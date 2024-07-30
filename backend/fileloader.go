package backend

import (
	"fmt"
	"golang.org/x/exp/slog"
	"net/http"
	"os"
	"path"
	"strings"
)

type FileLoader struct {
	http.Handler
}

func NewFileLoader() *FileLoader {
	return &FileLoader{}
}

func (h *FileLoader) ServeHTTP(res http.ResponseWriter, req *http.Request) {
	var err error

	var readFilePath string
	if strings.HasPrefix(req.URL.Path, "/static/images") {
		// site image
		readFilePath = path.Join(Hugo.SitePath, req.URL.Path)
	}

	if readFilePath == "" {
		res.WriteHeader(http.StatusBadRequest)
		res.Write([]byte(fmt.Sprintf("Could not load file %s", readFilePath)))
		return
	}

	fileData, err := os.ReadFile(readFilePath)
	if err != nil {
		res.WriteHeader(http.StatusBadRequest)
		res.Write([]byte(fmt.Sprintf("Could not load file %s", readFilePath)))
	}
	slog.Debug("read file", readFilePath)

	res.Write(fileData)
}
