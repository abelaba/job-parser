package client

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"job-parser-backend/internal/model"
	"net/http"
	"os"
)

type groqClient struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
}

type GroqClient interface {
	request(requestType string, url string, body map[string]any, responseFormat any) error
	POST(url string, body map[string]any) (*model.GroqResponse, error)
}

func CreateGroqClient(httpClient *http.Client) (GroqClient, error) {
	groqAPIKey := os.Getenv("GROQ_API_KEY")

	if groqAPIKey == "" {
		return nil, fmt.Errorf("Groq API key not set")
	}

	return &groqClient{
		apiKey:     groqAPIKey,
		baseURL:    "https://api.groq.com/openai/v1/chat/completions",
		httpClient: httpClient,
	}, nil
}

func (c *groqClient) POST(url string, body map[string]any) (*model.GroqResponse, error) {
	var response model.GroqResponse

	if err := c.request("POST", "", body, &response); err != nil {
		return nil, fmt.Errorf("error making Groq request: %w", err)
	}

	if len(response.Choices) == 0 || response.Choices[0].Message.Content == "" {
		return nil, errors.New("empty or invalid response from Groq API: no choices or content found")
	}

	return &response, nil
}

func (c *groqClient) request(requestType string, url string, body map[string]any, responseFormat any) error {
	url = c.baseURL + url

	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("error marshalling request body: %w", err)
	}

	request, err := http.NewRequest(requestType, url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return fmt.Errorf("error creating HTTP request: %w", err)
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+c.apiKey)

	response, err := c.httpClient.Do(request)
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
