package middleware

import (
	"net/http"
	"strings"

	"xinxun-news/internal/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Header Authorization wajib diisi"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Format header Authorization tidak valid"})
			c.Abort()
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(config.AppConfig.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token claims tidak valid"})
			c.Abort()
			return
		}

		// Safe type assertion with validation
		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token claims user_id tidak valid"})
			c.Abort()
			return
		}

		userType, ok := claims["user_type"].(string)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token claims user_type tidak valid"})
			c.Abort()
			return
		}

		c.Set("user_id", uint(userIDFloat))
		c.Set("user_type", userType)
		c.Next()
	}
}
