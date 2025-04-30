package service

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"job-parser-backend/internal/model"
	"net/http"
	"os"
	"time"
)

func notionRequestWrapper(requestType string, url string, body map[string]any, responseFormat any) error {
	const notionBaseURL string = "https://api.notion.com/v1/"

	notionApiKey := os.Getenv("NOTION_API_KEY")
	if notionApiKey == "" {
		return errors.New("Notion API key is not set")
	}

	url = notionBaseURL + url

	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("error marshalling request body: %w", err)
	}

	request, err := http.NewRequest(requestType, url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return fmt.Errorf("error creating HTTP request: %w", err)
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+notionApiKey)
	request.Header.Set("Notion-Version", "2022-06-28")

	client := &http.Client{}
	response, err := client.Do(request)
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


func GetRecentlySavedJobs() ([]model.Job, error) {
	notionDatabaseId := os.Getenv("NOTION_DATABASE_ID")
	url := fmt.Sprintf("databases/%v/query", notionDatabaseId)

	body := map[string]any{
		"filter": map[string]any{
			"property": "Status",
			"status": map[string]string{
				"equals": "Not Applied",
			},
		},
	}

	var notionResponse model.NotionResponse

	err := notionRequestWrapper("POST", url, body, &notionResponse)

	if err != nil {
		return nil, err
	}

	var recentJobs []model.Job

	for _, content:= range notionResponse.Results {
		recentJobs = append(recentJobs, model.Job{
			ID:          content.ID,
			Country:     content.Properties.Country.Select.Name,
			Company:     content.Properties.Company.Select.Name,
			URL:         content.Properties.URL.URL,
			Title:       content.Properties.Link.Title[0].PlainText,
			Description: content.Properties.Description.RichText[0].PlainText,
		})
	}

	return recentJobs, nil

}
