package handlers

import (
	"net/http"
	"strconv"
	"time"

	"xinxun-news/internal/database"
	"xinxun-news/internal/models"
	"xinxun-news/internal/repository"
	"xinxun-news/internal/services"

	"github.com/gin-gonic/gin"
)

type AdminHandler struct {
	newsRepo *repository.NewsRepository
	userRepo *repository.UserRepository
}

func NewAdminHandler() *AdminHandler {
	return &AdminHandler{
		newsRepo: repository.NewNewsRepository(),
		userRepo: repository.NewUserRepository(),
	}
}

type ApproveNewsRequest struct {
	RewardAmount float64 `json:"reward_amount"`
}

// ApproveNews approves a pending news and gives reward to publisher
func (h *AdminHandler) ApproveNews(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	news, err := h.newsRepo.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "News not found"})
		return
	}

	if news.Status != models.StatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "News is not pending approval"})
		return
	}

	var req ApproveNewsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get author (publisher)
	author, err := h.userRepo.FindByID(news.AuthorID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Author not found"})
		return
	}

	// Check if author is publisher
	if author.UserType != models.UserTypePublisher {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only publisher news can be approved"})
		return
	}

	// Check if xinxun_id exists
	if author.XinxunID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Publisher does not have xinxun_id"})
		return
	}

	// If this is a revision, update the original news instead
	if news.RevisionOf != nil {
		originalNews, err := h.newsRepo.FindByID(*news.RevisionOf)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Original news not found"})
			return
		}

		// Update original with revision data
		originalNews.Title = news.Title
		originalNews.Slug = news.Slug
		originalNews.Content = news.Content
		originalNews.Excerpt = news.Excerpt
		originalNews.Thumbnail = news.Thumbnail
		originalNews.CategoryID = news.CategoryID
		originalNews.Tags = news.Tags
		originalNews.RewardAmount = req.RewardAmount
		now := time.Now()
		originalNews.PublishedAt = &now
		originalNews.Status = models.StatusPublished

		if err := h.newsRepo.Update(originalNews); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Delete the revision
		if err := h.newsRepo.Delete(news.ID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Reload original with relations
		updatedOriginal, err := h.newsRepo.FindByID(originalNews.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Send reward
		if req.RewardAmount > 0 && !updatedOriginal.IsRewarded && author.XinxunID != nil {
			rewardResp, err := services.SendReward(*author.XinxunID, req.RewardAmount)
			if err != nil {
				c.JSON(http.StatusOK, gin.H{
					"message": "News approved but reward failed",
					"error":   err.Error(),
					"data":    updatedOriginal,
				})
				return
			}

			if rewardResp.Success {
				updatedOriginal.IsRewarded = true
				h.newsRepo.Update(updatedOriginal)
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Revision approved and original news updated successfully",
			"data":    updatedOriginal,
		})
		return
	}

	// Regular approval (not a revision)
	news.Status = models.StatusPublished
	news.RewardAmount = req.RewardAmount
	now := time.Now()
	news.PublishedAt = &now

	if err := h.newsRepo.Update(news); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Send reward to publisher via xinxun.us API
	// Use xinxun_id from user (which is the ID from xinxun.us API)
	if req.RewardAmount > 0 && !news.IsRewarded && author.XinxunID != nil {
		rewardResp, err := services.SendReward(*author.XinxunID, req.RewardAmount)
		if err != nil {
			// Log error but don't fail the approval
			c.JSON(http.StatusOK, gin.H{
				"message": "News approved but reward failed",
				"error":   err.Error(),
				"data":    news,
			})
			return
		}

		if rewardResp.Success {
			news.IsRewarded = true
			h.newsRepo.Update(news)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "News approved successfully",
		"data":    news,
	})
}

// RejectNews rejects a pending news
func (h *AdminHandler) RejectNews(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	news, err := h.newsRepo.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "News not found"})
		return
	}

	if news.Status != models.StatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "News is not pending approval"})
		return
	}

	news.Status = models.StatusRejected
	if err := h.newsRepo.Update(news); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "News rejected",
		"data":    news,
	})
}

// GetPendingNews gets all pending news for admin review
func (h *AdminHandler) GetPendingNews(c *gin.Context) {
	pending := models.StatusPending
	news, total, err := h.newsRepo.FindAll(100, 0, "", "", &pending)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": news,
		"meta": gin.H{
			"total": total,
		},
	})
}

// GetStatistics gets dashboard statistics for admin
func (h *AdminHandler) GetStatistics(c *gin.Context) {
	var stats struct {
		TotalPublished  int64         `json:"total_published"`
		TotalPending    int64         `json:"total_pending"`
		TotalDraft      int64         `json:"total_draft"`
		TotalRejected   int64         `json:"total_rejected"`
		TotalViews      int64         `json:"total_views"`
		TotalPublishers int64         `json:"total_publishers"`
		TopNews         []models.News `json:"top_news"`
	}

	// Count by status
	database.DB.Model(&models.News{}).Where("status = ?", models.StatusPublished).Count(&stats.TotalPublished)
	database.DB.Model(&models.News{}).Where("status = ?", models.StatusPending).Count(&stats.TotalPending)
	database.DB.Model(&models.News{}).Where("status = ?", models.StatusDraft).Count(&stats.TotalDraft)
	database.DB.Model(&models.News{}).Where("status = ?", models.StatusRejected).Count(&stats.TotalRejected)

	// Total views
	database.DB.Model(&models.News{}).Select("COALESCE(SUM(views), 0)").Scan(&stats.TotalViews)

	// Total publishers
	database.DB.Model(&models.User{}).Where("user_type = ?", models.UserTypePublisher).Count(&stats.TotalPublishers)

	// Top 5 news by views
	var allPublished []models.News
	database.DB.Where("status = ?", models.StatusPublished).
		Preload("Category").Preload("Author").
		Order("views DESC").Limit(5).Find(&allPublished)
	stats.TopNews = allPublished

	c.JSON(http.StatusOK, gin.H{"data": stats})
}
