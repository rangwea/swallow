package backend

import (
	"bytes"
	"fmt"
	"golang.org/x/exp/slog"
	"os"
	"path"

	"github.com/BurntSushi/toml"
)

type ConfType string

const (
	GITHUB ConfType = "github"
)

type Github struct {
	Repository string `json:"repository"`
	Email      string `json:"email"`
	Username   string `json:"username"`
	Token      string `json:"token"`
	Cname      string `json:"cname"`
}

var Conf = _conf{}

type _conf struct {
	DIR string
}

func (conf *_conf) Initialize() {
	conf.DIR = path.Join(AppHome, "conf")

	// init
	err := os.Mkdir(conf.DIR, os.ModePerm)
	if err != nil && !os.IsExist(err) {
		slog.Error("mk config dir fail", err)
		return
	}
}

func (conf *_conf) Read(t ConfType) (v interface{}, err error) {
	filePath := conf.getFile(t)
	if existed, _ := PathExists(filePath); !existed {
		return nil, nil
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	switch t {
	case GITHUB:
		a := Github{}
		_, err := toml.Decode(string(data), &a)
		if err != nil {
			slog.Error("read config fail", err)
			return nil, err
		}
		return a, nil
	}

	return nil, nil
}

func (conf *_conf) Write(t ConfType, v interface{}) error {
	buf := new(bytes.Buffer)
	err := toml.NewEncoder(buf).Encode(v)
	if err != nil {
		return err
	}

	filePath := conf.getFile(t)
	if existed, _ := PathExists(filePath); !existed {
		os.Create(filePath)
	}

	err = os.WriteFile(filePath, buf.Bytes(), os.ModePerm)
	if err != nil {
		return err
	}
	return nil
}

func (conf *_conf) getFile(t ConfType) string {
	return path.Join(conf.DIR, fmt.Sprintf("%s.toml", t))
}
