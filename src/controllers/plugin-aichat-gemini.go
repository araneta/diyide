package controllers

import (
	_ "bytes"
	"context"
	_ "encoding/base64"
	_ "encoding/json"
	"fmt"

	"os"
	"strings"

	"github.com/google/generative-ai-go/genai"
	_ "github.com/kataras/iris/v12"
	"google.golang.org/api/option"
)

// Replace with your actual API key and model name.
const (
	apiKey    = "AIzaSyAkD6kALKRdaQixM7DFZvXct_YBei73RYQ"
	modelName = "models/gemini-1.5-flash"
	endpoint  = "generativelanguage.googleapis.com:443"
)

type ApiResponse struct {
	Result string `json:"result"`
	Error  string `json:"error,omitempty"`
}

var conversationHistory []string

func buildPromptWithCommand(code, command string, history []string) string {
	prompt := ""
	for _, h := range history {
		prompt += h + "\n"
	}
	prompt += fmt.Sprintf("Analyze this code:\n```\n%s\n```\n\nCommand: %s", code, command)
	return prompt
}
func buildAnalyzePrompt(fpath, code string) string {
	var prompt string

	prompt = fmt.Sprintf("Analyze the following code, which is from the file: %s \n```\n%s\n```\n\n", fpath, code)
	return prompt
}
func buildPromptCommandWithExistingPrompt(prevPrompt, code, command string, history []string) string {
	prompt := ""
	for _, h := range history {
		prompt += h + "\n"
	}
	prompt += fmt.Sprintf("%s\nAnalyze this code:\n```\n%s\n```\n\nCommand: %s", prevPrompt, code, command)
	return prompt
}

func getGeminiResponse(prompt string, imageData []byte) (string, error) {
	ctx := context.Background()

	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return "", fmt.Errorf("failed to create client: %w", err)
	}
	defer client.Close()

	model := client.GenerativeModel(modelName)

	// Create the request.
	var req []genai.Part
	if imageData != nil {
		req = []genai.Part{
			genai.ImageData("jpeg", imageData),

			genai.Text(prompt),
		}

	} else {
		req = []genai.Part{
			genai.Text(prompt),
		}

	}

	// Generate content.
	resp, err := model.GenerateContent(ctx, req...)

	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	if len(resp.Candidates) > 0 && len(resp.Candidates[0].Content.Parts) > 0 {
		part := resp.Candidates[0].Content.Parts[0]
		//fmt.Println(part)
		return fmt.Sprintf("%v", part), nil
	}

	return "No response from Gemini.", nil
}

type apiKeyCredentials struct {
	apiKey string
}

func (c *apiKeyCredentials) GetRequestMetadata(ctx context.Context, uri ...string) (map[string]string, error) {
	return map[string]string{
		"x-goog-api-key": c.apiKey,
	}, nil
}

func (c *apiKeyCredentials) RequireTransportSecurity() bool {
	return false
}

func (c *AIChatController) GeminiAnalyze(form *AIChatCommandForm) (string, error) {

	n := len(form.Files)
	var prompt string
	if n > 0 {
		var sb strings.Builder

		for _, file := range form.Files {
			b, err := os.ReadFile(file) // just pass the file name
			if err != nil {
				return "", err
			}

			sb.WriteString(buildAnalyzePrompt(file, string(b)))
		}
		prompt = buildPromptCommandWithExistingPrompt(sb.String(), form.Code, form.Question, conversationHistory)
	} else {
		prompt = buildPromptWithCommand(form.Code, form.Question, conversationHistory)
	}
	fmt.Println(prompt)
	result, err := getGeminiResponse(prompt, form.ImageFile)
	if err != nil {
		return "", fmt.Errorf("Gemini error: %v\n", err)
	}

	conversationHistory = append(conversationHistory, "User: "+form.Question, "Gemini: "+result)
	if len(conversationHistory) > 10 {
		conversationHistory = conversationHistory[2:]
	}
	return result, nil

}
