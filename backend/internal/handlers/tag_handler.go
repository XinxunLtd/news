package handlers

import (
	"net/http"
	"strconv"

	"xinxun-news/internal/database"
	"xinxun-news/internal/models"
	"xinxun-news/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/gosimple/slug"
)

type TagHandler struct {
	tagRepo *repository.TagRepository
}

func NewTagHandler() *TagHandler {
	return &TagHandler{
		tagRepo: repository.NewTagRepository(),
	}
}

func (h *TagHandler) GetTags(c *gin.Context) {
	tags, err := h.tagRepo.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": tags})
}

type CreateTagRequest struct {
	Name string `json:"name" binding:"required"`
}

func (h *TagHandler) CreateTag(c *gin.Context) {
	var req CreateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tagSlug := slug.Make(req.Name)
	tag := &models.Tag{
		Name: req.Name,
		Slug: tagSlug,
	}

	if err := h.tagRepo.Create(tag); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": tag})
}

type UpdateTagRequest struct {
	Name string `json:"name"`
}

func (h *TagHandler) UpdateTag(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	tag, err := h.tagRepo.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tag not found"})
		return
	}

	var req UpdateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name != "" {
		tag.Name = req.Name
		tag.Slug = slug.Make(req.Name)
	}

	if err := h.tagRepo.Update(tag); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": tag})
}

func (h *TagHandler) DeleteTag(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	// Check if tag has news
	var count int64
	database.DB.Model(&models.News{}).Joins("JOIN news_tags ON news_tags.news_id = news.id").Where("news_tags.tag_id = ?", id).Count(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete tag with existing news"})
		return
	}

	if err := h.tagRepo.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tag deleted successfully"})
}

