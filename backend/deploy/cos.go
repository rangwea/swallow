package deploy

import (
	"reflect"
)

type COS struct {
	AppId     string `json:"appId"`
	SecretId  string `json:"secretId"`
	SecretKey string `json:"secretKey"`
	Region    string `json:"region"`
	Bucket    string `json:"bucket"`
}

type CosDeployer struct {
}

func (d *CosDeployer) Deploy(publicDir string, ci interface{}) (err error) {
	c := ci.(COS)

	return
}

func (d *CosDeployer) ConfType() reflect.Type {
	return reflect.TypeOf(Github{})
}
