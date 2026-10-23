package backend

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"
)

type PublishTarget struct {
	ID          string `json:"id"`
	Provider    string `json:"provider"`
	Destination string `json:"destination"`
	Website     string `json:"website"`
	Baseline    string `json:"baseline"`
	Repository  string `json:"repository,omitempty"`
	Branch      string `json:"branch,omitempty"`
	Bucket      string `json:"bucket,omitempty"`
	Region      string `json:"region,omitempty"`
	Prefix      string `json:"prefix,omitempty"`
	Endpoint    string `json:"endpoint,omitempty"`
	SiteID      string `json:"siteId,omitempty"`
}
type PublishFile struct {
	Path      string `json:"path"`
	Hash      string `json:"hash"`
	Size      int64  `json:"size"`
	ArticleID string `json:"articleId,omitempty"`
	Title     string `json:"title,omitempty"`
	Excluded  bool   `json:"excluded,omitempty"`
}
type PublishChange struct {
	Path      string `json:"path"`
	Kind      string `json:"kind"`
	ArticleID string `json:"articleId,omitempty"`
	Title     string `json:"title,omitempty"`
}
type PublishEvent struct {
	Sequence int    `json:"sequence"`
	Time     string `json:"time"`
	Stage    string `json:"stage"`
	Message  string `json:"message"`
}
type PublishReceipt struct {
	ID        string `json:"id"`
	Kind      string `json:"kind"`
	Confirmed bool   `json:"confirmed"`
}
type PublishRun struct {
	manifestHash string

	ID            string          `json:"id"`
	RequestKey    string          `json:"requestKey"`
	Target        PublishTarget   `json:"target"`
	SnapshotID    string          `json:"snapshotId"`
	RetryOf       string          `json:"retryOf,omitempty"`
	State         string          `json:"state"`
	Stage         string          `json:"stage"`
	PreparedAt    string          `json:"preparedAt,omitempty"`
	StartedAt     string          `json:"startedAt,omitempty"`
	FinishedAt    string          `json:"finishedAt,omitempty"`
	Error         string          `json:"error,omitempty"`
	Diagnostic    string          `json:"diagnostic,omitempty"`
	Completed     int             `json:"completed"`
	Total         int             `json:"total"`
	Drafts        int             `json:"drafts"`
	Sources       []PublishFile   `json:"sources"`
	Frozen        []PublishFile   `json:"-"`
	Output        []PublishFile   `json:"output"`
	Managed       []string        `json:"managed"`
	Changes       []PublishChange `json:"changes"`
	Events        []PublishEvent  `json:"events"`
	Receipt       *PublishReceipt `json:"receipt,omitempty"`
	Cleaned       bool            `json:"cleaned"`
	RetryDisabled bool            `json:"retryDisabled"`
}

// Frozen input validation is persisted separately from the public JSON response.
type storedRun struct {
	Run    PublishRun    `json:"run"`
	Frozen []PublishFile `json:"frozen"`
}
type publishService struct {
	sync.Mutex
	active  string
	cancel  context.CancelFunc
	workers sync.WaitGroup
}

var publisher = &publishService{}
var errContentChanged = errors.New("source_changed")
var errBaselineChanged = errors.New("baseline_changed")

func publishNow() string { return time.Now().UTC().Format(time.RFC3339Nano) }
func publishActive(state string) bool {
	return state == "preparing" || state == "building" || state == "uploading" || state == "recording"
}
func initPublishing() error {
	_, e := DB.Exec(`CREATE TABLE IF NOT EXISTS publish_schema(version INTEGER NOT NULL); INSERT INTO publish_schema(version) SELECT 1 WHERE NOT EXISTS(SELECT 1 FROM publish_schema);
 CREATE TABLE IF NOT EXISTS publish_target(id TEXT PRIMARY KEY, baseline TEXT NOT NULL DEFAULT '');
 CREATE TABLE IF NOT EXISTS publish_run(id TEXT PRIMARY KEY, request_key TEXT NOT NULL UNIQUE, target_id TEXT NOT NULL, created TEXT NOT NULL, state TEXT NOT NULL, body TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS publish_run_target ON publish_run(target_id,created);
 CREATE TABLE IF NOT EXISTS publish_manifest(run_id TEXT PRIMARY KEY, digest TEXT NOT NULL, body TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS publish_event(run_id TEXT NOT NULL,seq INTEGER NOT NULL,body TEXT NOT NULL,PRIMARY KEY(run_id,seq));`)
	if e != nil {
		return e
	}
	var version int
	if e = DB.Get(&version, "SELECT max(version) FROM publish_schema"); e != nil {
		return e
	}
	if version != 1 {
		return errors.New("unsupported_publish_schema")
	}
	rows := []struct {
		Body string `db:"body"`
	}{}
	if e = DB.Select(&rows, "SELECT body FROM publish_run WHERE state IN ('preparing','building','uploading','recording')"); e != nil {
		return e
	}
	for _, row := range rows {
		var stored storedRun
		if e = json.Unmarshal([]byte(row.Body), &stored); e != nil {
			return e
		}
		r := stored.Run
		if e = hydrateRun(&r); e != nil {
			return e
		}
		if r.State == "uploading" || r.State == "recording" {
			r.State = "outcome_unknown"
		} else {
			r.State = "interrupted"
		}
		r.Error = "application_interrupted"
		r.FinishedAt = publishNow()
		if e = saveRun(&r); e != nil {
			return e
		}
	}
	return nil
}

type storedManifest struct {
	Sources, Frozen, Output []PublishFile
	Changes                 []PublishChange
	Managed                 []string
}

func saveRun(r *PublishRun) error {
	if r.manifestHash == "" {
		data, e := json.Marshal(storedManifest{r.Sources, r.Frozen, r.Output, r.Changes, r.Managed})
		if e != nil {
			return e
		}
		hash := digest(data)
		if _, e = DB.Exec(`INSERT INTO publish_manifest(run_id,digest,body) VALUES(?,?,?) ON CONFLICT(run_id) DO UPDATE SET digest=excluded.digest,body=excluded.body WHERE publish_manifest.digest!=excluded.digest`, r.ID, hash, string(data)); e != nil {
			return e
		}
		r.manifestHash = hash
	}
	if len(r.Events) > 0 {
		event := r.Events[len(r.Events)-1]
		data, e := json.Marshal(event)
		if e != nil {
			return e
		}
		if _, e = DB.Exec("INSERT OR IGNORE INTO publish_event(run_id,seq,body) VALUES(?,?,?)", r.ID, event.Sequence, string(data)); e != nil {
			return e
		}
	}
	summary := *r
	summary.Sources = nil
	summary.Frozen = nil
	summary.Output = nil
	summary.Changes = nil
	summary.Managed = nil
	summary.Events = nil
	body, e := json.Marshal(storedRun{Run: summary})
	if e != nil {
		return e
	}
	_, e = DB.Exec(`INSERT INTO publish_run(id,request_key,target_id,created,state,body) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state,body=excluded.body`, r.ID, r.RequestKey, r.Target.ID, r.StartedAt, r.State, string(body))
	return e
}
func hydrateRun(r *PublishRun) error {
	var row struct {
		Body   string `db:"body"`
		Digest string `db:"digest"`
	}
	if e := DB.Get(&row, "SELECT digest,body FROM publish_manifest WHERE run_id=?", r.ID); e != nil {
		return e
	}
	var m storedManifest
	if e := json.Unmarshal([]byte(row.Body), &m); e != nil {
		return e
	}
	r.Sources = m.Sources
	r.Frozen = m.Frozen
	r.Output = m.Output
	r.Changes = m.Changes
	r.Managed = m.Managed
	r.manifestHash = row.Digest
	rows := []struct {
		Body string `db:"body"`
	}{}
	if e := DB.Select(&rows, "SELECT body FROM publish_event WHERE run_id=? ORDER BY seq", r.ID); e != nil {
		return e
	}
	r.Events = []PublishEvent{}
	for _, row := range rows {
		var event PublishEvent
		if e := json.Unmarshal([]byte(row.Body), &event); e != nil {
			return e
		}
		r.Events = append(r.Events, event)
	}
	return nil
}
func loadRun(id string) (*PublishRun, error) {
	if !safeKey.MatchString(id) {
		return nil, errors.New("invalid_task_id")
	}
	var body string
	if e := DB.Get(&body, "SELECT body FROM publish_run WHERE id=?", id); e != nil {
		return nil, e
	}
	var stored storedRun
	if e := json.Unmarshal([]byte(body), &stored); e != nil {
		return nil, e
	}
	r := stored.Run
	if r.ID != id || !safeKey.MatchString(r.SnapshotID) {
		return nil, errors.New("invalid_task_record")
	}
	if e := hydrateRun(&r); e != nil {
		return nil, e
	}
	return &r, nil
}
func summaryRuns() ([]PublishRun, error) {
	rows := []struct {
		Body string `db:"body"`
	}{}
	if e := DB.Select(&rows, "SELECT body FROM publish_run ORDER BY created DESC"); e != nil {
		return nil, e
	}
	result := []PublishRun{}
	for _, row := range rows {
		var stored storedRun
		if e := json.Unmarshal([]byte(row.Body), &stored); e != nil {
			return nil, e
		}
		result = append(result, stored.Run)
	}
	return result, nil
}
func allRuns() ([]PublishRun, error) {
	runs, e := summaryRuns()
	if e != nil {
		return nil, e
	}
	for i := range runs {
		if e = hydrateRun(&runs[i]); e != nil {
			return nil, e
		}
	}
	return runs, nil
}

func targetBaseline(id string) (string, error) {
	var result string
	if e := DB.Get(&result, "SELECT baseline FROM publish_target WHERE id=?", id); e != nil {
		return "", e
	}
	return result, nil
}
func finishSuccess(r *PublishRun) error {
	r.State = "succeeded"
	r.Stage = "recording"
	r.Error = ""
	r.FinishedAt = publishNow()
	summary := *r
	summary.Sources = nil
	summary.Frozen = nil
	summary.Output = nil
	summary.Changes = nil
	summary.Managed = nil
	summary.Events = nil
	body, e := json.Marshal(storedRun{Run: summary})
	if e != nil {
		return e
	}
	tx, e := DB.Beginx()
	if e != nil {
		return e
	}
	defer tx.Rollback()
	res, e := tx.Exec("UPDATE publish_target SET baseline=? WHERE id=? AND baseline=?", r.ID, r.Target.ID, r.Target.Baseline)
	if e != nil {
		return e
	}
	n, e := res.RowsAffected()
	if e != nil {
		return e
	}
	if n != 1 {
		return errBaselineChanged
	}
	if _, e = tx.Exec("UPDATE publish_run SET state=?,body=? WHERE id=?", r.State, string(body), r.ID); e != nil {
		return e
	}
	return tx.Commit()
}
func progressRun(r *PublishRun, stage string, done, total int, message string) error {
	r.Stage = stage
	r.Completed = done
	r.Total = total
	if message != "" {
		r.Events = append(r.Events, PublishEvent{len(r.Events) + 1, publishNow(), stage, message})
	}
	return saveRun(r)
}
func (s *publishService) launch(r *PublishRun, work func(context.Context, *PublishRun)) error {
	if s.active != "" {
		return fmt.Errorf("publish_busy:%s", s.active)
	}
	ctx, cancel := context.WithCancel(context.Background())
	s.active = r.ID
	s.cancel = cancel
	s.workers.Add(1)
	go func() {
		defer s.workers.Done()
		defer cancel()
		defer func() { s.Lock(); s.active = ""; s.cancel = nil; s.Unlock() }()
		defer func() {
			if recover() != nil {
				r.State = "outcome_unknown"
				r.Error = "unexpected_publish_error"
				r.FinishedAt = publishNow()
				_ = saveRun(r)
			}
		}()
		work(ctx, r)
	}()
	return nil
}
