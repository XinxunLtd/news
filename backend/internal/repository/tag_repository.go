package repository

import (
	"xinxun-news/internal/database"
	"xinxun-news/internal/models"

	"gorm.io/gorm"
)

type TagRepository struct{}

func NewTagRepository() *TagRepository {
	return &TagRepository{}
}

func (r *TagRepository) FindAll() ([]models.Tag, error) {
	var tags []models.Tag
	err := database.DB.Order("`order` ASC, id ASC").Find(&tags).Error
	return tags, err
}

func (r *TagRepository) FindByID(id uint) (*models.Tag, error) {
	var tag models.Tag
	err := database.DB.First(&tag, id).Error
	return &tag, err
}

func (r *TagRepository) FindBySlug(slug string) (*models.Tag, error) {
	var tag models.Tag
	err := database.DB.Where("slug = ?", slug).First(&tag).Error
	return &tag, err
}

// FindBySlugUnscoped finds tag by slug including soft-deleted ones
func (r *TagRepository) FindBySlugUnscoped(slug string) (*models.Tag, error) {
	var tag models.Tag
	err := database.DB.Unscoped().Where("slug = ?", slug).First(&tag).Error
	return &tag, err
}

func (r *TagRepository) Create(tag *models.Tag) error {
	// Check if there's a soft-deleted tag with the same slug
	existing, err := r.FindBySlugUnscoped(tag.Slug)
	if err == nil && existing.DeletedAt.Valid {
		// Restore the soft-deleted tag
		existing.Name = tag.Name
		if tag.Order > 0 {
			existing.Order = tag.Order
		} else {
			// If order is 0, set it to max order + 1
			var maxOrder int
			database.DB.Model(&models.Tag{}).Select("COALESCE(MAX(`order`), 0)").Scan(&maxOrder)
			existing.Order = maxOrder + 1
		}
		existing.DeletedAt = gorm.DeletedAt{} // Clear DeletedAt to restore
		return database.DB.Unscoped().Save(existing).Error
	}
	// If order is 0, set it to max order + 1
	if tag.Order == 0 {
		var maxOrder int
		database.DB.Model(&models.Tag{}).Select("COALESCE(MAX(`order`), 0)").Scan(&maxOrder)
		tag.Order = maxOrder + 1
	}
	return database.DB.Create(tag).Error
}

func (r *TagRepository) Update(tag *models.Tag) error {
	return database.DB.Save(tag).Error
}

func (r *TagRepository) Delete(id uint) error {
	return database.DB.Delete(&models.Tag{}, id).Error
}

