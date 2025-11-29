package database

import (
	"fmt"
	"log"

	"xinxun-news/internal/config"
	"xinxun-news/internal/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		config.AppConfig.DBUser,
		config.AppConfig.DBPassword,
		config.AppConfig.DBHost,
		config.AppConfig.DBPort,
		config.AppConfig.DBName,
	)

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connected successfully")
}

func Migrate() {
	// Use AutoMigrate which safely adds new columns without dropping existing data
	err := DB.AutoMigrate(
		&models.User{},
		&models.Category{},
		&models.Tag{},
		&models.News{},
	)

	if err != nil {
		log.Printf("Warning: Migration error (may be safe to ignore if columns already exist): %v", err)
		// Don't fatal, just log - allows app to continue if migration partially fails
		// This is safer for production where we don't want to drop data
	} else {
		log.Println("Database migrated successfully")
	}
	
	// Manually add revision_of column if it doesn't exist (safe migration)
	if !DB.Migrator().HasColumn(&models.News{}, "revision_of") {
		log.Println("Adding revision_of column to news table...")
		if err := DB.Migrator().AddColumn(&models.News{}, "revision_of"); err != nil {
			log.Printf("Warning: Could not add revision_of column: %v", err)
		} else {
			log.Println("revision_of column added successfully")
		}
	}
}

