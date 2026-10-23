package backend

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"sync"
	"time"
)

var writingMu sync.Mutex
var safeKey = regexp.MustCompile(`^[a-zA-Z0-9_-]{1,100}$`)

func validArticle(id string) bool {
	if id == AboutAid {
		return true
	}
	n, e := strconv.ParseInt(id, 10, 64)
	return e == nil && n > 0 && strconv.FormatInt(n, 10) == id
}
func newKey() string {
	b := make([]byte, 16)
	if _, e := rand.Read(b); e != nil {
		panic(e)
	}
	return hex.EncodeToString(b)
}
func writingDir(name string) string { return filepath.Join(AppHome, name) }
func writeJSON(name string, value any) error {
	b, e := json.Marshal(value)
	if e != nil {
		return e
	}
	if e = os.MkdirAll(filepath.Dir(name), 0700); e != nil {
		return e
	}
	return writeSiteConfig(name, b)
}
func articleFile(id string) string {
	if id == AboutAid {
		return Hugo.aboutFile
	}
	return filepath.Join(Hugo.articleDir, id, "index.md")
}
func articleHash(id string) string {
	if id == "" {
		return ""
	}
	b, e := os.ReadFile(articleFile(id))
	if e != nil {
		return "missing"
	}
	s := sha256.Sum256(b)
	return hex.EncodeToString(s[:])
}

type Draft struct {
	Version   int    `json:"version"`
	ID        string `json:"id"`
	ArticleID string `json:"articleId"`
	Meta      Meta   `json:"meta"`
	Content   string `json:"content"`
	BaseHash  string `json:"baseHash"`
	UpdatedAt string `json:"updatedAt"`
}

func (a *App) DraftSave(d Draft) *R {
	writingMu.Lock()
	defer writingMu.Unlock()
	if !safeKey.MatchString(d.ID) || (d.ArticleID != "" && !validArticle(d.ArticleID)) {
		return fail(errors.New("invalid draft identity"))
	}
	d.Version = 1
	d.UpdatedAt = time.Now().UTC().Format(time.RFC3339Nano)
	if e := writeJSON(filepath.Join(writingDir("drafts"), d.ID+".json"), d); e != nil {
		return fail(e)
	}
	return success(d)
}
func readDrafts() ([]Draft, error) {
	result := []Draft{}
	entries, e := os.ReadDir(writingDir("drafts"))
	if os.IsNotExist(e) {
		return result, nil
	}
	if e != nil {
		return nil, e
	}
	for _, f := range entries {
		if f.IsDir() || filepath.Ext(f.Name()) != ".json" {
			continue
		}
		b, e := os.ReadFile(filepath.Join(writingDir("drafts"), f.Name()))
		if e != nil {
			return nil, e
		}
		var d Draft
		if e = json.Unmarshal(b, &d); e != nil {
			return nil, fmt.Errorf("read draft %s: %w", f.Name(), e)
		}
		if !safeKey.MatchString(d.ID) || f.Name() != d.ID+".json" || (d.ArticleID != "" && !validArticle(d.ArticleID)) {
			return nil, fmt.Errorf("invalid draft file: %s", f.Name())
		}
		result = append(result, d)
	}
	sort.Slice(result, func(i, j int) bool { return result[i].UpdatedAt > result[j].UpdatedAt })
	return result, nil
}
func (a *App) DraftList() *R {
	writingMu.Lock()
	defer writingMu.Unlock()
	d, e := readDrafts()
	if e != nil {
		return fail(e)
	}
	return success(d)
}
func (a *App) DraftRemove(id string) *R {
	writingMu.Lock()
	defer writingMu.Unlock()
	if !safeKey.MatchString(id) {
		return fail(errors.New("invalid draft ID"))
	}
	e := os.Remove(filepath.Join(writingDir("drafts"), id+".json"))
	if e != nil && !os.IsNotExist(e) {
		return fail(e)
	}
	return success(nil)
}

// Rows retain exact SQLite date strings for compensation and restart recovery.
type articleRow struct {
	ID      int64  `db:"id"`
	Title   string `db:"title"`
	Tags    string `db:"tags"`
	Created string `db:"create_time"`
	Updated string `db:"update_time"`
}

func loadRow(id string) (*articleRow, error) {
	if id == AboutAid {
		return nil, nil
	}
	rows := []articleRow{}
	e := DB.Select(&rows, "select id,title,coalesce(tags,'') tags,coalesce(cast(create_time as text),'') create_time,coalesce(cast(update_time as text),'') update_time from t_article where id=?", id)
	if e != nil {
		return nil, e
	}
	if len(rows) == 0 {
		return nil, nil
	}
	return &rows[0], nil
}
func setRow(id string, row *articleRow) error {
	if id == AboutAid {
		return nil
	}
	if row == nil {
		_, e := DB.Exec("delete from t_article where id=?", id)
		return e
	}
	_, e := DB.Exec(`insert into t_article(id,title,tags,create_time,update_time) values(?,?,?,?,?) on conflict(id) do update set title=excluded.title,tags=excluded.tags,create_time=excluded.create_time,update_time=excluded.update_time`, row.ID, row.Title, row.Tags, row.Created, row.Updated)
	return e
}

type writingOperation struct {
	ID                          string
	Before, After               *articleRow
	BeforeContent, AfterContent []byte
	Existed                     bool
	// A move is applied forward for delete/restore, backward during compensation.
	From, To                        string
	Moves                           [][2]string
	File                            string
	CleanupSuccess, CleanupRollback string
	SavedDraftID                    string
	TrashRecord                     *TrashEntry
}

func sameRow(a, b *articleRow) bool {
	if a == nil || b == nil {
		return a == nil && b == nil
	}
	return *a == *b
}
func applyMove(from, to string) error {
	if from == "" {
		return nil
	}
	_, e := os.Stat(from)
	if os.IsNotExist(e) {
		if _, e = os.Stat(to); e == nil {
			return nil
		}
		return e
	}
	if e != nil {
		return e
	}
	if _, e = os.Stat(to); e == nil {
		return fmt.Errorf("destination already exists: %s", to)
	} else if !os.IsNotExist(e) {
		return e
	}
	if e = os.MkdirAll(filepath.Dir(to), 0700); e != nil {
		return e
	}
	return os.Rename(from, to)
}
func (op *writingOperation) files(forward bool) error {
	if op.From != "" {
		if forward {
			if op.TrashRecord != nil {
				if e := writeJSON(filepath.Join(filepath.Dir(op.To), "record.json"), op.TrashRecord); e != nil {
					return e
				}
			}
			if e := applyMove(op.From, op.To); e != nil {
				return e
			}
			for _, m := range op.Moves {
				if e := applyMove(m[0], m[1]); e != nil {
					return e
				}
			}
			return nil
		}
		for i := len(op.Moves) - 1; i >= 0; i-- {
			m := op.Moves[i]
			if e := applyMove(m[1], m[0]); e != nil {
				return e
			}
		}
		return applyMove(op.To, op.From)
	}
	data := op.AfterContent
	if !forward {
		data = op.BeforeContent
		if !op.Existed {
			e := os.Remove(op.File)
			if os.IsNotExist(e) {
				return nil
			}
			return e
		}
	}
	if e := os.MkdirAll(filepath.Dir(op.File), 0755); e != nil {
		return e
	}
	return writeSiteConfig(op.File, data)
}
func operationPath() string { return filepath.Join(writingDir("operations"), "pending.json") }
func recoverWriting() error {
	b, e := os.ReadFile(operationPath())
	if os.IsNotExist(e) {
		return nil
	}
	if e != nil {
		return e
	}
	var op writingOperation
	if e = json.Unmarshal(b, &op); e != nil {
		return e
	}
	row, e := loadRow(op.ID)
	if e != nil {
		return e
	}
	forward := sameRow(row, op.After)
	if e = op.files(forward); e != nil {
		return e
	}
	if forward {
		if e = op.associateDraft(); e != nil {
			return e
		}
	}
	cleanup := op.CleanupRollback
	if forward {
		cleanup = op.CleanupSuccess
	}
	if cleanup != "" {
		if e = os.RemoveAll(cleanup); e != nil {
			return e
		}
	}
	return os.Remove(operationPath())
}
func performWriting(op writingOperation) error {
	if e := recoverWriting(); e != nil {
		return fmt.Errorf("recover previous operation: %w", e)
	}
	if e := writeJSON(operationPath(), op); e != nil {
		return e
	}
	if e := op.files(true); e != nil {
		if op.File != "" {
			if cleanup := os.Remove(operationPath()); cleanup != nil {
				return fmt.Errorf("%v; journal cleanup: %w", e, cleanup)
			}
			return e
		}
		return compensate(op, e)
	}
	if e := setRow(op.ID, op.After); e != nil {
		return compensate(op, e)
	}
	if e := op.associateDraft(); e != nil {
		return e
	}
	if op.CleanupSuccess != "" {
		if e := os.RemoveAll(op.CleanupSuccess); e != nil {
			return e
		}
	}
	return os.Remove(operationPath())
}
func compensate(op writingOperation, cause error) error {
	if e := op.files(false); e != nil {
		return fmt.Errorf("%v; recovery required: %w", cause, e)
	}
	if e := setRow(op.ID, op.Before); e != nil {
		return fmt.Errorf("%v; index recovery required: %w", cause, e)
	}
	if op.CleanupRollback != "" {
		if e := os.RemoveAll(op.CleanupRollback); e != nil {
			return e
		}
	}
	if e := os.Remove(operationPath()); e != nil {
		return e
	}
	return cause
}

func (op *writingOperation) associateDraft() error {
	if op.SavedDraftID == "" {
		return nil
	}
	filename := filepath.Join(writingDir("drafts"), op.SavedDraftID+".json")
	b, e := os.ReadFile(filename)
	if os.IsNotExist(e) {
		return nil
	}
	if e != nil {
		return e
	}
	var d Draft
	if e = json.Unmarshal(b, &d); e != nil {
		return e
	}
	d.ArticleID = op.ID
	d.BaseHash = articleHash(op.ID)
	return writeJSON(filename, d)
}
