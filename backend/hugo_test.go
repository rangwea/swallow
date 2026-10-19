package backend

import (
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func testSite(t *testing.T) *_hugo {
	t.Helper()
	h := &_hugo{}
	h.setPaths(filepath.Join(t.TempDir(), "site"))
	h.NewSite()
	t.Cleanup(func() { _ = h.ClosePreview() })
	return h
}
func put(t *testing.T, name, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(name), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(name, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}
}
func TestBundledThemesBuild(t *testing.T) {
	for _, theme := range []string{"mini", "jane"} {
		t.Run(theme, func(t *testing.T) {
			h := testSite(t)
			data, err := os.ReadFile(h.configFile)
			if err != nil {
				t.Fatal(err)
			}
			put(t, h.configFile, strings.ReplaceAll(string(data), `theme = "mini"`, `theme = "`+theme+`"`))
			put(t, filepath.Join(h.articleDir, "hello.md"), "+++\ntitle = 'Hello'\ndate = '2026-01-01'\n+++\nHello world\n")
			put(t, filepath.Join(h.themeDir, theme, "static", "override.txt"), "theme")
			put(t, filepath.Join(h.SitePath, "static", "override.txt"), "site")
			if err := h.Build(); err != nil {
				t.Fatal(err)
			}
			got, err := os.ReadFile(filepath.Join(h.PublicDir, "override.txt"))
			if err != nil || string(got) != "site" {
				t.Fatalf("static precedence: %s %v", got, err)
			}
			got, err = os.ReadFile(filepath.Join(h.PublicDir, "post", "hello", "index.html"))
			if err != nil || !strings.Contains(string(got), "Hello world") {
				t.Fatalf("article missing: %v", err)
			}
			before, err := os.ReadFile(filepath.Join(h.PublicDir, "index.html"))
			if err != nil {
				t.Fatal(err)
			}
			put(t, filepath.Join(h.SitePath, "layouts", "home.html"), "{{ undefinedTemplateFunction }}")
			if err := h.Build(); err == nil {
				t.Fatal("invalid template should fail")
			}
			after, _ := os.ReadFile(filepath.Join(h.PublicDir, "index.html"))
			if string(before) != string(after) {
				t.Fatal("failed build replaced previous output")
			}
		})
	}
}
func TestRepairEmptyTheme(t *testing.T) {
	h := testSite(t)
	put(t, h.configFile, "theme = ''\ntitle = 'kept'\n")
	if err := h.repairSite(); err != nil {
		t.Fatal(err)
	}
	c, err := h.ReadConfig()
	if err != nil || c.Theme != "mini" || c.Title != "kept" {
		t.Fatalf("%+v %v", c, err)
	}
	if _, err := os.Stat(h.configFile + ".pre-hugo-0.168.bak"); err != nil {
		t.Fatal(err)
	}
	if err := h.Build(); err != nil {
		t.Fatal(err)
	}
}
func TestPreviewLifecycle(t *testing.T) {
	h := testSite(t)
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	h.previewAddr = listener.Addr().String()
	if err := h.Preview(); err == nil {
		t.Fatal("occupied port should fail synchronously")
	}
	listener.Close()
	for i := 0; i < 2; i++ {
		if err := h.Preview(); err != nil {
			t.Fatal(err)
		}
		response, err := http.Get("http://" + h.previewAddr)
		if err != nil {
			t.Fatal(err)
		}
		_, err = io.Copy(io.Discard, response.Body)
		response.Body.Close()
		if err != nil || response.StatusCode != 200 {
			t.Fatal(fmt.Sprint(response.StatusCode, err))
		}
		if err := h.ClosePreview(); err != nil {
			t.Fatal(err)
		}
	}
}

func TestThemeMigrationPreservesCustomFiles(t *testing.T) {
	h := testSite(t)
	name := filepath.Join(h.themeDir, "mini", "layouts", "partials", "social.html")
	original := "<div id=\"social\">\n\n{{ range $key, $val := .Site.Social }}\n    <a class=\"symbol\" href=\"{{ $val }}\" rel=\"me\" target=\"_blank\">\n        {{ $svg :=  print \"svgs/\" $key \".svg\" }}\n        {{ partial $svg (dict \"fill\" \"#bbbbbb\" \"width\" 28 \"height\" 28 ) }}\n    </a>\n{{ end }}\n\n</div>\n"
	put(t, name, original)
	if err := h.migrateBundledThemes(); err != nil {
		t.Fatal(err)
	}
	updated, err := os.ReadFile(name)
	if err != nil || strings.Contains(string(updated), ".Site.Social") {
		t.Fatalf("migration failed: %v", err)
	}
	backup, err := os.ReadFile(name + ".pre-hugo-0.168.bak")
	if err != nil || string(backup) != original {
		t.Fatal("original not backed up")
	}
	put(t, name, "custom template")
	if err := h.migrateBundledThemes(); err != nil {
		t.Fatal(err)
	}
	preserved, _ := os.ReadFile(name)
	if string(preserved) != "custom template" {
		t.Fatal("custom template overwritten")
	}
}
func TestConfigValidation(t *testing.T) {
	h := testSite(t)
	before, _ := os.ReadFile(h.configFile)
	for _, config := range []string{"invalid = [", "theme = ''", "theme = '../mini'", "theme = 'missing'"} {
		if err := h.WriteConfigStr([]byte(config)); err == nil {
			t.Fatalf("accepted %s", config)
		}
	}
	after, _ := os.ReadFile(h.configFile)
	if string(before) != string(after) {
		t.Fatal("invalid config replaced valid config")
	}
	c, err := h.ReadConfig()
	if err != nil {
		t.Fatal(err)
	}
	c.Theme = ""
	c.Params = nil
	if err := h.WriteConfig(c); err != nil {
		t.Fatal(err)
	}
}

// SWALLOW_TEST_SITE points at a disposable copy, never the live user site.
func TestExistingSiteCopy(t *testing.T) {
	site := os.Getenv("SWALLOW_TEST_SITE")
	if site == "" {
		t.Skip("no disposable site copy supplied")
	}
	h := &_hugo{}
	h.setPaths(site)
	if err := h.migrateBundledThemes(); err != nil {
		t.Fatal(err)
	}
	if err := h.repairSite(); err != nil {
		t.Fatal(err)
	}
	if err := h.Build(); err != nil {
		t.Fatal(err)
	}
}
func TestThemeWithoutStaticDirectory(t *testing.T) {
	h := testSite(t)
	if err := os.RemoveAll(filepath.Join(h.themeDir, "mini", "static")); err != nil {
		t.Fatal(err)
	}
	if err := h.Build(); err != nil {
		t.Fatal(err)
	}
}
