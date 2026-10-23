package backend

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"github.com/aliyun/aliyun-oss-go-sdk/oss"
	runtimeclient "github.com/go-openapi/runtime/client"
	netlify "github.com/netlify/open-api/go/porcelain"
	cos "github.com/tencentyun/cos-go-sdk-v5"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"path/filepath"
	"strings"
	"testing"
)

func TestObjectProvidersFollowPagination(t *testing.T) {
	for _, provider := range []string{"cos", "oss"} {
		t.Run(provider, func(t *testing.T) {
			calls := 0
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				calls++
				w.Header().Set("Content-Type", "application/xml")
				if r.URL.Query().Get("marker") == "" {
					io.WriteString(w, `<ListBucketResult><IsTruncated>true</IsTruncated><NextMarker>second</NextMarker><Contents><Key>one</Key></Contents></ListBucketResult>`)
				} else {
					io.WriteString(w, `<ListBucketResult><IsTruncated>false</IsTruncated><Contents><Key>two</Key></Contents></ListBucketResult>`)
				}
			}))
			defer server.Close()
			var store publishObjectStore
			if provider == "cos" {
				u, _ := url.Parse(server.URL)
				store = cosPublishStore{cos.NewClient(&cos.BaseURL{BucketURL: u}, server.Client())}
			} else {
				client, e := oss.New(server.URL, "id", "key", oss.ForcePathStyle(true))
				if e != nil {
					t.Fatal(e)
				}
				bucket, e := client.Bucket("bucket")
				if e != nil {
					t.Fatal(e)
				}
				store = ossPublishStore{bucket}
			}
			files, e := store.List(context.Background())
			if e != nil || calls != 2 || !files["one"] || !files["two"] {
				t.Fatal(files, calls, e)
			}
		})
	}
}
func TestNetlifyCreateUploadVerifyWithCancellableAPI(t *testing.T) {
	body := "site"
	sum := sha1.Sum([]byte(body))
	hash := hex.EncodeToString(sum[:])
	var uploaded bool
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.Header.Get("Authorization") != "Bearer secret" {
			t.Error("missing authorization")
		}
		switch {
		case r.Method == "POST" && r.URL.Path == "/api/v1/sites/site/deploys":
			var request map[string]interface{}
			json.NewDecoder(r.Body).Decode(&request)
			if request["draft"] == true {
				t.Error("not production")
			}
			json.NewEncoder(w).Encode(map[string]interface{}{"id": "deployment", "site_id": "site", "required": []string{hash}, "state": "prepared"})
		case r.Method == "PUT" && strings.Contains(r.URL.Path, "/deploys/deployment/files/"):
			data, _ := io.ReadAll(r.Body)
			if string(data) != body {
				t.Error("unexpected payload")
			}
			uploaded = true
			io.WriteString(w, `{}`)
		case r.Method == "GET" && r.URL.Path == "/api/v1/sites/site/deploys/deployment":
			if !uploaded {
				t.Error("verified before upload")
			}
			io.WriteString(w, `{"id":"deployment","site_id":"site","state":"ready"}`)
		default:
			t.Errorf("unexpected request %s %s", r.Method, r.URL.Path)
			http.Error(w, "unexpected", 404)
		}
	}))
	defer server.Close()
	u, _ := url.Parse(server.URL)
	old := netlify.Default
	netlify.Default = netlify.New(runtimeclient.New(u.Host, "/api/v1", []string{"http"}), nil)
	defer func() { netlify.Default = old }()
	dir := t.TempDir()
	put(t, filepath.Join(dir, "index.html"), body)
	r := &PublishRun{Target: PublishTarget{SiteID: "site"}, Output: []PublishFile{{Path: "index.html", Hash: digest([]byte(body)), Size: int64(len(body))}}}
	var receipt PublishReceipt
	e := publishNetlify(context.Background(), r, map[string]string{"token": "secret"}, dir, func(done, total int, msg string) error {
		if done != 1 || total != 1 {
			t.Error(done, total)
		}
		return nil
	}, func(p PublishReceipt) error { receipt = p; return nil })
	if e != nil || !receipt.Confirmed || !uploaded {
		t.Fatal(e, receipt, uploaded)
	}
}
