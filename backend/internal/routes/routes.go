package routes

import (
	"log"
	"os"
	"time"
	"xinxun-news/internal/handlers"
	"xinxun-news/internal/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRoutes() *gin.Engine {
	r := gin.Default()

	// CORS configuration
	config := cors.DefaultConfig()
	corsOrigin := os.Getenv("CORS_ORIGIN")
	if corsOrigin == "" {
		corsOrigin = "http://localhost:3000"
	}
	// Allow multiple origins for development and production
	config.AllowOrigins = []string{
		corsOrigin,
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"http://0.0.0.0:3000",
		"https://news.xinxun.us",
	}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"}
	config.AllowHeaders = []string{
		"Origin",
		"Content-Type",
		"Authorization",
		"Accept",
		"X-Requested-With",
		"Access-Control-Request-Method",
		"Access-Control-Request-Headers",
	}
	config.AllowCredentials = true
	config.ExposeHeaders = []string{"Content-Length", "Content-Type"}
	config.MaxAge = 12 * time.Hour
	r.Use(cors.New(config))

	// Log CORS config for debugging
	log.Printf("CORS configured - Allowed Origins: %v", config.AllowOrigins)

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "Backend is running"})
	})

	// Public routes - Changed from /api to /v1
	v1 := r.Group("/v1")
	{
		newsHandler := handlers.NewNewsHandler()
		categoryHandler := handlers.NewCategoryHandler()
		tagHandler := handlers.NewTagHandler()

		// News routes
		v1.GET("/news", newsHandler.GetNews)
		v1.GET("/news/featured", newsHandler.GetFeaturedNews)
		v1.GET("/news/search", newsHandler.SearchNews)
		v1.GET("/categories", categoryHandler.GetCategories)
		v1.GET("/tags", tagHandler.GetTags)

		// Xinxun integration endpoint
		v1.GET("/xinxun/newest", newsHandler.GetNewestNews)

		// News detail by slug - Must be last to avoid route conflicts
		// Changed from /news/:slug to /:slug
		v1.GET("/:slug", newsHandler.GetNewsBySlug)
	}

	// Publisher routes (public) - Changed from /api to /v1
	v1.POST("/publisher/login", handlers.NewPublisherHandler().Login)

	// Admin routes (protected) - Changed from /api/admin to /v1/admin
	admin := v1.Group("/admin")
	{
		authHandler := handlers.NewAuthHandler()
		newsHandler := handlers.NewNewsHandler()
		adminHandler := handlers.NewAdminHandler()
		userHandler := handlers.NewUserHandler()

		admin.POST("/login", authHandler.Login)
		admin.POST("/upload", middleware.AuthMiddleware(), handlers.UploadImage)

		// User profile management
		adminProfile := admin.Group("/profile")
		adminProfile.Use(middleware.AuthMiddleware())
		{
			adminProfile.GET("", userHandler.GetProfile)
			adminProfile.PUT("", userHandler.UpdateProfile)
		}

		// Publisher management (admin only)
		adminPublishers := admin.Group("/publishers")
		adminPublishers.Use(middleware.AuthMiddleware())
		{
			adminPublishers.GET("", userHandler.GetAllPublishers)
			adminPublishers.GET("/:id", userHandler.GetPublisher)
			adminPublishers.PUT("/:id", userHandler.UpdatePublisher)
			adminPublishers.DELETE("/:id", userHandler.DeletePublisher)
		}

		// Category management (admin only)
		categoryHandler := handlers.NewCategoryHandler()
		adminCategories := admin.Group("/categories")
		adminCategories.Use(middleware.AuthMiddleware())
		{
			adminCategories.GET("", categoryHandler.GetCategories)
			adminCategories.POST("", categoryHandler.CreateCategory)
			adminCategories.PUT("/:id", categoryHandler.UpdateCategory)
			adminCategories.DELETE("/:id", categoryHandler.DeleteCategory)
		}

		adminNews := admin.Group("/news")
		adminNews.Use(middleware.AuthMiddleware())
		{
			adminNews.GET("", newsHandler.GetNews) // Admin can see all statuses
			adminNews.POST("", newsHandler.CreateNews)
			adminNews.PUT("/:id", newsHandler.UpdateNews)
			adminNews.DELETE("/:id", newsHandler.DeleteNews)
			adminNews.POST("/:id/approve", adminHandler.ApproveNews)
			adminNews.POST("/:id/reject", adminHandler.RejectNews)
			adminNews.GET("/pending", adminHandler.GetPendingNews)
			adminNews.GET("/pending/revisions", adminHandler.GetPendingRevisions)
			adminNews.GET("/pending/counts", adminHandler.GetPendingCounts)
			adminNews.GET("/statistics", adminHandler.GetStatistics)
		}

		// Tag management (admin only)
		tagHandler := handlers.NewTagHandler()
		adminTags := admin.Group("/tags")
		adminTags.Use(middleware.AuthMiddleware())
		{
			adminTags.GET("", tagHandler.GetTags)
			adminTags.POST("", tagHandler.CreateTag)
			adminTags.PUT("/:id", tagHandler.UpdateTag)
			adminTags.DELETE("/:id", tagHandler.DeleteTag)
		}
	}

	// Publisher routes (protected) - Changed from /api/publisher to /v1/publisher
	publisher := v1.Group("/publisher")
	publisher.Use(middleware.AuthMiddleware())
	{
		newsHandler := handlers.NewNewsHandler()
		publisherHandler := handlers.NewPublisherHandler()
		publisher.POST("/news", newsHandler.CreateNews)
		publisher.PUT("/news/:id", newsHandler.UpdateNews)
		publisher.GET("/statistics", publisherHandler.GetPublisherStatistics)
	}

	return r
}
