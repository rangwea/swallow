package deploy

import (
	"context"
	"github.com/aliyun/alibabacloud-oss-go-sdk-v2/oss"
	"github.com/aliyun/alibabacloud-oss-go-sdk-v2/oss/credentials"
	"github.com/rangwea/swallows/backend/util"
	"reflect"
)

type Oss struct {
	AppId     string `json:"appId"`
	SecretId  string `json:"secretId"`
	SecretKey string `json:"secretKey"`
	Region    string `json:"region"`
	Bucket    string `json:"bucket"`
}

type OssDeployer struct {
}

func (d *OssDeployer) Deploy(publicDir string, ci interface{}) (err error) {
	c := ci.(Oss)

	bucket := oss.Ptr(c.Bucket)

	cfg := oss.LoadDefaultConfig().
		WithCredentialsProvider(credentials.NewStaticCredentialsProvider(c.SecretId, c.SecretKey)).
		WithRegion(c.Region)
	client := oss.NewClient(cfg)

	p := client.NewListObjectsV2Paginator(&oss.ListObjectsV2Request{
		Bucket: bucket,
	})

	remoteFiles := make(map[string]*string)
	for p.HasNext() {
		page, err := p.NextPage(context.Background())
		if err != nil {
			return
		}

		for _, item := range page.Contents {
			remoteFiles[*item.Key] = item.ETag
		}
	}

	localFiles, err := util.GetLocalFilesMD5(publicDir)
	if err != nil {
		return
	}

	for k, v := range localFiles {
		if *remoteFiles[k] != v {
			_, err = client.PutObjectFromFile(context.Background(), &oss.PutObjectRequest{Bucket: bucket, Key: oss.Ptr(k)}, k, nil)
			if err != nil {
				return
			}
		}
	}

	for k := range remoteFiles {
		if _, ok := localFiles[k]; !ok {
			_, err = client.DeleteObject(context.Background(), &oss.DeleteObjectRequest{Bucket: bucket,
				Key: oss.Ptr(k)})
			if err != nil {
				return
			}
		}
	}

	return
}

func (d *OssDeployer) ConfType() reflect.Type {
	return reflect.TypeOf(Github{})
}
