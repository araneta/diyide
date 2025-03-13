package controllers

import (
	_ "bufio"

	_ "io/ioutil"

	_ "os"
	_ "strings"

	"github.com/kataras/iris/v12"
)

type AIChatController struct {
}
type AIChatCommandForm struct {
	Code      string   `json:"code"`
	Question  string   `json:"question"`
	AIAgent   string   `json:"aiagent"`
	ImageFile []byte   `json:"imageFile"`
	Files     []string `json:"files"`
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

	if form.AIAgent == "deepseek" {
		response, err := c.DeepSeekAnalyze(&form)
		if err != nil {
			ctx.JSON(iris.Map{"response": err.Error()})
			return
		} else {
			ctx.JSON(iris.Map{"response": response})
		}
	} else if form.AIAgent == "gemini" {
		response, err := c.GeminiAnalyze(&form)
		if err != nil {
			ctx.JSON(iris.Map{"response": err.Error()})
			return
		} else {
			ctx.JSON(iris.Map{"response": response})
		}
	}

}
