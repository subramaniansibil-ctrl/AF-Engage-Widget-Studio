package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/af-engage-widget-studio/backend/internal/models"
	"github.com/af-engage-widget-studio/backend/internal/services"
	"github.com/af-engage-widget-studio/backend/internal/utils"
)

type SimulationHandler struct {
	service services.SimulationService
}

func NewSimulationHandler(service services.SimulationService) *SimulationHandler {
	return &SimulationHandler{service: service}
}

func (h *SimulationHandler) TwoPot(c *gin.Context) {
	var request models.TwoPotSimulationRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.JSONValidationError(c, err)
		return
	}

	c.JSON(http.StatusOK, h.service.CalculateTwoPot(c.Request.Context(), request))
}

func (h *SimulationHandler) Onefee(c *gin.Context) {
	var request models.OnefeeSimulationRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.JSONValidationError(c, err)
		return
	}

	c.JSON(http.StatusOK, h.service.CalculateOnefee(c.Request.Context(), request))
}

func (h *SimulationHandler) IncomeSustainability(c *gin.Context) {
	var request models.IncomeSustainabilityRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.JSONValidationError(c, err)
		return
	}

	c.JSON(http.StatusOK, h.service.CalculateIncomeSustainability(c.Request.Context(), request))
}
