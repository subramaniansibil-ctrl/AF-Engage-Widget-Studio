package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/af-engage-widget-studio/backend/internal/models"
	"github.com/af-engage-widget-studio/backend/internal/repositories"
	"github.com/af-engage-widget-studio/backend/internal/services"
	"github.com/af-engage-widget-studio/backend/internal/utils"
)

type ClientManagementHandler struct {
	service services.ClientManagementService
}

func NewClientManagementHandler(service services.ClientManagementService) *ClientManagementHandler {
	return &ClientManagementHandler{service: service}
}

func (h *ClientManagementHandler) List(c *gin.Context) {
	actor, ok := userFromContext(c)
	if !ok {
		utils.JSONError(c, http.StatusUnauthorized, "authentication required")
		return
	}
	recent, _ := strconv.ParseBool(c.Query("recent"))
	pagination := utils.ParsePagination(c, utils.DefaultPageSize, utils.MaxPageSize)
	clients, totalItems, err := h.service.ListClients(c.Request.Context(), models.ClientManagementFilters{
		Search: c.Query("search"), Status: models.ClientStatus(c.Query("status")),
		AssignedAdvisor: c.Query("assignedAdvisor"), RecentlyCreated: recent,
		SortBy: c.Query("sortBy"), SortOrder: c.Query("sortOrder"),
		Page: pagination.Page, PageSize: pagination.PageSize,
	}, actor)
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load clients")
		return
	}
	c.JSON(http.StatusOK, models.PaginatedResponse[models.Client]{
		Items: clients,
		Meta:  utils.PaginationMeta(pagination.Page, pagination.PageSize, totalItems),
	})
}

func (h *ClientManagementHandler) Get(c *gin.Context) {
	actor, ok := userFromContext(c)
	if !ok {
		utils.JSONError(c, http.StatusUnauthorized, "authentication required")
		return
	}
	client, err := h.service.GetClient(c.Request.Context(), c.Param("clientId"), actor)
	if err != nil {
		handleClientManagementError(c, err)
		return
	}
	c.JSON(http.StatusOK, client)
}

func (h *ClientManagementHandler) Create(c *gin.Context) {
	actor, ok := userFromContext(c)
	if !ok {
		utils.JSONError(c, http.StatusUnauthorized, "authentication required")
		return
	}
	var request models.ClientUpsertRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.JSONValidationError(c, err)
		return
	}
	client, err := h.service.CreateClient(c.Request.Context(), request, actor)
	if err != nil {
		handleClientManagementError(c, err)
		return
	}
	c.JSON(http.StatusCreated, client)
}

func (h *ClientManagementHandler) Update(c *gin.Context) {
	actor, ok := userFromContext(c)
	if !ok {
		utils.JSONError(c, http.StatusUnauthorized, "authentication required")
		return
	}
	var request models.ClientUpsertRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.JSONValidationError(c, err)
		return
	}
	client, err := h.service.UpdateClient(c.Request.Context(), c.Param("clientId"), request, actor)
	if err != nil {
		handleClientManagementError(c, err)
		return
	}
	c.JSON(http.StatusOK, client)
}

func (h *ClientManagementHandler) Deactivate(c *gin.Context) {
	actor, ok := userFromContext(c)
	if !ok {
		utils.JSONError(c, http.StatusUnauthorized, "authentication required")
		return
	}
	if err := h.service.DeactivateClient(c.Request.Context(), c.Param("clientId"), actor); err != nil {
		handleClientManagementError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *ClientManagementHandler) BulkImport(c *gin.Context) {
	actor, ok := userFromContext(c)
	if !ok {
		utils.JSONError(c, http.StatusUnauthorized, "authentication required")
		return
	}
	var request models.BulkClientImportRequest
	if err := json.NewDecoder(c.Request.Body).Decode(&request); err != nil || len(request.Rows) == 0 {
		utils.JSONError(c, http.StatusBadRequest, "at least one client row is required")
		return
	}
	c.JSON(http.StatusOK, h.service.ImportClients(c.Request.Context(), request, actor))
}

func handleClientManagementError(c *gin.Context, err error) {
	var validationError *services.ClientValidationError
	switch {
	case errors.As(err, &validationError):
		c.JSON(http.StatusBadRequest, utils.ErrorResponse{Success: false, Error: "validation failed", Details: map[string]string{validationError.Field: validationError.Message}})
	case errors.Is(err, repositories.ErrDuplicateClientID):
		utils.JSONError(c, http.StatusConflict, "client ID already exists")
	case errors.Is(err, repositories.ErrDuplicateClientEmail):
		utils.JSONError(c, http.StatusConflict, "email address already belongs to another client")
	case errors.Is(err, repositories.ErrClientNotFound):
		utils.JSONError(c, http.StatusNotFound, "client not found")
	default:
		utils.JSONError(c, http.StatusInternalServerError, "client operation failed")
	}
}
