package controllers
import (
	"bufio"
	"fmt"
	"os"
	"strings"
	"github.com/kataras/iris/v12"	
)

type FindInFilesController struct {
	
}
type SearchForm struct {
	SearchFor string `json:"searchfor"`	
	Extensions string `json:"exts"`	
	Folder string `json:"folder"`	
}
type SearchResult struct {
	FilePath string `json:"filePath"`
	LineNum  int    `json:"lineNum"`
	Line     string `json:"line"`
}
func SearchWordInFiles(baseDir string, files []string, word string) ([]SearchResult, error) {
	var results []SearchResult
	n := len(baseDir)
	fmt.Println(n)
	for _, file := range files {
		fmt.Println(file)
		f, err := os.Open(file)
		if err != nil {
			return nil, fmt.Errorf("could not open file %s: %w", file, err)
		}
		defer f.Close()

		reader := bufio.NewReader(f)
		lineNum := 0

		for {
			line, err := reader.ReadString('\n')
			lineNum++
			if strings.Contains(line, word) {
				results = append(results, SearchResult{
					FilePath: file[n:],
					LineNum:  lineNum,
					Line:     strings.TrimRight(line, "\n"),
				})
			}

			if err != nil {
				if err.Error() == "EOF" {
					break
				}
				return nil, fmt.Errorf("error reading file %s: %w", file, err)
			}
		}
	}

	return results, nil
}


func (c *FindInFilesController) FindInFiles(ctx iris.Context) {
	var form SearchForm
	err := ctx.ReadJSON(&form)

	if err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.WriteString(err.Error())
		return
	}

	extensions := strings.Split(form.Extensions, ",")
	excludedDirs := []string{"node_modules"}
	fmt.Println("searching files...")
	files, err := findFilesWithExtensions(form.Folder, extensions,excludedDirs)
	if err != nil {
		ctx.JSON(iris.Map{"status": "0", "message":  fmt.Sprintf("Error finding files: %v\n", err)})
		return
	}
	fmt.Println("search files done")
	fmt.Println("SearchWordInFiles...")
	results, err := SearchWordInFiles(form.Folder, files, form.SearchFor)
	fmt.Println(" done")
	if err != nil {		
		ctx.JSON(iris.Map{"status": "0", "message":  fmt.Sprintf("Error: %v\n", err)})
		return
	}
	ctx.JSON(iris.Map{"status": "1", "message": results})
}