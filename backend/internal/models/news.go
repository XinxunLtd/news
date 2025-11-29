package models

import (
	"time"

	"gorm.io/gorm"
)

type NewsStatus string

const (
	StatusDraft     NewsStatus = "draft"
	StatusPublished NewsStatus = "published"
	StatusPending   NewsStatus = "pending"   // Menunggu approval admin
	StatusRejected  NewsStatus = "rejected" // Ditolak admin
)

type News struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Title       string         `json:"title" gorm:"not null"`
	Slug        string         `json:"slug" gorm:"unique;not null;index"`
	Content     string         `json:"content" gorm:"type:text;not null"`
	Excerpt     string         `json:"excerpt" gorm:"type:text"`
	Thumbnail   string         `json:"thumbnail"`
	CategoryID  uint           `json:"category_id"`
	Category    Category       `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	AuthorID    uint           `json:"author_id"`
	Author      User           `json:"author,omitempty" gorm:"foreignKey:AuthorID"`
	Tags        []Tag          `json:"tags,omitempty" gorm:"many2many:news_tags;"`
	PublishedAt *time.Time     `json:"published_at"`
	Views       int            `json:"views" gorm:"default:0"`
	Status      NewsStatus     `json:"status" gorm:"type:enum('draft','published','pending','rejected');default:'draft'"`
	RewardAmount float64       `json:"reward_amount" gorm:"default:0"` // Reward untuk publisher jika di-approve
	IsRewarded  bool           `json:"is_rewarded" gorm:"default:false"` // Apakah sudah diberikan reward
	RevisionOf  *uint          `json:"revision_of" gorm:"index"` // ID of the original news if this is a revision
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

