package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/services"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/utils"
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
		utils.JSONError(c, http.StatusBadRequest, "invalid two-pot simulation request")
		return
	}

	c.JSON(http.StatusOK, h.service.CalculateTwoPot(c.Request.Context(), request))
}

func (h *SimulationHandler) Onefee(c *gin.Context) {
	var request models.OnefeeSimulationRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.JSONError(c, http.StatusBadRequest, "invalid onefee simulation request")
		return
	}

	c.JSON(http.StatusOK, h.service.CalculateOnefee(c.Request.Context(), request))
}

func (h *SimulationHandler) IncomeSustainability(c *gin.Context) {
	var request models.IncomeSustainabilityRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.JSONError(c, http.StatusBadRequest, "invalid income sustainability simulation request")
		return
	}

	c.JSON(http.StatusOK, h.service.CalculateIncomeSustainability(c.Request.Context(), request))
}
