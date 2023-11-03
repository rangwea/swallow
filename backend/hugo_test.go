package backend

import (
	"fmt"
	"log"
	"os"
	"testing"
)

func before() {
	AppHome = "/Users/feijianwu/.swallow/site"
	if e, _ := PathExists(AppHome); !e {
		if err := os.Mkdir(AppHome, os.ModePerm); err != nil {
			log.Fatal("make app home dir fail", err)
		}
	}
	Hugo.Initialize()
}

func TestInit(t *testing.T) {
	before()
}

func TestBuild(t *testing.T) {
	before()
	err := Hugo.Build()
	if err != nil {
		fmt.Println(err)
	}
}

func TestPreview(t *testing.T) {
	before()
	err := Hugo.Preview()
	if err != nil {
		fmt.Println(err)
	}
}

func TestWriteArticle(t *testing.T) {
	before()
	err := Hugo.WriteArticle("1", Meta{Title: "第一篇",
		Tags:        []string{"t1", "t2"},
		Description: "描述1",
		Date:        "2023-09-22 17:00:21",
		Lastmod:     "2023-09-22 17:00:21",
	},
		"哈哈哈，我的第一篇博客")
	fmt.Println(err)
}

func TestReadArticle(t *testing.T) {
	before()
	meta, content, err := Hugo.ReadArticle("1")
	fmt.Printf("%v\n%v\n%v\n", meta, content, err)
}

func TestSplitMetaAndContent(t *testing.T) {
	before()
	m, c := Hugo.SplitMetaAndContent(`+++
aaaa
+++
bbbb
cccc
dddd
	`)
	fmt.Printf("%v;%v\n", m, c)
}

func TestReadConfig(t *testing.T) {
	before()
	config, err := Hugo.ReadConfig()
	fmt.Printf("%v\n%v\n", config, err)
}

func TestWriteConfig(t *testing.T) {
	before()
	config := Config{
		Title:       "Title",
		Description: "Description",
		Theme:       "stack",
		Copyright:   "copyright",
		Params: &ConfigParams{
			Author: &ConfigAuthor{
				Name: "wikia1",
			},
		},
	}
	err := Hugo.WriteConfig(config)
	fmt.Printf("%v\n%v\n", config, err)
}
