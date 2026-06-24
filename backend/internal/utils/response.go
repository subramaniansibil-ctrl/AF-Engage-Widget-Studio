package utils

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
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
