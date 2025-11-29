package models

import (
	"time"

	"gorm.io/gorm"
)

type UserType string

const (
	UserTypeAdmin     UserType = "admin"
	UserTypePublisher UserType = "publisher"
)

type User struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	Username     string         `json:"username" gorm:"unique;not null"`
	Name         string         `json:"name" gorm:"not null"`
	Email        string         `json:"email" gorm:"unique;not null"`
	PasswordHash string         `json:"-" gorm:"not null"`
	UserType     UserType       `json:"user_type" gorm:"type:enum('admin','publisher');default:'admin'"`
	XinxunID     *uint          `json:"xinxun_id"` // ID dari xinxun.us API
	XinxunNumber string         `json:"xinxun_number"` // Nomor telepon dari xinxun
	Balance      float64        `json:"balance" gorm:"default:0"`
	Status       string         `json:"status" gorm:"default:'Active'"` // Active/Suspend
	ReffCode     string         `json:"reff_code"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

