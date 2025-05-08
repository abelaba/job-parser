package service

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"job-parser-backend/internal/model"
	"log"
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

	for _, content := range notionResponse.Results {
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

func CheckIfJobPostingExists(jobPostingUrl string) error {
	notionDatabaseId := os.Getenv("NOTION_DATABASE_ID")
	url := fmt.Sprintf("databases/%v/query", notionDatabaseId)

	body := map[string]any{
		"filter": map[string]any{
			"property": "URL",
			"url": map[string]string{
				"equals": jobPostingUrl,
			},
		},
	}

	var notionResponse model.NotionResponse

	if err := notionRequestWrapper("POST", url, body, &notionResponse); err != nil {
		return err
	}

	if notionResponse.Results != nil && len(notionResponse.Results) > 0 {
		return errors.New("You have already applied to this position")
	}

	return nil
}

func SaveJobPosting(data *model.Job) (*model.Job, error) {
	url := "pages"
	notionDatabaseId := os.Getenv("NOTION_DATABASE_ID")

	body := map[string]any{
		"parent": map[string]any{
			"database_id": notionDatabaseId,
		},
		"properties": map[string]any{
			"Link": map[string]any{
				"title": []map[string]any{
					{
						"text": map[string]any{
							"content": data.Title,
							"link": map[string]any{
								"url": data.URL,
							},
						},
					},
				},
			},
			"Status": map[string]any{
				"status": map[string]any{
					"name": "Not Applied",
				},
			},
			"Country": map[string]any{
				"select": map[string]any{
					"name": data.Country,
				},
			},
			"Company": map[string]any{
				"select": map[string]any{
					"name": data.Company,
				},
			},
			"URL": map[string]any{
				"url": data.URL,
			},
			"Description": map[string]any{
				"rich_text": []map[string]any{
					{
						"text": map[string]any{
							"content": data.Description,
						},
					},
				},
			},
		},
	}

	var notionProperties model.NotionPage

	err := notionRequestWrapper("POST", url, body, &notionProperties)

	if err != nil {
		return nil, err
	}

	savedJob := &model.Job{
		Country:     notionProperties.Properties.Country.Select.Name,
		Company:     notionProperties.Properties.Company.Select.Name,
		URL:         notionProperties.Properties.URL.URL,
		Title:       notionProperties.Properties.Link.Title[0].PlainText,
		Description: notionProperties.Properties.Description.RichText[0].PlainText,
	}

	return savedJob, nil

}

func UpdateJob(pageId string) error {
	url := "pages/" + pageId
	today := time.Now()
	body := map[string]any{
		"properties": map[string]any{
			"Status": map[string]any{
				"status": map[string]any{
					"name": "Applied",
				},
			},
			"Applied Date": map[string]any{
				"date": map[string]any{
					"start": today.Format(time.RFC3339), // Equivalent to toISOString()
				},
			},
		},
	}

	err := notionRequestWrapper("PATCH", url, body, nil)

	if err != nil {
		return err
	}

	return nil
}

func GetStats(dateRange string) (*model.StatsResult, error) {
	databaseID := os.Getenv("NOTION_DATABASE_ID")
	url := fmt.Sprintf("databases/%s/query", databaseID)

	var dateFilter map[string]any
	rangeNumber := 30 // Default to 30 days
	switch dateRange {
	case "PASTYEAR":
		dateFilter = map[string]any{"past_year": map[string]any{}}
	case "PASTMONTH":
		dateFilter = map[string]any{"past_month": map[string]any{}}
	case "PASTWEEK":
		dateFilter = map[string]any{"past_week": map[string]any{}}
		rangeNumber = 7
	default:
		dateFilter = map[string]any{"past_year": map[string]any{}}

	}

	body := map[string]any{
		"filter": map[string]any{
			"property": "Created Date",
			"date":     dateFilter,
		},
	}

	var notionResponse model.NotionResponse

	err := notionRequestWrapper("POST", url, body, &notionResponse)

	if err != nil {
		return nil, err
	}

	stats := &model.StatsResult{
		StatusCount:  make(map[string]int),
		CompanyCount: make(map[string]int),
		CountryCount: make(map[string]int),
		DailyCount: make(map[string]int),
	}

	// Initialize DailyCount for the last 30 days
	startDate := time.Now()
	
	for i := 0; i < rangeNumber; i++ {
		str := startDate.AddDate(0, 0, -i).Format("2006-01-02")
		stats.DailyCount[str] = 0
	}

	for _, data := range notionResponse.Results {
		status := data.Properties.Status.Status.Name
		company := data.Properties.Company.Select.Name
		country := data.Properties.Country.Select.Name
		if data.Properties.AppliedDate.Date != nil {
			date := data.Properties.AppliedDate.Date.Start
			t, err := time.Parse(time.RFC3339, date)
			if err == nil {
				now := time.Now()
				if now.Sub(t).Hours() <= 30*24 { // Check if the date is in the last 30 days
					str := t.Format("2006-01-02")
					stats.DailyCount[str]++
				}
			} else {
				log.Printf("Failed to parse date: %v", err)
			}
		}

		if status != "" {
			stats.StatusCount[status]++
		}
		if company != "" {
			stats.CompanyCount[company]++
		}
		if country != "" {
			stats.CountryCount[country]++
		}
	}

	return stats, nil
}

func GetStreak() (*model.StreakStats, error) {
	databaseID := os.Getenv("NOTION_DATABASE_ID")
	url := "databases/" + databaseID + "/query"

	body := map[string]any{
		"sorts": []map[string]any{
			{
				"property":  "Applied Date",
				"direction": "descending",
			},
		},
		"filter": map[string]any{
			"property": "Applied Date",
			"date": map[string]any{
				"is_not_empty": true,
			},
		},
	}

	var notionResponse model.NotionResponse

	err := notionRequestWrapper("POST", url, body, &notionResponse)

	if err != nil {
		return nil, err
	}

	var dates []time.Time
	for _, res := range notionResponse.Results {
		if res.Properties.AppliedDate.Date.Start != "" {
			parsed, err := time.Parse(time.RFC3339, res.Properties.AppliedDate.Date.Start)
			if err == nil {
				dates = append(dates, parsed)
			}
		}
	}

	if len(dates) == 0 {
		return &model.StreakStats{TotalCount: 0, MaxStreak: 0, CurrentStreak: 0, LastAppliedDate: ""}, nil
	}

	maxStreak := 1
	currentStreak := 1

	for i := 1; i < len(dates); i++ {
		prev := dates[i-1]
		curr := dates[i]
		diffDays := int(prev.Sub(curr).Hours() / 24)
		if diffDays == 1 {
			currentStreak++
			if currentStreak > maxStreak {
				maxStreak = currentStreak
			}
		} else {
			currentStreak = 1
		}
	}

	realCurrentStreak := 0
	today := time.Now().Truncate(24 * time.Hour)
	currentDate := today

	for i, d := range dates {
		d = d.Truncate(24 * time.Hour)
		diffDays := int(currentDate.Sub(d).Hours() / 24)
		if i == 0 && diffDays == 0 {
			realCurrentStreak++
		} else if i != 0 && diffDays == 1 {
			realCurrentStreak++
			currentDate = d
		} else {
			break
		}
		currentDate = d
	}

	return &model.StreakStats{
		TotalCount: len(dates),
		MaxStreak:       maxStreak,
		CurrentStreak:   realCurrentStreak,
		LastAppliedDate: dates[0].Format("2006-01-02"),
	}, nil
}
