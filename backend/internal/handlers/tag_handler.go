package handlers

import (
	"net/http"

	"xinxun-news/internal/repository"

	"github.com/gin-gonic/gin"
)

type TagHandler struct {
	tagRepo *repository.TagRepository
}

func NewTagHandler() *TagHandler {
	return &TagHandler{
		tagRepo: repository.NewTagRepository(),
	}
}

func (h *TagHandler) GetTags(c *gin.Context) {
	tags, err := h.tagRepo.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": tags})
}

