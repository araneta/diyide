package controllers

import (
	"github.com/cespare/xxhash/v2"
	"sort"
	"bufio"	
	
	
	"os"
	
	"fmt"
	
	
	"path/filepath"
	
	"github.com/kataras/iris/v12"	 
)

type ParserForm struct {
	FPath string `json:"fpath"`	
	Buffer string `json:"buffer"`	
	Language string `json:"language"`
}
// Property represents a property of an object field.
type Property struct {
	Name       string     `json:"name"`
	Type       string     `json:"type"`
	StartLine  int        `json:"startLine"`
	Properties []Property `json:"properties,omitempty"`
}

// Method represents a method of a class.
type Method struct {
	Name      string `json:"name"`
	Type      string `json:"type"`
	StartLine int    `json:"startLine"`
}

// Field represents a field of a class.
type Field struct {
	Name       string     `json:"name"`
	Type       string     `json:"type"`
	StartLine  int        `json:"startLine"`
	Properties []Property `json:"properties,omitempty"`
}

// Class represents a class with its methods and fields.
type Class struct {
	Name    string  `json:"name"`
	Methods []Method `json:"methods"`
	Fields  []Field  `json:"fields"`
}

type Function struct {
	Name        string `json:"name"`
	Type      string `json:"type,omitempty"`
	StartLine   int    `json:"startLine"`
	StartColumn int    `json:"startColumn"`
	EndLine     int    `json:"endLine"`
	EndColumn   int    `json:"endColumn"`

}
// TreeStructure represents the overall structure of the parsed code.
type TreeStructure struct {
	Classes   []Class    `json:"classes"`
	Functions []Function `json:"functions"`
	Variables []Variable `json:"variables"`
}

// Variable represents a variable declaration.
type Variable struct {
	Name      string `json:"name"`
	StartLine int    `json:"startLine"`
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

	
	var res TreeStructure
	if(form.Language=="javascript"){
		parser := absolutePath+"/javascript/treeStructure.js"
		//fmt.Println(parser)
		resx, err := parseJSStructure(parser, form.FPath)
		if err != nil {
			ctx.JSON(iris.Map{"status": "0", "message":  fmt.Sprintf("Error parsing content: %v\n", err)})
			return
		}	
		res = resx	
	}
	
	ctx.JSON(iris.Map{"status": "1", "message": res})
}