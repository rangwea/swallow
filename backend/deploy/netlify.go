package deploy

import (
	"context"
	"github.com/go-openapi/runtime"
	netlify "github.com/netlify/open-api/go/porcelain"
	pc "github.com/netlify/open-api/go/porcelain/context"
	"reflect"
)

type Netlify struct {
	SiteId string `json:"siteId"`
}

type NetlifyDeployer struct {
}

func (d *NetlifyDeployer) Deploy(publicDir string, ci interface{}) (err error) {
	c := ci.(Netlify)

	netlify.

	client := netlify.Default
	pc.WithAuthInfo(context.Background(), &runtime.ClientAuthInfoWriter{})
	_, err = client.DeploySite(context.Background(), netlify.DeployOptions{
		SiteID: c.SiteId,
		Dir:    publicDir,
	})
	if err != nil {
		return
	}

	return
}

func (d *NetlifyDeployer) ConfType() reflect.Type {
	return reflect.TypeOf(Github{})
}
