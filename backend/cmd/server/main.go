package main

import (
	"job-parser-backend/internal/handler"
	"log"
	"os"

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

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	err = router.Run("0.0.0.0:" + port)
	if err != nil {
		log.Fatal("Failed to start server: ", err)
	}
}
