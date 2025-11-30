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

	// Validate phone number format (must start with 8 and have 10-13 digits)
	if len(req.Number) < 10 || len(req.Number) > 13 || req.Number[0] != '8' {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nomor telepon harus dimulai dengan 8 dan memiliki 10-13 digit"})
		return
	}

	// Validate that all characters are digits
	for _, ch := range req.Number {
		if ch < '0' || ch > '9' {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Nomor telepon hanya boleh berisi angka"})
			return
		}
	}

	// Login to xinxun.us API
	xinxunResp, err := services.LoginXinxun(req.Number, req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghubungi xinxun.us"})
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

	// Use FirstOrCreate to handle duplicate gracefully
	username := "publisher_" + req.Number
	hashedPassword, _ := services.HashPassword(req.Password)
	xinxunID := uint(xinxunResp.Data.ID)

	// Prepare user data
	newUser := &models.User{
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

	// Use FirstOrCreate to handle race conditions and duplicates
	user, err := h.userRepo.FirstOrCreate(newUser, username, req.Number)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat/mengupdate pengguna: " + err.Error()})
		return
	}

	// Update user data from xinxun (always update to sync latest data)
	user.Name = xinxunResp.Data.Name
	user.Balance = xinxunResp.Data.Balance
	user.Status = xinxunResp.Data.Status
	user.ReffCode = xinxunResp.Data.ReffCode
	user.XinxunID = &xinxunID
	// Ensure xinxun_number is set
	if user.XinxunNumber == "" {
		user.XinxunNumber = req.Number
	}
	// Update password
	user.PasswordHash = hashedPassword

	if err := h.userRepo.Update(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate pengguna: " + err.Error()})
		return
	}

	// Generate JWT token
	token, err := services.GenerateToken(user.ID, string(user.UserType))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghasilkan token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Login berhasil.",
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
