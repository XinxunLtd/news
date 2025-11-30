package handlers

import (
	"context"
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
	startTime := time.Now()
	log.Printf("[UploadImage] ===== Starting image upload process at %s =====", startTime.Format(time.RFC3339))

	// Get user info for logging
	userID, _ := c.Get("user_id")
	userType, _ := c.Get("user_type")
	log.Printf("[UploadImage] User ID: %v, User Type: %v", userID, userType)

	// Get file from form
	log.Println("[UploadImage] Step 1: Getting file from form...")
	file, err := c.FormFile("image")
	if err != nil {
		log.Printf("[UploadImage] ERROR at Step 1 - Error getting file from form: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tidak ada file gambar yang diberikan"})
		return
	}
	log.Printf("[UploadImage] Step 1 SUCCESS - File received: %s, Size: %d bytes", file.Filename, file.Size)

	// Validate file size (max 10MB)
	maxSize := int64(10 * 1024 * 1024) // 10MB
	if file.Size > maxSize {
		log.Printf("[UploadImage] ERROR - File too large: %d bytes (max: %d bytes)", file.Size, maxSize)
		c.JSON(http.StatusBadRequest, gin.H{"error": "File terlalu besar. Maksimal 10MB"})
		return
	}

	// Open file
	log.Println("[UploadImage] Step 2: Opening file...")
	src, err := file.Open()
	if err != nil {
		log.Printf("[UploadImage] ERROR at Step 2 - Error opening file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuka file"})
		return
	}
	defer func() {
		if closeErr := src.Close(); closeErr != nil {
			log.Printf("[UploadImage] WARNING - Error closing file: %v", closeErr)
		}
		log.Println("[UploadImage] File closed successfully")
	}()

	// Read file data
	log.Println("[UploadImage] Step 3: Reading file data...")
	readStart := time.Now()
	fileData, err := io.ReadAll(src)
	readDuration := time.Since(readStart)
	if err != nil {
		log.Printf("[UploadImage] ERROR at Step 3 - Error reading file data: %v (took %v)", err, readDuration)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membaca data file"})
		return
	}
	log.Printf("[UploadImage] Step 3 SUCCESS - File data read: %d bytes (took %v)", len(fileData), readDuration)

	// Generate unique filename
	log.Println("[UploadImage] Step 4: Generating filename...")
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("news/%d%s", time.Now().UnixNano(), ext)
	contentType := file.Header.Get("Content-Type")
	if contentType == "" {
		// Default content type based on extension
		switch ext {
		case ".jpg", ".jpeg":
			contentType = "image/jpeg"
		case ".png":
			contentType = "image/png"
		case ".gif":
			contentType = "image/gif"
		case ".webp":
			contentType = "image/webp"
		case ".heic", ".heif":
			contentType = "image/heic"
		default:
			contentType = "image/jpeg"
		}
		log.Printf("[UploadImage] Content-Type was empty, set to: %s", contentType)
	}
	log.Printf("[UploadImage] Step 4 SUCCESS - Filename: %s, Content-Type: %s", filename, contentType)

	// Upload to S3 with timeout
	log.Println("[UploadImage] Step 5: Starting S3 upload...")
	uploadStart := time.Now()

	// Create context with timeout (30 seconds for S3 upload)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Use channel to handle timeout
	type uploadResult struct {
		url string
		err error
	}
	resultChan := make(chan uploadResult, 1)

	go func() {
		url, err := services.UploadToS3(filename, fileData, contentType)
		resultChan <- uploadResult{url: url, err: err}
	}()

	select {
	case result := <-resultChan:
		uploadDuration := time.Since(uploadStart)
		if result.err != nil {
			log.Printf("[UploadImage] ERROR at Step 5 - S3 upload failed: %v (took %v)", result.err, uploadDuration)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": fmt.Sprintf("Gagal mengupload ke S3: %v", result.err),
			})
			return
		}
		log.Printf("[UploadImage] Step 5 SUCCESS - S3 upload completed. URL: %s (took %v)", result.url, uploadDuration)

		totalDuration := time.Since(startTime)
		log.Printf("[UploadImage] ===== Upload completed successfully in %v =====", totalDuration)

		// S3 upload successful
		c.JSON(http.StatusOK, gin.H{
			"url":  result.url,
			"path": filename,
		})
	case <-ctx.Done():
		uploadDuration := time.Since(uploadStart)
		log.Printf("[UploadImage] ERROR at Step 5 - S3 upload timeout after %v", uploadDuration)
		c.JSON(http.StatusRequestTimeout, gin.H{
			"error": "Upload timeout. Silakan coba lagi dengan file yang lebih kecil.",
		})
		return
	}
}
