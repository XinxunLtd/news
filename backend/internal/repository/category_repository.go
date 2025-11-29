package repository

import (
	"xinxun-news/internal/database"
	"xinxun-news/internal/models"
)

type CategoryRepository struct{}

func NewCategoryRepository() *CategoryRepository {
	return &CategoryRepository{}
}

func (r *CategoryRepository) FindAll() ([]models.Category, error) {
	var categories []models.Category
	err := database.DB.Find(&categories).Error
	return categories, err
}

// FindAllForUser returns categories based on user type
func (r *CategoryRepository) FindAllForUser(isAdmin bool) ([]models.Category, error) {
	var categories []models.Category
	query := database.DB
	if !isAdmin {
		// Publisher can only see non-admin-only categories
		query = query.Where("is_admin_only = ?", false)
	}
	err := query.Find(&categories).Error
	return categories, err
}

func (r *CategoryRepository) FindBySlug(slug string) (*models.Category, error) {
	var category models.Category
	err := database.DB.Where("slug = ?", slug).First(&category).Error
	return &category, err
}

func (r *CategoryRepository) FindByID(id uint) (*models.Category, error) {
	var category models.Category
	err := database.DB.First(&category, id).Error
	return &category, err
}

func (r *CategoryRepository) Create(category *models.Category) error {
	return database.DB.Create(category).Error
}

func (r *CategoryRepository) Update(category *models.Category) error {
	return database.DB.Save(category).Error
}

func (r *CategoryRepository) Delete(id uint) error {
	return database.DB.Delete(&models.Category{}, id).Error
}

