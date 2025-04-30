package model

type Job struct {
	ID          string `json:"id"`
	Country     string `json:"country"`
	Company     string `json:"company"`
	URL         string `json:"url"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type StatsResult struct {
	StatusCount map[string]int `json:"statusCount"`
	CompanyCount map[string]int`json:"companyCount"`
	CountryCount map[string]int`json:"countryCount"`
}

type StreakStats struct {
	MaxStreak       int    `json:"maxStreak"`
	CurrentStreak   int    `json:"currentStreak"`
	LastAppliedDate string `json:"lastAppliedDate"`
}

type JobComparison struct {
	MatchScore      int      `json:"matchScore"`
	MissingSkills   []string `json:"missingSkills"`
	Recommendations []string `json:"recommendations"`
}
