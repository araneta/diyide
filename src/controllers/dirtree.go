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

type CreateNodeForm struct {
	ID   string `json:"id"`
	Text string `json:"text"`
	Type string `json:"type"`
}
type RenameNodeForm struct {
	ID   string `json:"id"`
	Text string `json:"text"`
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
	fmt.Println("root"+root)
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

	if len(nodes)==0{
		emptyArray := []int{}
		ctx.JSON(emptyArray)
	}else{
		ctx.JSON(nodes)
	}
	
}


func (c *AdminController) CreateFileOrDir(ctx iris.Context) {
	var form CreateNodeForm
	err := ctx.ReadJSON(&form)

	if err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.WriteString(err.Error())
		return
	}
	newDirPath := filepath.Join(form.ID, form.Text)
	fmt.Println(newDirPath)
	err = os.Mkdir(newDirPath, 0755)
	if err != nil {
		ctx.StatusCode(iris.StatusInternalServerError)
		ctx.WriteString(err.Error())
		return
	}

	ctx.StatusCode(iris.StatusOK)
	ctx.JSON(map[string]string{"status": "success"})
}


func (c *AdminController) RenameFileOrDir(ctx iris.Context) {
	var form RenameNodeForm
	err := ctx.ReadJSON(&form)

	if err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.WriteString(err.Error())
		return
	}
	dirPath := filepath.Dir(form.ID)
	//oldDirName := filepath.Base(form.ID)
	newDirPath := filepath.Join(dirPath, form.Text)

	err = os.Rename(form.ID, newDirPath)
	if err != nil {
		ctx.StatusCode(iris.StatusInternalServerError)
		ctx.WriteString(err.Error())
		return
	}
	ctx.StatusCode(iris.StatusOK)
	ctx.JSON(map[string]string{"status": "success"})
}
