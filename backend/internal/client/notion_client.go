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

type notionClient struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
	version    string
}

type NotionClient interface {
	request(requestType string, url string, body map[string]any, responseFormat any) error
	GetNotionPage(pageID string, body map[string]any) (*model.NotionPage, error)
	GetNotionDatabase(databaseID string, body map[string]any) (*model.NotionResponse, error)
	UpdateNotionPage(pageID string, body map[string]any) (*model.NotionPage, error)
	CreateNotionPage(databaseID string, body map[string]any) (*model.NotionPage, error)
}

func CreateNotionClient(httpClient *http.Client ) (NotionClient, error) {
	notionApiKey := os.Getenv("NOTION_API_KEY")
	
	if notionApiKey == "" {
		return nil, errors.New("Notion API key is not set")
	}

	return &notionClient{
		apiKey:     notionApiKey,
		baseURL:    "https://api.notion.com/v1/",
		httpClient: httpClient,
		version:    "2022-06-28",
	}, nil
}

func(c *notionClient) request(requestType string, url string, body map[string]any, responseFormat any) error {
	
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
	request.Header.Set("Notion-Version", "2022-06-28")

	response, err := c.httpClient.Do(request)
	if err != nil {
		return fmt.Errorf("error sending HTTP request: %w", err)
	}

	defer response.Body.Close()

	if response.StatusCode != 200 {
		body, _ := io.ReadAll(response.Body)
		return fmt.Errorf("Notion request returned status code %d with body: %s", response.StatusCode, string(body))
	}

	if responseFormat != nil {
		if err := json.NewDecoder(response.Body).Decode(&responseFormat); err != nil {
			return fmt.Errorf("error decoding response body to JSON: %w", err)
		}
	}

	return nil
}

func (c *notionClient) GetNotionPage(pageID string, body map[string]any) (*model.NotionPage, error) {
	url := fmt.Sprintf("pages/%s", pageID)
	var response model.NotionPage
	err := c.request("POST", url, body, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

func (c *notionClient) GetNotionDatabase(databaseID string, body map[string]any) (*model.NotionResponse, error) {
	url := fmt.Sprintf("databases/%s/query", databaseID)
	var response model.NotionResponse
	err := c.request("POST", url, body, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

func (c *notionClient) UpdateNotionPage(pageID string, body map[string]any) (*model.NotionPage, error) {
	url := fmt.Sprintf("pages/%s", pageID)
	var response model.NotionPage
	err := c.request("PATCH", url, body, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

func (c *notionClient) CreateNotionPage(databaseID string, body map[string]any) (*model.NotionPage, error) {
	url := fmt.Sprintf("pages")
	var response model.NotionPage

	body["parent"] = map[string]string{"database_id": databaseID}

	err := c.request("POST", url, body, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}
