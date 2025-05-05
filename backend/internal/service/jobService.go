package service

import (
	"job-parser-backend/internal/model"
)

func SaveJob(job model.Job) (*model.Job, error) {
	err := CheckIfJobPostingExists(job.URL)
	if err != nil {
		return nil, err
	}

	res, err := FormatDataToJSON(job.Description)
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

	savedJob, err := SaveJobPosting(parsedJob)
	if err != nil {
		return nil, err
	}

	return savedJob, nil
}
