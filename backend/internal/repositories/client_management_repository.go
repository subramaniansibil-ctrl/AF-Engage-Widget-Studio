package repositories

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
)

var (
	ErrDuplicateClientID    = errors.New("client ID already exists")
	ErrDuplicateClientEmail = errors.New("client email already exists")
)

type ClientManagementRepository interface {
	ListManagedClients(ctx context.Context, filters models.ClientManagementFilters) ([]models.Client, error)
	GetManagedClientByID(ctx context.Context, id string) (models.Client, error)
	CreateManagedClient(ctx context.Context, request models.ClientUpsertRequest) (models.Client, error)
	UpdateManagedClient(ctx context.Context, id string, request models.ClientUpsertRequest) (models.Client, error)
	DeactivateManagedClient(ctx context.Context, id string) error
}

func (r *mockAdvisorRepository) ListManagedClients(ctx context.Context, filters models.ClientManagementFilters) ([]models.Client, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	search := strings.ToLower(strings.TrimSpace(filters.Search))
	clients := make([]models.Client, 0, len(r.clients))
	for _, client := range r.clients {
		searchable := strings.ToLower(client.ID + " " + client.Name + " " + client.Email + " " + client.AssignedAdvisor)
		if search != "" && !strings.Contains(searchable, search) {
			continue
		}
		if filters.Status != "" && client.Status != filters.Status {
			continue
		}
		if filters.AssignedAdvisor != "" && client.AssignedAdvisor != filters.AssignedAdvisor {
			continue
		}
		if filters.RecentlyCreated && client.CreatedAt.Before(time.Now().AddDate(0, 0, -30)) {
			continue
		}
		clients = append(clients, client)
	}
	return clients, nil
}

func (r *mockAdvisorRepository) GetManagedClientByID(ctx context.Context, id string) (models.Client, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, client := range r.clients {
		if client.ID == id {
			return client, nil
		}
	}
	return models.Client{}, ErrClientNotFound
}

func (r *mockAdvisorRepository) CreateManagedClient(ctx context.Context, request models.ClientUpsertRequest) (models.Client, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, client := range r.clients {
		if strings.EqualFold(client.ID, request.ID) {
			return models.Client{}, ErrDuplicateClientID
		}
		if strings.EqualFold(client.Email, request.Email) {
			return models.Client{}, ErrDuplicateClientEmail
		}
	}
	client := clientFromUpsertRequest(request)
	r.clients = append(r.clients, client)
	return client, nil
}

func (r *mockAdvisorRepository) UpdateManagedClient(ctx context.Context, id string, request models.ClientUpsertRequest) (models.Client, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, client := range r.clients {
		if client.ID != id && strings.EqualFold(client.Email, request.Email) {
			return models.Client{}, ErrDuplicateClientEmail
		}
	}
	for index, existing := range r.clients {
		if existing.ID != id {
			continue
		}
		updated := clientFromUpsertRequest(request)
		updated.ID = id
		updated.Portfolio = existing.Portfolio
		updated.RetirementGoal = existing.RetirementGoal
		updated.RetirementStage = existing.RetirementStage
		updated.CreatedAt = existing.CreatedAt
		r.clients[index] = updated
		return updated, nil
	}
	return models.Client{}, ErrClientNotFound
}

func (r *mockAdvisorRepository) DeactivateManagedClient(ctx context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for index := range r.clients {
		if r.clients[index].ID == id {
			r.clients[index].Status = models.ClientStatusInactive
			return nil
		}
	}
	return ErrClientNotFound
}

func clientFromUpsertRequest(request models.ClientUpsertRequest) models.Client {
	risk := request.RiskProfile
	if risk == "" {
		risk = models.RiskModerate
	}
	portfolioID := request.PortfolioID
	if portfolioID == "" {
		portfolioID = "portfolio-" + request.ID
	}
	return models.Client{
		ID:              request.ID,
		Name:            request.Name,
		Age:             ageFromDateOfBirth(request.DateOfBirth),
		Email:           strings.ToLower(request.Email),
		MobileNumber:    request.MobileNumber,
		AssignedAdvisor: request.AssignedAdvisor,
		Status:          request.Status,
		DateOfBirth:     request.DateOfBirth,
		RiskProfile:     risk,
		RetirementStage: models.RetirementStageAccumulation,
		InvestmentGoal:  request.InvestmentGoal,
		PortfolioID:     portfolioID,
		Notes:           request.Notes,
		CreatedAt:       time.Now(),
		Portfolio:       PortfolioZeroValue(),
		RetirementGoal:  models.RetirementGoal{TargetAge: 65},
	}
}

func PortfolioZeroValue() models.Portfolio {
	return models.Portfolio{}
}

func ageFromDateOfBirth(value string) int {
	dateOfBirth, err := time.Parse("2006-01-02", value)
	if err != nil {
		return 0
	}
	today := time.Now()
	age := today.Year() - dateOfBirth.Year()
	if today.YearDay() < dateOfBirth.YearDay() {
		age--
	}
	return age
}
