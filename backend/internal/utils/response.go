package utils

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
)

type ErrorResponse struct {
	Success bool              `json:"success"`
	Error   string            `json:"error"`
	Details map[string]string `json:"details,omitempty"`
}

func JSONError(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, ErrorResponse{Success: false, Error: message})
}

func JSONValidationError(c *gin.Context, err error) {
	details := map[string]string{}
	var validationErrors validator.ValidationErrors
	if errors.As(err, &validationErrors) {
		for _, fieldError := range validationErrors {
			details[fieldError.Field()] = validationMessage(fieldError)
		}
	}
	c.JSON(http.StatusBadRequest, ErrorResponse{
		Success: false,
		Error:   "validation failed",
		Details: details,
	})
}

func validationMessage(fieldError validator.FieldError) string {
	switch fieldError.Tag() {
	case "required":
		return "is required"
	case "email":
		return "must be a valid email address"
	case "gte":
		return "must be greater than or equal to " + fieldError.Param()
	case "lte":
		return "must be less than or equal to " + fieldError.Param()
	default:
		return "is invalid"
	}
}

const (
	DefaultPageSize = 10
	MaxPageSize     = 100
)

type PaginationQuery struct {
	Page     int
	PageSize int
}

func ParsePagination(c *gin.Context, defaultPageSize, maxPageSize int) PaginationQuery {
	page := 1
	pageSize := defaultPageSize

	if value, err := strconv.Atoi(c.Query("page")); err == nil && value > 0 {
		page = value
	}
	if value, err := strconv.Atoi(c.Query("pageSize")); err == nil && value > 0 {
		pageSize = value
	}

	if pageSize <= 0 {
		pageSize = defaultPageSize
	}
	if pageSize > maxPageSize {
		pageSize = maxPageSize
	}

	return PaginationQuery{Page: page, PageSize: pageSize}
}

func PaginationMeta(page, pageSize, totalItems int) models.PaginationMeta {
	if pageSize <= 0 {
		pageSize = DefaultPageSize
	}
	totalPages := 1
	if totalItems > 0 {
		totalPages = (totalItems + pageSize - 1) / pageSize
	}
	if page < 1 {
		page = 1
	}
	if page > totalPages {
		page = totalPages
	}
	return models.PaginationMeta{
		Page:       page,
		PageSize:   pageSize,
		TotalItems: totalItems,
		TotalPages: totalPages,
	}
}
