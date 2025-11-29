package repository

import (
	"xinxun-news/internal/database"
	"xinxun-news/internal/models"
)

type TagRepository struct{}

func NewTagRepository() *TagRepository {
	return &TagRepository{}
}

func (r *TagRepository) FindAll() ([]models.Tag, error) {
	var tags []models.Tag
	err := database.DB.Find(&tags).Error
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

func (r *TagRepository) Create(tag *models.Tag) error {
	return database.DB.Create(tag).Error
}

func (r *TagRepository) Update(tag *models.Tag) error {
	return database.DB.Save(tag).Error
}

func (r *TagRepository) Delete(id uint) error {
	return database.DB.Delete(&models.Tag{}, id).Error
}

