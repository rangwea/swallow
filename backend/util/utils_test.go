package util

import (
	"testing"
)

func TestUnZip(t *testing.T) {
	err := UnZip("", "")
	if err != nil {
		panic(err)
	}
}

func TestGetLocalFilesCRC64(t *testing.T) {
	dir := "/Users/feijianwu/Code/mine/swallow-wails2/backend/deploy/test"
	r, err := GetLocalFilesCRC64(dir)
	if err != nil {
		println(err)
	}
	for k, v := range r {
		println(k, v)
	}
}
