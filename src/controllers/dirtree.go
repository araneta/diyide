package controllers

import (
	"encoding/hex"


	"os"
	"path/filepath"
	"fmt"
	"github.com/kataras/iris/v12"	 
)
type OpenDirForm struct{
	Dir string `json:"dir"`	
}
type Node struct {
	Text     string      `json:"text"`
	ID       string      `json:"id"`
	Type     string      `json:"type,omitempty"`
	Icon     string      `json:"icon"`
	Children interface{} `json:"children"`
	State    *NodeState  `json:"state,omitempty"`
	LIAttr   map[string]interface{} `json:"li_attr,omitempty"`
}

type NodeState struct {
	Opened   bool `json:"opened"`
	Disabled bool `json:"disabled"`
}
func encodePath(path string) string {
	//return url.QueryEscape(path)
	return hex.EncodeToString([]byte(path))

}

func decodePath(encodedPath string) (string, error) {
	//decoded, err := url.QueryUnescape(encodedPath)
	decodedBytes, err := hex.DecodeString(encodedPath)

	if err != nil {
		return "", err
	}
	//return decoded, nil
	return string(decodedBytes), nil

}

func (c *AdminController) OpenDir(ctx iris.Context) {
	basedir := ctx.URLParamDefault("basedir", "")
	root := ctx.URLParamDefault("dir", "#")
	var nodes []Node
	if root == "#"{
		root = basedir
	}else{
		decoded, err := decodePath(root)
		if err != nil {
			ctx.StatusCode(iris.StatusBadRequest)
			ctx.WriteString("Invalid ID")
			return
		}
		root = string(decoded)
	}
	files, err := os.ReadDir(root)
	if err != nil {
		fmt.Println("error")
		ctx.StatusCode(iris.StatusInternalServerError)
		ctx.WriteString(err.Error())
		return
	}

	for _, file := range files {
		node := Node{
			Text: file.Name(),
			ID:   encodePath(filepath.ToSlash(filepath.Join(root, file.Name()))),
			Icon: "jstree-folder",
		}
		if file.IsDir() {
			node.Children = true
			node.LIAttr = map[string]interface{}{
				"data-type": "d",
			}
		} else {
			node.LIAttr =  map[string]interface{}{
				"data-type": "f",
			}
			node.Children = false
			node.Icon = "jstree-file"
			node.Type = "file"
		}
		nodes = append(nodes, node)
	}

	if root == basedir {
		dirName := filepath.Base(basedir)

		rootNode := Node{
			Text:     dirName,
			ID:       encodePath("/"),
			Icon:     "jstree-folder",
			Children: nodes,
			LIAttr: map[string]interface{}{
				"data-type": "d",
			},
			State: &NodeState{
				Opened:   true,
				Disabled: true,
			},
		}
		nodes = []Node{rootNode}
	}

	ctx.JSON(nodes)
}