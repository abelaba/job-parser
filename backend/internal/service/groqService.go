package service

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"job-parser-backend/internal/model"
	"job-parser-backend/internal/utils"
	"net/http"
	"os"
)

func groqRequestWrapper(requestType string, url string, body map[string]any, responseFormat any) error {
	const groqURL string = "https://api.groq.com/openai/v1/chat/completions"

	groqAPIKey := os.Getenv("GROQ_API_KEY")
	if groqAPIKey == "" {
		return fmt.Errorf("Groq API key not set")
	}

	url = groqURL + url

	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("error marshalling request body: %w", err)
	}

	request, err := http.NewRequest(requestType, url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return fmt.Errorf("error creating HTTP request: %w", err)
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+groqAPIKey)

	client := &http.Client{}
	response, err := client.Do(request)
	if err != nil {
		return fmt.Errorf("error sending HTTP request: %w", err)
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(response.Body)
		return fmt.Errorf("Groq request failed with status %d: %s", response.StatusCode, string(bodyBytes))
	}

	if err := json.NewDecoder(response.Body).Decode(&responseFormat); err != nil {
		return fmt.Errorf("error decoding response JSON: %w", err)
	}

	return nil
}

func FormatDataToJSON(jobDescription string) (*model.Job, error) {
	body := map[string]any{
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": utils.FormatDataToJsonPrompt,
			},
			{
				"role":    "user",
				"content": jobDescription,
			},
		},
		"model":  "mistral-saba-24b",
		"stream": false,
		"response_format": map[string]string{
			"type": "json_object",
		},
	}

	var response model.GroqResponse
	if err := groqRequestWrapper("POST", "", body, &response); err != nil {
		return nil, fmt.Errorf("error making Groq request: %w", err)
	}

	if len(response.Choices) == 0 {
		return nil, errors.New("empty response from Groq API: no choices found")
	}

	var job model.Job
	if err := json.Unmarshal([]byte(response.Choices[0].Message.Content), &job); err != nil {
		return nil, fmt.Errorf("error decoding job JSON: %w", err)
	}

	return &job, nil
}

func CompareJobPosting(resume any, jobPosting string) (*model.JobComparison, error) {
	bytes, err := json.Marshal(resume)
	if err != nil {
		return nil, fmt.Errorf("error marshalling resume: %w", err)
	}

	resumeString := string(bytes)

	body := map[string]any{
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": utils.CompareJobPostingPrompt,
			},
			{
				"role":    "user",
				"content": "Resume:\n" + resumeString,
			},
			{
				"role":    "user",
				"content": "Job Posting:\n" + jobPosting,
			},
		},
		"model":  "gemma2-9b-it",
		"stream": false,
		"response_format": map[string]string{
			"type": "json_object",
		},
	}

	var response model.GroqResponse
	if err := groqRequestWrapper("POST", "", body, &response); err != nil {
		return nil, fmt.Errorf("error making Groq request: %w", err)
	}

	if len(response.Choices) == 0 || response.Choices[0].Message.Content == "" {
		return nil, errors.New("empty or invalid response from Groq API: no choices or content found")
	}

	var jobComparison model.JobComparison
	if err := json.Unmarshal([]byte(response.Choices[0].Message.Content), &jobComparison); err != nil {
		return nil, fmt.Errorf("error decoding inner job comparison JSON: %w", err)
	}

	return &jobComparison, nil
}

