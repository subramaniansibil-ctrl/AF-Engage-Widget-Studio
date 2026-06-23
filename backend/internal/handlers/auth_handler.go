package handlers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/repositories"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/services"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/utils"
)

type AuthHandler struct {
	service services.AuthService
}

func NewAuthHandler(service services.AuthService) *AuthHandler {
	return &AuthHandler{service: service}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var request models.LoginRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.JSONError(c, http.StatusBadRequest, "email and password are required")
		return
	}

	response, err := h.service.Login(c.Request.Context(), request)
	if err != nil {
		if errors.Is(err, repositories.ErrInvalidCredentials) {
			utils.JSONError(c, http.StatusUnauthorized, "invalid email or password")
			return
		}
		utils.JSONError(c, http.StatusInternalServerError, "failed to log in")
		return
	}

	c.JSON(http.StatusOK, response)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	token := tokenFromHeader(c.GetHeader("Authorization"))
	if err := h.service.Logout(c.Request.Context(), token); err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to log out")
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *AuthHandler) Me(c *gin.Context) {
	user, ok := middlewareUser(c)
	if !ok {
		utils.JSONError(c, http.StatusUnauthorized, "authentication required")
		return
	}
	c.JSON(http.StatusOK, user)
}

func tokenFromHeader(authHeader string) string {
	token, ok := strings.CutPrefix(authHeader, "Bearer ")
	if !ok {
		return ""
	}
	return token
}

func middlewareUser(c *gin.Context) (models.User, bool) {
	value, exists := c.Get("user")
	if !exists {
		return models.User{}, false
	}
	user, ok := value.(models.User)
	return user, ok
}
