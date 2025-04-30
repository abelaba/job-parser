package main

import (
	"job-parser-backend/internal/handler"
	"log"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load() 
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	router:= gin.Default()
	handler.RegisterJobHandler(router)
	router.Run("localhost:8000")
}
