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

type AdvisorHandler struct {
	service services.AdvisorService
}

func NewAdvisorHandler(service services.AdvisorService) *AdvisorHandler {
	return &AdvisorHandler{service: service}
}

func (h *AdvisorHandler) Dashboard(c *gin.Context) {
	stats, err := h.service.GetDashboardStats(c.Request.Context())
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load advisor dashboard")
		return
	}
	c.JSON(http.StatusOK, stats)
}

func (h *AdvisorHandler) ListClients(c *gin.Context) {
	filters := repositories.ClientFilters{
		Search:          c.Query("search"),
		RiskProfile:     models.RiskProfile(c.Query("riskProfile")),
		RetirementStage: models.RetirementStage(c.Query("retirementStage")),
	}
	if value, exists := c.Get("user"); exists {
		if user, ok := value.(models.User); ok && user.Role == models.RoleAdvisor {
			filters.AssignedAdvisor = user.Name
		}
	}

	clients, err := h.service.ListClients(c.Request.Context(), filters)
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load clients")
		return
	}
	c.JSON(http.StatusOK, clients)
}

func (h *AdvisorHandler) GetClient(c *gin.Context) {
	client, err := h.service.GetClientByID(c.Request.Context(), c.Param("clientId"))
	if err != nil {
		if errors.Is(err, repositories.ErrClientNotFound) {
			utils.JSONError(c, http.StatusNotFound, "client not found")
			return
		}
		utils.JSONError(c, http.StatusInternalServerError, "failed to load client")
		return
	}
	if value, exists := c.Get("user"); exists {
		if user, ok := value.(models.User); ok && user.Role == models.RoleAdvisor && client.AssignedAdvisor != user.Name {
			utils.JSONError(c, http.StatusForbidden, "client is not assigned to this advisor")
			return
		}
	}
	c.JSON(http.StatusOK, client)
}
