package controllers

import (
	"io/ioutil"
	_ "os"
	_ "encoding/json"
	"fmt"
	
	"regexp"
	"strings"
	
	"github.com/kataras/iris/v12"	 
)

type GetWordsForm struct {
	Root string `json:"root"`	
	Extensions string `json:"extensions"`	
	Language string `json:"language"`	
}
// getAllWords extracts all unique words from the content of the given files.
func getAllWords(files []string) ([]string, error) {
	wordMap := make(map[string]struct{})
	wordRegex := regexp.MustCompile(`\w+`)

	for _, file := range files {
		//fmt.Println(file)
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