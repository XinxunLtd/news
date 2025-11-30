package models

import (
	"time"

	"gorm.io/gorm"
)

type Category struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"not null"`
	Slug        string         `json:"slug" gorm:"unique;not null"`
	IsAdminOnly bool           `json:"is_admin_only" gorm:"default:false"`
	Order       int            `json:"order" gorm:"default:0"` // Urutan tampilan
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
	News        []News         `json:"news,omitempty" gorm:"foreignKey:CategoryID"`
}

