package backend

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/BurntSushi/toml"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"
)

func saveProtectedArticle(id string, meta Meta, content string, draftID ...string) (string, error) {
	writingMu.Lock()
	defer writingMu.Unlock()
	if e := recoverWriting(); e != nil {
		return "", e
	}
	if id != "" && !validArticle(id) {
		return "", errors.New("invalid article ID")
	}
	var before *articleRow
	var e error
	if id == "" {
		var next int64
		if e = DB.Get(&next, `select max(coalesce((select max(id) from t_article),0),coalesce((select seq from sqlite_sequence where name='t_article'),0))+1`); e != nil {
			return "", e
		}
		id = strconv.FormatInt(next, 10)
	} else {
		before, e = loadRow(id)
		if e != nil {
			return "", e
		}
		if before == nil && id != AboutAid {
			return "", errors.New("article no longer exists")
		}
	}
	meta.Lastmod = time.Now().Format("2006-01-02 15:04:05")
	if meta.Date == "" {
		meta.Date = meta.Lastmod
	}
	var buf bytes.Buffer
	if e = toml.NewEncoder(&buf).Encode(meta); e != nil {
		return "", e
	}
	filename := articleFile(id)
	old, e := os.ReadFile(filename)
	existed := e == nil
	if e != nil && !os.IsNotExist(e) {
		return "", e
	}
	var after *articleRow
	if id != AboutAid {
		number, _ := strconv.ParseInt(id, 10, 64)
		after = &articleRow{number, meta.Title, strings.Join(meta.Tags, ","), meta.Date, meta.Lastmod}
	}
	op := writingOperation{ID: id, Before: before, After: after, BeforeContent: old, AfterContent: []byte("+++\n" + buf.String() + "+++\n" + content), Existed: existed, File: filename}
	if len(draftID) > 0 {
		if !safeKey.MatchString(draftID[0]) {
			return "", errors.New("invalid draft ID")
		}
		op.SavedDraftID = draftID[0]
	}
	if e = performWriting(op); e != nil {
		return "", e
	}
	return id, nil
}

type TrashEntry struct {
	ID        string      `json:"id"`
	ArticleID string      `json:"articleId"`
	Title     string      `json:"title"`
	DeletedAt string      `json:"deletedAt"`
	Row       *articleRow `json:"row"`
	DraftIDs  []string    `json:"draftIds"`
}

func trashArticle(id string) error {
	if !validArticle(id) || id == AboutAid {
		return errors.New("invalid article ID")
	}
	if e := recoverWriting(); e != nil {
		return e
	}
	row, e := loadRow(id)
	if e != nil {
		return e
	}
	if row == nil {
		return errors.New("article no longer exists")
	}
	source := filepath.Join(Hugo.articleDir, id)
	if _, e = os.Stat(source); e != nil {
		return e
	}
	item := TrashEntry{ID: newKey(), ArticleID: id, Title: row.Title, DeletedAt: time.Now().UTC().Format(time.RFC3339Nano), Row: row, DraftIDs: []string{}}
	dir := filepath.Join(writingDir("trash"), item.ID)
	drafts, e := readDrafts()
	if e != nil {
		return e
	}
	moves := [][2]string{}
	for _, d := range drafts {
		if d.ArticleID == id {
			item.DraftIDs = append(item.DraftIDs, d.ID)
			moves = append(moves, [2]string{filepath.Join(writingDir("drafts"), d.ID+".json"), filepath.Join(dir, "drafts", d.ID+".json")})
		}
	}

	return performWriting(writingOperation{ID: id, Before: row, After: nil, From: source, To: filepath.Join(dir, "article"), Moves: moves, CleanupRollback: dir, TrashRecord: &item})
}
func (a *App) TrashList() *R {
	writingMu.Lock()
	defer writingMu.Unlock()
	if e := recoverWriting(); e != nil {
		return fail(e)
	}
	items := []TrashEntry{}
	entries, e := os.ReadDir(writingDir("trash"))
	if os.IsNotExist(e) {
		return success(items)
	}
	if e != nil {
		return fail(e)
	}
	for _, f := range entries {
		if !f.IsDir() {
			continue
		}
		b, e := os.ReadFile(filepath.Join(writingDir("trash"), f.Name(), "record.json"))
		if e != nil {
			return fail(e)
		}
		var item TrashEntry
		if e = json.Unmarshal(b, &item); e != nil {
			return fail(e)
		}
		items = append(items, item)
	}
	sort.Slice(items, func(i, j int) bool { return items[i].DeletedAt > items[j].DeletedAt })
	return success(items)
}
func (a *App) TrashRestore(key string) *R {
	writingMu.Lock()
	defer writingMu.Unlock()
	if !safeKey.MatchString(key) {
		return fail(errors.New("invalid trash ID"))
	}
	if e := recoverWriting(); e != nil {
		return fail(e)
	}
	dir := filepath.Join(writingDir("trash"), key)
	b, e := os.ReadFile(filepath.Join(dir, "record.json"))
	if e != nil {
		return fail(e)
	}
	var item TrashEntry
	if e = json.Unmarshal(b, &item); e != nil {
		return fail(e)
	}
	if !validArticle(item.ArticleID) || item.ArticleID == AboutAid || item.Row == nil || strconv.FormatInt(item.Row.ID, 10) != item.ArticleID {
		return fail(errors.New("invalid trash manifest"))
	}
	row, e := loadRow(item.ArticleID)
	if e != nil {
		return fail(e)
	}
	target := filepath.Join(Hugo.articleDir, item.ArticleID)
	if row != nil {
		return fail(errors.New("article ID already exists; restore refused"))
	}
	if _, e = os.Stat(target); !os.IsNotExist(e) {
		return fail(fmt.Errorf("article path already exists or is unavailable: %s", target))
	}
	moves := [][2]string{}
	for _, id := range item.DraftIDs {
		if !safeKey.MatchString(id) {
			return fail(errors.New("invalid draft ID"))
		}
		dest := filepath.Join(writingDir("drafts"), id+".json")
		if _, e = os.Stat(dest); !os.IsNotExist(e) {
			return fail(errors.New("draft already exists; restore refused"))
		}
		moves = append(moves, [2]string{filepath.Join(dir, "drafts", id+".json"), dest})
	}
	if e = performWriting(writingOperation{ID: item.ArticleID, After: item.Row, From: filepath.Join(dir, "article"), To: target, Moves: moves, CleanupSuccess: dir}); e != nil {
		return fail(e)
	}
	return success(item.ArticleID)
}

func (a *App) ArticleSaveWithDraft(id, draftID string, meta Meta, content string) *R {
	result, e := saveProtectedArticle(id, meta, content, draftID)
	if e != nil {
		return fail(e)
	}
	return success(result)
}
