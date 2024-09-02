// Microsoft Azure Blob Storage
// See doc:https://learn.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-go?tabs=roles-azure-portal
package deploy

import (
	"context"
	"fmt"
	"os"
	"reflect"

	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob"
	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob/blockblob"
	"github.com/rangwea/swallows/backend/util"
)

type Azure struct {
	Account     string `json:"account"`
	AccessToken string `json:"accessToken"`
	Container   string `json:"container"`
}

type AzureDeployer struct {
}

func (d *AzureDeployer) Deploy(publicDir string, ci interface{}) (err error) {
	c := ci.(Azure)

	url := fmt.Sprintf("https://%s.blob.core.windows.net/?%s", c.Account, c.AccessToken)

	client, err := azblob.NewClientWithNoCredential(url, nil)
	if err != nil {
		return err
	}

	remoteFiles := make(map[string]*string)
	pager := client.NewListBlobsFlatPager(c.Container, nil)
	for pager.More() {
		var resp azblob.ListBlobsFlatResponse
		resp, err = pager.NextPage(context.Background())
		if err != nil {
			return err
		}
		for _, blob := range resp.Segment.BlobItems {
			remoteFiles[*blob.Name] = blob.Metadata["md5"]
		}
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
			_, err = client.UploadFile(context.Background(), c.Container, k, f, &blockblob.UploadFileOptions{
				Metadata: map[string]*string{"md5": &v},
			})
			if err != nil {
				return
			}
		}
	}

	for k := range remoteFiles {
		if _, ok := localFiles[k]; !ok {
			_, err = client.DeleteBlob(context.Background(), c.Container, k, nil)
			if err != nil {
				return
			}
		}
	}

	return
}

func (d *AzureDeployer) ConfType() reflect.Type {
	return reflect.TypeOf(Cos{})
}
