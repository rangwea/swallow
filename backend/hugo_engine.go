package backend

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/gohugoio/hugo/config"
	"github.com/gohugoio/hugo/config/allconfig"
	"github.com/gohugoio/hugo/create/skeletons"
	"github.com/gohugoio/hugo/deps"
	"github.com/gohugoio/hugo/hugofs"
	"github.com/gohugoio/hugo/hugolib"
	"github.com/spf13/fsync"
)

// Hugo's embedding APIs are isolated here so future version changes stay local.
// Unlike HugoSites.Build, the Hugo CLI also synchronizes the merged static FS.
func (h *_hugo) buildSite() (err error) {
	sitePath, err := filepath.Abs(h.SitePath)
	if err != nil {
		return err
	}
	stage, err := os.MkdirTemp(sitePath, ".swallow-build-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(stage)
	flags := config.New()
	flags.Set("workingDir", sitePath)
	flags.Set("publishDir", stage)
	flags.Set("environment", "production")
	flags.Set("theme", h.effectiveTheme())
	configs, err := allconfig.LoadConfig(allconfig.ConfigSourceDescriptor{Fs: hugofs.Os, Filename: filepath.Join(sitePath, "hugo.toml"), Flags: flags, Environment: "production"})
	if err != nil {
		return fmt.Errorf("load Hugo config: %w", err)
	}
	fs := hugofs.NewFrom(hugofs.Os, config.BaseConfig{WorkingDir: sitePath, PublishDir: stage})
	sites, err := hugolib.NewHugoSites(deps.DepsCfg{Configs: configs, Fs: fs})
	if err != nil {
		return fmt.Errorf("create Hugo sites: %w", err)
	}
	defer func() {
		if closeErr := sites.Close(); err == nil && closeErr != nil {
			err = fmt.Errorf("close Hugo sites: %w", closeErr)
		}
	}()
	for _, source := range sites.BaseFs.SourceFilesystems.Static {
		syncer := fsync.NewSyncer()
		syncer.SrcFs, syncer.DestFs = source.Fs, sites.Fs.PublishDirStatic
		// Preserve writable staging permissions instead of copying virtual root modes.
		syncer.NoTimes, syncer.NoChmod = true, true
		destination := string(filepath.Separator)
		if source.PublishFolder != "" {
			destination = filepath.Join(destination, source.PublishFolder)
		}
		if err := syncer.Sync(destination, string(filepath.Separator)); err != nil {
			return fmt.Errorf("sync Hugo static files: %w", err)
		}
	}
	if err := sites.Build(hugolib.BuildCfg{ErrRecovery: true}); err != nil {
		return fmt.Errorf("build Hugo site: %w", err)
	}
	if _, err := os.Stat(filepath.Join(stage, "index.html")); err != nil {
		return fmt.Errorf("Hugo did not produce index.html: %w", err)
	}
	return h.publishBuild(stage)
}

func createSiteSkeleton(sitePath string) error {
	return skeletons.CreateProject(sitePath, hugofs.Os, false, "toml")
}

func (h *_hugo) effectiveTheme() string {
	c, err := os.ReadFile(h.configFile)
	if err != nil {
		return "mini"
	}
	// TOML is decoded rather than extracting a path from UI values.
	values, err := decodeSiteConfig(c)
	if err == nil {
		if theme, ok := values["theme"].(string); ok && strings.TrimSpace(theme) != "" {
			return theme
		}
	}
	return "mini"
}

func (h *_hugo) validateTheme(theme string) error {
	if theme == "." || theme == ".." || strings.ContainsAny(theme, `/\`) {
		return fmt.Errorf("invalid theme name: %q", theme)
	}
	info, err := os.Stat(filepath.Join(h.themeDir, theme))
	if err != nil {
		return fmt.Errorf("theme %q is not installed: %w", theme, err)
	}
	if !info.IsDir() {
		return fmt.Errorf("theme %q is not a directory", theme)
	}
	return nil
}

func (h *_hugo) publishBuild(stage string) error {
	h.outputMu.Lock()
	defer h.outputMu.Unlock()
	backup, err := os.MkdirTemp(filepath.Dir(h.PublicDir), ".swallow-public-backup-")
	if err != nil {
		return err
	}
	if err := os.Remove(backup); err != nil {
		return err
	}
	hadPublic := false
	if _, err := os.Stat(h.PublicDir); err == nil {
		if err := os.Rename(h.PublicDir, backup); err != nil {
			return err
		}
		hadPublic = true
	} else if !os.IsNotExist(err) {
		return err
	}
	if err := os.Rename(stage, h.PublicDir); err != nil {
		if hadPublic {
			if rollbackErr := os.Rename(backup, h.PublicDir); rollbackErr != nil {
				return fmt.Errorf("publish failed: %v; restore previous output: %w", err, rollbackErr)
			}
		}
		return err
	}
	if hadPublic {
		return os.RemoveAll(backup)
	}
	return nil
}
