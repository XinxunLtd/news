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

type CategoryHandler struct {
	categoryRepo *repository.CategoryRepository
}

func NewCategoryHandler() *CategoryHandler {
	return &CategoryHandler{
		categoryRepo: repository.NewCategoryRepository(),
	}
}

func (h *CategoryHandler) GetCategories(c *gin.Context) {
	// All users (public, publisher, admin) can see all categories
	// The restriction is only on publishing (handled in news creation/update)
	var categories []models.Category
	var err error
	categories, err = h.categoryRepo.FindAll()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": categories})
}

type CreateCategoryRequest struct {
	Name        string `json:"name" binding:"required"`
	IsAdminOnly bool   `json:"is_admin_only"`
	Order       int    `json:"order"` // Urutan tampilan (optional, default akan di-set otomatis)
}

func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	var req CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	categorySlug := slug.Make(req.Name)
	category := &models.Category{
		Name:        req.Name,
		Slug:        categorySlug,
		IsAdminOnly: req.IsAdminOnly,
		Order:       req.Order,
	}

	if err := h.categoryRepo.Create(category); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": category})
}

type UpdateCategoryRequest struct {
	Name        string `json:"name"`
	IsAdminOnly *bool  `json:"is_admin_only"`
	Order       *int   `json:"order"` // Urutan tampilan (optional)
}

func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	category, err := h.categoryRepo.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kategori tidak ditemukan"})
		return
	}

	var req UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name != "" {
		category.Name = req.Name
		category.Slug = slug.Make(req.Name)
	}

	if req.IsAdminOnly != nil {
		category.IsAdminOnly = *req.IsAdminOnly
	}

	if req.Order != nil {
		category.Order = *req.Order
	}

	if err := h.categoryRepo.Update(category); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": category})
}

func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	// Check if category has news
	var count int64
	database.DB.Model(&models.News{}).Where("category_id = ?", id).Count(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tidak dapat menghapus kategori dengan artikel yang ada"})
		return
	}

	if err := h.categoryRepo.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Kategori berhasil dihapus"})
}
