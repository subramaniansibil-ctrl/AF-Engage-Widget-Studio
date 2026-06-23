package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/services"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/utils"
)

type StatusHandler struct {
	service services.StatusService
}

func NewStatusHandler(service services.StatusService) *StatusHandler {
	return &StatusHandler{service: service}
}

func (h *StatusHandler) Health(c *gin.Context) {
	response, err := h.service.Health(c.Request.Context())
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load health status")
		return
	}
	c.JSON(http.StatusOK, response)
}

func (h *StatusHandler) Status(c *gin.Context) {
	response, err := h.service.Status(c.Request.Context())
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load API status")
		return
	}
	c.JSON(http.StatusOK, response)
}
