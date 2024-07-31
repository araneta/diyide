package controllers

import (
	"github.com/cespare/xxhash/v2"
	"sort"
	"bufio"	
	"bytes"
	"io/ioutil"
	"os"
	"encoding/json"
	"fmt"
	"os/exec"
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
type ParserForm struct {
	FPath string `json:"fpath"`	
	Buffer string `json:"buffer"`	
	Language string `json:"language"`
}
type Function struct {
	Name        string `json:"name"`
	StartLine   int    `json:"startLine"`
	StartColumn int    `json:"startColumn"`
	EndLine     int    `json:"endLine"`
	EndColumn   int    `json:"endColumn"`

}
// Define a type that is a slice of Function
type ByName []Function

// Implement sort.Interface methods for ByName
func (a ByName) Len() int           { return len(a) }
func (a ByName) Less(i, j int) bool { return a[i].Name < a[j].Name }
func (a ByName) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }

type ParserResult struct {
	Functions []Function  `json:"functions"`	
}
type ListFileForm struct {
	Dir string `json:"dir"`	
	Extensions []string `json:"extensions"`	
}
//buggy
type DefinitionForm struct {
	Word string `json:"word"`	
	Dir string `json:"dir"`	
	Language string `json:"language"`	
	Extensions []string `json:"extensions"`	
}

type DefinitionResult struct {
	File string `json:"file"`	
	Function Function  `json:"function"`	
}

type GetDefinitionsUsedInFileForm struct {
	Word string `json:"word"`	
	FPath string `json:"fpath"`		
	Language string `json:"language"`	
	Extensions string `json:"extensions"`	
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


//deprecated
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
func parseJSImport(parser, jsFilePath string) ([]string, error) {
	cmd := exec.Command("node", parser, jsFilePath)
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		fmt.Println(fmt.Sprint(err) + ": " + stderr.String())
		return nil, err
	}
	//fmt.Println("Result: " + out.String())
	output:=out.String()
	/*output, err := cmd.Output()
	if err != nil {
		return nil, err
	}*/

	var files []string
	err = json.Unmarshal([]byte(output), &files)
	if err != nil {
		return nil, err
	}

	return files, nil
}
// parseJSFunctions runs the JavaScript script to parse functions and returns the result
func parseJSFunctions(parser, jsFilePath string) ([]Function, error) {
	cmd := exec.Command("node", parser, jsFilePath)
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		fmt.Println(fmt.Sprint(err) + ": " + stderr.String())
		return nil, err
	}
	//fmt.Println("Result: " + out.String())
	output:=out.String()
	/*output, err := cmd.Output()
	if err != nil {
		return nil, err
	}*/

	var functions []Function
	err = json.Unmarshal([]byte(output), &functions)
	if err != nil {
		return nil, err
	}

	return functions, nil
}
func hashStringXXHash(input string) string {
	hashedValue := xxhash.Sum64String(input)
	return fmt.Sprintf("%x", hashedValue)
}

func (c *AdminController) Parser(ctx iris.Context) {
	var form ParserForm
	err := ctx.ReadJSON(&form)

	if err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.WriteString(err.Error())
		return
	}
	absolutePath, err := filepath.Abs(c.ParserPath)
	if err != nil {
		//log.Fatalf("Error getting absolute path: %v", err)
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.WriteString(err.Error())
		return
	}

	//save to temp file
	fpath := absolutePath+"/temp/"+hashStringXXHash(form.FPath)
	//fmt.Println(fpath)	
    file, err := os.Create(fpath)
    if err != nil {
        ctx.JSON(iris.Map{"status": "0", "message":  "ERROR: Unable to read file: "+fpath+err.Error()})		
		return
    }
    defer file.Close()

    writer := bufio.NewWriter(file)
    _, err = writer.WriteString(form.Buffer)
    if err != nil {
        ctx.JSON(iris.Map{"status": "0", "message":  "ERROR: Unable to read file: "+fpath+err.Error()})		
		return
    }

    err = writer.Flush()
    if err != nil {
        ctx.JSON(iris.Map{"status": "0", "message":  "ERROR: Unable to read file: "+fpath+err.Error()})		
		return
    }
	
	var res ParserResult
	if(form.Language=="javascript"){
		parser := absolutePath+"/javascript/parserFunctions.js"
		//fmt.Println(parser)
		functions, err := parseJSFunctions(parser, fpath)
		if err != nil {
			ctx.JSON(iris.Map{"status": "0", "message":  fmt.Sprintf("Error parsing content: %v\n", err)})
			return
		}
		// Sort the functions slice
		sort.Sort(ByName(functions))
		res.Functions = functions
	}
	
	ctx.JSON(iris.Map{"status": "1", "message": res})
}
func (c *AdminController) getJSDefinition(files  []string, word string)(DefinitionResult,error){
	var ret DefinitionResult
	absolutePath, err := filepath.Abs(c.ParserPath)
	if err != nil {		
		return ret,err
	}
	parser := absolutePath+"/javascript/parserFunctions.js"
	//fmt.Println(parser)
	for _, file := range files {
		functions, err := parseJSFunctions(parser, file)
		if err != nil {			
			return ret, err
		}

		for _, function := range functions {
			if function.Name == word{
				ret.File = file
				ret.Function = function
				return ret, nil
			}
		}
	}
	return ret,nil
}

func (c *AdminController) Definitions(ctx iris.Context) {
	var form GetDefinitionsUsedInFileForm
	err := ctx.ReadJSON(&form)

	if err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.WriteString(err.Error())
		return
	}
	//var ret ParserResult
/* //slow
	excludedDirs := []string{"node_modules", "dist", "build"}

	files, err := findFilesWithExtensions(form.Dir, form.Extensions,excludedDirs)
	if err != nil {
		ctx.JSON(iris.Map{"status": "0", "message":  fmt.Sprintf("Error finding files: %v\n", err)})
		return
	}	
	
	if(form.Language=="javascript"){
		ret,err = c.getJSDefinition(files, form.Word)
		if err != nil{
			ctx.JSON(iris.Map{"status": "0", "message":  fmt.Sprintf("Error get definitions files: %v\n", err)})
			return
		}
	}*/
	absolutePath, err := filepath.Abs(c.ParserPath)
	if err != nil {
		//log.Fatalf("Error getting absolute path: %v", err)
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.WriteString(err.Error())
		return
	}
	var ret DefinitionResult
	if(form.Language=="javascript"){
		parser := absolutePath+"/javascript/parserFunctionsRecursive.js"
		//fmt.Println(parser)
		files, err := parseJSImport(parser, form.FPath)
		if err != nil {
			ctx.JSON(iris.Map{"status": "0", "message":  fmt.Sprintf("Error parsing content: %v\n", err)})
			return
		}
		//ret.Functions = functions
		//ctx.JSON(iris.Map{"status": "1", "message": files})
		ret,err = c.getJSDefinition(files, form.Word)
		if err != nil{
			ctx.JSON(iris.Map{"status": "0", "message":  fmt.Sprintf("Error get definitions files: %v\n", err)})
			return
		}
	}
	
	ctx.JSON(iris.Map{"status": "1", "message": ret})
}



func (c *AdminController) TreeStructure(ctx iris.Context) {
	var form ParserForm
	err := ctx.ReadJSON(&form)

	if err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.WriteString(err.Error())
		return
	}
	absolutePath, err := filepath.Abs(c.ParserPath)
	if err != nil {
		//log.Fatalf("Error getting absolute path: %v", err)
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.WriteString(err.Error())
		return
	}

	
	var res ParserResult
	if(form.Language=="javascript"){
		parser := absolutePath+"/javascript/parserFunctions.js"
		//fmt.Println(parser)
		functions, err := parseJSFunctions(parser, fpath)
		if err != nil {
			ctx.JSON(iris.Map{"status": "0", "message":  fmt.Sprintf("Error parsing content: %v\n", err)})
			return
		}
		// Sort the functions slice
		sort.Sort(ByName(functions))
		res.Functions = functions
	}
	
	ctx.JSON(iris.Map{"status": "1", "message": res})
}