package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"xinxun-news/internal/models"
	"xinxun-news/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/gosimple/slug"
)

type NewsHandler struct {
	newsRepo     *repository.NewsRepository
	categoryRepo *repository.CategoryRepository
}

func NewNewsHandler() *NewsHandler {
	return &NewsHandler{
		newsRepo:     repository.NewNewsRepository(),
		categoryRepo: repository.NewCategoryRepository(),
	}
}

func (h *NewsHandler) GetNews(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	search := c.Query("q")
	category := c.Query("category")

	if limit > 100 {
		limit = 100
	}
	if limit < 1 {
		limit = 10
	}
	if page < 1 {
		page = 1
	}

	offset := (page - 1) * limit

	// For public, only show published. For admin/publisher, show all statuses
	var status *models.NewsStatus
	_, exists := c.Get("user_id")
	if !exists {
		// Public access - only published
		published := models.StatusPublished
		status = &published
	}
	// If user is authenticated (admin/publisher), status is nil = show all

	news, total, err := h.newsRepo.FindAll(limit, offset, search, category, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": news,
		"meta": gin.H{
			"total": total,
			"page":  page,
			"limit": limit,
			"pages": (int(total) + limit - 1) / limit,
		},
	})
}

// GetFeaturedNews gets top viewed news for featured slider
func (h *NewsHandler) GetFeaturedNews(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "5"))
	if limit < 3 {
		limit = 3
	}
	if limit > 5 {
		limit = 5
	}

	news, err := h.newsRepo.FindTopViews(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": news})
}

// GetNewestNews gets 3 newest published news for xinxun.us integration
func (h *NewsHandler) GetNewestNews(c *gin.Context) {
	news, err := h.newsRepo.FindNewest(3)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch news",
			"data":    nil,
		})
		return
	}

	// Format response according to requirements
	type NewsItem struct {
		Title      string `json:"title"`
		Excerpt    string `json:"excerpt"`
		Thumbnail  string `json:"thumbnail"`
		Category   string `json:"categories"`
		TotalViews int    `json:"views"`
		Href       string `json:"href"`
	}

	var result []NewsItem
	baseURL := "https://news.xinxun.us"
	for _, item := range news {
		result = append(result, NewsItem{
			Title:      item.Title,
			Excerpt:    item.Excerpt,
			Thumbnail:  item.Thumbnail,
			Category:   item.Category.Name,
			TotalViews: item.Views,
			Href:       baseURL + "/" + item.Slug,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Successfully",
		"data":    result,
	})
}

func (h *NewsHandler) GetNewsBySlug(c *gin.Context) {
	slug := c.Param("slug")

	// Exclude reserved paths that should not be treated as news slugs
	reservedPaths := map[string]bool{
		"news":       true,
		"categories": true,
		"tags":       true,
		"xinxun":     true,
		"admin":      true,
		"publisher":  true,
		"health":     true,
	}
	if reservedPaths[slug] {
		c.JSON(http.StatusNotFound, gin.H{"error": "News not found"})
		return
	}

	news, err := h.newsRepo.FindBySlug(slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "News not found"})
		return
	}

	// Increment views
	go h.newsRepo.IncrementViews(news.ID)

	c.JSON(http.StatusOK, gin.H{"data": news})
}

func (h *NewsHandler) SearchNews(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter 'q' is required"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))

	if limit > 100 {
		limit = 100
	}
	if page < 1 {
		page = 1
	}

	offset := (page - 1) * limit

	news, total, err := h.newsRepo.FindAll(limit, offset, query, "", nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": news,
		"meta": gin.H{
			"total": total,
			"page":  page,
			"limit": limit,
			"pages": (int(total) + limit - 1) / limit,
		},
	})
}

type CreateNewsRequest struct {
	Title      string `json:"title" binding:"required"`
	Content    string `json:"content" binding:"required"`
	Excerpt    string `json:"excerpt" binding:"required"`
	Thumbnail  string `json:"thumbnail" binding:"required"`
	CategoryID uint   `json:"category_id" binding:"required"`
	TagIDs     []uint `json:"tag_ids"`
	Status     string `json:"status"`
}

func (h *NewsHandler) CreateNews(c *gin.Context) {
	var req CreateNewsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	userType, _ := c.Get("user_type")

	// Validate title length (max 100 words)
	titleWords := strings.Fields(strings.TrimSpace(req.Title))
	if len(titleWords) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title must not exceed 100 words"})
		return
	}

	// Validate excerpt length (max 200 words)
	excerptWords := strings.Fields(strings.TrimSpace(req.Excerpt))
	if len(excerptWords) > 200 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Excerpt must not exceed 200 words"})
		return
	}

	// Validate category access for publisher - publisher cannot use admin-only categories
	if userType == string(models.UserTypePublisher) {
		category, err := h.categoryRepo.FindByID(req.CategoryID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Category not found"})
			return
		}
		if category.IsAdminOnly {
			c.JSON(http.StatusForbidden, gin.H{"error": "This category is restricted to admin only. Only admin can publish news with this category."})
			return
		}
	}

	newsSlug := slug.Make(req.Title)
	// Ensure unique slug
	existing, _ := h.newsRepo.FindBySlug(newsSlug)
	if existing != nil {
		newsSlug = newsSlug + "-" + strconv.FormatInt(time.Now().Unix(), 10)
	}

	// Publisher news goes to pending, admin can publish directly
	status := models.StatusDraft
	var publishedAt *time.Time
	if userType == string(models.UserTypeAdmin) {
		if req.Status == "published" {
			status = models.StatusPublished
			now := time.Now()
			publishedAt = &now
		}
	} else if userType == string(models.UserTypePublisher) {
		// Publisher news must be approved by admin
		status = models.StatusPending
	}

	news := &models.News{
		Title:       req.Title,
		Slug:        newsSlug,
		Content:     req.Content,
		Excerpt:     req.Excerpt,
		Thumbnail:   req.Thumbnail,
		CategoryID:  req.CategoryID,
		AuthorID:    userID.(uint),
		Status:      status,
		PublishedAt: publishedAt,
	}

	if len(req.TagIDs) > 0 {
		var tags []models.Tag
		for _, tagID := range req.TagIDs {
			tags = append(tags, models.Tag{ID: tagID})
		}
		news.Tags = tags
	}

	if err := h.newsRepo.Create(news); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with relations
	createdNews, err := h.newsRepo.FindByID(news.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": createdNews})
}

type UpdateNewsRequest struct {
	Title      string `json:"title"`
	Content    string `json:"content"`
	Excerpt    string `json:"excerpt"`
	Thumbnail  string `json:"thumbnail"`
	CategoryID uint   `json:"category_id"`
	TagIDs     []uint `json:"tag_ids"`
	Status     string `json:"status"`
}

func (h *NewsHandler) UpdateNews(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	news, err := h.newsRepo.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "News not found"})
		return
	}

	userID, _ := c.Get("user_id")
	userType, _ := c.Get("user_type")

	// Check if user owns this news (for publisher)
	if userType == string(models.UserTypePublisher) && news.AuthorID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only edit your own news"})
		return
	}

	var req UpdateNewsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// If publisher is editing a published news, create a new revision instead of updating directly
	if userType == string(models.UserTypePublisher) && news.Status == models.StatusPublished {
		// Create new revision with pending status
		newsSlug := slug.Make(req.Title)
		if req.Title == "" {
			newsSlug = news.Slug
		}
		// Ensure unique slug
		existing, _ := h.newsRepo.FindBySlug(newsSlug)
		if existing != nil && existing.ID != news.ID {
			newsSlug = newsSlug + "-" + strconv.FormatInt(time.Now().Unix(), 10)
		}

		// Use provided values or fallback to original
		revisionTitle := req.Title
		if revisionTitle == "" {
			revisionTitle = news.Title
		}
		revisionContent := req.Content
		if revisionContent == "" {
			revisionContent = news.Content
		}
		revisionExcerpt := req.Excerpt
		if revisionExcerpt == "" {
			revisionExcerpt = news.Excerpt
		}
		revisionThumbnail := req.Thumbnail
		if revisionThumbnail == "" {
			revisionThumbnail = news.Thumbnail
		}
		revisionCategoryID := req.CategoryID
		if revisionCategoryID == 0 {
			revisionCategoryID = news.CategoryID
		}

		revision := &models.News{
			Title:      revisionTitle,
			Slug:       newsSlug,
			Content:    revisionContent,
			Excerpt:    revisionExcerpt,
			Thumbnail:  revisionThumbnail,
			CategoryID: revisionCategoryID,
			AuthorID:   news.AuthorID,
			Status:     models.StatusPending,
			RevisionOf: &news.ID, // Link to original
		}

		// Validate category access
		if req.CategoryID > 0 {
			category, err := h.categoryRepo.FindByID(req.CategoryID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Category not found"})
				return
			}
			if category.IsAdminOnly {
				c.JSON(http.StatusForbidden, gin.H{"error": "This category is restricted to admin only"})
				return
			}
		}

		// Validate title length
		if req.Title != "" {
			titleWords := strings.Fields(strings.TrimSpace(req.Title))
			if len(titleWords) > 100 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Title must not exceed 100 words"})
				return
			}
		}

		// Validate excerpt length
		if req.Excerpt != "" {
			excerptWords := strings.Fields(strings.TrimSpace(req.Excerpt))
			if len(excerptWords) > 200 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Excerpt must not exceed 200 words"})
				return
			}
		}

		// Set tags
		if len(req.TagIDs) > 0 {
			var tags []models.Tag
			for _, tagID := range req.TagIDs {
				tags = append(tags, models.Tag{ID: tagID})
			}
			revision.Tags = tags
		} else {
			// Copy tags from original
			revision.Tags = news.Tags
		}

		if err := h.newsRepo.Create(revision); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Reload with relations
		createdRevision, err := h.newsRepo.FindByID(revision.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "Revision created. Waiting for admin approval.",
			"data":    createdRevision,
		})
		return
	}

	if req.Title != "" {
		// Validate title length (max 100 words)
		titleWords := strings.Fields(strings.TrimSpace(req.Title))
		if len(titleWords) > 100 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Title must not exceed 100 words"})
			return
		}
		news.Title = req.Title
		news.Slug = slug.Make(req.Title)
	}
	if req.Content != "" {
		news.Content = req.Content
	}
	if req.Excerpt != "" {
		// Validate excerpt length (max 200 words)
		excerptWords := strings.Fields(strings.TrimSpace(req.Excerpt))
		if len(excerptWords) > 200 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Excerpt must not exceed 200 words"})
			return
		}
		news.Excerpt = req.Excerpt
	}
	if req.Thumbnail != "" {
		news.Thumbnail = req.Thumbnail
	}
	if req.CategoryID > 0 {
		// Validate category access for publisher - publisher cannot use admin-only categories
		userType, _ := c.Get("user_type")
		if userType == string(models.UserTypePublisher) {
			category, err := h.categoryRepo.FindByID(req.CategoryID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Category not found"})
				return
			}
			if category.IsAdminOnly {
				c.JSON(http.StatusForbidden, gin.H{"error": "This category is restricted to admin only. Only admin can publish news with this category."})
				return
			}
		}
		news.CategoryID = req.CategoryID
	}
	if req.Status != "" {
		if req.Status == "published" {
			news.Status = models.StatusPublished
			if news.PublishedAt == nil {
				now := time.Now()
				news.PublishedAt = &now
			}
		} else {
			news.Status = models.StatusDraft
		}
	}
	if len(req.TagIDs) > 0 {
		var tags []models.Tag
		for _, tagID := range req.TagIDs {
			tags = append(tags, models.Tag{ID: tagID})
		}
		news.Tags = tags
	}

	if err := h.newsRepo.Update(news); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": news})
}

func (h *NewsHandler) DeleteNews(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	if err := h.newsRepo.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "News deleted successfully"})
}
