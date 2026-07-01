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

type AdvisorManagementHandler struct {
	service services.AdvisorManagementService
}

func NewAdvisorManagementHandler(service services.AdvisorManagementService) *AdvisorManagementHandler {
	return &AdvisorManagementHandler{service: service}
}

func (h *AdvisorManagementHandler) List(c *gin.Context) {
	pagination := utils.ParsePagination(c, utils.DefaultPageSize, utils.MaxPageSize)
	advisors, totalItems, err := h.service.ListAdvisors(c.Request.Context(), models.AdvisorManagementFilters{
		Search: c.Query("search"),
		Status: models.AdvisorStatus(c.Query("status")),
		Page: pagination.Page, PageSize: pagination.PageSize,
	})
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load advisors")
		return
	}
	c.JSON(http.StatusOK, models.PaginatedResponse[models.Advisor]{
		Items: advisors,
		Meta:  utils.PaginationMeta(pagination.Page, pagination.PageSize, totalItems),
	})
}

func (h *AdvisorManagementHandler) Get(c *gin.Context) {
	advisor, err := h.service.GetAdvisor(c.Request.Context(), c.Param("advisorId"))
	if err != nil {
		handleAdvisorManagementError(c, err)
		return
	}
	c.JSON(http.StatusOK, advisor)
}

func (h *AdvisorManagementHandler) Create(c *gin.Context) {
	var request models.AdvisorUpsertRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.JSONValidationError(c, err)
		return
	}
	advisor, err := h.service.CreateAdvisor(c.Request.Context(), request)
	if err != nil {
		handleAdvisorManagementError(c, err)
		return
	}
	c.JSON(http.StatusCreated, advisor)
}

func (h *AdvisorManagementHandler) Update(c *gin.Context) {
	var request models.AdvisorUpsertRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.JSONValidationError(c, err)
		return
	}
	advisor, err := h.service.UpdateAdvisor(c.Request.Context(), c.Param("advisorId"), request)
	if err != nil {
		handleAdvisorManagementError(c, err)
		return
	}
	c.JSON(http.StatusOK, advisor)
}

func (h *AdvisorManagementHandler) Deactivate(c *gin.Context) {
	if err := h.service.DeactivateAdvisor(c.Request.Context(), c.Param("advisorId")); err != nil {
		handleAdvisorManagementError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func handleAdvisorManagementError(c *gin.Context, err error) {
	var validationError *services.AdvisorValidationError
	switch {
	case errors.As(err, &validationError):
		c.JSON(http.StatusBadRequest, utils.ErrorResponse{Success: false, Error: "validation failed", Details: map[string]string{validationError.Field: validationError.Message}})
	case errors.Is(err, repositories.ErrDuplicateAdvisorID):
		utils.JSONError(c, http.StatusConflict, "advisor ID already exists")
	case errors.Is(err, repositories.ErrDuplicateAdvisorEmail):
		utils.JSONError(c, http.StatusConflict, "email address already belongs to another user")
	case errors.Is(err, repositories.ErrAdvisorNotFound):
		utils.JSONError(c, http.StatusNotFound, "advisor not found")
	default:
		utils.JSONError(c, http.StatusInternalServerError, "advisor operation failed")
	}
}
