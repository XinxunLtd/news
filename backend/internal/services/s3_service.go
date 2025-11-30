package services

import (
	"bytes"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

var s3Client *s3.S3
var s3Bucket string

func InitS3() {
	accessKey := os.Getenv("AWS_ACCESS_KEY_ID")
	secretKey := os.Getenv("AWS_SECRET_ACCESS_KEY")
	region := os.Getenv("AWS_REGION")
	s3Bucket = os.Getenv("AWS_S3_BUCKET")

	log.Printf("[InitS3] Initializing S3 - Region: %s, Bucket: %s, AccessKey set: %v", region, s3Bucket, accessKey != "")

	if accessKey == "" || secretKey == "" || region == "" || s3Bucket == "" {
		log.Println("[InitS3] S3 not configured - missing environment variables")
		return // S3 not configured
	}

	sess, err := session.NewSession(&aws.Config{
		Region:      aws.String(region),
		Credentials: credentials.NewStaticCredentials(accessKey, secretKey, ""),
	})
	if err != nil {
		log.Printf("[InitS3] Error creating AWS session: %v", err)
		return
	}

	s3Client = s3.New(sess)
	log.Println("[InitS3] S3 client initialized successfully")
}

func UploadToS3(key string, fileData []byte, contentType string) (string, error) {
	startTime := time.Now()
	log.Printf("[UploadToS3] ===== Starting S3 upload at %s =====", startTime.Format(time.RFC3339))
	log.Printf("[UploadToS3] Key: %s, Size: %d bytes, ContentType: %s", key, len(fileData), contentType)

	if s3Client == nil {
		log.Println("[UploadToS3] ERROR: S3 client is nil - S3 not initialized")
		return "", fmt.Errorf("S3 not initialized")
	}

	if s3Bucket == "" {
		log.Println("[UploadToS3] ERROR: S3 bucket is empty")
		return "", fmt.Errorf("S3 bucket not configured")
	}

	log.Printf("[UploadToS3] S3 Client initialized, Bucket: %s", s3Bucket)
	log.Printf("[UploadToS3] Creating PutObject request...")

	// Note: ACL removed because modern S3 buckets use bucket policies instead
	putObjectInput := &s3.PutObjectInput{
		Bucket:      aws.String(s3Bucket),
		Key:         aws.String(key),
		Body:        bytes.NewReader(fileData),
		ContentType: aws.String(contentType),
		// ACL removed - bucket should have public-read policy configured
	}

	log.Printf("[UploadToS3] Executing PutObject to S3...")
	putStart := time.Now()
	_, err := s3Client.PutObject(putObjectInput)
	putDuration := time.Since(putStart)

	if err != nil {
		log.Printf("[UploadToS3] ERROR uploading to S3: %v (took %v)", err, putDuration)
		return "", fmt.Errorf("S3 upload failed: %w", err)
	}

	// Return public URL
	url := fmt.Sprintf("https://%s.s3.amazonaws.com/%s", s3Bucket, key)
	totalDuration := time.Since(startTime)
	log.Printf("[UploadToS3] ===== Upload successful in %v =====", totalDuration)
	log.Printf("[UploadToS3] PutObject took: %v, Total: %v", putDuration, totalDuration)
	log.Printf("[UploadToS3] Final URL: %s", url)
	return url, nil
}

func DeleteFromS3(key string) error {
	if s3Client == nil {
		return fmt.Errorf("S3 not initialized")
	}

	_, err := s3Client.DeleteObject(&s3.DeleteObjectInput{
		Bucket: aws.String(s3Bucket),
		Key:    aws.String(key),
	})

	return err
}

func GetS3URL(key string) string {
	if s3Bucket == "" {
		return ""
	}
	return fmt.Sprintf("https://%s.s3.amazonaws.com/%s", s3Bucket, key)
}
