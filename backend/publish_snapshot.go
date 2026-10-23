package backend

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/BurntSushi/toml"
	"github.com/gohugoio/hugo/hugofs"
	"github.com/gohugoio/hugo/parser/metadecoders"
	"io"
	"io/fs"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

func releaseDir(id string) string { return filepath.Join(AppHome, "releases", id) }
func digest(b []byte) string      { s := sha256.Sum256(b); return hex.EncodeToString(s[:]) }
func readPublishConfig() (PublishTarget, map[string]string, error) {
	ac, e := getAppConf()
	if e != nil {
		return PublishTarget{}, nil, e
	}
	if ac == nil || ac.ActivedDeploy == "" {
		return PublishTarget{}, nil, errors.New("configure_deploy_target")
	}
	return readPublishTarget(string(ac.ActivedDeploy))
}
func readPublishTarget(provider string) (t PublishTarget, c map[string]string, err error) {
	t.Provider = provider
	b, e := Conf.Read(ConfType(provider))
	if e != nil {
		return t, nil, e
	}
	if len(b) == 0 {
		return t, nil, errors.New("configure_deploy_target")
	}
	if e = json.Unmarshal(b, &c); e != nil {
		return t, nil, e
	}
	trim := func(k string) string { return strings.TrimSpace(c[k]) }
	required := func(keys ...string) bool {
		for _, k := range keys {
			if trim(k) == "" {
				return false
			}
		}
		return true
	}
	t.Website = trim("siteUrl")
	if t.Website != "" {
		u, e := url.Parse(t.Website)
		if e != nil || u.Host == "" || u.User != nil || (u.Scheme != "http" && u.Scheme != "https") {
			return t, nil, errors.New("invalid_website_url")
		}
	}
	t.Prefix = strings.Trim(trim("prefix"), "/")
	if strings.Contains(t.Prefix, "\\") {
		return t, nil, errors.New("invalid_publish_prefix")
	}
	for _, part := range strings.Split(t.Prefix, "/") {
		if part == "." || part == ".." {
			return t, nil, errors.New("invalid_publish_prefix")
		}
	}
	if t.Prefix != "" {
		t.Prefix = path.Clean(t.Prefix)
	}
	switch provider {
	case "github":
		if !required("repository", "token", "email") {
			return t, nil, errors.New("configure_github_credentials")
		}
		repo := trim("repository")
		if strings.HasPrefix(repo, "git@github.com:") {
			repo = "https://github.com/" + strings.TrimPrefix(repo, "git@github.com:")
		}
		u, e := url.Parse(repo)
		if e != nil || u.Scheme != "https" || u.Host == "" || u.User != nil || u.RawQuery != "" || u.Fragment != "" {
			return t, nil, errors.New("use_https_repository_without_embedded_credentials")
		}
		u.Host = strings.ToLower(u.Host)
		u.Path = strings.TrimSuffix(strings.TrimRight(u.Path, "/"), ".git")
		if u.Path == "" || u.Path == "/" {
			return t, nil, errors.New("invalid_repository")
		}
		t.Repository = u.String()
		t.Branch = trim("branch")
		if t.Branch == "" {
			t.Branch = "master"
		}
		t.Destination = t.Repository + " #" + t.Branch
	case "netlify":
		if !required("siteId", "token") {
			return t, nil, errors.New("configure_netlify_credentials")
		}
		t.SiteID = trim("siteId")
		t.Destination = t.SiteID
	case "cos", "oss":
		if !required("bucket", "region", "secretId", "secretKey") {
			return t, nil, errors.New("configure_object_storage_credentials")
		}
		t.Bucket = trim("bucket")
		t.Region = trim("region")
		if provider == "cos" {
			t.Endpoint = "https://" + t.Bucket + ".cos." + t.Region + ".myqcloud.com"
		} else {
			region := strings.TrimPrefix(t.Region, "oss-")
			t.Endpoint = "https://oss-" + region + ".aliyuncs.com"
		}
		t.Destination = t.Endpoint + "/" + t.Bucket + "/" + t.Prefix
	default:
		return t, nil, errors.New("unknown_deploy_type")
	}
	t.ID = digest([]byte(t.Provider + "\n" + t.Destination))
	_, e = DB.Exec("INSERT OR IGNORE INTO publish_target(id,baseline) VALUES(?,'')", t.ID)
	if e != nil {
		return t, nil, e
	}
	t.Baseline, e = targetBaseline(t.ID)
	return t, c, e
}
func excludedSource(rel string, d fs.DirEntry) bool {
	first := strings.Split(rel, "/")[0]
	if first == "public" || first == "node_modules" || first == "resources" || strings.HasPrefix(first, ".") {
		return true
	}
	if d.IsDir() && (d.Name() == ".git" || d.Name() == "node_modules") {
		return true
	}
	return strings.HasSuffix(rel, ".pre-hugo-0.168.bak") || strings.HasPrefix(d.Name(), ".swallow-") || d.Name() == ".hugo_build.lock"
}
func scanPublishFiles(ctx context.Context, root string, source bool) ([]PublishFile, error) {
	result := []PublishFile{}
	e := filepath.WalkDir(root, func(filename string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if e := ctx.Err(); e != nil {
			return e
		}
		if filename == root {
			return nil
		}
		rel, e := filepath.Rel(root, filename)
		if e != nil {
			return e
		}
		rel = filepath.ToSlash(rel)
		if source && excludedSource(rel, d) {
			if d.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if !source && d.Name() == ".git" {
			if d.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if d.Type()&os.ModeSymlink != 0 {
			return fmt.Errorf("cannot_freeze_symlink:%s", rel)
		}
		if d.IsDir() {
			return nil
		}
		info, e := d.Info()
		if e != nil {
			return e
		}
		if !info.Mode().IsRegular() {
			return fmt.Errorf("unsupported_file:%s", rel)
		}
		file, e := os.Open(filename)
		if e != nil {
			return e
		}
		hash := sha256.New()
		n, e := io.Copy(hash, file)
		file.Close()
		if e != nil {
			return e
		}
		entry := PublishFile{Path: rel, Size: n, Hash: hex.EncodeToString(hash.Sum(nil))}
		if source && strings.HasPrefix(rel, "content/") && strings.HasSuffix(rel, ".md") {
			b, e := os.ReadFile(filename)
			if e != nil {
				return e
			}
			raw, _ := Hugo.SplitMetaAndContent(string(b))
			var values struct {
				Title       string
				Draft       bool
				Date        string
				PublishDate string
			}
			_, _ = toml.Decode(raw, &values)
			entry.Title = values.Title
			parts := strings.Split(rel, "/")
			if len(parts) == 4 && parts[1] == "post" && parts[3] == "index.md" && validArticle(parts[2]) {
				entry.ArticleID = parts[2]
			} else if rel == "content/about/index.md" {
				entry.ArticleID = "about"
			}
			entry.Excluded = values.Draft
		}
		result = append(result, entry)
		return nil
	})
	sort.Slice(result, func(i, j int) bool { return result[i].Path < result[j].Path })
	return result, e
}
func sameFiles(a, b []PublishFile) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i].Path != b[i].Path || a[i].Hash != b[i].Hash {
			return false
		}
	}
	return true
}
func copyManifest(ctx context.Context, from, to string, files []PublishFile) error {
	for _, f := range files {
		if e := ctx.Err(); e != nil {
			return e
		}
		if !safeRelative(f.Path) {
			return errors.New("invalid_manifest_path")
		}
		src := filepath.Join(from, filepath.FromSlash(f.Path))
		b, e := os.ReadFile(src)
		if e != nil {
			return e
		}
		if digest(b) != f.Hash {
			return errContentChanged
		}
		dest := filepath.Join(to, filepath.FromSlash(f.Path))
		if e = os.MkdirAll(filepath.Dir(dest), 0700); e != nil {
			return e
		}
		if e = writeSiteConfig(dest, b); e != nil {
			return e
		}
	}
	return nil
}
func safeRelative(name string) bool {
	return name != "" && !strings.Contains(name, "\\") && !strings.HasPrefix(name, "/") && path.Clean(name) == name && name != ".." && !strings.HasPrefix(name, "../")
}
func validateSnapshotConfig(root string) error {
	b, e := os.ReadFile(filepath.Join(root, "hugo.toml"))
	if e != nil {
		return e
	}
	c, e := decodeSiteConfig(b)
	if e != nil {
		return e
	}
	// Reject external/remote module imports and mounts that cannot be frozen locally.
	var check func(any) error
	check = func(v any) error {
		switch x := v.(type) {
		case map[string]interface{}:
			for k, val := range x {
				key := strings.ToLower(k)
				if key == "imports" {
					if list, ok := val.([]map[string]interface{}); ok && len(list) > 0 {
						return errors.New("external_modules_require_frozen_dependencies")
					}
					if list, ok := val.([]interface{}); ok && len(list) > 0 {
						return errors.New("external_modules_require_frozen_dependencies")
					}
				}
				if key == "theme" || key == "source" || key == "themesdir" || key == "contentdir" || key == "staticdir" || key == "assetdir" || key == "layoutdir" || key == "datadir" {
					if text, ok := val.(string); ok && (filepath.IsAbs(text) || filepath.Clean(text) == ".." || strings.HasPrefix(filepath.ToSlash(filepath.Clean(text)), "../")) {
						return errors.New("external_mount_cannot_be_frozen")
					}
				}
				if e := check(val); e != nil {
					return e
				}
			}
		case []map[string]interface{}:
			for _, val := range x {
				if e := check(val); e != nil {
					return e
				}
			}
		case []interface{}:
			for _, val := range x {
				if e := check(val); e != nil {
					return e
				}
			}
		}
		return nil
	}
	if e = check(c); e != nil {
		return e
	}
	// Theme and environment configuration may contain additional module mounts.
	return filepath.WalkDir(root, func(filename string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if d.IsDir() {
			return nil
		}
		rel, _ := filepath.Rel(root, filename)
		rel = filepath.ToSlash(rel)
		if !(strings.HasPrefix(rel, "config/") || strings.HasPrefix(rel, "themes/")) {
			return nil
		}
		parts := strings.Split(rel, "/")
		if parts[0] == "themes" && (len(parts) < 3 || (len(parts) > 3 && parts[2] != "config")) {
			return nil
		}
		base := strings.ToLower(d.Name())
		if !(base == "hugo.toml" || base == "config.toml" || base == "hugo.yaml" || base == "config.yaml" || strings.HasPrefix(rel, "config/")) {
			return nil
		}
		ext := strings.ToLower(filepath.Ext(filename))
		if ext != ".toml" && ext != ".json" && ext != ".yaml" && ext != ".yml" {
			return nil
		}
		values, e := metadecoders.Default.UnmarshalFileToMap(hugofs.Os, filename)
		if e != nil {
			return e
		}
		for key, value := range values {
			if strings.EqualFold(key, "workingDir") && value != "" {
				return errors.New("external_working_directory_override")
			}
		}
		return check(values)
	})
}
func freezeRelease(ctx context.Context, r *PublishRun) error {
	writingMu.Lock()
	defer writingMu.Unlock()
	Hugo.configMu.RLock()
	defer Hugo.configMu.RUnlock()
	root := releaseDir(r.SnapshotID)
	src := filepath.Join(root, "source")
	if e := os.MkdirAll(root, 0700); e != nil {
		return e
	}
	for attempt := 0; attempt < 3; attempt++ {
		if e := ctx.Err(); e != nil {
			return e
		}
		before, e := scanPublishFiles(ctx, Hugo.SitePath, true)
		if e != nil {
			return e
		}
		var size int64
		for _, file := range before {
			size += file.Size
		}
		available, err := publishDiskAvailable(root)
		if err != nil {
			return err
		}
		if uint64(size)*2+32*1024*1024 > available {
			return errors.New("insufficient_disk_space")
		}
		if e = os.RemoveAll(src); e != nil {
			return e
		}
		if e = os.MkdirAll(src, 0700); e != nil {
			return e
		}
		e = copyManifest(ctx, Hugo.SitePath, src, before)
		if errors.Is(e, errContentChanged) {
			continue
		}
		if e != nil {
			return e
		}
		after, e := scanPublishFiles(ctx, Hugo.SitePath, true)
		if e != nil {
			return e
		}
		if !sameFiles(before, after) {
			continue
		}
		if e = validateSnapshotConfig(src); e != nil {
			return e
		}
		h := &_hugo{}
		h.setPaths(src)
		if e = h.setWorkingDirConfig(); e != nil {
			return e
		}
		r.Sources = before
		r.Frozen, e = scanPublishFiles(ctx, src, true)
		if e != nil {
			return e
		}
		r.PreparedAt = publishNow()
		drafts, e := readDrafts()
		if e != nil {
			return e
		}
		r.Drafts = len(drafts)
		return nil
	}
	return errors.New("source_keeps_changing")
}
func differences(before, after []PublishFile) []PublishChange {
	old := map[string]PublishFile{}
	for _, f := range before {
		old[f.Path] = f
	}
	changes := []PublishChange{}
	for _, f := range after {
		prev, exists := old[f.Path]
		kind := ""
		if !exists {
			kind = "added"
		} else if prev.Hash != f.Hash {
			kind = "modified"
		}
		if kind != "" {
			changes = append(changes, PublishChange{f.Path, kind, f.ArticleID, f.Title})
		}
		delete(old, f.Path)
	}
	for _, f := range old {
		changes = append(changes, PublishChange{f.Path, "removed", f.ArticleID, f.Title})
	}
	sort.Slice(changes, func(i, j int) bool { return changes[i].Path < changes[j].Path })
	return changes
}
func verifyFiles(ctx context.Context, dir string, expected []PublishFile, source bool) error {
	actual, e := scanPublishFiles(ctx, dir, source)
	if e != nil {
		return e
	}
	if !sameFiles(actual, expected) {
		return errors.New("snapshot_missing_or_changed")
	}
	return nil
}
func expiredAfter(start string, finish string) bool {
	a, e := time.Parse(time.RFC3339Nano, start)
	if e != nil {
		return false
	}
	b, e := time.Parse(time.RFC3339Nano, finish)
	return e == nil && b.After(a)
}
