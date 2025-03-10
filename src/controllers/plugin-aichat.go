package controllers

import (
	_ "bufio"
	"bytes"
	"encoding/json"
	"fmt"
	_ "io/ioutil"
	"net/http"
	_ "os"
	_ "strings"

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

// Define the request and response structures
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatCompletionRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
	Stream   bool      `json:"stream"`
}

type ChatCompletionResponse struct {
	Choices []struct {
		Message Message `json:"message"`
	} `json:"choices"`
	ErrorMsg string `json:"error_msg,omitempty"`
}

func (c *AIChatController) Analyze(ctx iris.Context) {
	var form AIChatCommandForm
	err := ctx.ReadJSON(&form)

	if err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.WriteString(err.Error())
		return
	}
	// API endpoint and key
	apiURL := "https://api.deepseek.com/chat/completions"
	apiKey := "sk-0b2f5476296148b3b5aae1a48379e49a" // Replace with your actual API key
	command := fmt.Sprintf("%s. code: %s", form.Question, form.Code)
	// Create the request payload
	requestPayload := ChatCompletionRequest{
		Model: "deepseek-chat",
		Messages: []Message{
			{Role: "system", Content: "Act as expert software developer. You are a helpful assistant."},
			{Role: "user", Content: command},
		},
		Stream: false,
	}

	// Marshal the payload into JSON
	requestBody, err := json.Marshal(requestPayload)
	if err != nil {
		fmt.Printf("Error marshaling JSON: %v\n", err)
		return
	}

	// Create the HTTP request
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(requestBody))
	if err != nil {
		fmt.Printf("Error creating request: %v\n", err)
		return
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	// Send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Error sending request: %v\n", err)
		return
	}
	defer resp.Body.Close()

	// Read the response
	var apiResponse ChatCompletionResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResponse); err != nil {
		fmt.Printf("Error decoding response: %v\n", err)
		return
	}

	// Handle the response
	if apiResponse.ErrorMsg != "" {
		fmt.Printf("API Error: %v\n", apiResponse.ErrorMsg)
	} else if len(apiResponse.Choices) > 0 {
		fmt.Printf("Assistant: %v\n", apiResponse.Choices[0].Message.Content)
	} else {
		fmt.Println("No response from the API.")
	}

	// Return the response to the frontend
	ctx.JSON(iris.Map{"response": apiResponse.Choices[0].Message.Content})
	//ctx.JSON(iris.Map{"status": "1", "message": results})
}
