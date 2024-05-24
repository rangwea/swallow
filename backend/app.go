package backend

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/user"
	"path"
	"strconv"
	"strings"
	"time"

	"github.com/pkg/errors"
	"github.com/rangwea/swallows/backend/util"

	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
	rt "github.com/wailsapp/wails/v2/pkg/runtime"
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
	a.ctx = ctx

	defer func() {
		if r := recover(); r != nil {
			rt.MessageDialog(a.ctx, rt.MessageDialogOptions{
				Type:    rt.ErrorDialog,
				Message: fmt.Sprintf("app crashed:\n%s", r),
			})
			rt.Quit(a.ctx)
		}
	}()

	// initialize
	initialize()
}

func initialize() {
	// global cons init
	initAppHome()

	// db init
	initDB()

	// component init
	Conf.Initialize()
	Hugo.Initialize()
}

func initAppHome() {
	u, err := user.Current()
	if err != nil {
		panic(err)
	}
	AppHome = path.Join(u.HomeDir, ".swallow")
	if e, _ := util.PathExists(AppHome); !e {
		if err = os.Mkdir(AppHome, os.ModePerm); err != nil {
			panic(fmt.Errorf("make app home dir fail", err))
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
	ActivedDeploy ConfType `json:"activedDeploy"`
}

const confTypeApp ConfType = "app"

const SiteImagePath = "/static/images"

func (a *App) SitePreview() *R {
	err := Hugo.Preview()
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
	err := Hugo.Build()
	if err != nil {
		return fail(err)
	}

	ac, err := getAppConf()
	if err != nil {
		return fail(errors.Wrap(err, "get app conf fail"))
	}
	if ac == nil || ac.ActivedDeploy == "" {
		return fail(errors.New("please set server config"))
	}

	err = Deployers.Deploy(ac.ActivedDeploy, Hugo.PublicDir)
	if err != nil {
		return fail(errors.Wrap(err, "deploy fail"))
	}

	return success(nil)
}

func (a *App) ArticleList(search string, page int) *R {
	where := ""
	if search != "" {
		where += " where title like ? or tags like ?"
		search = "%" + search + "%"
	}

	offset := page * 10
	countSql := "select count(id) from t_article " + where
	pageSql := "select * from t_article " + where + " order by update_time desc limit 10 offset " + strconv.Itoa(offset)

	r := make(map[string]interface{})
	count := 0
	l := []Article{}
	r["total"] = &count
	r["list"] = &l

	DB.Get(&count, countSql, search, search)

	if count == 0 {
		return success(r)
	}

	err := DB.Select(&l, pageSql, search, search)
	if err != nil {
		return fail(err)
	}

	return success(r)
}

func (a *App) ArticleSave(aid string, meta Meta, content string) *R {
	n := time.Now().Format("2006-01-02 15:04:05")
	meta.Lastmod = n
	if meta.Date == "" {
		meta.Date = n
	}

	if aid != AboutAid {
		// common article need save db
		err := saveArticleToDB(&aid, meta)
		if err != nil {
			return fail(err)
		}
	}

	err := Hugo.WriteArticle(aid, meta, content)
	if err != nil {
		return fail(err)
	}

	return success(aid)
}

func (a *App) ArticleGet(aid string) *R {
	meta, content, err := Hugo.ReadArticle(aid)
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
		Hugo.DeleteArticle(aid)
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

	imageDir := Hugo.GetArticleImageDir(aid)
	os.Mkdir(imageDir, os.ModePerm)

	localPath, sitePath := Hugo.GenArticleImagePath(aid)
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

	imageDir := Hugo.GetArticleImageDir(aida)
	os.Mkdir(imageDir, os.ModePerm)

	localPath, sitePath := Hugo.GenArticleImagePath(aida)
	err := os.WriteFile(localPath, file, os.ModePerm)
	if err != nil {
		return fail(err)
	}

	return success(sitePath)
}

func (a *App) SiteConfigGet() *R {
	c, err := Hugo.ReadConfig()
	if err != nil {
		return fail(err)
	}
	return success(c)
}

func (a *App) SiteConfigSave(c Config) *R {
	err := Hugo.WriteConfig(c)
	if err != nil {
		return fail(err)
	}
	return success(nil)
}

func (a *App) SiteConfigGetStr() *R {
	c, err := Hugo.ReadConfigStr()
	if err != nil {
		return fail(err)
	}
	return success(c)
}

func (a *App) SiteConfigSaveStr(c []byte) *R {
	err := Hugo.WriteConfigStr(c)
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
	var r map[string]interface{}
	json.Unmarshal(v, &r)
	return success(r)
}

func (a *App) ConfSave(t ConfType, v string) *R {
	appConf, err := getAppConf()
	if err != nil {
		return fail(err)
	}
	appConf.ActivedDeploy = t
	appConfBytes, err := json.Marshal(appConf)
	if err != nil {
		return fail(errors.New("app conf marshal error"))
	}
	Conf.Write(confTypeApp, string(appConfBytes))

	err = Conf.Write(t, v)
	if err != nil {
		return fail(err)
	}
	return success(nil)
}

func (a *App) ConfGetThemes() *R {
	ts, err := Hugo.GetThemes()
	if err != nil {
		return fail(err)
	}
	return success(ts)
}

func (a *App) SelectConfImage(img string) *R {
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

	p := path.Join(Hugo.ImageDir, img)
	// remove old
	os.Remove(p)

	// copy conf image
	err = util.CopyFile(selection, p)
	if err != nil {
		return fail(err)
	}

	return success(nil)
}

func (a *App) GetSiteImageConf(imgPath string) *R {
	avatar := ""
	_, err := os.Stat(Hugo.ImageDir + "/avatar.png")
	if !os.IsNotExist(err) {
		avatar = SiteImagePath + "/avatar.png"
	}

	favicon := ""
	_, err = os.Stat(Hugo.ImageDir + "/favicon.ico")
	if !os.IsNotExist(err) {
		favicon = SiteImagePath + "/favicon.ico"
	}
	return success(map[string]string{
		"avatar":  avatar,
		"favicon": favicon,
	})
}

func saveArticleToDB(aidpr *string, meta Meta) error {
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
	if err != nil {
		return
	}
	c = &AppConf{}
	if cs == nil {
		return
	}
	err = json.Unmarshal(cs, c)
	return
}

func success(data interface{}) *R {
	return &R{Code: CodeSuccess, Msg: "success", Data: data}
}

func fail(err error) *R {
	return &R{Code: CodeError, Msg: err.Error()}
}
