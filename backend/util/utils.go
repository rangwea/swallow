package util

import (
	"archive/zip"
	"crypto/md5"
	"fmt"
	"hash/crc64"
	"io"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"

	"github.com/rangwea/swallows/assets"
)

var commands = map[string]string{
	"windows": "start",
	"darwin":  "open",
	"linux":   "xdg-open",
}

func OpenBrowser(uri string) error {
	run, ok := commands[runtime.GOOS]
	if !ok {
		return fmt.Errorf("don't know how to open things on %s platform", runtime.GOOS)
	}

	cmd := exec.Command(run, uri)
	return cmd.Start()
}

func PathExists(path string) (bool, error) {
	_, err := os.Stat(path)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}

func CopyAsset(src string, dst string, fileModel ...os.FileMode) (err error) {
	hb, err := assets.Asserts.ReadFile(src)
	if err != nil {
		return
	}
	fm := os.ModePerm
	if fileModel != nil {
		fm = fileModel[0]
	}
	err = os.WriteFile(dst, hb, fm)
	if err != nil {
		return err
	}
	return nil
}

func CopyFile(src string, dst string, fileModel ...os.FileMode) (err error) {
	hb, err := os.ReadFile(src)
	if err != nil {
		return
	}
	fm := os.ModePerm
	if fileModel != nil {
		fm = fileModel[0]
	}
	err = os.WriteFile(dst, hb, fm)
	if err != nil {
		return err
	}
	return nil
}

func UnZip(src string, dst string) (err error) {
	zr, err := zip.OpenReader(src)
	if err != nil {
		return err
	}
	defer func(zr *zip.ReadCloser) {
		err = zr.Close()
	}(zr)

	if dst != "" {
		if err := os.MkdirAll(dst, 0755); err != nil {
			return err
		}
	}

	for _, file := range zr.File {
		p := path.Join(dst, file.Name)

		if file.FileInfo().IsDir() {
			if err := os.MkdirAll(p, file.Mode()); err != nil {
				return err
			}
			continue
		}

		fr, err := file.Open()
		if err != nil {
			return err
		}

		fw, err := os.OpenFile(p, os.O_CREATE|os.O_RDWR|os.O_TRUNC, file.Mode())
		if err != nil {
			return err
		}

		_, err = io.Copy(fw, fr)
		if err != nil {
			return err
		}

		fw.Close()
		fr.Close()
	}
	return nil
}

func GetLocalFilesCRC64(base string) (r map[string]string, err error) {
	r = make(map[string]string)
	err = filepath.Walk(base, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		table := crc64.MakeTable(crc64.ECMA)
		if !info.IsDir() {
			file, err := os.Open(path)
			if err != nil {
				return err
			}
			defer file.Close()

			hash := crc64.New(table)
			if _, err := io.Copy(hash, file); err != nil {
				return err
			}
			crc64Hash := hash.Sum64()
			r[strings.Replace(path, base, "", -1)[1:]] = strconv.FormatUint(crc64Hash, 10)
		}
		return nil
	})

	return
}

func GetLocalFilesMD5(base string) (r map[string]string, err error) {
	r = make(map[string]string)
	err = filepath.Walk(base, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			file, err := os.Open(path)
			if err != nil {
				return err
			}
			defer file.Close()

			hash := md5.New()
			if _, err := io.Copy(hash, file); err != nil {
				return err
			}
			md5Hash := hash.Sum(nil)
			r[strings.Replace(path, base, "", -1)[1:]] = string(md5Hash)
		}
		return nil
	})

	return
}
