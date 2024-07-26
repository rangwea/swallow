package util

import (
	"os/user"
	"path"
	"testing"
)

func TestUnZip(t *testing.T) {
	err := UnZip("", "")
	if err != nil {
		panic(err)
	}
}

func TestGetLocalFilesCRC64(t *testing.T) {
	u, err := user.Current()
	if err != nil {
		panic(err)
	}
	dir := path.Join(u.HomeDir, ".swallow", "site", "public")
	r, err := GetLocalFilesCRC64(dir)
	for k, v := range r {
		println(k, v)
	}
}
