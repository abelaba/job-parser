package handler

import (
	"github.com/gin-gonic/gin"
	"job-parser-backend/internal/model"
	"job-parser-backend/internal/service"
	"log"
	"net/http"
)

func RegisterJobHandler(router *gin.Engine) {
	router.GET("/api/job/recent", GetRecentlySavedJobsHandler)
	router.GET("/api/job/stats", GetStatsHandler)
	router.GET("/api/job/streak", GetStreakHandler)

	router.POST("/api/job/check", CheckIfJobPostingExistsHandler)
	router.POST("/api/job", SaveJobHandler)
	router.POST("/api/job/compare", CompareJobPostingHandler)

	router.PUT("/api/job/:pageID", UpdateJobHandler)
}

func SaveJobHandler(context *gin.Context) {
	var req model.Job
	if err := context.BindJSON(&req); err != nil {
		logError(err)
		context.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	res, err := service.SaveJob(req)
	if err != nil {
		logError(err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save job"})
		return
	}
	context.JSON(http.StatusOK, res)
}

func CompareJobPostingHandler(context *gin.Context) {
	type CompareJobPostingRequest struct {
		Resume     any    `json:"resume"`
		JobPosting string `json:"jobPosting"`
	}
	var req CompareJobPostingRequest
	if err := context.BindJSON(&req); err != nil {
		logError(err)
		context.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	res, err := service.CompareJobPosting(req.Resume, req.JobPosting)
	if err != nil {
		logError(err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to compare job posting"})
		return
	}
	context.JSON(http.StatusOK, res)
}

func GetRecentlySavedJobsHandler(context *gin.Context) {
	jobs, err := service.GetRecentlySavedJobs()
	if err != nil {
		logError(err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch saved jobs"})
		return
	}
	context.JSON(http.StatusOK, jobs)
}

func CheckIfJobPostingExistsHandler(context *gin.Context) {
	type JobCheckRequest struct {
		URL string `json:"url"`
	}
	var req JobCheckRequest
	if err := context.BindJSON(&req); err != nil {
		logError(err)
		context.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	err := service.CheckIfJobPostingExists(req.URL)
	if err != nil {
		logError(err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check if job posting exists"})
		return
	}
	context.JSON(http.StatusOK, gin.H{})
}

func UpdateJobHandler(context *gin.Context) {
	pageID := context.Param("pageID")

	if pageID == "" {
		context.JSON(http.StatusBadRequest, gin.H{"error": "Missing pageID in path"})
		return
	}

	err := service.UpdateJob(pageID)
	if err != nil {
		logError(err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update job"})
		return
	}
	context.JSON(http.StatusOK, gin.H{})
}

func GetStatsHandler(context *gin.Context) {
	rangeParam := context.Query("range")

	statResult, err := service.GetStats(rangeParam)
	if err != nil {
		logError(err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stats"})
		return
	}
	context.JSON(http.StatusOK, statResult)
}

func GetStreakHandler(context *gin.Context) {
	streakStat, err := service.GetStreak()
	if err != nil {
		logError(err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch streak"})
		return
	}
	context.JSON(http.StatusOK, streakStat)
}

func logError(err error) {
	log.Printf("Error: %v", err)
}
