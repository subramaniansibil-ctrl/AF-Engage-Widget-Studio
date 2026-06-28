package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/repositories"
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

func (h *ClientHandler) Widget(c *gin.Context) {
	clientID, ok := clientIDFromContext(c)
	if !ok {
		utils.JSONError(c, http.StatusUnauthorized, "client context required")
		return
	}
	widget, err := h.service.GetAssignedWidget(c.Request.Context(), clientID, c.Param("widgetId"))
	if err != nil {
		utils.JSONError(c, http.StatusNotFound, "assigned widget not found")
		return
	}
	c.JSON(http.StatusOK, widget)
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
		utils.JSONValidationError(c, err)
		return
	}

	simulation, err := h.service.SaveSimulation(c.Request.Context(), clientID, request)
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to save simulation")
		return
	}
	c.JSON(http.StatusOK, simulation)
}

func (h *ClientHandler) Simulations(c *gin.Context) {
	clientID, ok := clientIDFromContext(c)
	if !ok {
		utils.JSONError(c, http.StatusUnauthorized, "client context required")
		return
	}
	simulations, err := h.service.ListSimulations(c.Request.Context(), clientID, c.Query("widgetId"))
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load simulations")
		return
	}
	c.JSON(http.StatusOK, simulations)
}

func (h *ClientHandler) UpdateSimulation(c *gin.Context) {
	clientID, ok := clientIDFromContext(c)
	if !ok {
		utils.JSONError(c, http.StatusUnauthorized, "client context required")
		return
	}
	var request models.SimulationUpdateRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.JSONValidationError(c, err)
		return
	}
	simulation, err := h.service.UpdateSimulation(c.Request.Context(), clientID, c.Param("simulationId"), request)
	if err != nil {
		handleSimulationError(c, err)
		return
	}
	c.JSON(http.StatusOK, simulation)
}

func (h *ClientHandler) DuplicateSimulation(c *gin.Context) {
	clientID, ok := clientIDFromContext(c)
	if !ok {
		utils.JSONError(c, http.StatusUnauthorized, "client context required")
		return
	}
	var request models.DuplicateSimulationRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.JSONValidationError(c, err)
		return
	}
	simulation, err := h.service.DuplicateSimulation(c.Request.Context(), clientID, c.Param("simulationId"), request.Name)
	if err != nil {
		handleSimulationError(c, err)
		return
	}
	c.JSON(http.StatusCreated, simulation)
}

func (h *ClientHandler) DeleteSimulation(c *gin.Context) {
	clientID, ok := clientIDFromContext(c)
	if !ok {
		utils.JSONError(c, http.StatusUnauthorized, "client context required")
		return
	}
	if err := h.service.DeleteSimulation(c.Request.Context(), clientID, c.Param("simulationId")); err != nil {
		handleSimulationError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func handleSimulationError(c *gin.Context, err error) {
	if errors.Is(err, repositories.ErrSimulationNotFound) {
		utils.JSONError(c, http.StatusNotFound, "simulation not found")
		return
	}
	utils.JSONError(c, http.StatusInternalServerError, "simulation operation failed")
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
