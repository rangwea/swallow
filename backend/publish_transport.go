package backend

import (
	"context"
	"crypto/sha1"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"github.com/aliyun/aliyun-oss-go-sdk/oss"
	"github.com/go-git/go-git/v5"
	gitcfg "github.com/go-git/go-git/v5/config"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
	githttp "github.com/go-git/go-git/v5/plumbing/transport/http"
	"github.com/go-openapi/runtime"
	"github.com/go-openapi/strfmt"
	"github.com/netlify/open-api/go/models"
	"github.com/netlify/open-api/go/plumbing/operations"
	netlify "github.com/netlify/open-api/go/porcelain"
	"github.com/rangwea/swallows/backend/util"
	"github.com/tencentyun/cos-go-sdk-v5"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"
)

type publishProgress func(int, int, string) error
type publishReceiptWriter func(PublishReceipt) error

var publishTransport = uploadPublish
var verifyPublishTransport = verifyRemotePublish

func openPublishWebsite(uri string) *R {
	if e := util.OpenBrowser(uri); e != nil {
		return fail(e)
	}
	return success(nil)
}
func uploadPublish(ctx context.Context, r *PublishRun, c map[string]string, dir string, progress publishProgress, receipt publishReceiptWriter) error {
	ctx, cancel := context.WithTimeout(ctx, 30*time.Minute)
	defer cancel()
	switch r.Target.Provider {
	case "github":
		return publishGit(ctx, r, c, dir, receipt)
	case "netlify":
		return publishNetlify(ctx, r, c, dir, progress, receipt)
	case "cos", "oss":
		return publishObjects(ctx, r, c, dir, progress, receipt)
	}
	return errors.New("invalid_deploy_provider")
}
func gitAuth(c map[string]string) *githttp.BasicAuth {
	name := c["username"]
	if name == "" {
		name = "token"
	}
	return &githttp.BasicAuth{Username: name, Password: c["token"]}
}
func gitRemoteHash(ctx context.Context, remote *git.Remote, branch plumbing.ReferenceName, auth *githttp.BasicAuth) (plumbing.Hash, error) {
	refs, e := remote.ListContext(ctx, &git.ListOptions{Auth: auth})
	if e != nil {
		if strings.Contains(e.Error(), "empty") {
			return plumbing.ZeroHash, nil
		}
		return plumbing.ZeroHash, errors.New("network_failed_repository_access")
	}
	for _, ref := range refs {
		if ref.Name() == branch {
			return ref.Hash(), nil
		}
	}
	return plumbing.ZeroHash, nil
}
func publishGit(ctx context.Context, r *PublishRun, c map[string]string, dir string, receipt publishReceiptWriter) error {
	branch := plumbing.NewBranchReferenceName(r.Target.Branch)
	if e := branch.Validate(); e != nil {
		return errors.New("invalid_publish_branch")
	}
	work := filepath.Join(releaseDir(r.ID), "git-work")
	if e := os.RemoveAll(work); e != nil {
		return e
	}
	if e := os.MkdirAll(work, 0700); e != nil {
		return e
	}
	if e := copyManifest(ctx, dir, work, r.Output); e != nil {
		return e
	}
	repo, e := git.PlainInitWithOptions(work, &git.PlainInitOptions{InitOptions: git.InitOptions{DefaultBranch: branch}})
	if e != nil {
		return e
	}
	remote, e := repo.CreateRemote(&gitcfg.RemoteConfig{Name: "origin", URLs: []string{r.Target.Repository}})
	if e != nil {
		return e
	}
	auth := gitAuth(c)
	expected, e := gitRemoteHash(ctx, remote, branch, auth)
	if e != nil {
		return e
	}
	if r.Target.Baseline != "" {
		b, e := loadRun(r.Target.Baseline)
		if e != nil {
			return e
		}
		ownedRetry := false
		retryID := r.RetryOf
		for retryID != "" {
			old, e := loadRun(retryID)
			if e != nil {
				return e
			}
			if old.Target.ID != r.Target.ID || old.SnapshotID != r.SnapshotID {
				break
			}
			if old.Receipt != nil && old.Receipt.Kind == "git" && old.Receipt.ID == expected.String() {
				ownedRetry = true
				break
			}
			retryID = old.RetryOf
		}
		if b.Receipt != nil && b.Receipt.Kind == "git" && b.Receipt.ID != expected.String() && !ownedRetry {
			return errors.New("remote_conflict_repository_changed")
		}
	}
	wt, e := repo.Worktree()
	if e != nil {
		return e
	}
	if e = wt.AddWithOptions(&git.AddOptions{All: true}); e != nil {
		return e
	}
	hash, e := wt.Commit("Swallow release "+r.ID, &git.CommitOptions{Author: &object.Signature{Name: "Swallow", Email: c["email"], When: time.Now()}, AllowEmptyCommits: true})
	if e != nil {
		return e
	}
	if e = receipt(PublishReceipt{ID: hash.String(), Kind: "git"}); e != nil {
		return e
	}
	// A tracking ref with the expected hash also protects branch creation (zero).
	if e = repo.Storer.SetReference(plumbing.NewHashReference(plumbing.ReferenceName("refs/remotes/origin/"+r.Target.Branch), expected)); e != nil {
		return e
	}
	e = repo.PushContext(ctx, &git.PushOptions{RemoteName: "origin", Auth: auth, RefSpecs: []gitcfg.RefSpec{gitcfg.RefSpec(branch.String() + ":" + branch.String())}, Force: true, ForceWithLease: &git.ForceWithLease{RefName: branch, Hash: expected}})

	if e != nil && !errors.Is(e, git.NoErrAlreadyUpToDate) {
		return errors.New("upload_failed_git_check_remote_conflict")
	}
	return receipt(PublishReceipt{ID: hash.String(), Kind: "git", Confirmed: true})
}
func netlifyAuth(c map[string]string) runtime.ClientAuthInfoWriter {
	return runtime.ClientAuthInfoWriterFunc(func(req runtime.ClientRequest, _ strfmt.Registry) error {
		return req.SetHeaderParam("Authorization", "Bearer "+c["token"])
	})
}
func publishNetlify(ctx context.Context, r *PublishRun, c map[string]string, dir string, progress publishProgress, receipt publishReceiptWriter) error {
	files := map[string]string{}
	byHash := map[string]PublishFile{}
	for _, file := range r.Output {
		if e := ctx.Err(); e != nil {
			return e
		}
		body, e := os.ReadFile(filepath.Join(dir, filepath.FromSlash(file.Path)))
		if e != nil {
			return e
		}
		sum := sha1.Sum(body)
		hash := hex.EncodeToString(sum[:])
		files["/"+file.Path] = hash
		byHash[hash] = file
	}
	params := operations.NewCreateSiteDeployParamsWithContext(ctx).WithSiteID(r.Target.SiteID).WithDeploy(&models.DeployFiles{Files: files, Async: false, Draft: false})
	created, e := netlify.Default.Operations.CreateSiteDeploy(params, netlifyAuth(c))
	if e != nil {
		return errors.New("upload_failed_netlify_may_have_received_content")
	}
	if created == nil || created.Payload == nil || created.Payload.ID == "" {
		return errors.New("verify_failed_netlify_no_deploy_id")
	}
	result := created.Payload
	if e = receipt(PublishReceipt{ID: result.ID, Kind: "netlify"}); e != nil {
		return e
	}
	for i, hash := range result.Required {
		file, ok := byHash[hash]
		if !ok {
			return errors.New("verify_failed_netlify_unknown_required_file")
		}
		body, e := os.Open(filepath.Join(dir, filepath.FromSlash(file.Path)))
		if e != nil {
			return e
		}
		upload := operations.NewUploadDeployFileParamsWithContext(ctx).WithDeployID(result.ID).WithPath(file.Path).WithFileBody(body).WithSize(&file.Size)
		_, e = netlify.Default.Operations.UploadDeployFile(upload, netlifyAuth(c))
		body.Close()
		if e != nil {
			return errors.New("upload_failed_netlify_file")
		}
		if e = progress(i+1, len(result.Required), "file_uploaded"); e != nil {
			return e
		}
	}
	for {
		params := operations.NewGetSiteDeployParamsWithContext(ctx).WithSiteID(r.Target.SiteID).WithDeployID(result.ID)
		response, e := netlify.Default.Operations.GetSiteDeploy(params, netlifyAuth(c))
		if e != nil {
			return errors.New("verify_failed_netlify_status")
		}
		if response == nil || response.Payload == nil {
			return errors.New("verify_failed_netlify_empty_response")
		}
		if response.Payload.State == "ready" {
			return receipt(PublishReceipt{ID: result.ID, Kind: "netlify", Confirmed: true})
		}
		if response.Payload.State == "error" {
			return errors.New("upload_failed_netlify_build")
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(2 * time.Second):
		}
	}
}

type publishObjectStore interface {
	List(context.Context) (map[string]bool, error)
	Put(context.Context, string, string) error
	Delete(context.Context, string) error
	Hash(context.Context, string) (string, error)
}
type cosPublishStore struct{ client *cos.Client }

func (s cosPublishStore) List(ctx context.Context) (map[string]bool, error) {
	out := map[string]bool{}
	marker := ""
	for {
		page, _, e := s.client.Bucket.Get(ctx, &cos.BucketGetOptions{Marker: marker})
		if e != nil {
			return nil, errors.New("network_failed_cos_list")
		}
		for _, item := range page.Contents {
			out[item.Key] = true
		}
		if !page.IsTruncated {
			return out, nil
		}
		if page.NextMarker == marker || page.NextMarker == "" {
			return nil, errors.New("invalid_cos_pagination")
		}
		marker = page.NextMarker
	}
}
func (s cosPublishStore) Put(ctx context.Context, key, filename string) error {
	_, e := s.client.Object.PutFromFile(ctx, key, filename, nil)
	return e
}
func (s cosPublishStore) Delete(ctx context.Context, key string) error {
	_, e := s.client.Object.Delete(ctx, key)
	return e
}
func (s cosPublishStore) Hash(ctx context.Context, key string) (string, error) {
	response, e := s.client.Object.Get(ctx, key, nil)
	if e != nil {
		return "", e
	}
	defer response.Body.Close()
	return streamHash(response.Body)
}

type ossPublishStore struct{ bucket *oss.Bucket }

func (s ossPublishStore) List(ctx context.Context) (map[string]bool, error) {
	out := map[string]bool{}
	marker := ""
	for {
		page, e := s.bucket.ListObjects(oss.Marker(marker), oss.WithContext(ctx))
		if e != nil {
			return nil, errors.New("network_failed_oss_list")
		}
		for _, item := range page.Objects {
			out[item.Key] = true
		}
		if !page.IsTruncated {
			return out, nil
		}
		if page.NextMarker == marker || page.NextMarker == "" {
			return nil, errors.New("invalid_oss_pagination")
		}
		marker = page.NextMarker
	}
}
func (s ossPublishStore) Put(ctx context.Context, key, filename string) error {
	return s.bucket.PutObjectFromFile(key, filename, oss.WithContext(ctx))
}
func (s ossPublishStore) Delete(ctx context.Context, key string) error {
	return s.bucket.DeleteObject(key, oss.WithContext(ctx))
}
func (s ossPublishStore) Hash(ctx context.Context, key string) (string, error) {
	reader, e := s.bucket.GetObject(key, oss.WithContext(ctx))
	if e != nil {
		return "", e
	}
	defer reader.Close()
	return streamHash(reader)
}
func streamHash(reader io.Reader) (string, error) {
	h := sha256.New()
	if _, e := io.Copy(h, reader); e != nil {
		return "", e
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}
func objectStore(t PublishTarget, c map[string]string) (publishObjectStore, error) {
	if t.Provider == "cos" {
		u, e := url.Parse(t.Endpoint)
		if e != nil {
			return nil, e
		}
		return cosPublishStore{cos.NewClient(&cos.BaseURL{BucketURL: u}, &http.Client{Timeout: 2 * time.Minute, Transport: &cos.AuthorizationTransport{SecretID: c["secretId"], SecretKey: c["secretKey"]}})}, nil
	}
	client, e := oss.New(t.Endpoint, c["secretId"], c["secretKey"], oss.Timeout(15, 120))
	if e != nil {
		return nil, e
	}
	bucket, e := client.Bucket(t.Bucket)
	if e != nil {
		return nil, e
	}
	return ossPublishStore{bucket}, nil
}
func objectKey(prefix, name string) string { return path.Join(prefix, name) }
func publishObjects(ctx context.Context, r *PublishRun, c map[string]string, dir string, progress publishProgress, receipt publishReceiptWriter) error {
	store, e := objectStore(r.Target, c)
	if e != nil {
		return errors.New("invalid_object_storage_configuration")
	}
	return uploadObjectPlan(ctx, r, store, dir, progress, receipt)
}
func uploadObjectPlan(ctx context.Context, r *PublishRun, store publishObjectStore, dir string, progress publishProgress, receipt publishReceiptWriter) error {
	remote, e := store.List(ctx)
	if e != nil {
		return e
	}
	current := map[string]bool{}
	for _, f := range r.Output {
		if !safeRelative(f.Path) {
			return errors.New("invalid_manifest_path")
		}
		current[f.Path] = true
	}
	deletes := []string{}
	for _, name := range r.Managed {
		if !safeRelative(name) {
			return errors.New("invalid_managed_path")
		}
		if !current[name] && remote[objectKey(r.Target.Prefix, name)] {
			deletes = append(deletes, name)
		}
	}
	if e = receipt(PublishReceipt{ID: r.ID, Kind: "objects"}); e != nil {
		return e
	}
	done, total := 0, len(r.Output)+len(deletes)
	for _, f := range r.Output {
		if e = ctx.Err(); e != nil {
			return e
		}
		if e = store.Put(ctx, objectKey(r.Target.Prefix, f.Path), filepath.Join(dir, filepath.FromSlash(f.Path))); e != nil {
			return errors.New("upload_failed_object_write")
		}
		done++
		if e = progress(done, total, "file_uploaded"); e != nil {
			return e
		}
	}
	for _, name := range deletes {
		if e = ctx.Err(); e != nil {
			return e
		}
		if e = store.Delete(ctx, objectKey(r.Target.Prefix, name)); e != nil {
			return errors.New("upload_failed_managed_delete")
		}
		done++
		if e = progress(done, total, "managed_file_removed"); e != nil {
			return e
		}
	}
	return receipt(PublishReceipt{ID: r.ID, Kind: "objects", Confirmed: true})
}
func verifyRemotePublish(ctx context.Context, r *PublishRun, c map[string]string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Minute)
	defer cancel()
	if r.Receipt == nil {
		return errors.New("verify_failed_no_receipt_republish_original_output")
	}
	switch r.Target.Provider {
	case "github":
		remote := git.NewRemote(nil, &gitcfg.RemoteConfig{Name: "origin", URLs: []string{r.Target.Repository}})
		hash, e := gitRemoteHash(ctx, remote, plumbing.NewBranchReferenceName(r.Target.Branch), gitAuth(c))
		if e != nil {
			return e
		}
		if hash.String() != r.Receipt.ID {
			return errors.New("verify_failed_remote_reference_differs")
		}
	case "netlify":
		params := operations.NewGetSiteDeployParamsWithContext(ctx).WithSiteID(r.Target.SiteID).WithDeployID(r.Receipt.ID)
		response, e := netlify.Default.Operations.GetSiteDeploy(params, netlifyAuth(c))
		if e != nil || response == nil || response.Payload == nil || response.Payload.State != "ready" {
			return errors.New("verify_failed_netlify_not_ready")
		}
	default:
		store, e := objectStore(r.Target, c)
		if e != nil {
			return e
		}
		remote, e := store.List(ctx)
		if e != nil {
			return e
		}
		current := map[string]bool{}
		for _, file := range r.Output {
			key := objectKey(r.Target.Prefix, file.Path)
			hash, e := store.Hash(ctx, key)
			if e != nil || hash != file.Hash {
				return errors.New("verify_failed_remote_content_differs")
			}
			current[file.Path] = true
		}
		for _, name := range r.Managed {
			if !current[name] && remote[objectKey(r.Target.Prefix, name)] {
				return errors.New("verify_failed_deleted_file_still_exists")
			}
		}
	}
	r.Receipt.Confirmed = true
	return saveRun(r)
}
