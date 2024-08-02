package deploy

import (
	"path"
	"reflect"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
	"github.com/rangwea/swallows/backend/util"
)

type Oss struct {
	AccessKeyID     string `json:"secretId"`
	AccessKeySecret string `json:"secretKey"`
	Region          string `json:"region"`
	Bucket          string `json:"bucket"`
}

type OssDeployer struct {
}

func (d *OssDeployer) Deploy(publicDir string, ci interface{}) (err error) {
	c := ci.(*Oss)

	client, err := oss.New("oss-cn-hangzhou.aliyuncs.com", c.AccessKeyID, c.AccessKeySecret, oss.Region(c.Region))
	if err != nil {
		return
	}

	bucket, err := client.Bucket(c.Bucket)
	if err != nil {
		return
	}

	remoteFiles := make(map[string]string)
	marker := ""
	for {
		lsRes, err := bucket.ListObjects(oss.Marker(marker))
		if err != nil {
			return err
		}
		for _, item := range lsRes.Objects {
			h, err := bucket.GetObjectDetailedMeta(item.Key)
			if err != nil {
				return nil
			}
			remoteFiles[item.Key] = h.Get("x-oss-hash-crc64ecma")
		}
		if lsRes.IsTruncated {
			marker = lsRes.NextMarker
		} else {
			break
		}
	}

	localFiles, err := util.GetLocalFilesCRC64(publicDir)
	if err != nil {
		return
	}

	for k, v := range localFiles {
		if remoteFiles[k] != v {
			err = bucket.PutObjectFromFile(k, path.Join(publicDir, k))
			if err != nil {
				return
			}
		}
	}

	for k := range remoteFiles {
		if _, ok := localFiles[k]; !ok {
			err = bucket.DeleteObject(k)
			if err != nil {
				return
			}
		}
	}

	return
}

func (d *OssDeployer) ConfType() reflect.Type {
	return reflect.TypeOf(Oss{})
}
