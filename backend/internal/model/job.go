package model

// Job represents a job listing.
type Job struct {
	ID          string `json:"id"`
	Country     string `json:"country"`
	Company     string `json:"company"`
	URL         string `json:"url"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

// StatsResult holds aggregated job application statistics.
type StatsResult struct {
	StatusCount  map[string]int `json:"statusCount"`
	CompanyCount map[string]int `json:"companyCount"`
	CountryCount map[string]int `json:"countryCount"`
	DailyCount   map[string]int `json:"dailyCount"`
}

// StreakStats contains streak-related data.
type StreakStats struct {
	TotalCount      int    `json:"totalCount"`
	MaxStreak       int    `json:"maxStreak"`
	CurrentStreak   int    `json:"currentStreak"`
	LastAppliedDate string `json:"lastAppliedDate"`
}

// JobComparison holds comparison results between a resume and job posting.
type JobComparison struct {
	MatchScore      int      `json:"matchScore"`
	MissingSkills   []string `json:"missingSkills"`
	Recommendations []string `json:"recommendations"`
}
