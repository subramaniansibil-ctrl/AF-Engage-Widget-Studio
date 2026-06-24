package services

import (
	"context"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/repositories"
)

type ClientService interface {
	GetDashboard(ctx context.Context, clientID string) (models.ClientDashboardResponse, error)
	ListAssignedWidgets(ctx context.Context, clientID string) ([]models.DashboardAssignment, error)
	ListRecommendations(ctx context.Context, clientID string) ([]models.ClientRecommendation, error)
	SaveSimulation(ctx context.Context, clientID string, request models.SimulationRequest) (models.Simulation, error)
}

type clientService struct {
	advisorRepository repositories.AdvisorRepository
	widgetRepository  repositories.WidgetRepository
	clientRepository  repositories.ClientRepository
}

func NewClientService(advisorRepository repositories.AdvisorRepository, widgetRepository repositories.WidgetRepository, clientRepository repositories.ClientRepository) ClientService {
	return &clientService{
		advisorRepository: advisorRepository,
		widgetRepository:  widgetRepository,
		clientRepository:  clientRepository,
	}
}

func (s *clientService) GetDashboard(ctx context.Context, clientID string) (models.ClientDashboardResponse, error) {
	client, err := s.advisorRepository.GetClientByID(ctx, clientID)
	if err != nil {
		return models.ClientDashboardResponse{}, err
	}
	assignedWidgets, err := s.ListAssignedWidgets(ctx, clientID)
	if err != nil {
		return models.ClientDashboardResponse{}, err
	}
	recommendations, err := s.clientRepository.ListRecommendations(ctx, clientID)
	if err != nil {
		return models.ClientDashboardResponse{}, err
	}
	simulations, err := s.clientRepository.ListSimulations(ctx, clientID)
	if err != nil {
		return models.ClientDashboardResponse{}, err
	}

	return models.ClientDashboardResponse{
		ClientProfile:            client,
		PortfolioSummary:         client.Portfolio,
		AssignedWidgets:          assignedWidgets,
		RetirementGoalProgress:   client.RetirementGoal,
		Recommendations:          recommendations,
		LatestSimulations:        simulations,
		RetirementReadinessScore: client.RetirementGoal.Progress,
	}, nil
}

func (s *clientService) ListAssignedWidgets(ctx context.Context, clientID string) ([]models.DashboardAssignment, error) {
	assignments, err := s.widgetRepository.ListAssignedWidgets(ctx, clientID)
	if err != nil {
		return nil, err
	}

	published := make([]models.DashboardAssignment, 0, len(assignments))
	for _, assignment := range assignments {
		if assignment.Published {
			published = append(published, assignment)
		}
	}

	return published, nil
}

func (s *clientService) ListRecommendations(ctx context.Context, clientID string) ([]models.ClientRecommendation, error) {
	return s.clientRepository.ListRecommendations(ctx, clientID)
}

func (s *clientService) SaveSimulation(ctx context.Context, clientID string, request models.SimulationRequest) (models.Simulation, error) {
	return s.clientRepository.SaveSimulation(ctx, clientID, request)
}
