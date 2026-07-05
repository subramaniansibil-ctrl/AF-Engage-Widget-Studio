package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/af-engage-widget-studio/backend/internal/models"
	"github.com/af-engage-widget-studio/backend/internal/repositories"
	"github.com/af-engage-widget-studio/backend/internal/services"
	"github.com/af-engage-widget-studio/backend/internal/utils"
)

type AdvisorHandler struct {
	service services.AdvisorService
}

func NewAdvisorHandler(service services.AdvisorService) *AdvisorHandler {
	return &AdvisorHandler{service: service}
}

func (h *AdvisorHandler) Dashboard(c *gin.Context) {
	advisorName := ""
	if value, exists := c.Get("user"); exists {
		if user, ok := value.(models.User); ok && user.Role == models.RoleAdvisor {
			advisorName = user.Name
		}
	}
	stats, err := h.service.GetDashboardStats(c.Request.Context(), advisorName)
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load advisor dashboard")
		return
	}
	c.JSON(http.StatusOK, stats)
}

func (h *AdvisorHandler) ListClients(c *gin.Context) {
	pagination := utils.ParsePagination(c, utils.DefaultPageSize, utils.MaxPageSize)
	filters := repositories.ClientFilters{
		Search:          c.Query("search"),
		RiskProfile:     models.RiskProfile(c.Query("riskProfile")),
		RetirementStage: models.RetirementStage(c.Query("retirementStage")),
		Page:            pagination.Page,
		PageSize:        pagination.PageSize,
	}
	if value, exists := c.Get("user"); exists {
		if user, ok := value.(models.User); ok && user.Role == models.RoleAdvisor {
			filters.AssignedAdvisor = user.Name
		}
	}

	clients, totalItems, err := h.service.ListClients(c.Request.Context(), filters)
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load clients")
		return
	}
	c.JSON(http.StatusOK, models.PaginatedResponse[models.Client]{
		Items: clients,
		Meta:  utils.PaginationMeta(pagination.Page, pagination.PageSize, totalItems),
	})
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
