package main

import (
	"job-parser-backend/internal/handler"
	"log"
	"os"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func RegisterHandlers(r *gin.Engine){
	handler.RegisterJobHandler(r)
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	mode := os.Getenv("MODE")
	if(mode == "release") {
		gin.SetMode(gin.ReleaseMode)
	}

	log.Println("Running in", gin.Mode(), "mode")

	router:= gin.Default()

	RegisterHandlers(router)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	log.Println("Server starting on port", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server: ", err)
	}
}
