package services

import (
	"context"
	"fmt"
	"net/mail"
	"strings"
	"time"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/repositories"
)

type ClientManagementService interface {
	ListClients(ctx context.Context, filters models.ClientManagementFilters) ([]models.Client, error)
	GetClient(ctx context.Context, id string) (models.Client, error)
	CreateClient(ctx context.Context, request models.ClientUpsertRequest) (models.Client, error)
	UpdateClient(ctx context.Context, id string, request models.ClientUpsertRequest) (models.Client, error)
	DeactivateClient(ctx context.Context, id string) error
	ImportClients(ctx context.Context, request models.BulkClientImportRequest) models.BulkClientImportResponse
}

type ClientValidationError struct {
	Field   string
	Message string
}

func (e *ClientValidationError) Error() string {
	return e.Field + " " + e.Message
}

type clientManagementService struct {
	repository repositories.ClientManagementRepository
}

func NewClientManagementService(repository repositories.ClientManagementRepository) ClientManagementService {
	return &clientManagementService{repository: repository}
}

func (s *clientManagementService) ListClients(ctx context.Context, filters models.ClientManagementFilters) ([]models.Client, error) {
	return s.repository.ListManagedClients(ctx, filters)
}

func (s *clientManagementService) GetClient(ctx context.Context, id string) (models.Client, error) {
	return s.repository.GetManagedClientByID(ctx, id)
}

func (s *clientManagementService) CreateClient(ctx context.Context, request models.ClientUpsertRequest) (models.Client, error) {
	normalizeClientRequest(&request)
	if err := validateClientRequest(request); err != nil {
		return models.Client{}, err
	}
	return s.repository.CreateManagedClient(ctx, request)
}

func (s *clientManagementService) UpdateClient(ctx context.Context, id string, request models.ClientUpsertRequest) (models.Client, error) {
	normalizeClientRequest(&request)
	request.ID = id
	if err := validateClientRequest(request); err != nil {
		return models.Client{}, err
	}
	return s.repository.UpdateManagedClient(ctx, id, request)
}

func (s *clientManagementService) DeactivateClient(ctx context.Context, id string) error {
	return s.repository.DeactivateManagedClient(ctx, id)
}

func (s *clientManagementService) ImportClients(ctx context.Context, request models.BulkClientImportRequest) models.BulkClientImportResponse {
	response := models.BulkClientImportResponse{Clients: []models.Client{}, Errors: []models.ClientImportError{}}
	seenIDs := map[string]int{}
	seenEmails := map[string]int{}
	failedRows := map[int]struct{}{}

	for _, row := range request.Rows {
		normalizeClientRequest(&row.Client)
		rowErrors := []models.ClientImportError{}
		if err := validateClientRequest(row.Client); err != nil {
			validationError := err.(*ClientValidationError)
			rowErrors = append(rowErrors, models.ClientImportError{RowNumber: row.RowNumber, Field: validationError.Field, Message: validationError.Message})
		}
		idKey := strings.ToLower(row.Client.ID)
		emailKey := strings.ToLower(row.Client.Email)
		if previous, exists := seenIDs[idKey]; idKey != "" && exists {
			rowErrors = append(rowErrors, models.ClientImportError{RowNumber: row.RowNumber, Field: "clientId", Message: fmt.Sprintf("duplicates row %d", previous)})
		}
		if previous, exists := seenEmails[emailKey]; emailKey != "" && exists {
			rowErrors = append(rowErrors, models.ClientImportError{RowNumber: row.RowNumber, Field: "email", Message: fmt.Sprintf("duplicates row %d", previous)})
		}
		seenIDs[idKey] = row.RowNumber
		seenEmails[emailKey] = row.RowNumber
		if len(rowErrors) > 0 {
			response.Errors = append(response.Errors, rowErrors...)
			failedRows[row.RowNumber] = struct{}{}
			continue
		}

		client, err := s.repository.CreateManagedClient(ctx, row.Client)
		if err != nil {
			field, message := "row", "could not be imported"
			if err == repositories.ErrDuplicateClientID {
				field, message = "clientId", "already exists"
			} else if err == repositories.ErrDuplicateClientEmail {
				field, message = "email", "already belongs to another client"
			}
			response.Errors = append(response.Errors, models.ClientImportError{RowNumber: row.RowNumber, Field: field, Message: message})
			failedRows[row.RowNumber] = struct{}{}
			continue
		}
		response.Clients = append(response.Clients, client)
	}
	response.Imported = len(response.Clients)
	response.Failed = len(failedRows)
	return response
}

func normalizeClientRequest(request *models.ClientUpsertRequest) {
	request.ID = strings.TrimSpace(request.ID)
	request.Name = strings.TrimSpace(request.Name)
	request.Email = strings.ToLower(strings.TrimSpace(request.Email))
	request.MobileNumber = strings.TrimSpace(request.MobileNumber)
	request.AssignedAdvisor = strings.TrimSpace(request.AssignedAdvisor)
	request.DateOfBirth = strings.TrimSpace(request.DateOfBirth)
	request.InvestmentGoal = strings.TrimSpace(request.InvestmentGoal)
	request.PortfolioID = strings.TrimSpace(request.PortfolioID)
	request.Notes = strings.TrimSpace(request.Notes)
}

func validateClientRequest(request models.ClientUpsertRequest) error {
	required := []struct{ field, value string }{
		{"clientId", request.ID}, {"clientName", request.Name}, {"email", request.Email},
		{"mobileNumber", request.MobileNumber}, {"assignedAdvisor", request.AssignedAdvisor}, {"status", string(request.Status)},
	}
	for _, item := range required {
		if item.value == "" {
			return &ClientValidationError{Field: item.field, Message: "is required"}
		}
	}
	if _, err := mail.ParseAddress(request.Email); err != nil || strings.ContainsAny(request.Email, " <>") {
		return &ClientValidationError{Field: "email", Message: "must be a valid email address"}
	}
	if request.Status != models.ClientStatusActive && request.Status != models.ClientStatusInactive {
		return &ClientValidationError{Field: "status", Message: "must be ACTIVE or INACTIVE"}
	}
	if request.RiskProfile != "" && request.RiskProfile != models.RiskConservative && request.RiskProfile != models.RiskModerate && request.RiskProfile != models.RiskGrowth && request.RiskProfile != models.RiskAggressive {
		return &ClientValidationError{Field: "riskProfile", Message: "is invalid"}
	}
	if request.DateOfBirth != "" {
		dateOfBirth, err := time.Parse("2006-01-02", request.DateOfBirth)
		if err != nil || dateOfBirth.After(time.Now()) {
			return &ClientValidationError{Field: "dateOfBirth", Message: "must be a valid past date in YYYY-MM-DD format"}
		}
	}
	return nil
}
