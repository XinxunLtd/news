package handlers

import (
	"net/http"
	"strconv"

	"xinxun-news/internal/database"
	"xinxun-news/internal/models"
	"xinxun-news/internal/repository"
	"xinxun-news/internal/services"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userRepo *repository.UserRepository
}

func NewUserHandler() *UserHandler {
	return &UserHandler{
		userRepo: repository.NewUserRepository(),
	}
}

type UpdateProfileRequest struct {
	Username string `json:"username"`
	Name     string `json:"name"`
	Password string `json:"password"`
}

// UpdateProfile updates current user's profile (username, name, password)
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")

	user, err := h.userRepo.FindByID(userID.(uint))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Username != "" {
		// Check if username already exists (except current user)
		existing, _ := h.userRepo.FindByUsername(req.Username)
		if existing != nil && existing.ID != user.ID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Username already exists"})
			return
		}
		user.Username = req.Username
	}

	if req.Name != "" {
		user.Name = req.Name
	}

	if req.Password != "" {
		if len(req.Password) < 6 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 6 characters"})
			return
		}
		hashedPassword, err := services.HashPassword(req.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		user.PasswordHash = hashedPassword
	}

	if err := h.userRepo.Update(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"data": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"name":     user.Name,
			"email":    user.Email,
			"user_type": user.UserType,
		},
	})
}

// GetProfile gets current user's profile
func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")

	user, err := h.userRepo.FindByID(userID.(uint))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"id":           user.ID,
			"username":     user.Username,
			"name":         user.Name,
			"email":        user.Email,
			"user_type":    user.UserType,
			"xinxun_id":    user.XinxunID,
			"xinxun_number": user.XinxunNumber,
			"balance":      user.Balance,
			"status":       user.Status,
			"reff_code":    user.ReffCode,
			"created_at":   user.CreatedAt,
		},
	})
}

// GetAllPublishers gets all publishers (admin only)
func (h *UserHandler) GetAllPublishers(c *gin.Context) {
	// Get user type to check if admin
	userType, exists := c.Get("user_type")
	if !exists || userType != string(models.UserTypeAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	// Get all publishers
	var publishers []models.User
	err := database.DB.Where("user_type = ?", models.UserTypePublisher).Find(&publishers).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": publishers,
	})
}

// GetPublisher gets a single publisher by ID (admin only)
func (h *UserHandler) GetPublisher(c *gin.Context) {
	// Check if admin
	userType, exists := c.Get("user_type")
	if !exists || userType != string(models.UserTypeAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	publisher, err := h.userRepo.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Publisher not found"})
		return
	}

	if publisher.UserType != models.UserTypePublisher {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User is not a publisher"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": publisher})
}

type UpdatePublisherRequest struct {
	Username string  `json:"username"`
	Name     string  `json:"name"`
	Password string  `json:"password"`
	Status   string  `json:"status"`
	Balance  float64 `json:"balance"`
}

// UpdatePublisher updates a publisher (admin only)
func (h *UserHandler) UpdatePublisher(c *gin.Context) {
	// Check if admin
	userType, exists := c.Get("user_type")
	if !exists || userType != string(models.UserTypeAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	publisher, err := h.userRepo.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Publisher not found"})
		return
	}

	if publisher.UserType != models.UserTypePublisher {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User is not a publisher"})
		return
	}

	var req UpdatePublisherRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Username != "" {
		// Check if username already exists (except current user)
		existing, _ := h.userRepo.FindByUsername(req.Username)
		if existing != nil && existing.ID != publisher.ID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Username already exists"})
			return
		}
		publisher.Username = req.Username
	}

	if req.Name != "" {
		publisher.Name = req.Name
	}

	if req.Password != "" {
		if len(req.Password) < 6 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 6 characters"})
			return
		}
		hashedPassword, err := services.HashPassword(req.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		publisher.PasswordHash = hashedPassword
	}

	if req.Status != "" {
		publisher.Status = req.Status
	}

	if req.Balance >= 0 {
		publisher.Balance = req.Balance
	}

	if err := h.userRepo.Update(publisher); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Publisher updated successfully",
		"data":    publisher,
	})
}

// DeletePublisher deletes a publisher (admin only)
func (h *UserHandler) DeletePublisher(c *gin.Context) {
	// Check if admin
	userType, exists := c.Get("user_type")
	if !exists || userType != string(models.UserTypeAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	publisher, err := h.userRepo.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Publisher not found"})
		return
	}

	if publisher.UserType != models.UserTypePublisher {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User is not a publisher"})
		return
	}

	// Soft delete
	if err := database.DB.Delete(publisher).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Publisher deleted successfully"})
}

