package services

import (
	"context"
	"net/mail"
	"strings"

	"github.com/af-engage-widget-studio/backend/internal/models"
	"github.com/af-engage-widget-studio/backend/internal/repositories"
)

type AdvisorManagementService interface {
	ListAdvisors(ctx context.Context, filters models.AdvisorManagementFilters) ([]models.Advisor, int, error)
	GetAdvisor(ctx context.Context, id string) (models.Advisor, error)
	CreateAdvisor(ctx context.Context, request models.AdvisorUpsertRequest) (models.Advisor, error)
	UpdateAdvisor(ctx context.Context, id string, request models.AdvisorUpsertRequest) (models.Advisor, error)
	DeactivateAdvisor(ctx context.Context, id string) error
}

type AdvisorValidationError struct {
	Field   string
	Message string
}

func (e *AdvisorValidationError) Error() string {
	return e.Field + " " + e.Message
}

type advisorManagementService struct {
	repository repositories.AdvisorManagementRepository
}

func NewAdvisorManagementService(repository repositories.AdvisorManagementRepository) AdvisorManagementService {
	return &advisorManagementService{repository: repository}
}

func (s *advisorManagementService) ListAdvisors(ctx context.Context, filters models.AdvisorManagementFilters) ([]models.Advisor, int, error) {
	return s.repository.ListManagedAdvisors(ctx, filters)
}

func (s *advisorManagementService) GetAdvisor(ctx context.Context, id string) (models.Advisor, error) {
	return s.repository.GetManagedAdvisorByID(ctx, id)
}

func (s *advisorManagementService) CreateAdvisor(ctx context.Context, request models.AdvisorUpsertRequest) (models.Advisor, error) {
	normalizeAdvisorRequest(&request)
	if err := validateAdvisorRequest(request, true); err != nil {
		return models.Advisor{}, err
	}
	return s.repository.CreateManagedAdvisor(ctx, request)
}

func (s *advisorManagementService) UpdateAdvisor(ctx context.Context, id string, request models.AdvisorUpsertRequest) (models.Advisor, error) {
	normalizeAdvisorRequest(&request)
	request.ID = id
	if err := validateAdvisorRequest(request, false); err != nil {
		return models.Advisor{}, err
	}
	return s.repository.UpdateManagedAdvisor(ctx, id, request)
}

func (s *advisorManagementService) DeactivateAdvisor(ctx context.Context, id string) error {
	return s.repository.DeactivateManagedAdvisor(ctx, id)
}

func normalizeAdvisorRequest(request *models.AdvisorUpsertRequest) {
	request.ID = strings.TrimSpace(request.ID)
	request.Name = strings.TrimSpace(request.Name)
	request.Email = strings.ToLower(strings.TrimSpace(request.Email))
	request.Password = strings.TrimSpace(request.Password)
}

func validateAdvisorRequest(request models.AdvisorUpsertRequest, passwordRequired bool) error {
	required := []struct{ field, value string }{
		{"advisorId", request.ID}, {"advisorName", request.Name}, {"email", request.Email}, {"status", string(request.Status)},
	}
	for _, item := range required {
		if item.value == "" {
			return &AdvisorValidationError{Field: item.field, Message: "is required"}
		}
	}
	if _, err := mail.ParseAddress(request.Email); err != nil || strings.ContainsAny(request.Email, " <>") {
		return &AdvisorValidationError{Field: "email", Message: "must be a valid email address"}
	}
	if request.Status != models.AdvisorStatusActive && request.Status != models.AdvisorStatusInactive {
		return &AdvisorValidationError{Field: "status", Message: "must be ACTIVE or INACTIVE"}
	}
	if passwordRequired && request.Password == "" {
		return &AdvisorValidationError{Field: "password", Message: "is required"}
	}
	if request.Password != "" && len(request.Password) < 8 {
		return &AdvisorValidationError{Field: "password", Message: "must be at least 8 characters"}
	}
	return nil
}
