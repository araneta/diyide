package controllers
import (
	
	"bufio"	
	_ "bytes"
	_ "io/ioutil"
	"os"
	"strings"
	_ "encoding/json"
	"fmt"
	"path/filepath"
	
	"github.com/kataras/iris/v12"	 
)
type ListFileForm struct {
	Dir string `json:"dir"`	
	Extensions []string `json:"extensions"`	
}
type ReadFile struct {
	FPath string `json:"fpath"`	
}
type WriteFile struct {
	FPath string `json:"fpath"`	
	Buffer string `json:"buffer"`	
}
// findFilesWithExtensions recursively finds all files with the given extensions in the specified directory.
func findFilesWithExtensions(root string, extensions, excludedDirs []string) ([]string, error) {
	var files []string
	extMap := make(map[string]struct{})
	for _, ext := range extensions {
		extMap[ext] = struct{}{}
	}

	excludedMap := make(map[string]struct{})
	for _, dir := range excludedDirs {
		excludedMap[dir] = struct{}{}
	}

	err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			if _, found := excludedMap[info.Name()]; found {
				return filepath.SkipDir
			}
		} else {
			ext := filepath.Ext(info.Name())
			if _, found := extMap[ext]; found {
				files = append(files, path)
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return files, nil
}

func (c *AdminController) WriteFile(ctx iris.Context) {
	var writef WriteFile
	err := ctx.ReadJSON(&writef)

	if err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.WriteString(err.Error())
		return
	}

	fpath := writef.FPath
	//fmt.Println(fpath)	
    file, err := os.Create(fpath)
    if err != nil {
        ctx.JSON(iris.Map{"status": "0", "message":  "ERROR: Unable to read file: "+fpath+err.Error()})		
		return
    }
    defer file.Close()

    writer := bufio.NewWriter(file)
    _, err = writer.WriteString(writef.Buffer)
    if err != nil {
        ctx.JSON(iris.Map{"status": "0", "message":  "ERROR: Unable to read file: "+fpath+err.Error()})		
		return
    }

    err = writer.Flush()
    if err != nil {
        ctx.JSON(iris.Map{"status": "0", "message":  "ERROR: Unable to read file: "+fpath+err.Error()})		
		return
    }
	ctx.WriteString( "ok")
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
	//fmt.Println(fpath)
	dat, err := os.ReadFile(fpath)
    if err != nil {
		ctx.JSON(iris.Map{"status": "0", "message":  "ERROR: Unable to read file: "+fpath+err.Error()})		
		return
	}
	ctx.WriteString( string(dat))
}

func (c *AdminController) ListFiles(ctx iris.Context) {
	var form ListFileForm
	err := ctx.ReadJSON(&form)

	if err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.WriteString(err.Error())
		return
	}

	excludedDirs := []string{"node_modules", "dist", "build"}

	files, err := findFilesWithExtensions(form.Dir, form.Extensions,excludedDirs)
	if err != nil {
		ctx.JSON(iris.Map{"status": "0", "message":  fmt.Sprintf("Error finding files: %v\n", err)})
		return
	}
	var ret []string
	for _, file := range files {
		ret = append(ret, strings.Replace(file, form.Dir, "", 1))
	}
	ctx.JSON(iris.Map{"status": "1", "message": ret})
}

