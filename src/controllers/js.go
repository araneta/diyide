package controllers

import (
	
	
	
	"bytes"
	
	
	"encoding/json"
	"fmt"
	"os/exec"
	
	"path/filepath"
	
	
)

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

func parseJSStructure(parser, jsFilePath string) (TreeStructure, error) {
	var tree TreeStructure
	cmd := exec.Command("node", parser, jsFilePath)
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		fmt.Println(fmt.Sprint(err) + ": " + stderr.String())
		return tree, err
	}
	//fmt.Println("Result: " + out.String())
	output:=out.String()
	/*output, err := cmd.Output()
	if err != nil {
		return nil, err
	}*/

	
	err = json.Unmarshal([]byte(output), &tree)
	if err != nil {
		return tree, err
	}

	return tree, nil
}