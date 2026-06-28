package services

import (
	"context"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/repositories"
)

type ClientService interface {
	GetDashboard(ctx context.Context, clientID string) (models.ClientDashboardResponse, error)
	ListAssignedWidgets(ctx context.Context, clientID string) ([]models.DashboardAssignment, error)
	GetAssignedWidget(ctx context.Context, clientID string, widgetID string) (models.DashboardAssignment, error)
	ListRecommendations(ctx context.Context, clientID string) ([]models.ClientRecommendation, error)
	ListSimulations(ctx context.Context, clientID string, widgetID string) ([]models.Simulation, error)
	SaveSimulation(ctx context.Context, clientID string, request models.SimulationRequest) (models.Simulation, error)
	UpdateSimulation(ctx context.Context, clientID string, simulationID string, request models.SimulationUpdateRequest) (models.Simulation, error)
	DuplicateSimulation(ctx context.Context, clientID string, simulationID string, name string) (models.Simulation, error)
	DeleteSimulation(ctx context.Context, clientID string, simulationID string) error
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
	simulations, err := s.clientRepository.ListSimulations(ctx, clientID, "")
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

func (s *clientService) GetAssignedWidget(ctx context.Context, clientID string, widgetID string) (models.DashboardAssignment, error) {
	assignments, err := s.ListAssignedWidgets(ctx, clientID)
	if err != nil {
		return models.DashboardAssignment{}, err
	}
	for _, assignment := range assignments {
		if assignment.WidgetID == widgetID {
			return assignment, nil
		}
	}
	return models.DashboardAssignment{}, repositories.ErrAssignmentNotFound
}

func (s *clientService) ListRecommendations(ctx context.Context, clientID string) ([]models.ClientRecommendation, error) {
	return s.clientRepository.ListRecommendations(ctx, clientID)
}

func (s *clientService) SaveSimulation(ctx context.Context, clientID string, request models.SimulationRequest) (models.Simulation, error) {
	return s.clientRepository.SaveSimulation(ctx, clientID, request)
}

func (s *clientService) ListSimulations(ctx context.Context, clientID string, widgetID string) ([]models.Simulation, error) {
	return s.clientRepository.ListSimulations(ctx, clientID, widgetID)
}

func (s *clientService) UpdateSimulation(ctx context.Context, clientID string, simulationID string, request models.SimulationUpdateRequest) (models.Simulation, error) {
	return s.clientRepository.UpdateSimulation(ctx, clientID, simulationID, request)
}

func (s *clientService) DuplicateSimulation(ctx context.Context, clientID string, simulationID string, name string) (models.Simulation, error) {
	return s.clientRepository.DuplicateSimulation(ctx, clientID, simulationID, name)
}

func (s *clientService) DeleteSimulation(ctx context.Context, clientID string, simulationID string) error {
	return s.clientRepository.DeleteSimulation(ctx, clientID, simulationID)
}
