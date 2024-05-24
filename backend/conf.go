package backend

import (
	"fmt"
	"os"
	"path"

	"github.com/rangwea/swallows/backend/util"
)

type ConfType string

var Conf = _conf{}

type _conf struct {
	DIR string
}

func (conf *_conf) Initialize() {
	conf.DIR = path.Join(AppHome, "conf")

	// init
	err := os.Mkdir(conf.DIR, os.ModePerm)
	if err != nil && !os.IsExist(err) {
		panic(fmt.Errorf("mk config dir fail", err))
		return
	}
}

func (conf *_conf) Read(t ConfType) (v []byte, err error) {
	filePath := conf.getFile(t)
	if existed, _ := util.PathExists(filePath); !existed {
		return
	}

	v, err = os.ReadFile(filePath)
	if err != nil {
		return
	}

	return
}

func (conf *_conf) Write(t ConfType, v string) error {
	filePath := conf.getFile(t)
	if existed, _ := util.PathExists(filePath); !existed {
		os.Create(filePath)
	}

	err := os.WriteFile(filePath, []byte(v), os.ModePerm)
	return err
}

func (conf *_conf) getFile(t ConfType) string {
	return path.Join(conf.DIR, fmt.Sprintf("%s.json", t))
}
