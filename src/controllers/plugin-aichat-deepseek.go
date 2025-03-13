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
)

type DeepSeekResponse struct {
	Analysis string `json:"analysis"`
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

func (c *AIChatController) DeepSeekAnalyze(form *AIChatCommandForm) (string, error) {
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
		return "", fmt.Errorf("Error marshaling JSON: %v\n", err)

	}

	// Create the HTTP request
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(requestBody))
	if err != nil {
		return "", fmt.Errorf("Error creating request: %v\n", err)

	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	// Send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("Error sending request: %v\n", err)

	}
	defer resp.Body.Close()

	// Read the response
	var apiResponse ChatCompletionResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResponse); err != nil {
		return "", fmt.Errorf("Error decoding response: %v\n", err)

	}

	// Handle the response
	if apiResponse.ErrorMsg != "" {
		return "", fmt.Errorf("API Error: %v\n", apiResponse.ErrorMsg)

	} else if len(apiResponse.Choices) > 0 {
		return "", fmt.Errorf("Assistant: %v\n", apiResponse.Choices[0].Message.Content)
	} else {
		return "", fmt.Errorf("No response from the API.")
	}

	// Return the response to the frontend
	return apiResponse.Choices[0].Message.Content, nil
}
