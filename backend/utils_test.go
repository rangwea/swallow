package backend

import (
	"testing"
)

func TestUnZip(t *testing.T) {
	err := UnZip("", "")
	if err != nil {
		panic(err)
	}
}
