package deploy

import (
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/go-git/go-git/v5/plumbing/transport/http"
	"reflect"
	"time"
)

type Github struct {
	Repository string `json:"repository"`
	Email      string `json:"email"`
	Username   string `json:"username"`
	Token      string `json:"token"`
	Cname      string `json:"cname"`
}

type GitDeployer struct {
}

func (d *GitDeployer) Deploy(publicDir string, c interface{}) (err error) {
	github := c.(Github)

	_, err = git.PlainInit(publicDir, false)
	if err != nil {
		return
	}

	r, err := git.PlainOpen(publicDir)
	if err != nil {
		return
	}
	w, err := r.Worktree()
	if err != nil {
		return
	}
	_, err = w.Add(".")
	if err != nil {
		return
	}
	_, err = w.Commit("deploy", &git.CommitOptions{
		Author: &object.Signature{
			Email: github.Email,
			When:  time.Now(),
		},
	})
	if err != nil {
		return
	}

	_, err = r.CreateRemote(&config.RemoteConfig{
		Name: "origin",
		URLs: []string{github.Repository},
	})
	if err != nil {
		return
	}

	err = r.Push(&git.PushOptions{
		RemoteName: "origin",
		Force:      true,
		Auth: &http.BasicAuth{
			Username: github.Username,
			Password: github.Token,
		},
	})
	if err != nil {
		return
	}
	return
}

func (d *GitDeployer) ConfType() reflect.Type {
	return reflect.TypeOf(Github{})
}
