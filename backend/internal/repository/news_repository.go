package repository

import (
	"xinxun-news/internal/database"
	"xinxun-news/internal/models"

	"gorm.io/gorm"
)

type NewsRepository struct{}

func NewNewsRepository() *NewsRepository {
	return &NewsRepository{}
}

func (r *NewsRepository) FindAll(limit, offset int, search, category string, status *models.NewsStatus) ([]models.News, int64, error) {
	var news []models.News
	var total int64

	query := database.DB.Model(&models.News{})

	if search != "" {
		query = query.Where("title LIKE ? OR excerpt LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if category != "" {
		query = query.Joins("JOIN categories ON categories.id = news.category_id").
			Where("categories.slug = ?", category)
	}

	if status != nil {
		// Filter by specific status (public view - only published)
		query = query.Where("status = ?", *status)
	}
	// If status is nil, show all statuses (admin/publisher view)

	query.Count(&total)

	err := query.Preload("Category").Preload("Author").Preload("Tags").
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&news).Error

	return news, total, err
}

// FindTopViews gets top viewed news for featured section
func (r *NewsRepository) FindTopViews(limit int) ([]models.News, error) {
	var news []models.News
	err := database.DB.Preload("Category").Preload("Author").Preload("Tags").
		Where("status = ?", models.StatusPublished).
		Order("views DESC, created_at DESC").
		Limit(limit).
		Find(&news).Error
	return news, err
}

// FindNewest gets newest published news ordered by created_at DESC
func (r *NewsRepository) FindNewest(limit int) ([]models.News, error) {
	var news []models.News
	err := database.DB.Preload("Category").
		Where("status = ?", models.StatusPublished).
		Order("created_at DESC").
		Limit(limit).
		Find(&news).Error
	return news, err
}

func (r *NewsRepository) FindBySlug(slug string) (*models.News, error) {
	var news models.News
	err := database.DB.Preload("Category").Preload("Author").Preload("Tags").
		Where("slug = ? AND status = ?", slug, models.StatusPublished).
		First(&news).Error
	return &news, err
}

func (r *NewsRepository) FindByID(id uint) (*models.News, error) {
	var news models.News
	err := database.DB.Preload("Category").Preload("Author").Preload("Tags").
		First(&news, id).Error
	return &news, err
}

func (r *NewsRepository) Create(news *models.News) error {
	return database.DB.Create(news).Error
}

func (r *NewsRepository) Update(news *models.News) error {
	return database.DB.Save(news).Error
}

func (r *NewsRepository) Delete(id uint) error {
	return database.DB.Delete(&models.News{}, id).Error
}

func (r *NewsRepository) IncrementViews(id uint) error {
	return database.DB.Model(&models.News{}).Where("id = ?", id).
		UpdateColumn("views", gorm.Expr("views + 1")).Error
}

