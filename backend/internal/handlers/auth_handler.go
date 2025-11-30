package handlers

import (
	"net/http"

	"xinxun-news/internal/repository"
	"xinxun-news/internal/services"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	userRepo *repository.UserRepository
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		userRepo: repository.NewUserRepository(),
	}
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userRepo.FindByUsername(req.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Username atau password salah"})
		return
	}

	if !services.CheckPasswordHash(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Username atau password salah"})
		return
	}

	token, err := services.GenerateToken(user.ID, string(user.UserType))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghasilkan token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":        user.ID,
			"username":  user.Username,
			"name":      user.Name,
			"email":     user.Email,
			"user_type": user.UserType,
		},
	})
}
