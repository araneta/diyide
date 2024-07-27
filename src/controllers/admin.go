package controllers

import (
	_ "teloeditor/common"	
	_ "path/filepath"
	_ "strconv"
	"bufio"
	"fmt"
	"io/ioutil"
	"os"
	
	"regexp"
	"strings"
	"html"
	"path/filepath"
	
	"github.com/kataras/iris/v12"	 
)
type ReadFile struct {
	FPath string `json:"fpath"`	
}
type WriteFile struct {
	FPath string `json:"fpath"`	
	Buffer string `json:"buffer"`	
}
type GetWordsForm struct {
	Root string `json:"root"`	
	Extensions string `json:"extensions"`	
	Language string `json:"language"`	
}


func (c *AdminController) Test(ctx iris.Context) {
	ctx.JSON(iris.Map{"status": "1", "message": ""})
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
	fmt.Println(fpath)	
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


// getAllWords extracts all unique words from the content of the given files.
func getAllWords(files []string) ([]string, error) {
	wordMap := make(map[string]struct{})
	wordRegex := regexp.MustCompile(`\w+`)

	for _, file := range files {
		fmt.Println(file)
		content, err := ioutil.ReadFile(file)
		if err != nil {
			return nil, err
		}

		words := wordRegex.FindAllString(string(content), -1)
		for _, word := range words {
			wordMap[word] = struct{}{}
		}
	}

	uniqueWords := make([]string, 0, len(wordMap))
	for word := range wordMap {
		uniqueWords = append(uniqueWords, word)
	}
	return uniqueWords, nil
}
func (c *AdminController) GetWords(ctx iris.Context) {
	
	var form GetWordsForm
	err := ctx.ReadJSON(&form)

	if err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.WriteString(err.Error())
		return
	}
	extensions := strings.Split(form.Extensions, ",")
	excludedDirs := []string{"node_modules", "dist", "build"}

	files, err := findFilesWithExtensions(form.Root, extensions,excludedDirs)
	if err != nil {
		ctx.JSON(iris.Map{"status": "0", "message":  fmt.Sprintf("Error finding files: %v\n", err)})
		return
	}

	words, err := getAllWords(files)
	if err != nil {		
		ctx.JSON(iris.Map{"status": "0", "message":  fmt.Sprintf("Error extracting words: %v\n", err)})
		return
	}
	ctx.JSON(iris.Map{"status": "1", "message": words})

}