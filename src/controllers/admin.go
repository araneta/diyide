package controllers

import (
	_ "teloeditor/common"
	"os"
	_ "path/filepath"
	_ "strconv"
	"html"
	"path/filepath"
	"fmt"
	"github.com/kataras/iris/v12"
	 "strings"
)
type ReadFile struct {
	FPath string `json:"fpath"`	
}
func (c *AdminController) Test(ctx iris.Context) {
	ctx.JSON(iris.Map{"status": "1", "message": ""})
}
func (c *AdminController) ReadFile(ctx iris.Context) {
	var readf ReadFile
	err := ctx.ReadJSON(&readf)

	if err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.WriteString(err.Error())
		return
	}

	fpath := readf.FPath
	fmt.Println(fpath)
	dat, err := os.ReadFile(fpath)
    if err != nil {
		ctx.JSON(iris.Map{"status": "0", "message":  "ERROR: Unable to read file: "+fpath+err.Error()})		
		return
	}
	ctx.WriteString( string(dat))
}
func (c *AdminController) OpenFolder(ctx iris.Context) {
	postDir := ctx.PostValue("dir")
	onlyFolders := ctx.PostValue("onlyFolders") == "true"
	onlyFiles := ctx.PostValue("onlyFiles") == "true"
	checkbox := ""
	if ctx.PostValue("multiSelect") == "true" {
		checkbox = "<input type='checkbox' />"
	}
	if _, err := os.Stat(postDir); os.IsNotExist(err) {		
		ctx.JSON(iris.Map{"status": "0", "message":  "ERROR: Directory does not exist"})
		return
	}

	files, err := os.ReadDir(postDir)
	if err != nil {
		ctx.JSON(iris.Map{"status": "0", "message":  "ERROR: Unable to read directory"})		
		return
	}
	root := "";
	var builder strings.Builder
	if len(files) > 2 { // The 2 accounts for . and ..
		

		builder.WriteString( "<ul class='jqueryFileTree'>")
		for _, file := range files {
			fileName := file.Name()
			htmlRel := html.EscapeString(strings.TrimPrefix(filepath.Join(postDir, fileName), root))
			htmlName := html.EscapeString(fileName)
			ext := filepath.Ext(fileName)

			if fileName != "." && fileName != ".." {
				if file.IsDir() && (!onlyFiles || onlyFolders) {
					builder.WriteString(fmt.Sprintf("<li class='directory collapsed'>%s<a rel='%s/'>%s</a></li>", checkbox, htmlRel, htmlName))
				} else if !onlyFolders || onlyFiles {
					builder.WriteString(fmt.Sprintf("<li class='file ext_%s'>%s<a rel='%s'>%s</a></li>", ext, checkbox, htmlRel, htmlName))
				}
			}
		}
		builder.WriteString( "</ul>")
	}
	ctx.WriteString( builder.String())
}
