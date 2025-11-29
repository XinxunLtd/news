package handlers

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"path/filepath"
	"time"

	"xinxun-news/internal/services"

	"github.com/gin-gonic/gin"
)

func UploadImage(c *gin.Context) {
	log.Println("[UploadImage] Starting image upload process")

	file, err := c.FormFile("image")
	if err != nil {
		log.Printf("[UploadImage] Error getting file from form: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "No image file provided"})
		return
	}

	log.Printf("[UploadImage] File received: %s, Size: %d bytes", file.Filename, file.Size)

	// Open file
	src, err := file.Open()
	if err != nil {
		log.Printf("[UploadImage] Error opening file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
		return
	}
	defer src.Close()

	// Read file data
	fileData, err := io.ReadAll(src)
	if err != nil {
		log.Printf("[UploadImage] Error reading file data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		return
	}

	log.Printf("[UploadImage] File data read successfully: %d bytes", len(fileData))

	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("news/%d%s", time.Now().UnixNano(), ext)
	contentType := file.Header.Get("Content-Type")

	log.Printf("[UploadImage] Generated filename: %s, Content-Type: %s", filename, contentType)

	// Upload to S3 only
	log.Println("[UploadImage] Starting S3 upload...")
	url, err := services.UploadToS3(filename, fileData, contentType)
	if err != nil {
		log.Printf("[UploadImage] S3 upload failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to upload to S3: " + err.Error(),
		})
		return
	}

	log.Printf("[UploadImage] S3 upload successful. URL: %s", url)

	// S3 upload successful
	c.JSON(http.StatusOK, gin.H{
		"url":  url,
		"path": filename,
	})
}
