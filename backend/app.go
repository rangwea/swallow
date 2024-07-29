package backend

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/pkg/errors"
	"github.com/rangwea/swallows/backend/hugo"
	"github.com/rangwea/swallows/backend/util"
	"os"
	"os/user"
	"path"
	"strconv"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
	rt "github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/exp/slog"
)

var AppHome string
var DB *sqlx.DB

const InitSql = `CREATE TABLE IF NOT EXISTS t_article(
    id INTEGER PRIMARY KEY autoincrement,
    title VARCHAR NOT NULL,
    tags VARCHAR,
    create_time DATETIME,
    update_time DATETIME
);
CREATE INDEX IF NOT EXISTS idx_t_article_title ON t_article(title);
CREATE INDEX IF NOT EXISTS idx_t_article_tags ON t_article(tags);
CREATE INDEX IF NOT EXISTS idx_t_article_create_time ON t_article(create_time);
CREATE INDEX IF NOT EXISTS idx_t_article_update_time ON t_article(update_time);`

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// Startup is called when the app starts. The context is saved
func (a *App) Startup(ctx context.Context) {
	// initialize
	initialize()
	a.ctx = ctx
}

func initialize() {
	// global cons init
	initAppHome()

	// db init
	initDB()

	// component init
	Conf.Initialize()
	hugo.Hugo.Initialize()
}

func initAppHome() {
	u, err := user.Current()
	if err != nil {
		slog.Error("get user dir fail", err)
	}
	AppHome = path.Join(u.HomeDir, ".swallow")
	if e, _ := util.PathExists(AppHome); !e {
		if err = os.Mkdir(AppHome, os.ModePerm); err != nil {
			slog.Error("make app home dir fail", err)
		}
	}
}

func initDB() {
	DB = sqlx.MustOpen("sqlite3", path.Join(AppHome, "db"))
	DB.MustExec(InitSql)
}

const (
	CodeSuccess = 1
	CodeError   = 0
)

type R struct {
	Code int         `json:"code"`
	Msg  string      `json:"msg"`
	Data interface{} `json:"data"`
}

type AppConf struct {
	Server ConfType
}

const confTypeApp ConfType = "app"

func (a *App) SitePreview() *R {
	err := hugo.Hugo.Preview()
	if err != nil {
		return fail(err)
	}
	err = util.OpenBrowser("http://localhost:1313/")
	if err != nil {
		return fail(err)
	}
	return success(nil)
}

func (a *App) SiteDeploy() *R {
	err := hugo.Hugo.Build()
	if err != nil {
		return fail(err)
	}

	ac, err := getAppConf()
	if err != nil {
		return fail(err)
	}
	if ac == nil || ac.Server == "" {
		return fail(errors.New("please set server config"))
	}

	err = Deployers.Deploy(ac.Server, hugo.Hugo.PublicDir)
	if err != nil {
		return fail(err)
	}

	return success(nil)
}

func (a *App) ArticleList(search string) *R {
	sql := "select * from t_article"
	if search != "" {
		sql += " where title like ? or tags like ?"
	}
	sql += " order by update_time desc"
	search = "%" + search + "%"
	r := []Article{}
	err := DB.Select(&r, sql, search, search, search)
	if err != nil {
		return fail(err)
	}
	return success(r)
}

func (a *App) ArticleSave(aid string, meta hugo.Meta, content string) *R {
	n := time.Now().Format("2006-01-02 15:04:05")
	meta.Lastmod = n
	if meta.Date == "" {
		meta.Date = n
	}

	if aid != hugo.AboutAid {
		// common article need save db
		err := saveArticleToDB(&aid, meta)
		if err != nil {
			return fail(err)
		}
	}

	err := hugo.Hugo.WriteArticle(aid, meta, content)
	if err != nil {
		return fail(err)
	}

	return success(aid)
}

func (a *App) ArticleGet(aid string) *R {
	meta, content, err := hugo.Hugo.ReadArticle(aid)
	if err != nil {
		return fail(err)
	}
	data := map[string]interface{}{
		"meta":    meta,
		"content": content,
	}
	return success(data)
}

func (a *App) ArticleRemove(aids []string) *R {
	_, err := DB.Exec(fmt.Sprintf("delete from t_article where id in(%s)", strings.Join(aids[:], ",")))
	if err != nil {
		return fail(err)
	}
	for _, aid := range aids {
		hugo.Hugo.DeleteArticle(aid)
	}
	return success(nil)
}

func (a *App) ArticleInsertImage(aid string) *R {
	selection, err := rt.OpenFileDialog(a.ctx, rt.OpenDialogOptions{
		Title: "Select Image",
		Filters: []rt.FileFilter{
			{
				DisplayName: "Images (*.png;*.jpg;*.gif;*.jpeg)",
				Pattern:     "*.png;*.jpg;*.gif;*.jpeg",
			},
		},
	})
	if err != nil {
		return fail(err)
	}

	imageDir := hugo.Hugo.GetArticleImageDir(aid)
	os.Mkdir(imageDir, os.ModePerm)

	localPath, sitePath := hugo.Hugo.GenArticleImagePath(aid)
	err = util.CopyFile(selection, localPath)
	if err != nil {
		return fail(err)
	}

	return success(sitePath)
}

func (a *App) ArticleInsertImageBlob(aid int, blob string) *R {
	var file []byte
	if err := json.Unmarshal([]byte(blob), &file); err != nil {
		return fail(err)
	}

	aida := strconv.Itoa(aid)

	imageDir := hugo.Hugo.GetArticleImageDir(aida)
	os.Mkdir(imageDir, os.ModePerm)

	localPath, sitePath := hugo.Hugo.GenArticleImagePath(aida)
	err := os.WriteFile(localPath, file, os.ModePerm)
	if err != nil {
		return fail(err)
	}

	return success(sitePath)
}

func (a *App) SiteConfigGet() *R {
	c, err := hugo.Hugo.ReadConfig()
	if err != nil {
		return fail(err)
	}
	return success(c)
}

func (a *App) SiteConfigSave(c hugo.Config) *R {
	err := hugo.Hugo.WriteConfig(c)
	if err != nil {
		return fail(err)
	}
	return success(nil)
}

func (a *App) ConfGet(t ConfType) *R {
	v, err := Conf.Read(t)
	if err != nil {
		return fail(err)
	}
	return success(v)
}

func (a *App) ConfSave(t ConfType, v string) *R {
	err := Conf.Write(t, v)
	if err != nil {
		return fail(err)
	}
	return success(nil)
}

func (a *App) ConfGetThemes() *R {
	ts, err := hugo.Hugo.GetThemes()
	if err != nil {
		return fail(err)
	}
	return success(ts)
}

func (a *App) SelectConfImage(imgPath string) *R {
	selection, err := rt.OpenFileDialog(a.ctx, rt.OpenDialogOptions{
		Title: "Select Image",
		Filters: []rt.FileFilter{
			{
				DisplayName: "Images (*.png;*.jpg;*.gif;*.jpeg;*.ico)",
				Pattern:     "*.png;*.jpg;*.gif;*.jpeg;*.ico",
			},
		},
	})
	if err != nil {
		return fail(err)
	}

	p := path.Join(hugo.Hugo.SitePath, imgPath)
	// remove old
	os.Remove(p)

	// copy conf image
	err = util.CopyAsset(selection, p)
	if err != nil {
		return fail(err)
	}

	return success(nil)
}

func saveArticleToDB(aidpr *string, meta hugo.Meta) error {
	title := meta.Title
	createTime := meta.Date
	tags := strings.Join(meta.Tags, ",")
	updateTime := meta.Lastmod

	aid := *aidpr

	if aid == "" {
		r, err := DB.Exec("insert into t_article(title, tags, create_time, update_time) values(?,?,?,?)",
			title, tags, createTime, updateTime)
		if err != nil {
			return err
		}
		nid, err := r.LastInsertId()
		if err != nil {
			return err
		}
		*aidpr = strconv.FormatInt(nid, 10)
	} else {
		id, err := strconv.Atoi(aid)
		if err != nil {
			return err
		}
		_, err = DB.Exec("update t_article set title=?, tags=?, update_time=? where id=?",
			title, tags, updateTime, id)
		if err != nil {
			return err
		}
	}
	return nil
}

func getAppConf() (c *AppConf, err error) {
	cs, err := Conf.Read(confTypeApp)
	c = &AppConf{}
	err = json.Unmarshal(cs, c)
	return
}

func success(data interface{}) *R {
	return &R{Code: CodeSuccess, Msg: "success", Data: data}
}

func fail(err error) *R {
	return &R{Code: CodeError, Msg: err.Error()}
}
