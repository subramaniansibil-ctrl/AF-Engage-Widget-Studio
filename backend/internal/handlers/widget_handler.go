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

type WidgetHandler struct {
	service services.WidgetService
}

func NewWidgetHandler(service services.WidgetService) *WidgetHandler {
	return &WidgetHandler{service: service}
}

func (h *WidgetHandler) ListWidgets(c *gin.Context) {
	widgets, err := h.service.ListWidgets(c.Request.Context())
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load widgets")
		return
	}
	c.JSON(http.StatusOK, widgets)
}

func (h *WidgetHandler) GetWidget(c *gin.Context) {
	widget, err := h.service.GetWidgetByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		if errors.Is(err, repositories.ErrWidgetNotFound) {
			utils.JSONError(c, http.StatusNotFound, "widget not found")
			return
		}
		utils.JSONError(c, http.StatusInternalServerError, "failed to load widget")
		return
	}
	c.JSON(http.StatusOK, widget)
}

func (h *WidgetHandler) ConfigureWidget(c *gin.Context) {
	var request models.ConfigureWidgetRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.JSONValidationError(c, err)
		return
	}

	configuration, err := h.service.ConfigureWidget(c.Request.Context(), c.Param("clientId"), request)
	if err != nil {
		if errors.Is(err, repositories.ErrWidgetNotFound) {
			utils.JSONError(c, http.StatusNotFound, "widget not found")
			return
		}
		utils.JSONError(c, http.StatusInternalServerError, "failed to configure widget")
		return
	}
	c.JSON(http.StatusOK, configuration)
}

func (h *WidgetHandler) AssignWidget(c *gin.Context) {
	var request models.AssignWidgetRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.JSONValidationError(c, err)
		return
	}

	assignment, err := h.service.AssignWidget(c.Request.Context(), c.Param("clientId"), request)
	if err != nil {
		if errors.Is(err, repositories.ErrWidgetAlreadyAssigned) {
			utils.JSONError(c, http.StatusConflict, "widget is already assigned to this client")
			return
		}
		if errors.Is(err, repositories.ErrWidgetNotFound) || errors.Is(err, repositories.ErrConfigurationNotFound) {
			utils.JSONError(c, http.StatusNotFound, "widget or configuration not found")
			return
		}
		utils.JSONError(c, http.StatusInternalServerError, "failed to assign widget")
		return
	}
	c.JSON(http.StatusOK, assignment)
}

func (h *WidgetHandler) RemoveAssignedWidget(c *gin.Context) {
	err := h.service.RemoveAssignedWidget(c.Request.Context(), c.Param("clientId"), c.Param("assignmentId"))
	if err != nil {
		if errors.Is(err, repositories.ErrAssignmentNotFound) {
			utils.JSONError(c, http.StatusNotFound, "assigned widget not found")
			return
		}
		utils.JSONError(c, http.StatusInternalServerError, "failed to remove assigned widget")
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *WidgetHandler) ListAssignedWidgets(c *gin.Context) {
	assignments, err := h.service.ListAssignedWidgets(c.Request.Context(), c.Param("clientId"))
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load assigned widgets")
		return
	}
	c.JSON(http.StatusOK, assignments)
}

func (h *WidgetHandler) PublishDashboard(c *gin.Context) {
	assignments, err := h.service.PublishDashboard(c.Request.Context(), c.Param("clientId"))
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to publish dashboard")
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "assignedWidgets": assignments})
}
