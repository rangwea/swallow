package deploy

import (
	"context"
	"github.com/go-openapi/runtime"
	"github.com/go-openapi/strfmt"
	netlify "github.com/netlify/open-api/go/porcelain"
	nc "github.com/netlify/open-api/go/porcelain/context"
	"reflect"
)

type Netlify struct {
	SiteId string `json:"siteId"`
	Token  string `json:"token"`
}

type NetlifyDeployer struct {
}

func (d *NetlifyDeployer) Deploy(publicDir string, ci interface{}) (err error) {
	c := ci.(Netlify)

	client := netlify.Default
	authInfoWriter := runtime.ClientAuthInfoWriterFunc(func(r runtime.ClientRequest,
		_ strfmt.Registry) error {
		err := r.SetHeaderParam("Authorization", "Bearer "+c.Token)
		if err != nil {
			return err
		}
		return nil
	})
	ctx := nc.WithAuthInfo(context.Background(), authInfoWriter)
	_, err = client.DeploySite(ctx, netlify.DeployOptions{
		SiteID: c.SiteId,
		Dir:    publicDir,
	})
	if err != nil {
		return
	}

	return
}

func (d *NetlifyDeployer) ConfType() reflect.Type {
	return reflect.TypeOf(Netlify{})
}
