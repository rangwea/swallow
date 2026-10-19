package backend

import (
	"archive/zip"
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"github.com/rangwea/swallows/assets"
	"os"
	"path/filepath"
)

// Upgrade only unchanged bundled templates; preserve user-customized themes.
func (h *_hugo) migrateBundledThemes() error {
	data, err := assets.Asserts.ReadFile("theme-migrations.json")
	if err != nil {
		return err
	}
	var originals map[string]string
	if err := json.Unmarshal(data, &originals); err != nil {
		return err
	}
	archive, err := assets.Asserts.ReadFile("themes.zip")
	if err != nil {
		return err
	}
	reader, err := zip.NewReader(bytes.NewReader(archive), int64(len(archive)))
	if err != nil {
		return err
	}
	for name, hash := range originals {
		filename := filepath.Join(h.themeDir, filepath.FromSlash(name))
		current, err := os.ReadFile(filename)
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return err
		}
		sum := sha256.Sum256(current)
		if hex.EncodeToString(sum[:]) != hash {
			continue
		}
		replacement, err := reader.Open("themes/" + name)
		if err != nil {
			return err
		}
		var content bytes.Buffer
		_, err = content.ReadFrom(replacement)
		replacement.Close()
		if err != nil {
			return err
		}
		backup := filename + ".pre-hugo-0.168.bak"
		if _, err := os.Stat(backup); os.IsNotExist(err) {
			if err := os.WriteFile(backup, current, 0600); err != nil {
				return err
			}
		}
		if err := writeSiteConfig(filename, content.Bytes()); err != nil {
			return err
		}
	}
	return nil
}
