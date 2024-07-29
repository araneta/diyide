package controllers

import (
	"encoding/hex"

	"io"
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
type DeleteNodeForm struct {
	ID   string `json:"id"`	
}
type CopyNodeForm struct {
	ID   string `json:"id"`
	Parent string `json:"parent"`
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
	var node Node
	if(form.Type=="file"){
		// Create the file
		file, err := os.Create(newDirPath)
		if err != nil {
			fmt.Println("Error creating file:", err)
			ctx.StatusCode(iris.StatusInternalServerError)
			ctx.WriteString(err.Error())			
			return
		}
		// Ensure the file is closed when done
		defer file.Close()
		node = Node{
			//Text: file.Name(),
			ID:   encodePath(newDirPath),
			Icon: "jstree-file",
		}
	}else{
		err = os.Mkdir(newDirPath, 0755)
		if err != nil {
			ctx.StatusCode(iris.StatusInternalServerError)
			ctx.WriteString(err.Error())
			return
		}
		node = Node{
			//Text: file.Name(),
			ID:   encodePath(newDirPath),
			Icon: "jstree-folder",
		}
	}
	

	ctx.StatusCode(iris.StatusOK)
	ctx.JSON(node)
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
	ctx.JSON(map[string]string{"id": encodePath(newDirPath)})
}

func (c *AdminController) DeleteFileOrDir(ctx iris.Context) {
	var form DeleteNodeForm
	err := ctx.ReadJSON(&form)

	if err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.WriteString(err.Error())
		return
	}
	// Delete the file
    err1 := os.RemoveAll(form.ID)
    if err1 != nil {
        ctx.StatusCode(iris.StatusInternalServerError)
		ctx.WriteString(err1.Error())		
        return
    }
	ctx.StatusCode(iris.StatusOK)
	ctx.JSON(map[string]string{"status": "OK"})
}
func copyFile(src, dst string) error {
    sourceFile, err := os.Open(src)
    if err != nil {
        return err
    }
    defer sourceFile.Close()

    destinationFile, err := os.Create(dst)
    if err != nil {
        return err
    }
    defer destinationFile.Close()

    _, err = io.Copy(destinationFile, sourceFile)
    if err != nil {
        return err
    }

    sourceInfo, err := os.Stat(src)
    if err != nil {
        return err
    }
    err = os.Chmod(dst, sourceInfo.Mode())
    if err != nil {
        return err
    }

    return nil
}

func copyDir(src string, dst string) error {
    srcInfo, err := os.Stat(src)
    if err != nil {
        return err
    }

    // Create the destination directory with the same permissions as the source directory
    err = os.MkdirAll(dst, srcInfo.Mode())
    if err != nil {
        return err
    }

    entries, err := os.ReadDir(src)
    if err != nil {
        return err
    }

    // If the directory is empty, return early to ensure it is created
    if len(entries) == 0 {
        return nil
    }

    for _, entry := range entries {
        srcPath := filepath.Join(src, entry.Name())
        dstPath := filepath.Join(dst, entry.Name())

        if entry.IsDir() {
            err = copyDir(srcPath, dstPath)
            if err != nil {
                return err
            }
        } else {
            err = copyFile(srcPath, dstPath)
            if err != nil {
                return err
            }
        }
    }
    return nil
}



func (c *AdminController) CopyFileOrDir(ctx iris.Context) {
	
	var form CopyNodeForm
	err := ctx.ReadJSON(&form)

	if err != nil {
		fmt.Println("error11")
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.WriteString(err.Error())
		return
	}
	
	srcDirfileInfo, errsrcDir := os.Stat(form.ID)
	if errsrcDir != nil {
		fmt.Println("error15")
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.WriteString(errsrcDir.Error())
		return
	}
	

	dstDirfileInfo, errdstDir := os.Stat(form.Parent)
	if errdstDir != nil {
		fmt.Println("error16")
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.WriteString(errdstDir.Error())
		
		return
	}
	var dst string
	if srcDirfileInfo.IsDir() && dstDirfileInfo.IsDir() {
		dirName := filepath.Base(form.ID)
		dst := filepath.Join(form.Parent, dirName)

		fmt.Println("copy dir")
		fmt.Println(form.ID)
		fmt.Println(dst)
		errcpy := copyDir(form.ID, dst)
		if errcpy != nil {
			fmt.Println("error17")
			ctx.StatusCode(iris.StatusBadRequest)
			ctx.WriteString(errcpy.Error())
			return
		}
	}
	if !srcDirfileInfo.IsDir() && dstDirfileInfo.IsDir(){
		fileName := filepath.Base(form.ID)
		fmt.Println("copy file")
		dst := filepath.Join(form.Parent, fileName)
		fmt.Println(form.ID)
		fmt.Println(dst)
		errcpy := copyFile(form.ID, dst)
		if errcpy != nil {
			fmt.Println("error17")
			ctx.StatusCode(iris.StatusBadRequest)
			ctx.WriteString(errcpy.Error())
			return
		}
	}
	
	ctx.StatusCode(iris.StatusOK)
	ctx.JSON(map[string]string{"id": encodePath(dst)})
}

func (c *AdminController) MoveFileOrDir(ctx iris.Context) {
	var form CopyNodeForm
	err := ctx.ReadJSON(&form)

	if err != nil {
		fmt.Println("error11")
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.WriteString(err.Error())
		return
	}
	dirName := filepath.Base(form.ID)
	dst := filepath.Join(form.Parent, dirName)
	err2 := os.Rename(form.ID, dst)
	if err2 != nil {
		fmt.Println("error11")
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.WriteString(err2.Error())
		return
	}
	ctx.StatusCode(iris.StatusOK)
	ctx.JSON(map[string]string{"id": encodePath(dst)})
}