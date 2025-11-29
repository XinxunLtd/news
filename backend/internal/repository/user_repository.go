package repository

import (
	"xinxun-news/internal/database"
	"xinxun-news/internal/models"
)

type UserRepository struct{}

func NewUserRepository() *UserRepository {
	return &UserRepository{}
}

func (r *UserRepository) FindByUsername(username string) (*models.User, error) {
	var user models.User
	err := database.DB.Where("username = ?", username).First(&user).Error
	return &user, err
}

func (r *UserRepository) FindByUsernameOrXinxunNumber(username string, xinxunNumber string) (*models.User, error) {
	var user models.User
	err := database.DB.Where("username = ? OR xinxun_number = ?", username, xinxunNumber).First(&user).Error
	return &user, err
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	err := database.DB.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *UserRepository) Create(user *models.User) error {
	return database.DB.Create(user).Error
}

// FirstOrCreate finds a user by username or xinxun_number, or creates if not found
// Returns the existing user if found, or creates new one
// Uses Unscoped to check including soft-deleted records to avoid duplicates
func (r *UserRepository) FirstOrCreate(user *models.User, username string, xinxunNumber string) (*models.User, error) {
	var existing models.User
	
	// First check without soft delete filter (Unscoped) to catch all users including soft-deleted
	err := database.DB.Unscoped().Where("username = ? OR xinxun_number = ?", username, xinxunNumber).First(&existing).Error
	
	if err != nil {
		// User doesn't exist at all (including soft-deleted), try to create it
		createErr := database.DB.Create(user).Error
		if createErr != nil {
			// If create fails (likely duplicate due to race condition), try to find again with Unscoped
			var found models.User
			findErr := database.DB.Unscoped().Where("username = ? OR xinxun_number = ?", username, xinxunNumber).First(&found).Error
			if findErr != nil {
				// Still not found, return original create error
				return nil, createErr
			}
			// User was created by another request, restore if soft-deleted
			if found.DeletedAt.Valid {
				database.DB.Unscoped().Model(&found).Update("deleted_at", nil)
			}
			// Reload to get updated record
			database.DB.First(&found, found.ID)
			return &found, nil
		}
		// Successfully created
		return user, nil
	}
	
	// User exists (including soft-deleted), restore if soft-deleted
	if existing.DeletedAt.Valid {
		database.DB.Unscoped().Model(&existing).Update("deleted_at", nil)
		// Reload to get updated record
		database.DB.First(&existing, existing.ID)
	}
	
	// Return existing user
	return &existing, nil
}

func (r *UserRepository) Update(user *models.User) error {
	return database.DB.Save(user).Error
}

func (r *UserRepository) FindByXinxunNumber(number string) (*models.User, error) {
	var user models.User
	err := database.DB.Where("xinxun_number = ?", number).First(&user).Error
	return &user, err
}

func (r *UserRepository) FindByID(id uint) (*models.User, error) {
	var user models.User
	err := database.DB.First(&user, id).Error
	return &user, err
}

