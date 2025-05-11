package handler

import (
	"job-parser-backend/internal/model"
	"job-parser-backend/internal/service"
	"log"
	"net/http"
	"github.com/gin-gonic/gin"
)

type JobHandler interface {
	saveJobHandler(context *gin.Context)
	compareJobPostingHandler(context *gin.Context)
	getRecentlySavedJobsHandler(context *gin.Context)
	updateJobHandler(context *gin.Context)
	getStatsHandler(context *gin.Context)
	getStreakHandler(context *gin.Context)
	registerJobHandler(router *gin.Engine)
}	

type jobHandler struct {
	service service.JobService
}

func CreateJobHandler(svc service.JobService, router *gin.Engine) JobHandler {
	jobHandler := &jobHandler{service: svc}
	jobHandler.registerJobHandler(router)
	return jobHandler
}

func(h *jobHandler) registerJobHandler(router *gin.Engine) {
	router.GET("/api/job/recent", h.getRecentlySavedJobsHandler)
	router.GET("/api/job/stats", h.getStatsHandler)
	router.GET("/api/job/streak", h.getStreakHandler)

	router.POST("/api/job", h.saveJobHandler)
	router.POST("/api/job/compare", h.compareJobPostingHandler)

	router.PUT("/api/job/:pageID", h.updateJobHandler)
}

func(h *jobHandler) saveJobHandler(context *gin.Context) {
	var req model.Job
	if err := context.BindJSON(&req); err != nil {
		logError(err)
		context.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	res, err := h.service.SaveJob(req)
	if err != nil {
		logError(err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save job"})
		return
	}
	context.JSON(http.StatusOK, res)
}

func(h *jobHandler) compareJobPostingHandler(context *gin.Context) {
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

	res, err := h.service.CompareJobPosting(req.Resume, req.JobPosting)
	if err != nil {
		logError(err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to compare job posting"})
		return
	}
	context.JSON(http.StatusOK, res)
}

func(h *jobHandler) getRecentlySavedJobsHandler(context *gin.Context) {
	jobs, err := h.service.GetRecentlySavedJobs()
	if err != nil {
		logError(err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch saved jobs"})
		return
	}
	context.JSON(http.StatusOK, jobs)
}


func(h *jobHandler) updateJobHandler(context *gin.Context) {
	pageID := context.Param("pageID")

	if pageID == "" {
		context.JSON(http.StatusBadRequest, gin.H{"error": "Missing pageID in path"})
		return
	}

	err := h.service.UpdateJob(pageID)
	if err != nil {
		logError(err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update job"})
		return
	}
	context.JSON(http.StatusOK, gin.H{})
}

func(h *jobHandler) getStatsHandler(context *gin.Context) {
	rangeParam := context.Query("range")

	statResult, err := h.service.GetStats(rangeParam)
	if err != nil {
		logError(err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stats"})
		return
	}
	context.JSON(http.StatusOK, statResult)
}

func(h *jobHandler) getStreakHandler(context *gin.Context) {
	streakStat, err := h.service.GetStreak()
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
