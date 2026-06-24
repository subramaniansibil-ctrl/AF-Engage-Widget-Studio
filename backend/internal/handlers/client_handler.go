package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/services"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/utils"
)

type ClientHandler struct {
	service services.ClientService
}

func NewClientHandler(service services.ClientService) *ClientHandler {
	return &ClientHandler{service: service}
}

func (h *ClientHandler) Dashboard(c *gin.Context) {
	clientID, ok := clientIDFromContext(c)
	if !ok {
		utils.JSONError(c, http.StatusUnauthorized, "client context required")
		return
	}

	response, err := h.service.GetDashboard(c.Request.Context(), clientID)
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load client dashboard")
		return
	}
	c.JSON(http.StatusOK, response)
}

func (h *ClientHandler) Widgets(c *gin.Context) {
	clientID, ok := clientIDFromContext(c)
	if !ok {
		utils.JSONError(c, http.StatusUnauthorized, "client context required")
		return
	}

	widgets, err := h.service.ListAssignedWidgets(c.Request.Context(), clientID)
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load client widgets")
		return
	}
	c.JSON(http.StatusOK, widgets)
}

func (h *ClientHandler) Recommendations(c *gin.Context) {
	clientID, ok := clientIDFromContext(c)
	if !ok {
		utils.JSONError(c, http.StatusUnauthorized, "client context required")
		return
	}

	recommendations, err := h.service.ListRecommendations(c.Request.Context(), clientID)
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load recommendations")
		return
	}
	c.JSON(http.StatusOK, recommendations)
}

func (h *ClientHandler) SaveSimulation(c *gin.Context) {
	clientID, ok := clientIDFromContext(c)
	if !ok {
		utils.JSONError(c, http.StatusUnauthorized, "client context required")
		return
	}

	var request models.SimulationRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.JSONError(c, http.StatusBadRequest, "widgetId is required")
		return
	}

	simulation, err := h.service.SaveSimulation(c.Request.Context(), clientID, request)
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to save simulation")
		return
	}
	c.JSON(http.StatusOK, simulation)
}

func clientIDFromContext(c *gin.Context) (string, bool) {
	value, exists := c.Get("user")
	if !exists {
		return "", false
	}
	user, ok := value.(models.User)
	if !ok || user.ClientID == "" {
		return "", false
	}
	return user.ClientID, true
}
