package deploy

import (
	"context"
	"net/http"
	"net/url"
	"path"
	"reflect"

	"github.com/rangwea/swallows/backend/util"
	"github.com/tencentyun/cos-go-sdk-v5"
)

type Cos struct {
	SecretId  string `json:"secretId"`
	SecretKey string `json:"secretKey"`
	Region    string `json:"region"`
	Bucket    string `json:"bucket"`
}

type CosDeployer struct {
}

func (d *CosDeployer) Deploy(publicDir string, ci interface{}) (err error) {
	c := ci.(*Cos)
	u, err := url.Parse("https://" + c.Bucket + ".cos." + c.Region + ".myqcloud.com/")
	if err != nil {
		return err
	}
	b := &cos.BaseURL{BucketURL: u}
	client := cos.NewClient(b, &http.Client{
		Transport: &cos.AuthorizationTransport{
			SecretID:  c.SecretId,
			SecretKey: c.SecretKey,
		}})

	ctx := context.Background()

	v, _, err := client.Bucket.Get(ctx, &cos.BucketGetOptions{})
	if err != nil {
		return
	}

	remoteFiles := make(map[string]string)
	for _, item := range v.Contents {
		var r *cos.Response
		r, err = client.Object.Head(ctx, item.Key, nil)
		if err != nil {
			return err
		}
		remoteFiles[item.Key] = r.Header.Get("x-cos-hash-crc64ecma")
	}

	localFiles, err := util.GetLocalFilesCRC64(publicDir)
	if err != nil {
		return
	}

	for k, v := range localFiles {
		if remoteFiles[k] != v {
			_, err = client.Object.PutFromFile(context.Background(), k, path.Join(publicDir, k), nil)
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
