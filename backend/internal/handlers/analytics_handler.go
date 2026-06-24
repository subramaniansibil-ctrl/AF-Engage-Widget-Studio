package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/repositories"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/services"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/utils"
)

type AnalyticsHandler struct {
	service services.AnalyticsService
}

func NewAnalyticsHandler(service services.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{service: service}
}

func (h *AnalyticsHandler) AdvisorAnalytics(c *gin.Context) {
	analytics, err := h.service.GetAdvisorAnalytics(c.Request.Context())
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load advisor analytics")
		return
	}
	c.JSON(http.StatusOK, analytics)
}

func (h *AnalyticsHandler) WidgetUsage(c *gin.Context) {
	usage, err := h.service.GetWidgetUsage(c.Request.Context())
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load widget usage")
		return
	}
	c.JSON(http.StatusOK, usage)
}

func (h *AnalyticsHandler) Notifications(c *gin.Context) {
	notifications, err := h.service.ListNotifications(c.Request.Context())
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load notifications")
		return
	}
	c.JSON(http.StatusOK, notifications)
}

func (h *AnalyticsHandler) MarkNotificationRead(c *gin.Context) {
	notification, err := h.service.MarkNotificationRead(c.Request.Context(), c.Param("id"))
	if errors.Is(err, repositories.ErrNotificationNotFound) {
		utils.JSONError(c, http.StatusNotFound, "notification not found")
		return
	}
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to update notification")
		return
	}
	c.JSON(http.StatusOK, notification)
}

func (h *AnalyticsHandler) AuditLogs(c *gin.Context) {
	logs, err := h.service.ListAuditLogs(c.Request.Context())
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load audit logs")
		return
	}
	c.JSON(http.StatusOK, logs)
}
