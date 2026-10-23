package backend

import (
	"context"
	"errors"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func setupPublish(t *testing.T) *App {
	a := setupWriting(t)
	DB.SetMaxOpenConns(1)
	Hugo.NewSite() // setupWriting already creates content; install embedded config/themes explicitly below.
	h := testSite(t)
	Hugo.setPaths(h.SitePath)
	os.MkdirAll(Conf.DIR, 0700)
	if e := Conf.Write(confTypeApp, `{"activedDeploy":"cos"}`); e != nil {
		t.Fatal(e)
	}
	if e := Conf.Write("cos", `{"bucket":"test-123","region":"ap-test","secretId":"SECRET-ID","secretKey":"DO-NOT-LOG","siteUrl":"https://example.com","prefix":"blog"}`); e != nil {
		t.Fatal(e)
	}
	publisher.Lock()
	publisher.active = ""
	publisher.cancel = nil
	publisher.Unlock()
	if e := initPublishing(); e != nil {
		t.Fatal(e)
	}
	oldTransport, oldVerify := publishTransport, verifyPublishTransport
	t.Cleanup(func() {
		publisher.Lock()
		if publisher.cancel != nil {
			publisher.cancel()
		}
		publisher.Unlock()
		publisher.workers.Wait()
		publishTransport = oldTransport
		verifyPublishTransport = oldVerify
	})
	publishTransport = func(ctx context.Context, r *PublishRun, c map[string]string, dir string, p publishProgress, w publishReceiptWriter) error {
		if e := ctx.Err(); e != nil {
			return e
		}
		if e := w(PublishReceipt{ID: r.ID, Kind: "objects"}); e != nil {
			return e
		}
		if e := p(len(r.Output), len(r.Output), "uploaded"); e != nil {
			return e
		}
		return w(PublishReceipt{ID: r.ID, Kind: "objects", Confirmed: true})
	}
	return a
}
func waitPublish(t *testing.T, id string, states ...string) *PublishRun {
	t.Helper()
	deadline := time.Now().Add(12 * time.Second)
	for time.Now().Before(deadline) {
		r, e := loadRun(id)
		if e != nil {
			t.Fatal(e)
		}
		for _, s := range states {
			if r.State == s {
				publisher.workers.Wait()
				return r
			}
		}
		if r.State == "failed" || r.State == "outcome_unknown" {
			t.Fatalf("unexpected task state: %s %s", r.State, r.Error)
		}
		time.Sleep(15 * time.Millisecond)
	}
	t.Fatal("task timeout")
	return nil
}
func preparePublish(t *testing.T, a *App) *PublishRun {
	t.Helper()
	id := requireOK(t, a.PublishPrepare(newKey())).(string)
	return waitPublish(t, id, "ready")
}
func TestPublishFrozenBaselineAndTargetIsolation(t *testing.T) {
	a := setupPublish(t)
	id := requireOK(t, a.ArticleSave("", Meta{Title: "Before"}, "original")).(string)
	requireOK(t, a.DraftSave(Draft{ID: "private", ArticleID: id, Content: "private draft"}))
	r := preparePublish(t, a)
	if r.Drafts != 1 || r.Target.Baseline != "" {
		t.Fatal(r)
	}
	for _, f := range r.Sources {
		if strings.Contains(f.Path, "drafts") {
			t.Fatal("draft leaked")
		}
	}
	requireOK(t, a.ArticleSave(id, Meta{Title: "After"}, "newer"))
	if a.PublishStart(r.ID, false).Code == 1 {
		t.Fatal("stale snapshot published silently")
	}
	requireOK(t, a.PublishStart(r.ID, true))
	done := waitPublish(t, r.ID, "succeeded")
	baseline, e := targetBaseline(done.Target.ID)
	if e != nil || baseline != done.ID {
		t.Fatal(baseline, e)
	}
	content, e := os.ReadFile(filepath.Join(releaseDir(done.SnapshotID), "source", "content", "post", id, "index.md"))
	if e != nil || !strings.Contains(string(content), "original") || strings.Contains(string(content), "newer") {
		t.Fatal("snapshot changed", e)
	}
	states := requireOK(t, a.PublishArticleStates()).(map[string]interface{})
	if states["states"].(map[string]string)[id] != "modified" {
		t.Fatal(states)
	}
	if strings.Contains(publishJSON(done), "DO-NOT-LOG") || strings.Contains(publishJSON(done), "SECRET-ID") {
		t.Fatal("secret persisted")
	}
	requireOK(t, a.PublishUseTarget("cos"))
	Conf.Write("cos", `{"bucket":"other-123","region":"ap-test","secretId":"same","secretKey":"same"}`)
	target, _, e := readPublishConfig()
	if e != nil || target.ID == done.Target.ID || target.Baseline != "" {
		t.Fatal(target, e)
	}
}
func TestPublishFailureRetryAndNewerBaseline(t *testing.T) {
	a := setupPublish(t)
	r := preparePublish(t, a)
	publishTransport = func(ctx context.Context, r *PublishRun, c map[string]string, dir string, p publishProgress, w publishReceiptWriter) error {
		w(PublishReceipt{ID: r.ID, Kind: "objects"})
		return errors.New("upload_failed_injected")
	}
	requireOK(t, a.PublishStart(r.ID, false))
	failed := waitPublish(t, r.ID, "outcome_unknown")
	baseline, _ := targetBaseline(failed.Target.ID)
	if baseline != "" {
		t.Fatal("advanced failed baseline")
	}
	if a.PublishRetry(failed.ID, newKey(), false).Code == 1 {
		t.Fatal("unknown retransmit needs explicit acknowledgement")
	}
	retryID := requireOK(t, a.PublishRetry(failed.ID, newKey(), true)).(string)
	retry, _ := loadRun(retryID)
	if retry.SnapshotID != r.SnapshotID || !sameFiles(retry.Output, failed.Output) {
		t.Fatal("retry changed artifacts")
	}
	publishTransport = func(ctx context.Context, r *PublishRun, c map[string]string, dir string, p publishProgress, w publishReceiptWriter) error {
		return w(PublishReceipt{ID: r.ID, Kind: "objects", Confirmed: true})
	}
	requireOK(t, a.PublishStart(retryID, false))
	waitPublish(t, retryID, "succeeded")
	if a.PublishRetry(failed.ID, newKey(), true).Code == 1 {
		t.Fatal("old failure overwrote newer success")
	}
	if a.PublishCleanup(retryID).Code == 1 {
		t.Fatal("baseline artifact deleted")
	}
}
func TestPublishRestartAndIdempotency(t *testing.T) {
	a := setupPublish(t)
	key := newKey()
	id := requireOK(t, a.PublishPrepare(key)).(string)
	second := requireOK(t, a.PublishPrepare(key)).(string)
	if id != second {
		t.Fatal("duplicate request")
	}
	r := waitPublish(t, id, "ready")
	r.State = "uploading"
	r.Stage = "uploading"
	if e := saveRun(r); e != nil {
		t.Fatal(e)
	}
	if e := initPublishing(); e != nil {
		t.Fatal(e)
	}
	r, _ = loadRun(id)
	if r.State != "outcome_unknown" {
		t.Fatal(r.State)
	}
	if e := os.WriteFile(filepath.Join(releaseDir(r.SnapshotID), "source", "hugo.toml"), []byte("changed"), 0600); e != nil {
		t.Fatal(e)
	}
	if a.PublishRetry(id, newKey(), true).Code == 1 {
		t.Fatal("corrupt source accepted")
	}
}
func TestPublishMissingSourceAndExternalMount(t *testing.T) {
	a := setupPublish(t)
	config, e := os.ReadFile(Hugo.configFile)
	if e != nil {
		t.Fatal(e)
	}
	put(t, Hugo.configFile, string(config)+"\n[module]\n[[module.mounts]]\nsource = '/tmp/private'\ntarget = 'content'\n")
	id := requireOK(t, a.PublishPrepare(newKey())).(string)
	r := waitPublish(t, id, "failed")
	if !strings.Contains(r.Error, "external_") {
		t.Fatal(r.Error)
	}
}

type memoryPublishStore struct {
	objects    map[string]string
	deleted    []string
	failDelete bool
}

func (s *memoryPublishStore) List(context.Context) (map[string]bool, error) {
	m := map[string]bool{}
	for k := range s.objects {
		m[k] = true
	}
	return m, nil
}
func (s *memoryPublishStore) Put(ctx context.Context, k, f string) error {
	b, e := os.ReadFile(f)
	if e == nil {
		s.objects[k] = string(b)
	}
	return e
}
func (s *memoryPublishStore) Delete(ctx context.Context, k string) error {
	if s.failDelete {
		return errors.New("fail")
	}
	s.deleted = append(s.deleted, k)
	delete(s.objects, k)
	return nil
}
func (s *memoryPublishStore) Hash(ctx context.Context, k string) (string, error) {
	return digest([]byte(s.objects[k])), nil
}
func TestObjectPlanOnlyDeletesOwnedFiles(t *testing.T) {
	dir := t.TempDir()
	put(t, filepath.Join(dir, "index.html"), "site")
	store := &memoryPublishStore{objects: map[string]string{"blog/old.html": "owned", "blog/private.txt": "unknown", "other/index.html": "other"}}
	r := &PublishRun{ID: newKey(), Target: PublishTarget{Prefix: "blog"}, Output: []PublishFile{{Path: "index.html", Hash: digest([]byte("site"))}}, Managed: []string{"old.html"}}
	e := uploadObjectPlan(context.Background(), r, store, dir, func(a, b int, s string) error { return nil }, func(p PublishReceipt) error { return nil })
	if e != nil {
		t.Fatal(e)
	}
	if _, ok := store.objects["blog/private.txt"]; !ok {
		t.Fatal("unknown file deleted")
	}
	if len(store.deleted) != 1 || store.deleted[0] != "blog/old.html" {
		t.Fatal(store.deleted)
	}
	store.objects["blog/old.html"] = "again"
	store.failDelete = true
	if e = uploadObjectPlan(context.Background(), r, store, dir, func(a, b int, s string) error { return nil }, func(p PublishReceipt) error { return nil }); e == nil {
		t.Fatal("delete failure swallowed")
	}
}
func TestGitConditionalPublishLocalRepository(t *testing.T) {
	setupPublish(t)
	bare := filepath.Join(t.TempDir(), "remote.git")
	if _, e := git.PlainInit(bare, true); e != nil {
		t.Fatal(e)
	}
	id := newKey()
	dir := t.TempDir()
	put(t, filepath.Join(dir, "index.html"), "hello")
	r := &PublishRun{ID: id, Target: PublishTarget{Repository: bare, Branch: "site"}, Output: []PublishFile{{Path: "index.html", Hash: digest([]byte("hello"))}}}
	var receipt PublishReceipt
	writer := func(p PublishReceipt) error { receipt = p; return nil }
	if e := publishGit(context.Background(), r, map[string]string{"email": "test@example.com"}, dir, writer); e != nil {
		t.Fatal(e)
	}
	if !receipt.Confirmed {
		t.Fatal("not confirmed")
	}
	repo, e := git.PlainOpen(bare)
	if e != nil {
		t.Fatal(e)
	}
	ref, e := repo.Reference(plumbing.NewBranchReferenceName("site"), true)
	if e != nil || ref.Hash().String() != receipt.ID {
		t.Fatal(ref, e)
	}
	// A stale lease must reject a changed ref, not overwrite it.
	local, e := git.PlainOpen(filepath.Join(releaseDir(id), "git-work"))
	if e != nil {
		t.Fatal(e)
	}
	wt, e := local.Worktree()
	if e != nil {
		t.Fatal(e)
	}
	put(t, filepath.Join(releaseDir(id), "git-work", "index.html"), "new commit")
	wt.Add("index.html")
	if _, e = wt.Commit("new", &git.CommitOptions{Author: &object.Signature{Name: "Test", Email: "test@example.com", When: time.Now()}}); e != nil {
		t.Fatal(e)
	}
	e = local.Push(&git.PushOptions{RemoteName: "origin", RefSpecs: []config.RefSpec{"+refs/heads/site:refs/heads/site"}, ForceWithLease: &git.ForceWithLease{RefName: plumbing.NewBranchReferenceName("site"), Hash: plumbing.NewHash(strings.Repeat("1", 40))}})
	if e == nil || errors.Is(e, git.NoErrAlreadyUpToDate) {
		t.Fatal("stale lease accepted")
	}
}

func TestPublishVerificationDoesNotAdvanceOnFailure(t *testing.T) {
	a := setupPublish(t)
	r := preparePublish(t, a)
	r.State = "outcome_unknown"
	r.Receipt = &PublishReceipt{ID: "receipt", Kind: "objects"}
	if e := saveRun(r); e != nil {
		t.Fatal(e)
	}
	verifyPublishTransport = func(ctx context.Context, r *PublishRun, c map[string]string) error {
		return errors.New("verify_failed_injected")
	}
	requireOK(t, a.PublishVerify(r.ID))
	waitPublish(t, r.ID, "outcome_unknown")
	baseline, _ := targetBaseline(r.Target.ID)
	if baseline != "" {
		t.Fatal("verification failure advanced baseline")
	}
	verifyPublishTransport = func(ctx context.Context, r *PublishRun, c map[string]string) error {
		r.Receipt.Confirmed = true
		return nil
	}
	requireOK(t, a.PublishVerify(r.ID))
	waitPublish(t, r.ID, "succeeded")
}
func TestPublishCancellationAndBusy(t *testing.T) {
	a := setupPublish(t)
	r := preparePublish(t, a)
	entered := make(chan struct{})
	publishTransport = func(ctx context.Context, r *PublishRun, c map[string]string, dir string, p publishProgress, w publishReceiptWriter) error {
		close(entered)
		<-ctx.Done()
		return ctx.Err()
	}
	requireOK(t, a.PublishStart(r.ID, false))
	<-entered
	if a.PublishPrepare(newKey()).Code == 1 {
		t.Fatal("second concurrent task accepted")
	}
	requireOK(t, a.PublishCancel(r.ID))
	waitPublish(t, r.ID, "outcome_unknown")
}

func TestAppearanceSaveDoesNotChangeDeploymentTarget(t *testing.T) {
	a := setupPublish(t)
	requireOK(t, a.ConfSave(confTypeApp, `{"activedDeploy":"cos","appTheme":"white","custom":"preserve"}`))
	ac, e := getAppConf()
	if e != nil || ac.ActivedDeploy != "cos" {
		t.Fatal(ac, e)
	}
	requireOK(t, a.ConfSave("netlify", `{"siteId":"site","token":"secret"}`))
	b, e := Conf.Read(confTypeApp)
	if e != nil || !strings.Contains(string(b), "preserve") {
		t.Fatal(string(b), e)
	}
}

func TestSnapshotIgnoresThemeExamplesButChecksThemeMounts(t *testing.T) {
	setupPublish(t)
	if e := validateSnapshotConfig(Hugo.SitePath); e != nil {
		t.Fatal(e)
	}
	put(t, filepath.Join(Hugo.themeDir, "mini", "hugo.toml"), "[module]\n[[module.mounts]]\nsource='../external'\ntarget='content'\n")
	if e := validateSnapshotConfig(Hugo.SitePath); e == nil {
		t.Fatal("external theme mount accepted")
	}
}
