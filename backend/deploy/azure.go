package deploy

import (
	"context"
	"github.com/rangwea/swallows/backend/util"
	"github.com/tencentyun/cos-go-sdk-v5"
	"net/http"
	"net/url"
	"reflect"
)

type Cos struct {
	AppId     string `json:"appId"`
	SecretId  string `json:"secretId"`
	SecretKey string `json:"secretKey"`
	Region    string `json:"region"`
	Bucket    string `json:"bucket"`
}

type CosDeployer struct {
}

func (d *CosDeployer) Deploy(publicDir string, ci interface{}) (err error) {
	c := ci.(Cos)
	u, err := url.Parse("https://" + c.Bucket + ".cos." + c.Region + ".myqcloud.com/")
	b := &cos.BaseURL{BucketURL: u}
	client := cos.NewClient(b, &http.Client{
		Transport: &cos.AuthorizationTransport{
			SecretID:  c.SecretId,
			SecretKey: c.SecretKey,
		}})

	v, _, err := client.Bucket.Get(context.Background(), &cos.BucketGetOptions{})
	if err != nil {
		return
	}

	remoteFiles := make(map[string]string)
	for _, item := range v.Contents {
		remoteFiles[item.Key] = item.ETag
	}

	localFiles, err := util.GetLocalFilesCRC64(publicDir)
	if err != nil {
		return
	}

	for k, v := range localFiles {
		if remoteFiles[k] != v {
			_, err = client.Object.PutFromFile(context.Background(), k, k, nil)
			if err != nil {
				return
			}
		}
	}

	for k := range remoteFiles {
		if _, ok := localFiles[k]; !ok {
			_, err = client.Object.Delete(context.Background(), k)
			if err != nil {
				return
			}
		}
	}

	return
}

func (d *CosDeployer) ConfType() reflect.Type {
	return reflect.TypeOf(Cos{})
}
