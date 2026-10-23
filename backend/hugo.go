package backend

import (
	"bufio"
	"bytes"
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"os"
	"path"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/rangwea/swallows/backend/util"

	"golang.org/x/exp/slog"

	"github.com/BurntSushi/toml"
)

const AboutAid string = "about"

type _hugo struct {
	frozenBuild   bool
	PublicDir     string
	SitePath      string
	ImageDir      string
	articleDir    string
	articleImgDir string
	themeDir      string
	aboutDir      string
	aboutFile     string
	cnameFile     string
	configFile    string
	server        *http.Server
	serverRunning bool
	previewAddr   string
	buildMu       sync.Mutex
	configMu      sync.RWMutex
	previewMu     sync.Mutex
	outputMu      sync.RWMutex
}

var Hugo = _hugo{}

type Meta struct {
	Title       string   `json:"title"`
	Tags        []string `json:"tags"`
	Description string   `json:"description"`
	Date        string   `json:"date"`
	Lastmod     string   `json:"lastmod"`
}

type Config struct {
	Title                  string        `json:"title"`
	Description            string        `json:"description"`
	DefaultContentLanguage string        `json:"defaultContentLanguage"`
	Theme                  string        `json:"theme"`
	Copyright              string        `json:"copyright"`
	Params                 *ConfigParams `json:"params"`
}

type ConfigParams struct {
	Author *ConfigAuthor `json:"author"`
}

type ConfigAuthor struct {
	Name string `json:"name"`
}

func (h *_hugo) Initialize() {
	slog.Info("init hugo start")
	h.setPaths(path.Join(AppHome, "site"))

	h.NewSite()

	if err := h.migrateBundledThemes(); err != nil {
		panic(err)
	}
	if err := h.repairSite(); err != nil {
		panic(err)
	}

	slog.Info("init hugo done")
}

func (h *_hugo) setPaths(sitePath string) {
	h.SitePath = sitePath
	h.articleDir = path.Join(h.SitePath, "content", "post")
	h.articleImgDir = path.Join(h.articleDir, "images")
	h.ImageDir = path.Join(h.SitePath, "static", "images")
	h.cnameFile = path.Join(h.SitePath, "static", "CNAME")
	h.themeDir = path.Join(h.SitePath, "themes")
	h.aboutDir = path.Join(h.SitePath, "content", AboutAid)
	h.aboutFile = path.Join(h.SitePath, "content", AboutAid, "index.md")
	h.configFile = path.Join(h.SitePath, "hugo.toml")
	h.PublicDir = path.Join(h.SitePath, "public")

}

func (h *_hugo) NewSite() {
	slog.Info("start new site")
	if existed, _ := util.PathExists(h.SitePath); existed {
		slog.Info("site existed")
		return
	}

	// call hugo to create site
	err := createSiteSkeleton(h.SitePath)
	if err != nil {
		panic(fmt.Errorf("copy config fail, %w", err))
	}

	// copy config file
	os.Remove(h.configFile)
	err = util.CopyAsset("hugo.toml", h.configFile)
	if err != nil {
		panic(fmt.Errorf("copy config fail, %w", err))
	}
	slog.Info("copy config file")

	err = h.setWorkingDirConfig()
	if err != nil {
		panic(fmt.Errorf("set workingDir config fail, %w", err))
	}

	// copy theme zip file
	themeCopyDstPath := path.Join(path.Dir(h.SitePath), "themes.zip")
	err = util.CopyAsset("themes.zip", themeCopyDstPath)
	if err != nil {
		panic(fmt.Errorf("copy themes.zip fail, %w", err))
	}
	// unzip
	err = util.UnZip(themeCopyDstPath, h.SitePath)
	if err != nil {
		panic(fmt.Errorf("unzip themes file fail, %w", err))
	}
	// remove zip
	os.Remove(themeCopyDstPath)
	slog.Info("unzip theme file")

	os.Mkdir(h.articleDir, os.ModePerm)
	os.Mkdir(h.articleImgDir, os.ModePerm)
	os.Mkdir(h.ImageDir, os.ModePerm)
	os.WriteFile(h.cnameFile, nil, 0644)
	// create about post
	os.Mkdir(h.aboutDir, os.ModePerm)
	os.WriteFile(h.aboutFile, nil, 0644)

	slog.Info("new site success")
}

func (h *_hugo) Build() error {
	h.buildMu.Lock()
	defer h.buildMu.Unlock()
	h.configMu.RLock()
	defer h.configMu.RUnlock()
	return h.buildSite()
}

func (h *_hugo) Preview() error {
	if err := h.Build(); err != nil {
		return err
	}
	h.previewMu.Lock()
	defer h.previewMu.Unlock()
	if h.serverRunning {
		return nil
	}
	addr := h.previewAddr
	if addr == "" {
		addr = "127.0.0.1:1313"
	}
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		return fmt.Errorf("start preview on %s: %w", addr, err)
	}
	mux := http.NewServeMux()
	files := http.FileServer(http.Dir(h.PublicDir))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		h.outputMu.RLock()
		defer h.outputMu.RUnlock()
		w.Header().Set("Cache-Control", "no-store")
		files.ServeHTTP(w, r)
	})
	server := &http.Server{Handler: mux, ReadHeaderTimeout: 5 * time.Second}
	h.server, h.serverRunning = server, true
	go func() {
		err := server.Serve(listener)
		h.previewMu.Lock()
		if h.server == server {
			h.serverRunning = false
		}
		h.previewMu.Unlock()
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("preview server failed", "error", err)
		}
	}()
	return nil
}

func (h *_hugo) ClosePreview() error {
	h.previewMu.Lock()
	defer h.previewMu.Unlock()
	if h.server == nil {
		return nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	err := h.server.Shutdown(ctx)
	if err != nil {
		_ = h.server.Close()
	}
	h.server, h.serverRunning = nil, false
	return err
}

func (h *_hugo) WriteArticle(aid string, meta Meta, content string) error {
	buf := new(bytes.Buffer)
	err := toml.NewEncoder(buf).Encode(meta)
	if err != nil {
		slog.Error("encode meta fail", err)
		return err
	}
	metaString := "+++\n" + buf.String() + "+++\n"
	content = metaString + content

	var articleF string
	if aid == AboutAid {
		// about file
		articleF = h.aboutFile
	} else {
		// common article file
		adir := path.Join(h.articleDir, aid)
		if e, _ := util.PathExists(adir); !e {
			err = os.MkdirAll(adir, os.ModePerm)
			if err != nil {
				return err
			}
		}
		articleF = path.Join(adir, "index.md")
	}

	err = writeSiteConfig(articleF, []byte(content))
	if err != nil {
		slog.Error("write article fail", err)
		return err
	}
	return nil
}

func (h *_hugo) ReadArticle(aid string) (meta Meta, content string, err error) {
	var p string
	if aid == AboutAid {
		p = h.aboutFile // about file
	} else {
		p = path.Join(h.articleDir, aid, "index.md") // common article file
	}
	a, err := os.ReadFile(p)
	if err != nil {
		slog.Error("read article fail", err)
		return Meta{}, "", err
	}
	m, c := h.SplitMetaAndContent(string(a))
	meta = Meta{}
	_, err = toml.Decode(m, &meta)
	if err != nil {
		slog.Error("decode meta fail when reading article", err)
		return Meta{}, "", err
	}
	return meta, c, nil
}

func (h *_hugo) DeleteArticle(aid string) error {
	p := path.Join(h.articleDir, aid)
	err := os.RemoveAll(p)
	if err != nil {
		slog.Error("remove article file fail", err)
		return err
	}
	return nil
}

func (h *_hugo) GetArticleImageDir(aid string) string {
	return path.Join(h.SitePath, "/static/images", aid)
}

func (h *_hugo) GenArticleImagePath(aid string) (localPath string, sitePath string) {
	filename := strconv.FormatInt(time.Now().UnixNano(), 10) + ".png"
	sitePath = path.Join("/static/images", aid, filename)
	localPath = path.Join(h.SitePath, sitePath)
	return localPath, sitePath
}

func (h *_hugo) ReadConfig() (c Config, err error) {
	h.configMu.RLock()
	defer h.configMu.RUnlock()
	b, err := os.ReadFile(h.configFile)
	if err != nil {
		slog.Error("read config fail", err)
		return Config{}, err
	}
	r := Config{}
	_, err = toml.Decode(string(b), &r)
	if err != nil {
		slog.Error("decode config fail", err)
		return Config{}, err
	}
	return r, nil
}

func (h *_hugo) WriteConfig(c Config) error {
	h.configMu.Lock()
	defer h.configMu.Unlock()
	c.Theme = strings.TrimSpace(c.Theme)
	if c.Theme == "" {
		c.Theme = "mini"
	}
	if err := h.validateTheme(c.Theme); err != nil {
		return err
	}
	b, err := os.ReadFile(h.configFile)
	if err != nil {
		return err
	}
	old := make(map[string]interface{})
	_, err = toml.Decode(string(b), &old)
	if err != nil {
		slog.Error("decode config fail", err)
		return err
	}

	old["title"] = c.Title
	old["description"] = c.Description
	old["defaultContentLanguage"] = c.DefaultContentLanguage
	old["theme"] = c.Theme
	old["copyright"] = c.Copyright
	oldParams, _ := old["params"].(map[string]interface{})
	if oldParams == nil {
		oldParams = make(map[string]interface{})
	}
	oldAuthor, _ := oldParams["author"].(map[string]interface{})
	if oldAuthor == nil {
		oldAuthor = make(map[string]interface{})
	}
	if c.Params != nil && c.Params.Author != nil {
		oldAuthor["name"] = c.Params.Author.Name
	}
	oldParams["author"] = oldAuthor
	old["params"] = oldParams

	buf := new(bytes.Buffer)
	err = toml.NewEncoder(buf).Encode(old)
	if err != nil {
		slog.Error("encode config fail", err)
		return err
	}

	err = writeSiteConfig(h.configFile, buf.Bytes())
	if err != nil {
		slog.Error("write config fail", err)
		return err
	}

	return nil
}

func (h *_hugo) ReadConfigStr() (c []byte, err error) {
	h.configMu.RLock()
	defer h.configMu.RUnlock()
	c, err = os.ReadFile(h.configFile)
	if err != nil {
		slog.Error("read config fail", err)
		return
	}
	return
}

func (h *_hugo) WriteConfigStr(c []byte) error {
	h.configMu.Lock()
	defer h.configMu.Unlock()
	values, err := decodeSiteConfig(c)
	if err != nil {
		return err
	}
	theme, ok := values["theme"].(string)
	if !ok || strings.TrimSpace(theme) == "" {
		return fmt.Errorf("theme must name an installed theme")
	}
	if err := h.validateTheme(theme); err != nil {
		return err
	}
	return writeSiteConfig(h.configFile, c)
}

func (h *_hugo) SplitMetaAndContent(article string) (meta string, content string) {
	var lines []string
	sc := bufio.NewScanner(strings.NewReader(article))
	for sc.Scan() {
		lines = append(lines, sc.Text())
	}
	if len(lines) == 0 {
		return "", ""
	}

	inMeta := false
	// the index of second +++
	var secondCodeMark int
	for i, line := range lines {
		if !inMeta && strings.HasPrefix(line, "+++") {
			inMeta = true
			continue
		}
		if inMeta && strings.HasPrefix(line, "+++") {
			secondCodeMark = i
			continue
		}
	}

	meta = strings.Join(lines[1:secondCodeMark], "\n")
	content = strings.Join(lines[secondCodeMark+1:], "\n")

	return meta, content
}

func (h *_hugo) GetThemes() (themes []string, err error) {
	es, err := os.ReadDir(h.themeDir)
	if err != nil {
		return
	}
	for _, e := range es {
		if !e.IsDir() || strings.HasPrefix(e.Name(), ".") {
			continue
		}
		themes = append(themes, e.Name())
	}
	return
}

func (h *_hugo) setWorkingDirConfig() error {
	b, err := os.ReadFile(h.configFile)
	if err != nil {
		slog.Error("read config fail", err)
		return err
	}
	c := make(map[string]interface{})
	_, err = toml.Decode(string(b), &c)
	if err != nil {
		slog.Error("decode config fail", err)
		return err
	}

	c["workingDir"] = h.SitePath

	buf := new(bytes.Buffer)
	err = toml.NewEncoder(buf).Encode(c)
	if err != nil {
		slog.Error("encode config fail", err)
		return err
	}
	err = writeSiteConfig(h.configFile, buf.Bytes())
	if err != nil {
		slog.Error("write config fail", err)
		return err
	}
	return nil
}

func (h *_hugo) getCurrentTheme() (string, error) {
	c, err := h.ReadConfig()
	if err != nil {
		return "", err
	}
	return c.Theme, nil
}
