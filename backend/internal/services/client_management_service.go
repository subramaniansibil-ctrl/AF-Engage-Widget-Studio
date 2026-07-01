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
	ListClients(ctx context.Context, filters models.ClientManagementFilters, actor ...models.User) ([]models.Client, error)
	GetClient(ctx context.Context, id string, actor ...models.User) (models.Client, error)
	CreateClient(ctx context.Context, request models.ClientUpsertRequest, actor ...models.User) (models.Client, error)
	UpdateClient(ctx context.Context, id string, request models.ClientUpsertRequest, actor ...models.User) (models.Client, error)
	DeactivateClient(ctx context.Context, id string, actor ...models.User) error
	ImportClients(ctx context.Context, request models.BulkClientImportRequest, actor ...models.User) models.BulkClientImportResponse
}

type ClientValidationError struct {
	Field   string
	Message string
}

func (e *ClientValidationError) Error() string {
	return e.Field + " " + e.Message
}

type clientManagementService struct {
	repository     repositories.ClientManagementRepository
	authRepository repositories.AuthRepository
	advisors       repositories.AdvisorManagementRepository
}

func NewClientManagementService(repository repositories.ClientManagementRepository, authRepository repositories.AuthRepository, advisors ...repositories.AdvisorManagementRepository) ClientManagementService {
	service := &clientManagementService{repository: repository, authRepository: authRepository}
	if len(advisors) > 0 {
		service.advisors = advisors[0]
	}
	return service
}

func (s *clientManagementService) ListClients(ctx context.Context, filters models.ClientManagementFilters, actors ...models.User) ([]models.Client, error) {
	actor := managementActor(actors)
	if actor.Role == models.RoleAdvisor {
		filters.AssignedAdvisor = actor.Name
	}
	return s.repository.ListManagedClients(ctx, filters)
}

func (s *clientManagementService) GetClient(ctx context.Context, id string, actors ...models.User) (models.Client, error) {
	client, err := s.repository.GetManagedClientByID(ctx, id)
	if err != nil {
		return models.Client{}, err
	}
	actor := managementActor(actors)
	if actor.Role == models.RoleAdvisor && client.AssignedAdvisor != actor.Name {
		return models.Client{}, repositories.ErrClientNotFound
	}
	return client, nil
}

func (s *clientManagementService) CreateClient(ctx context.Context, request models.ClientUpsertRequest, actors ...models.User) (models.Client, error) {
	actor := managementActor(actors)
	if err := s.applyAdvisorAssignment(ctx, &request, actor, ""); err != nil {
		return models.Client{}, err
	}
	normalizeClientRequest(&request)
	if err := validateClientRequest(request, true); err != nil {
		return models.Client{}, err
	}
	if s.authRepository != nil {
		exists, err := s.authRepository.EmailExists(ctx, request.Email)
		if err != nil {
			return models.Client{}, err
		}
		if exists {
			return models.Client{}, repositories.ErrDuplicateClientEmail
		}
	}
	client, err := s.repository.CreateManagedClient(ctx, request)
	if err != nil {
		return models.Client{}, err
	}
	if s.authRepository != nil && request.Password != "" {
		if err := s.authRepository.CreateUser(ctx, models.User{
			ID:       "user-client-" + request.ID,
			Name:     request.Name,
			Email:    request.Email,
			Role:     models.RoleClient,
			ClientID: request.ID,
			Status:   string(models.ClientStatusActive),
		}, request.Password); err != nil {
			return models.Client{}, err
		}
	}
	return client, nil
}

func (s *clientManagementService) UpdateClient(ctx context.Context, id string, request models.ClientUpsertRequest, actors ...models.User) (models.Client, error) {
	actor := managementActor(actors)
	existing, err := s.repository.GetManagedClientByID(ctx, id)
	if err != nil {
		return models.Client{}, err
	}
	if actor.Role == models.RoleAdvisor && existing.AssignedAdvisor != actor.Name {
		return models.Client{}, repositories.ErrClientNotFound
	}
	if err := s.applyAdvisorAssignment(ctx, &request, actor, existing.AssignedAdvisor); err != nil {
		return models.Client{}, err
	}
	normalizeClientRequest(&request)
	request.ID = id
	if err := validateClientRequest(request, false); err != nil {
		return models.Client{}, err
	}
	return s.repository.UpdateManagedClient(ctx, id, request)
}

func (s *clientManagementService) DeactivateClient(ctx context.Context, id string, actors ...models.User) error {
	actor := managementActor(actors)
	if actor.Role == models.RoleAdvisor {
		client, err := s.repository.GetManagedClientByID(ctx, id)
		if err != nil {
			return err
		}
		if client.AssignedAdvisor != actor.Name {
			return repositories.ErrClientNotFound
		}
	}
	return s.repository.DeactivateManagedClient(ctx, id)
}

func (s *clientManagementService) ImportClients(ctx context.Context, request models.BulkClientImportRequest, actors ...models.User) models.BulkClientImportResponse {
	actor := managementActor(actors)
	response := models.BulkClientImportResponse{Clients: []models.Client{}, Errors: []models.ClientImportError{}}
	seenIDs := map[string]int{}
	seenEmails := map[string]int{}
	failedRows := map[int]struct{}{}

	for _, row := range request.Rows {
		if err := s.applyAdvisorAssignment(ctx, &row.Client, actor, ""); err != nil {
			field, message := "assignedAdvisor", "could not be validated"
			if validationError, ok := err.(*ClientValidationError); ok {
				field, message = validationError.Field, validationError.Message
			}
			response.Errors = append(response.Errors, models.ClientImportError{RowNumber: row.RowNumber, Field: field, Message: message})
			failedRows[row.RowNumber] = struct{}{}
			continue
		}
		normalizeClientRequest(&row.Client)
		rowErrors := []models.ClientImportError{}
		if err := validateClientRequest(row.Client, false); err != nil {
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

func managementActor(actors []models.User) models.User {
	if len(actors) > 0 {
		return actors[0]
	}
	return models.User{Role: models.RoleAdmin}
}

func (s *clientManagementService) applyAdvisorAssignment(ctx context.Context, request *models.ClientUpsertRequest, actor models.User, existingAdvisor string) error {
	if actor.Role == models.RoleAdvisor {
		request.AssignedAdvisor = actor.Name
		return nil
	}
	if actor.Role != models.RoleAdmin {
		return &ClientValidationError{Field: "assignedAdvisor", Message: "can only be changed by an admin"}
	}
	if existingAdvisor != "" && strings.TrimSpace(request.AssignedAdvisor) == "" {
		request.AssignedAdvisor = existingAdvisor
	}
	if strings.TrimSpace(request.AssignedAdvisor) == "" {
		return &ClientValidationError{Field: "assignedAdvisor", Message: "is required"}
	}
	if s.advisors == nil {
		return nil
	}
	items, err := s.advisors.ListManagedAdvisors(ctx, models.AdvisorManagementFilters{Status: models.AdvisorStatusActive})
	if err != nil {
		return err
	}
	for _, advisor := range items {
		if strings.EqualFold(advisor.Name, request.AssignedAdvisor) {
			request.AssignedAdvisor = advisor.Name
			return nil
		}
	}
	return &ClientValidationError{Field: "assignedAdvisor", Message: "must match an active advisor"}
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
	request.Password = strings.TrimSpace(request.Password)
	request.ConfirmPassword = strings.TrimSpace(request.ConfirmPassword)
}

func validateClientRequest(request models.ClientUpsertRequest, passwordRequired bool) error {
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
	if passwordRequired || request.Password != "" {
		if passwordRequired && request.Password == "" {
			return &ClientValidationError{Field: "password", Message: "is required"}
		}
		if request.Password != "" && len(request.Password) < 8 {
			return &ClientValidationError{Field: "password", Message: "must be at least 8 characters"}
		}
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
