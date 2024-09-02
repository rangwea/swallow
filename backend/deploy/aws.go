// Amazon S3
// See doc: https://aws.github.io/aws-sdk-go-v2/docs/
package deploy

import (
	"context"
	"io"
	"os"
	"reflect"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/rangwea/swallows/backend/util"
)

type Aws struct {
	AccountID       string `json:"accountId"`
	AccessKeyID     string `json:"accessKeyID"`
	SecretAccessKey string `json:"secretAccessKey"`
	Bucket          string `json:"bucket"`
}

type AwsDeployer struct {
}

func (d *AwsDeployer) Deploy(publicDir string, ci interface{}) (err error) {
	c := ci.(Aws)

	cfg, err := config.LoadDefaultConfig(context.Background(), config.WithCredentialsProvider(credentials.StaticCredentialsProvider{
		Value: aws.Credentials{
			AccountID:       c.AccountID,
			AccessKeyID:     c.AccessKeyID,
			SecretAccessKey: c.SecretAccessKey,
		},
	}))
	if err != nil {
		return nil
	}

	client := s3.NewFromConfig(cfg)

	output, err := client.ListObjectsV2(context.Background(), &s3.ListObjectsV2Input{
		Bucket: aws.String("my-bucket"),
	})
	if err != nil {
		return err
	}

	remoteFiles := make(map[string]*string)
	for _, object := range output.Contents {
		remoteFiles[*object.Key] = object.ETag
	}

	localFiles, err := util.GetLocalFilesMD5(publicDir)
	if err != nil {
		return
	}

	for k, v := range localFiles {
		if *remoteFiles[k] != v {
			var f *os.File
			f, err = os.Open(k)
			if err != nil {
				return
			}
			defer f.Close()
			_, err = client.UploadPart(context.Background(), &s3.UploadPartInput{
				Key:    &k,
				Bucket: &c.Bucket,
				Body:   io.Reader(f),
			})
			if err != nil {
				return
			}
		}
	}

	for k := range remoteFiles {
		if _, ok := localFiles[k]; !ok {
			_, err = client.DeleteObject(context.Background(), &s3.DeleteObjectInput{
				Bucket: &c.Bucket,
				Key:    &k,
			})
			if err != nil {
				return
			}
		}
	}

	return
}

func (d *AwsDeployer) ConfType() reflect.Type {
	return reflect.TypeOf(Cos{})
}
