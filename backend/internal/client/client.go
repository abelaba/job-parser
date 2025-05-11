package client

import (
	"fmt"
	"net/http"
)

func CreateClients(httpClient *http.Client) (NotionClient, GroqClient, error) {
	notionClient, err := CreateNotionClient(httpClient)
	if err != nil {
		return nil, nil, fmt.Errorf("error creating Notion client: %w", err)
	}

	groqClient, err := CreateGroqClient(httpClient)
	if err != nil {
		return nil, nil, fmt.Errorf("error creating Groq client: %w", err)
	}

	return notionClient, groqClient, nil
}
