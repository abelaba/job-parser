package main

import (
	"job-parser-backend/internal/client"
	"job-parser-backend/internal/handler"
	"job-parser-backend/internal/service"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func Initalize(r *gin.Engine) {
	// Initialize clients
	httpClient := &http.Client{}
	notionClient, groqClient, err := client.CreateClients(httpClient)

	if err != nil {
		log.Fatal("Failed to create clients: ", err)
	}
	// Initialize services
	jobService := service.NewJobService(notionClient, groqClient)

	// Initialize handlers
	handler.CreateJobHandler(jobService, r)

	// Health Check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy"})
	})
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Error loading .env file")
	}

	mode := os.Getenv("MODE")
	if mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	log.Println("Running in", gin.Mode(), "mode")

	router := gin.Default()

	Initalize(router)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	log.Println("Server starting on port", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server: ", err)
	}
}
