package backend

import (
	"bytes"
	"fmt"
	"github.com/BurntSushi/toml"
	"os"
	"path/filepath"
	"strings"
)

func decodeSiteConfig(data []byte) (map[string]interface{}, error) {
	var values map[string]interface{}
	_, err := toml.Decode(string(data), &values)
	return values, err
}
func writeSiteConfig(filename string, data []byte) error {
	file, err := os.CreateTemp(filepath.Dir(filename), ".swallow-config-")
	if err != nil {
		return err
	}
	name := file.Name()
	defer os.Remove(name)
	if _, err := file.Write(data); err != nil {
		file.Close()
		return err
	}
	if err := file.Sync(); err != nil {
		file.Close()
		return err
	}
	if err := file.Close(); err != nil {
		return err
	}
	return os.Rename(name, filename)
}
func (h *_hugo) repairSite() error {
	values, err := os.ReadFile(h.configFile)
	if err != nil {
		return err
	}
	config, err := decodeSiteConfig(values)
	if err != nil {
		return err
	}
	theme, _ := config["theme"].(string)
	changed := false
	if strings.TrimSpace(theme) == "" {
		if err := h.validateTheme("mini"); err != nil {
			return fmt.Errorf("restore default theme: %w", err)
		}
		config["theme"] = "mini"
		changed = true
	}
	workingDir, _ := config["workingDir"].(string)
	if workingDir != "" && filepath.Clean(workingDir) != filepath.Clean(h.SitePath) {
		config["workingDir"] = h.SitePath
		changed = true
	}
	if !changed {
		return nil
	}
	backup := h.configFile + ".pre-hugo-0.168.bak"
	if _, err := os.Stat(backup); os.IsNotExist(err) {
		if err := os.WriteFile(backup, values, 0600); err != nil {
			return err
		}
	}
	var output bytes.Buffer
	if err := toml.NewEncoder(&output).Encode(config); err != nil {
		return err
	}
	return writeSiteConfig(h.configFile, output.Bytes())
}
