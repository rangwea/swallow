package backend

import (
	"errors"
	"github.com/jmoiron/sqlx"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
)

func setupWriting(t *testing.T) *App {
	t.Helper()
	oldHome, oldSite, oldDB, oldConf := AppHome, Hugo.SitePath, DB, Conf.DIR
	AppHome = t.TempDir()
	Hugo.setPaths(filepath.Join(AppHome, "site"))
	Conf.DIR = filepath.Join(AppHome, "conf")
	if e := os.MkdirAll(Hugo.articleDir, 0755); e != nil {
		t.Fatal(e)
	}
	var e error
	DB, e = sqlx.Open("sqlite3", filepath.Join(AppHome, "articles.db"))
	if e != nil {
		t.Fatal(e)
	}
	if _, e = DB.Exec(InitSql); e != nil {
		t.Fatal(e)
	}
	t.Cleanup(func() { DB.Close(); AppHome = oldHome; Hugo.setPaths(oldSite); DB = oldDB; Conf.DIR = oldConf })
	return NewApp()
}
func requireOK(t *testing.T, r *R) interface{} {
	t.Helper()
	if r.Code != 1 {
		t.Fatalf("operation failed: %+v", r)
	}
	return r.Data
}
func TestDraftIsolationAndValidation(t *testing.T) {
	a := setupWriting(t)
	d := Draft{ID: "draft-new", Meta: Meta{Title: "Private"}, Content: "secret"}
	requireOK(t, a.DraftSave(d))
	drafts := requireOK(t, a.DraftList()).([]Draft)
	if len(drafts) != 1 || drafts[0].Version != 1 {
		t.Fatal(drafts)
	}
	var count int
	DB.Get(&count, "select count(*) from t_article")
	if count != 0 {
		t.Fatal("draft created article")
	}
	if entries, _ := os.ReadDir(Hugo.articleDir); len(entries) != 0 {
		t.Fatal("draft entered Hugo content")
	}
	d.ID = "../escape"
	if a.DraftSave(d).Code == 1 {
		t.Fatal("accepted traversal")
	}
	requireOK(t, a.DraftRemove("draft-new"))
	if len(requireOK(t, a.DraftList()).([]Draft)) != 0 {
		t.Fatal("draft not removed")
	}
}
func TestTrashRoundTripAndConflict(t *testing.T) {
	a := setupWriting(t)
	id := requireOK(t, a.ArticleSave("", Meta{Title: "Hello"}, "body")).(string)
	requireOK(t, a.DraftSave(Draft{ID: "article-" + id, ArticleID: id, Content: "private update"}))
	source, _ := os.ReadFile(articleFile(id))
	requireOK(t, a.ArticleRemove([]string{id}))
	items := requireOK(t, a.TrashList()).([]TrashEntry)
	if len(items) != 1 {
		t.Fatal(items)
	}
	if _, e := os.Stat(articleFile(id)); !os.IsNotExist(e) {
		t.Fatal("article remains published")
	}
	row, _ := loadRow(id)
	if row != nil {
		t.Fatal("index still active")
	}
	if len(requireOK(t, a.DraftList()).([]Draft)) != 0 {
		t.Fatal("trashed draft is active")
	}
	requireOK(t, a.TrashRestore(items[0].ID))
	actual, _ := os.ReadFile(articleFile(id))
	if string(actual) != string(source) {
		t.Fatal("content changed")
	}
	if len(requireOK(t, a.DraftList()).([]Draft)) != 1 {
		t.Fatal("draft not restored")
	}
	// Explicitly conflicting index prevents restoration without overwriting.
	requireOK(t, a.ArticleRemove([]string{id}))
	items = requireOK(t, a.TrashList()).([]TrashEntry)
	if e := setRow(id, items[0].Row); e != nil {
		t.Fatal(e)
	}
	if a.TrashRestore(items[0].ID).Code == 1 {
		t.Fatal("overwrote conflicting index")
	}
	if a.TrashRestore("../escape").Code == 1 {
		t.Fatal("accepted traversal")
	}
}
func TestSaveFailurePreservesIndexAndDraft(t *testing.T) {
	a := setupWriting(t)
	requireOK(t, a.DraftSave(Draft{ID: "private", Content: "keep"}))
	// An inaccessible parent forces the formal file write to fail before any row is committed.
	if e := os.RemoveAll(Hugo.articleDir); e != nil {
		t.Fatal(e)
	}
	if e := os.WriteFile(Hugo.articleDir, []byte("blocked"), 0600); e != nil {
		t.Fatal(e)
	}
	if a.ArticleSave("", Meta{Title: "Fail"}, "body").Code == 1 {
		t.Fatal("accepted failed file write")
	}
	var count int
	DB.Get(&count, "select count(*) from t_article")
	if count != 0 {
		t.Fatal("ghost index")
	}
	if len(requireOK(t, a.DraftList()).([]Draft)) != 1 {
		t.Fatal("lost draft")
	}
}
func TestWritingRecoveryBeforeAndAfterCommit(t *testing.T) {
	for _, committed := range []bool{false, true} {
		t.Run(map[bool]string{false: "rollback", true: "finish"}[committed], func(t *testing.T) {
			a := setupWriting(t)
			id := requireOK(t, a.ArticleSave("", Meta{Title: "Before"}, "old")).(string)
			before, e := loadRow(id)
			if e != nil {
				t.Fatal(e)
			}
			old, _ := os.ReadFile(articleFile(id))
			after := *before
			after.Title = "After"
			op := writingOperation{ID: id, Before: before, After: &after, BeforeContent: old, AfterContent: []byte("updated"), Existed: true, File: articleFile(id)}
			if e = writeJSON(operationPath(), op); e != nil {
				t.Fatal(e)
			}
			if e = op.files(true); e != nil {
				t.Fatal(e)
			}
			if committed {
				if e = setRow(id, &after); e != nil {
					t.Fatal(e)
				}
			}
			if e = recoverWriting(); e != nil {
				t.Fatal(e)
			}
			got, _ := os.ReadFile(articleFile(id))
			expected := string(old)
			if committed {
				expected = "updated"
			}
			if string(got) != expected {
				t.Fatalf("%q != %q", got, expected)
			}
			if _, e = os.Stat(operationPath()); !os.IsNotExist(e) {
				t.Fatal("journal remains")
			}
		})
	}
}
func TestPaginationSearchAndClamp(t *testing.T) {
	a := setupWriting(t)
	if e := Conf.Write(confTypeApp, `{"articlesPerPage":2}`); e != nil { // create parent before writing
		os.MkdirAll(Conf.DIR, 0700)
		if e = Conf.Write(confTypeApp, `{"articlesPerPage":2}`); e != nil {
			t.Fatal(e)
		}
	}
	for i := 0; i < 5; i++ {
		requireOK(t, a.ArticleSave("", Meta{Title: "Title", Tags: []string{"tag"}}, "body"))
	}
	result := requireOK(t, a.ArticleList("", 99)).(map[string]interface{})
	if result["page"] != 2 || result["pageSize"] != 2 || len(result["list"].([]Article)) != 1 {
		t.Fatal(result)
	}
	result = requireOK(t, a.ArticleList("tag", -1)).(map[string]interface{})
	if result["total"] != 5 || result["page"] != 0 {
		t.Fatal(result)
	}
	result = requireOK(t, a.ArticleList("missing", 99)).(map[string]interface{})
	if result["total"] != 0 || result["page"] != 0 {
		t.Fatal(result)
	}
}

type failingDeployer struct{}

func (*failingDeployer) Deploy(string, interface{}) error { return errors.New("upload failed") }
func (*failingDeployer) ConfType() reflect.Type           { return reflect.TypeOf(struct{}{}) }
func TestDeployReturnsError(t *testing.T) {
	setupWriting(t)
	old := deployers["test"]
	deployers["test"] = &failingDeployer{}
	t.Cleanup(func() {
		if old == nil {
			delete(deployers, "test")
		} else {
			deployers["test"] = old
		}
	})
	os.MkdirAll(Conf.DIR, 0700)
	if e := Conf.Write("test", "{}"); e != nil {
		t.Fatal(e)
	}
	if e := Deployers.Deploy("test", ""); e == nil || !strings.Contains(e.Error(), "upload failed") {
		t.Fatal(e)
	}
	if e := Deployers.Deploy("unknown", ""); e == nil {
		t.Fatal("unknown type accepted")
	}
}

func TestSavedDraftAssociationSurvivesRestart(t *testing.T) {
	a := setupWriting(t)
	requireOK(t, a.DraftSave(Draft{ID: "new-draft", Content: "private", Meta: Meta{Title: "Title"}}))
	id := requireOK(t, a.ArticleSaveWithDraft("", "new-draft", Meta{Title: "Title"}, "body")).(string)
	drafts := requireOK(t, a.DraftList()).([]Draft)
	if len(drafts) != 1 || drafts[0].ArticleID != id || drafts[0].BaseHash != articleHash(id) {
		t.Fatal(drafts)
	}
}
func TestTrashRecoveryAcrossCommit(t *testing.T) {
	for _, commit := range []bool{false, true} {
		t.Run(map[bool]string{false: "rollback", true: "committed"}[commit], func(t *testing.T) {
			a := setupWriting(t)
			id := requireOK(t, a.ArticleSave("", Meta{Title: "Trash"}, "body")).(string)
			requireOK(t, a.DraftSave(Draft{ID: "private", ArticleID: id, Content: "draft"}))
			before, _ := loadRow(id)
			dir := filepath.Join(writingDir("trash"), "interrupted")
			item := TrashEntry{ID: "interrupted", ArticleID: id, Row: before, DraftIDs: []string{"private"}}
			if e := writeJSON(filepath.Join(dir, "record.json"), item); e != nil {
				t.Fatal(e)
			}
			op := writingOperation{ID: id, Before: before, From: filepath.Join(Hugo.articleDir, id), To: filepath.Join(dir, "article"), Moves: [][2]string{{filepath.Join(writingDir("drafts"), "private.json"), filepath.Join(dir, "drafts", "private.json")}}, CleanupRollback: dir}
			if e := writeJSON(operationPath(), op); e != nil {
				t.Fatal(e)
			}
			if e := op.files(true); e != nil {
				t.Fatal(e)
			}
			if commit {
				if e := setRow(id, nil); e != nil {
					t.Fatal(e)
				}
			}
			if e := recoverWriting(); e != nil {
				t.Fatal(e)
			}
			if commit {
				requireOK(t, a.TrashRestore("interrupted"))
			}
			if _, e := os.Stat(articleFile(id)); e != nil {
				t.Fatal(e)
			}
			if len(requireOK(t, a.DraftList()).([]Draft)) != 1 {
				t.Fatal("draft lost")
			}
		})
	}
}
func TestConcurrentDraftWritesRemainReadable(t *testing.T) {
	a := setupWriting(t)
	done := make(chan *R, 12)
	for i := 0; i < 12; i++ {
		go func() { done <- a.DraftSave(Draft{ID: "same", Content: strings.Repeat("x", 10000)}) }()
	}
	for i := 0; i < 12; i++ {
		requireOK(t, <-done)
	}
	if drafts := requireOK(t, a.DraftList()).([]Draft); len(drafts) != 1 || len(drafts[0].Content) != 10000 {
		t.Fatal("incomplete draft")
	}
}

func TestGuardIgnoresLateCleanup(t *testing.T) {
	a := NewApp()
	writingGuard.Lock()
	previousRevision, previousActive := writingGuard.revision, writingGuard.active
	writingGuard.revision = 0
	writingGuard.active = false
	writingGuard.Unlock()
	t.Cleanup(func() {
		writingGuard.Lock()
		writingGuard.revision = previousRevision
		writingGuard.active = previousActive
		writingGuard.Unlock()
	})
	a.WritingGuard(3, true)
	a.WritingGuard(2, false)
	writingGuard.Lock()
	active := writingGuard.active
	writingGuard.Unlock()
	if !active {
		t.Fatal("late unmount disabled close protection")
	}
	a.WritingGuard(4, false)
	writingGuard.Lock()
	active = writingGuard.active
	writingGuard.Unlock()
	if active {
		t.Fatal("current unmount did not release guard")
	}
}
