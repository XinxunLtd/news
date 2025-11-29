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
func (r *UserRepository) FirstOrCreate(user *models.User, username string, xinxunNumber string) (*models.User, error) {
	var existing models.User
	err := database.DB.Where("username = ? OR xinxun_number = ?", username, xinxunNumber).First(&existing).Error
	
	if err != nil {
		// User doesn't exist, try to create it
		createErr := database.DB.Create(user).Error
		if createErr != nil {
			// If create fails (likely duplicate due to race condition), try to find again
			var found models.User
			findErr := database.DB.Where("username = ? OR xinxun_number = ?", username, xinxunNumber).First(&found).Error
			if findErr != nil {
				return nil, createErr // Return original create error
			}
			// User was created by another request, return it
			return &found, nil
		}
		// Successfully created
		return user, nil
	}
	
	// User exists, return it
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

