package handlers

import (
	"net/http"

	"xinxun-news/internal/database"
	"xinxun-news/internal/models"
	"xinxun-news/internal/repository"
	"xinxun-news/internal/services"

	"github.com/gin-gonic/gin"
)

type PublisherHandler struct {
	userRepo *repository.UserRepository
	newsRepo *repository.NewsRepository
}

func NewPublisherHandler() *PublisherHandler {
	return &PublisherHandler{
		userRepo: repository.NewUserRepository(),
		newsRepo: repository.NewNewsRepository(),
	}
}

type PublisherLoginRequest struct {
	Number   string `json:"number" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
}

func (h *PublisherHandler) Login(c *gin.Context) {
	var req PublisherLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate number starts with 8
	if len(req.Number) == 0 || req.Number[0] != '8' {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nomor telepon harus dimulai dengan 8"})
		return
	}

	// Login to xinxun.us API
	xinxunResp, err := services.LoginXinxun(req.Number, req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to xinxun.us"})
		return
	}

	if !xinxunResp.Success {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": xinxunResp.Message,
			"data":    nil,
		})
		return
	}

	// Check if user exists by xinxun_number
	user, err := h.userRepo.FindByXinxunNumber(req.Number)
	if err != nil {
		// User doesn't exist by xinxun_number, check if username already exists
		username := "publisher_" + req.Number
		existingUser, usernameErr := h.userRepo.FindByUsername(username)
		
		if usernameErr == nil && existingUser != nil {
			// Username exists but xinxun_number doesn't match - update the existing user
			user = existingUser
			user.XinxunNumber = req.Number
			xinxunID := uint(xinxunResp.Data.ID)
			user.XinxunID = &xinxunID
			user.Name = xinxunResp.Data.Name
			user.Balance = xinxunResp.Data.Balance
			user.Status = xinxunResp.Data.Status
			user.ReffCode = xinxunResp.Data.ReffCode
			// Update password
			hashedPassword, _ := services.HashPassword(req.Password)
			user.PasswordHash = hashedPassword
			if err := h.userRepo.Update(user); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
				return
			}
		} else {
			// User doesn't exist at all, create new publisher
			hashedPassword, _ := services.HashPassword(req.Password)
			xinxunID := uint(xinxunResp.Data.ID)
			user = &models.User{
				Username:     username,
				Name:         xinxunResp.Data.Name,
				Email:        req.Number + "@xinxun.news",
				PasswordHash: hashedPassword,
				UserType:     models.UserTypePublisher,
				XinxunID:     &xinxunID,
				XinxunNumber: req.Number,
				Balance:      xinxunResp.Data.Balance,
				Status:       xinxunResp.Data.Status,
				ReffCode:     xinxunResp.Data.ReffCode,
			}
			if err := h.userRepo.Create(user); err != nil {
				// If still fails due to duplicate, try to find and update
				if existingUser, findErr := h.userRepo.FindByUsername(username); findErr == nil {
					user = existingUser
					user.XinxunNumber = req.Number
					xinxunID := uint(xinxunResp.Data.ID)
					user.XinxunID = &xinxunID
					user.Name = xinxunResp.Data.Name
					user.Balance = xinxunResp.Data.Balance
					user.Status = xinxunResp.Data.Status
					user.ReffCode = xinxunResp.Data.ReffCode
					hashedPassword, _ := services.HashPassword(req.Password)
					user.PasswordHash = hashedPassword
					if updateErr := h.userRepo.Update(user); updateErr != nil {
						c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create/update user"})
						return
					}
				} else {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
					return
				}
			}
		}
	} else {
		// User exists, update user data from xinxun
		user.Name = xinxunResp.Data.Name
		user.Balance = xinxunResp.Data.Balance
		user.Status = xinxunResp.Data.Status
		user.ReffCode = xinxunResp.Data.ReffCode
		xinxunID := uint(xinxunResp.Data.ID)
		user.XinxunID = &xinxunID
		// Update password if provided
		if req.Password != "" {
			hashedPassword, _ := services.HashPassword(req.Password)
			user.PasswordHash = hashedPassword
		}
		if err := h.userRepo.Update(user); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
			return
		}
	}

	// Generate JWT token
	token, err := services.GenerateToken(user.ID, string(user.UserType))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Login berhasil",
		"data": gin.H{
			"token": token,
			"user": gin.H{
				"id":            user.ID,
				"username":      user.Username,
				"name":          user.Name,
				"email":         user.Email,
				"user_type":     user.UserType,
				"xinxun_id":     user.XinxunID,
				"xinxun_number": user.XinxunNumber,
				"balance":       user.Balance,
				"status":        user.Status,
				"reff_code":     user.ReffCode,
			},
		},
	})
}

// GetPublisherStatistics gets dashboard statistics for publisher
func (h *PublisherHandler) GetPublisherStatistics(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var stats struct {
		TotalPublished int64         `json:"total_published"`
		TotalPending   int64         `json:"total_pending"`
		TotalDraft     int64         `json:"total_draft"`
		TotalRejected  int64         `json:"total_rejected"`
		TotalViews     int64         `json:"total_views"`
		TopNews        []models.News `json:"top_news"`
	}

	// Count by status for this publisher
	database.DB.Model(&models.News{}).
		Where("author_id = ? AND status = ?", userID, models.StatusPublished).
		Count(&stats.TotalPublished)
	database.DB.Model(&models.News{}).
		Where("author_id = ? AND status = ?", userID, models.StatusPending).
		Count(&stats.TotalPending)
	database.DB.Model(&models.News{}).
		Where("author_id = ? AND status = ?", userID, models.StatusDraft).
		Count(&stats.TotalDraft)
	database.DB.Model(&models.News{}).
		Where("author_id = ? AND status = ?", userID, models.StatusRejected).
		Count(&stats.TotalRejected)

	// Total views for this publisher
	database.DB.Model(&models.News{}).
		Where("author_id = ?", userID).
		Select("COALESCE(SUM(views), 0)").Scan(&stats.TotalViews)

	// Top 5 news by views for this publisher
	var topNews []models.News
	database.DB.Where("author_id = ? AND status = ?", userID, models.StatusPublished).
		Preload("Category").Preload("Author").
		Order("views DESC").Limit(5).Find(&topNews)
	stats.TopNews = topNews

	c.JSON(http.StatusOK, gin.H{"data": stats})
}
