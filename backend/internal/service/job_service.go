package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"job-parser-backend/internal/client"
	"job-parser-backend/internal/model"
	"job-parser-backend/internal/utils"
	"log"
	"os"
	"time"
)

type JobService interface {
	SaveJob(job model.Job) (*model.Job, error)
	checkIfJobPostingExists(url string) error
	UpdateJob(pageID string) error
	GetRecentlySavedJobs() ([]model.Job, error)
	GetStats(dateRange string) (*model.StatsResult, error)
	GetStreak() (*model.StreakStats, error)
	formatJobDescriptionToJSON(jobDescription string) (*model.Job, error)
	CompareJobPosting(resume any, jobPosting string) (*model.JobComparison, error)
	saveJobPosting(job *model.Job) (*model.Job, error)
}

type jobService struct {
	notionClient client.NotionClient
	groqClient   client.GroqClient
}

func NewJobService(notionClient client.NotionClient, groqClient client.GroqClient) JobService {
	return &jobService{
		notionClient: notionClient,
		groqClient:   groqClient,
	}
}

func(s *jobService) SaveJob(job model.Job) (*model.Job, error) {
	err := s.checkIfJobPostingExists(job.URL)
	if err != nil {
		return nil, err
	}

	res, err := s.formatJobDescriptionToJSON(job.Description)
	if err != nil {
		return nil, err
	}

	parsedJob := &model.Job{
		URL:         job.URL,
		Description: res.Description,
		Company:     res.Company,
		Country:     res.Country,
		Title:       res.Title,
	}

	savedJob, err := s.saveJobPosting(parsedJob)
	if err != nil {
		return nil, err
	}

	return savedJob, nil
}

func(s *jobService) formatJobDescriptionToJSON(jobDescription string) (*model.Job, error) {
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

	response, err := s.groqClient.POST("", body)
	
	if err != nil {
		return nil, fmt.Errorf("error making Groq request: %w", err)
	}
	
	var job model.Job
	if err := json.Unmarshal([]byte(response.Choices[0].Message.Content), &job); err != nil {
		return nil, fmt.Errorf("error decoding job JSON: %w", err)
	}

	return &job, nil
}

func(s *jobService) CompareJobPosting(resume any, jobPosting string) (*model.JobComparison, error) {
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

	response, err := s.groqClient.POST("", body)
	
	if err != nil {
		return nil, fmt.Errorf("error making Groq request: %w", err)
	}

	var jobComparison model.JobComparison
	if err := json.Unmarshal([]byte(response.Choices[0].Message.Content), &jobComparison); err != nil {
		return nil, fmt.Errorf("error decoding inner job comparison JSON: %w", err)
	}

	return &jobComparison, nil
}


func(s *jobService) GetRecentlySavedJobs() ([]model.Job, error) {
	notionDatabaseId := os.Getenv("NOTION_DATABASE_ID")

	body := map[string]any{
		"filter": map[string]any{
			"property": "Status",
			"status": map[string]string{
				"equals": "Not Applied",
			},
		},
	}

	response, err := s.notionClient.GetNotionDatabase(notionDatabaseId, body)

	if err != nil {
		return nil, err
	}

	var recentJobs []model.Job

	for _, content := range response.Results {
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

func(s *jobService) checkIfJobPostingExists(jobPostingUrl string) error {
	notionDatabaseId := os.Getenv("NOTION_DATABASE_ID")

	body := map[string]any{
		"filter": map[string]any{
			"property": "URL",
			"url": map[string]string{
				"equals": jobPostingUrl,
			},
		},
	}

	response, err := s.notionClient.GetNotionDatabase(notionDatabaseId, body)

	if err != nil {
		return err
	}

	if response.Results != nil && len(response.Results) > 0 {
		return errors.New("You have already applied to this position")
	}

	return nil
}

func(s *jobService) saveJobPosting(data *model.Job) (*model.Job, error) {
	notionDatabaseId := os.Getenv("NOTION_DATABASE_ID")

	body := map[string]any{
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

	page, err := s.notionClient.CreateNotionPage(notionDatabaseId, body)

	if err != nil {
		return nil, err
	}

	savedJob := &model.Job{
		Country:     page.Properties.Country.Select.Name,
		Company:     page.Properties.Company.Select.Name,
		URL:         page.Properties.URL.URL,
		Title:       page.Properties.Link.Title[0].PlainText,
		Description: page.Properties.Description.RichText[0].PlainText,
	}

	return savedJob, nil

}

func(s *jobService) UpdateJob(pageId string) error {
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

	_, err := s.notionClient.UpdateNotionPage(pageId, body)

	if err != nil {
		return err
	}

	return nil
}

func(s *jobService) GetStats(dateRange string) (*model.StatsResult, error) {
	databaseID := os.Getenv("NOTION_DATABASE_ID")

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

	response, err := s.notionClient.GetNotionDatabase(databaseID, body)

	if err != nil {
		return nil, err
	}

	stats := &model.StatsResult{
		StatusCount:  make(map[string]int),
		CompanyCount: make(map[string]int),
		CountryCount: make(map[string]int),
		DailyCount:   make(map[string]int),
	}

	// Initialize DailyCount for the last 30 days
	startDate := time.Now()

	for i := 0; i < rangeNumber; i++ {
		str := startDate.AddDate(0, 0, -i).Format("2006-01-02")
		stats.DailyCount[str] = 0
	}

	for _, data := range response.Results {
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

func(s *jobService) GetStreak() (*model.StreakStats, error) {
	databaseID := os.Getenv("NOTION_DATABASE_ID")

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

	response, err := s.notionClient.GetNotionDatabase(databaseID, body)

	if err != nil {
		return nil, err
	}

	var dates []time.Time
	for _, res := range response.Results {
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
		TotalCount:      len(dates),
		MaxStreak:       maxStreak,
		CurrentStreak:   realCurrentStreak,
		LastAppliedDate: dates[0].Format("2006-01-02"),
	}, nil
}
