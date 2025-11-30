package repository

import (
	"xinxun-news/internal/database"
	"xinxun-news/internal/models"

	"gorm.io/gorm"
)

type CategoryRepository struct{}

func NewCategoryRepository() *CategoryRepository {
	return &CategoryRepository{}
}

func (r *CategoryRepository) FindAll() ([]models.Category, error) {
	var categories []models.Category
	err := database.DB.Order("`order` ASC, id ASC").Find(&categories).Error
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
	err := query.Order("`order` ASC, id ASC").Find(&categories).Error
	return categories, err
}

func (r *CategoryRepository) FindBySlug(slug string) (*models.Category, error) {
	var category models.Category
	err := database.DB.Where("slug = ?", slug).First(&category).Error
	return &category, err
}

// FindBySlugUnscoped finds category by slug including soft-deleted ones
func (r *CategoryRepository) FindBySlugUnscoped(slug string) (*models.Category, error) {
	var category models.Category
	err := database.DB.Unscoped().Where("slug = ?", slug).First(&category).Error
	return &category, err
}

func (r *CategoryRepository) FindByID(id uint) (*models.Category, error) {
	var category models.Category
	err := database.DB.First(&category, id).Error
	return &category, err
}

func (r *CategoryRepository) Create(category *models.Category) error {
	// Check if there's a soft-deleted category with the same slug
	existing, err := r.FindBySlugUnscoped(category.Slug)
	if err == nil && existing.DeletedAt.Valid {
		// Restore the soft-deleted category
		existing.Name = category.Name
		existing.IsAdminOnly = category.IsAdminOnly
		if category.Order > 0 {
			existing.Order = category.Order
		} else {
			// If order is 0, set it to max order + 1
			var maxOrder int
			database.DB.Model(&models.Category{}).Select("COALESCE(MAX(`order`), 0)").Scan(&maxOrder)
			existing.Order = maxOrder + 1
		}
		existing.DeletedAt = gorm.DeletedAt{} // Clear DeletedAt to restore
		return database.DB.Unscoped().Save(existing).Error
	}
	// If order is 0, set it to max order + 1
	if category.Order == 0 {
		var maxOrder int
		database.DB.Model(&models.Category{}).Select("COALESCE(MAX(`order`), 0)").Scan(&maxOrder)
		category.Order = maxOrder + 1
	}
	return database.DB.Create(category).Error
}

func (r *CategoryRepository) Update(category *models.Category) error {
	return database.DB.Save(category).Error
}

func (r *CategoryRepository) Delete(id uint) error {
	return database.DB.Delete(&models.Category{}, id).Error
}

