package backend

import (
	"encoding/json"
	"fmt"
	"github.com/rangwea/swallows/backend/deploy"
	"reflect"
)

var Deployers = _deployers{}

type deployer interface {
	Deploy(publicDir string, c interface{}) (err error)

	ConfType() reflect.Type
}

const (
	GITHUB  ConfType = "github"
	COS     ConfType = "cos"
	OSS     ConfType = "oss"
	Netlify ConfType = "netlify"
)

// all deployers
var deployers = map[ConfType]deployer{
	GITHUB:  &deploy.GitDeployer{},
	COS:     &deploy.CosDeployer{},
	OSS:     &deploy.OssDeployer{},
	Netlify: &deploy.NetlifyDeployer{},
}

type _deployers struct {
}

func (d *_deployers) Deploy(t ConfType, publicDir string) error {
	deployer, ok := deployers[t]
	if !ok {
		return fmt.Errorf("unknown deployment type: %s", t)
	}
	c, err := Conf.Read(t)
	if err != nil {
		return err
	}

	if len(c) == 0 {
		return fmt.Errorf("deployment %s is not configured", t)
	}
	conf := reflect.New(deployer.ConfType()).Interface()
	err = json.Unmarshal(c, &conf)
	if err != nil {
		return err
	}

	return deployer.Deploy(publicDir, conf)
}
