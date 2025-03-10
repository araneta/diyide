package controllers

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/kataras/iris/v12"
)

type DeepSeekResponse struct {
	Analysis string `json:"analysis"`
}

type AIChatController struct {
}
type AIChatCommandForm struct {
	Code     string `json:"code"`
	Question string `json:"question"`
	AIAgent  string `json:"aiagent"`
}
type AIChatCommandResult struct {
	Response string `json:"response"`
}

func (c *AIChatController) Analyze(ctx iris.Context) {
	var form AIChatCommandForm
	err := ctx.ReadJSON(&form)

	if err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.WriteString(err.Error())
		return
	}

	ctx.JSON(iris.Map{"status": "1", "message": results})
}
