package repositories

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
)

var (
	ErrAdvisorNotFound       = errors.New("advisor not found")
	ErrDuplicateAdvisorID    = errors.New("advisor ID already exists")
	ErrDuplicateAdvisorEmail = errors.New("advisor email already exists")
)

type AdvisorManagementRepository interface {
	ListManagedAdvisors(ctx context.Context, filters models.AdvisorManagementFilters) ([]models.Advisor, error)
	GetManagedAdvisorByID(ctx context.Context, id string) (models.Advisor, error)
	CreateManagedAdvisor(ctx context.Context, request models.AdvisorUpsertRequest) (models.Advisor, error)
	UpdateManagedAdvisor(ctx context.Context, id string, request models.AdvisorUpsertRequest) (models.Advisor, error)
	DeactivateManagedAdvisor(ctx context.Context, id string) error
}

func (r *mockAdvisorRepository) ListManagedAdvisors(ctx context.Context, filters models.AdvisorManagementFilters) ([]models.Advisor, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	search := strings.ToLower(strings.TrimSpace(filters.Search))
	advisors := make([]models.Advisor, 0, len(r.advisors))
	for _, advisor := range r.advisors {
		searchable := strings.ToLower(advisor.ID + " " + advisor.Name + " " + advisor.Email)
		if search != "" && !strings.Contains(searchable, search) {
			continue
		}
		if filters.Status != "" && advisor.Status != filters.Status {
			continue
		}
		advisor.ClientCount = r.countClientsForAdvisor(advisor.Name)
		advisors = append(advisors, advisor)
	}
	return advisors, nil
}

func (r *mockAdvisorRepository) GetManagedAdvisorByID(ctx context.Context, id string) (models.Advisor, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, advisor := range r.advisors {
		if advisor.ID == id {
			advisor.ClientCount = r.countClientsForAdvisor(advisor.Name)
			return advisor, nil
		}
	}
	return models.Advisor{}, ErrAdvisorNotFound
}

func (r *mockAdvisorRepository) CreateManagedAdvisor(ctx context.Context, request models.AdvisorUpsertRequest) (models.Advisor, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, advisor := range r.advisors {
		if strings.EqualFold(advisor.ID, request.ID) {
			return models.Advisor{}, ErrDuplicateAdvisorID
		}
		if strings.EqualFold(advisor.Email, request.Email) {
			return models.Advisor{}, ErrDuplicateAdvisorEmail
		}
	}
	advisor := advisorFromUpsertRequest(request)
	r.advisors = append(r.advisors, advisor)
	return advisor, nil
}

func (r *mockAdvisorRepository) UpdateManagedAdvisor(ctx context.Context, id string, request models.AdvisorUpsertRequest) (models.Advisor, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, advisor := range r.advisors {
		if advisor.ID != id && strings.EqualFold(advisor.Email, request.Email) {
			return models.Advisor{}, ErrDuplicateAdvisorEmail
		}
	}
	for index, existing := range r.advisors {
		if existing.ID != id {
			continue
		}
		updated := advisorFromUpsertRequest(request)
		updated.ID = id
		updated.CreatedAt = existing.CreatedAt
		updated.ClientCount = r.countClientsForAdvisor(updated.Name)
		r.advisors[index] = updated
		return updated, nil
	}
	return models.Advisor{}, ErrAdvisorNotFound
}

func (r *mockAdvisorRepository) DeactivateManagedAdvisor(ctx context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for index := range r.advisors {
		if r.advisors[index].ID == id {
			r.advisors[index].Status = models.AdvisorStatusInactive
			return nil
		}
	}
	return ErrAdvisorNotFound
}

func advisorFromUpsertRequest(request models.AdvisorUpsertRequest) models.Advisor {
	return models.Advisor{
		ID:        request.ID,
		Name:      request.Name,
		Email:     strings.ToLower(request.Email),
		Status:    request.Status,
		CreatedAt: time.Now(),
	}
}

func (r *mockAdvisorRepository) countClientsForAdvisor(name string) int {
	count := 0
	for _, client := range r.clients {
		if client.AssignedAdvisor == name && client.Status == models.ClientStatusActive {
			count++
		}
	}
	return count
}
