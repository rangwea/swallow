package backend

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

func failRun(r *PublishRun, state string, e error) {
	r.State = state
	r.Error = publicPublishError(e)
	r.FinishedAt = publishNow()
	_ = saveRun(r)
}
func publicPublishError(e error) string {
	if e == nil {
		return ""
	}
	// SDK errors can echo authenticated URLs, headers, or tokens. Keep local error codes only.
	allowed := []string{"build_failed", "source_changed", "baseline_changed", "snapshot_missing_or_changed", "source_keeps_changing", "application_interrupted", "target_changed", "newer_success_exists", "configure_", "invalid_", "external_", "cannot_freeze_", "unsupported_", "remote_conflict", "upload_failed", "verify_failed", "network_failed", "cancelled", "insufficient_"}
	text := e.Error()
	for _, prefix := range allowed {
		if len(text) >= len(prefix) && text[:len(prefix)] == prefix {
			if len(text) > 180 {
				text = text[:180]
			}
			return text
		}
	}
	if errors.Is(e, context.Canceled) {
		return "cancelled"
	}
	if errors.Is(e, context.DeadlineExceeded) {
		return "network_failed_timeout"
	}
	return "operation_failed_check_configuration_and_network"
}
func currentTargetMatches(target PublishTarget) (map[string]string, error) {
	t, c, e := readPublishTarget(target.Provider)
	if e != nil {
		return nil, e
	}
	if t.ID != target.ID {
		return nil, errors.New("target_changed")
	}
	return c, nil
}
func diffBaseline(r *PublishRun) error {
	var previous []PublishFile
	if r.Target.Baseline != "" {
		b, e := loadRun(r.Target.Baseline)
		if e != nil {
			return e
		}
		previous = b.Sources
	}
	r.Changes = differences(previous, r.Sources)
	r.manifestHash = ""
	return nil
}
func (a *App) PublishPrepare(requestKey string) *R {
	publisher.Lock()
	defer publisher.Unlock()
	if !safeKey.MatchString(requestKey) {
		return fail(errors.New("invalid_request_key"))
	}
	var existing string
	if e := DB.Get(&existing, "SELECT id FROM publish_run WHERE request_key=?", requestKey); e == nil {
		return success(existing)
	}
	if publisher.active != "" {
		return fail(fmt.Errorf("publish_busy:%s", publisher.active))
	}
	target, _, e := readPublishConfig()
	if e != nil {
		return fail(e)
	}
	r := &PublishRun{ID: newKey(), RequestKey: requestKey, Target: target, State: "preparing", Stage: "preparing", StartedAt: publishNow(), Sources: []PublishFile{}, Frozen: []PublishFile{}, Output: []PublishFile{}, Changes: []PublishChange{}, Events: []PublishEvent{}, Managed: []string{}}
	r.SnapshotID = r.ID
	if e = saveRun(r); e != nil {
		return fail(e)
	}
	e = publisher.launch(r, func(ctx context.Context, r *PublishRun) {
		if e := freezeRelease(ctx, r); e != nil {
			state := "failed"
			if errors.Is(e, context.Canceled) {
				state = "cancelled"
			}
			failRun(r, state, e)
			return
		}
		if e := diffBaseline(r); e != nil {
			failRun(r, "failed", e)
			return
		}
		managed, e := managedPaths(r)
		if e != nil {
			failRun(r, "failed", e)
			return
		}
		r.Managed = managed
		r.manifestHash = ""
		r.State = "ready"
		if e := progressRun(r, "ready", 0, 0, "snapshot_ready"); e != nil {
			failRun(r, "failed", e)
		}
	})
	if e != nil {
		return fail(e)
	}
	return success(r.ID)
}
func (a *App) PublishList(targetID string, page int) *R {
	publisher.Lock()
	defer publisher.Unlock()
	runs, e := summaryRuns()
	if e != nil {
		return fail(e)
	}
	filtered := []PublishRun{}
	for _, r := range runs {
		if targetID == "" || r.Target.ID == targetID {
			r.Sources = nil
			r.Frozen = nil
			r.Output = nil
			r.Changes = nil
			r.Events = nil
			filtered = append(filtered, r)
		}
	}
	if page < 0 {
		page = 0
	}
	if len(filtered) > 0 && page > (len(filtered)-1)/20 {
		page = (len(filtered) - 1) / 20
	}
	if len(filtered) == 0 {
		page = 0
	}
	start := page * 20
	if start > len(filtered) {
		start = len(filtered)
	}
	end := start + 20
	if end > len(filtered) {
		end = len(filtered)
	}
	return success(map[string]interface{}{"list": filtered[start:end], "total": len(filtered), "page": page, "activeId": publisher.active})
}
func (a *App) PublishGet(id string) *R {
	publisher.Lock()
	defer publisher.Unlock()
	r, e := loadRun(id)
	if e != nil {
		return fail(e)
	}
	return success(r)
}
func (a *App) PublishTarget() *R {
	t, _, e := readPublishConfig()
	if e != nil {
		return fail(e)
	}
	return success(t)
}
func (a *App) PublishFreshness(id string) *R {
	r, e := loadRun(id)
	if e != nil {
		return fail(e)
	}
	files, e := scanPublishFiles(context.Background(), Hugo.SitePath, true)
	if e != nil {
		return fail(e)
	}
	drafts, e := readDrafts()
	if e != nil {
		return fail(e)
	}
	return success(map[string]interface{}{"changed": !sameFiles(files, r.Sources), "drafts": len(drafts)})
}
func (a *App) PublishStart(id string, allowOlderContent bool) *R {
	publisher.Lock()
	defer publisher.Unlock()
	r, e := loadRun(id)
	if e != nil {
		return fail(e)
	}
	if publishActive(r.State) || r.State == "succeeded" {
		return success(r.ID)
	}
	if r.State != "ready" {
		return fail(errors.New("task_not_ready"))
	}
	if publisher.active != "" {
		return fail(fmt.Errorf("publish_busy:%s", publisher.active))
	}
	if _, e = currentTargetMatches(r.Target); e != nil {
		return fail(e)
	}
	baseline, e := targetBaseline(r.Target.ID)
	if e != nil {
		return fail(e)
	}
	if baseline != r.Target.Baseline {
		return fail(errBaselineChanged)
	}
	if r.RetryOf == "" {
		files, e := scanPublishFiles(context.Background(), Hugo.SitePath, true)
		if e != nil {
			return fail(e)
		}
		if !sameFiles(files, r.Sources) && !allowOlderContent {
			return fail(errContentChanged)
		}
	}
	managed, err := managedPaths(r)
	if err != nil {
		return fail(err)
	}
	if strings.Join(managed, "\n") != strings.Join(r.Managed, "\n") {
		return fail(errors.New("managed_plan_changed_refresh"))
	}
	if e = verifyFiles(context.Background(), filepath.Join(releaseDir(r.SnapshotID), "source"), r.Frozen, true); e != nil {
		return fail(e)
	}
	r.State = "building"
	r.Stage = "building"
	if e = saveRun(r); e != nil {
		return fail(e)
	}
	if e = publisher.launch(r, executePublish); e != nil {
		return fail(e)
	}
	return success(r.ID)
}
func executePublish(ctx context.Context, r *PublishRun) {
	dir := releaseDir(r.SnapshotID)
	output := filepath.Join(dir, "output")
	if len(r.Output) > 0 {
		if e := verifyFiles(ctx, output, r.Output, false); e != nil {
			failRun(r, "failed", e)
			return
		}
	} else {
		if e := verifyFiles(ctx, filepath.Join(dir, "source"), r.Frozen, true); e != nil {
			failRun(r, "failed", e)
			return
		}
		if e := progressRun(r, "building", 0, 0, "building_snapshot"); e != nil {
			failRun(r, "failed", e)
			return
		}
		h := &_hugo{}
		h.setPaths(filepath.Join(dir, "source"))
		h.PublicDir = output
		h.frozenBuild = true
		if e := h.Build(); e != nil {
			r.Diagnostic = publishBuildLocations(e.Error(), filepath.Join(dir, "source"))
			failRun(r, "failed", errors.New("build_failed_check_theme_and_configuration"))
			return
		}
		files, e := scanPublishFiles(ctx, output, false)
		if e != nil {
			failRun(r, "failed", e)
			return
		}
		r.Output = files
		r.manifestHash = ""
	}
	if e := ctx.Err(); e != nil {
		failRun(r, "cancelled", e)
		return
	}
	creds, e := currentTargetMatches(r.Target)
	if e != nil {
		failRun(r, "failed", e)
		return
	}
	baseline, e := targetBaseline(r.Target.ID)
	if e != nil || baseline != r.Target.Baseline {
		failRun(r, "failed", errBaselineChanged)
		return
	}
	managed, e := managedPaths(r)
	if e != nil {
		failRun(r, "failed", e)
		return
	}
	r.Managed = managed
	r.manifestHash = ""
	r.State = "uploading"
	if e = progressRun(r, "uploading", 0, 0, "uploading_frozen_output"); e != nil {
		failRun(r, "failed", e)
		return
	}
	receipt := func(value PublishReceipt) error { r.Receipt = &value; return saveRun(r) }
	progress := func(done, total int, message string) error { return progressRun(r, "uploading", done, total, message) }
	e = publishTransport(ctx, r, creds, output, progress, receipt)
	if e != nil {
		state := "failed"
		if errors.Is(e, context.Canceled) || r.Receipt != nil || r.Target.Provider == "netlify" {
			state = "outcome_unknown"
		}
		failRun(r, state, e)
		return
	}
	if r.Receipt == nil || !r.Receipt.Confirmed {
		failRun(r, "outcome_unknown", errors.New("verify_failed_confirmation_unavailable"))
		return
	}
	r.State = "recording"
	if e = progressRun(r, "recording", r.Completed, r.Total, "recording_result"); e != nil {
		failRun(r, "outcome_unknown", e)
		return
	}
	if e = finishSuccess(r); e != nil {
		failRun(r, "outcome_unknown", e)
	}
}
func managedPaths(r *PublishRun) ([]string, error) {
	paths := map[string]bool{}
	runs, e := allRuns()
	if e != nil {
		return nil, e
	}
	// Only our successful baseline and upload-attempt manifests establish ownership.
	for _, prev := range runs {
		if prev.Target.ID != r.Target.ID || prev.ID == r.ID {
			continue
		}
		if prev.ID == r.Target.Baseline || prev.Stage == "uploading" || prev.Stage == "recording" {
			for _, file := range prev.Output {
				if safeRelative(file.Path) {
					paths[file.Path] = true
				}
			}
			for _, name := range prev.Managed {
				if safeRelative(name) {
					paths[name] = true
				}
			}
		}
	}
	result := []string{}
	for name := range paths {
		result = append(result, name)
	}
	sort.Strings(result)
	return result, nil
}
func (a *App) PublishRetry(id, key string, resendUnknown bool) *R {
	publisher.Lock()
	defer publisher.Unlock()
	if !safeKey.MatchString(key) {
		return fail(errors.New("invalid_request_key"))
	}
	var existing string
	if e := DB.Get(&existing, "SELECT id FROM publish_run WHERE request_key=?", key); e == nil {
		return success(existing)
	}
	old, e := loadRun(id)
	if e != nil {
		return fail(e)
	}
	if old.State != "failed" && old.State != "interrupted" && old.State != "cancelled" && old.State != "outcome_unknown" {
		return fail(errors.New("task_not_retryable"))
	}
	if old.State == "outcome_unknown" && !resendUnknown {
		return fail(errors.New("remote_result_requires_confirmation"))
	}
	if old.Cleaned || old.RetryDisabled {
		return fail(errors.New("snapshot_missing_or_changed"))
	}
	if _, e = currentTargetMatches(old.Target); e != nil {
		return fail(e)
	}
	baseline, e := targetBaseline(old.Target.ID)
	if e != nil {
		return fail(e)
	}
	if baseline != "" && baseline != old.Target.Baseline && baseline != old.ID {
		return fail(errors.New("newer_success_exists"))
	}
	if e = verifyFiles(context.Background(), filepath.Join(releaseDir(old.SnapshotID), "source"), old.Frozen, true); e != nil {
		return fail(e)
	}
	if len(old.Output) > 0 {
		if e = verifyFiles(context.Background(), filepath.Join(releaseDir(old.SnapshotID), "output"), old.Output, false); e != nil {
			return fail(e)
		}
	}
	r := *old
	r.manifestHash = ""
	r.Diagnostic = ""
	r.ID = newKey()
	r.RequestKey = key
	r.RetryOf = old.ID
	r.State = "ready"
	r.Stage = "ready"
	r.Error = ""
	r.StartedAt = publishNow()
	r.FinishedAt = ""
	r.Target.Baseline = baseline
	r.Events = []PublishEvent{}
	r.Receipt = nil
	managed, err := managedPaths(&r)
	if err != nil {
		return fail(err)
	}
	r.Managed = managed
	if e = saveRun(&r); e != nil {
		return fail(e)
	}
	return success(r.ID)
}
func (a *App) PublishCancel(id string) *R {
	publisher.Lock()
	defer publisher.Unlock()
	r, e := loadRun(id)
	if e != nil {
		return fail(e)
	}
	if r.State == "ready" {
		r.State = "cancelled"
		r.FinishedAt = publishNow()
		if e = saveRun(r); e != nil {
			return fail(e)
		}
		return success(nil)
	}
	if publisher.active != id {
		return fail(errors.New("task_not_running"))
	}
	publisher.cancel()
	return success("stop_requested_remote_changes_not_rolled_back")
}
func (a *App) PublishVerify(id string) *R {
	publisher.Lock()
	defer publisher.Unlock()
	if publisher.active != "" {
		return fail(errors.New("publish_busy"))
	}
	r, e := loadRun(id)
	if e != nil {
		return fail(e)
	}
	if r.State != "outcome_unknown" {
		return fail(errors.New("task_not_pending_verification"))
	}
	creds, e := currentTargetMatches(r.Target)
	if e != nil {
		return fail(e)
	}
	baseline, e := targetBaseline(r.Target.ID)
	if e != nil {
		return fail(e)
	}
	if baseline != r.Target.Baseline {
		return fail(errors.New("newer_success_exists"))
	}
	r.State = "uploading"
	if e = saveRun(r); e != nil {
		return fail(e)
	}
	if e = publisher.launch(r, func(ctx context.Context, r *PublishRun) {
		if e := verifyPublishTransport(ctx, r, creds); e != nil {
			failRun(r, "outcome_unknown", e)
			return
		}
		if e := finishSuccess(r); e != nil {
			failRun(r, "outcome_unknown", e)
		}
	}); e != nil {
		return fail(e)
	}
	return success(id)
}
func (a *App) PublishCleanup(id string) *R {
	publisher.Lock()
	defer publisher.Unlock()
	runs, e := allRuns()
	if e != nil {
		return fail(e)
	}
	r, e := loadRun(id)
	if e != nil {
		return fail(e)
	}
	for _, other := range runs {
		if other.SnapshotID != r.SnapshotID {
			continue
		}
		baseline, e := targetBaseline(other.Target.ID)
		if e != nil {
			return fail(e)
		}
		if baseline == other.ID || publishActive(other.State) || other.State == "outcome_unknown" || other.State == "ready" || ((other.State == "failed" || other.State == "interrupted" || other.State == "cancelled") && !other.RetryDisabled) {
			return fail(errors.New("history_protected_by_baseline_or_retry"))
		}
	}
	if e = os.RemoveAll(releaseDir(r.SnapshotID)); e != nil {
		return fail(e)
	}
	for _, other := range runs {
		if other.SnapshotID == r.SnapshotID {
			other.Cleaned = true
			if e = saveRun(&other); e != nil {
				return fail(e)
			}
		}
	}
	return success(nil)
}
func (a *App) PublishArticleStates() *R {
	target, _, e := readPublishConfig()
	if e != nil {
		return success(map[string]interface{}{"known": false, "states": map[string]string{}})
	}
	if target.Baseline == "" {
		return success(map[string]interface{}{"known": false, "states": map[string]string{}})
	}
	base, e := loadRun(target.Baseline)
	if e != nil {
		return fail(e)
	}
	files, e := scanPublishFiles(context.Background(), Hugo.SitePath, true)
	if e != nil {
		return fail(e)
	}
	old := map[string]PublishFile{}
	for _, f := range base.Sources {
		if f.ArticleID != "" {
			old[f.ArticleID] = f
		}
	}
	states := map[string]string{}
	for _, f := range files {
		if f.ArticleID == "" {
			continue
		}
		status := "unpublished"
		if prev, ok := old[f.ArticleID]; ok {
			status = "published"
			if f.Hash != prev.Hash {
				status = "modified"
			}
		}
		if f.Excluded {
			status = "excluded"
		}
		states[f.ArticleID] = status
	}
	return success(map[string]interface{}{"known": true, "target": target, "states": states})
}
func (a *App) PublishOpenWebsite(id string) *R {
	r, e := loadRun(id)
	if e != nil {
		return fail(e)
	}
	if r.Target.Website == "" {
		return fail(errors.New("configure_website_url"))
	}
	return openPublishWebsite(r.Target.Website)
}

// Used by tests and diagnostics without serializing secrets.
func publishJSON(r *PublishRun) string { b, _ := json.Marshal(r); return string(b) }

func (a *App) PublishAbandonRetry(id string) *R {
	publisher.Lock()
	defer publisher.Unlock()
	r, e := loadRun(id)
	if e != nil {
		return fail(e)
	}
	if r.State != "failed" && r.State != "interrupted" && r.State != "cancelled" {
		return fail(errors.New("history_protected_by_baseline_or_retry"))
	}
	r.RetryDisabled = true
	if e = saveRun(r); e != nil {
		return fail(e)
	}
	return success(nil)
}

func (a *App) PublishUseTarget(provider string) *R {
	publisher.Lock()
	defer publisher.Unlock()
	target, _, e := readPublishTarget(provider)
	if e != nil {
		return fail(e)
	}
	b, e := Conf.Read(confTypeApp)
	if e != nil {
		return fail(e)
	}
	values := map[string]interface{}{}
	if len(b) > 0 {
		if e = json.Unmarshal(b, &values); e != nil {
			return fail(e)
		}
	}
	values["activedDeploy"] = provider
	data, e := json.Marshal(values)
	if e != nil {
		return fail(e)
	}
	if e = Conf.Write(confTypeApp, string(data)); e != nil {
		return fail(e)
	}
	return success(target)
}

func publishBuildLocations(message, root string) string {
	locations := regexp.MustCompile(`[A-Za-z0-9_./\\-]+\.(?:html|toml|yaml|json|md):[0-9]+(?::[0-9]+)?`).FindAllString(message, -1)
	if len(locations) > 8 {
		locations = locations[:8]
	}
	for i, value := range locations {
		locations[i] = strings.TrimPrefix(value, root+string(filepath.Separator))
	}
	return strings.Join(locations, "; ")
}

func (a *App) PublishActivity() *R {
	publisher.Lock()
	defer publisher.Unlock()
	id := publisher.active
	stage := ""
	if id != "" {
		r, e := loadRun(id)
		if e != nil {
			return fail(e)
		}
		stage = r.Stage
	}
	return success(map[string]interface{}{"activeId": id, "stage": stage})
}
