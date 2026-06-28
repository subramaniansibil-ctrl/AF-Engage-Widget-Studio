package repositories

import (
	"context"
	"errors"
	"strings"
	"sync"
	"time"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
)

var ErrClientNotFound = errors.New("client not found")

type ClientFilters struct {
	Search          string
	RiskProfile     models.RiskProfile
	RetirementStage models.RetirementStage
	AssignedAdvisor string
}

type AdvisorRepository interface {
	GetDashboardStats(ctx context.Context) (models.AdvisorDashboardStats, error)
	ListClients(ctx context.Context, filters ClientFilters) ([]models.Client, error)
	GetClientByID(ctx context.Context, id string) (models.Client, error)
}

type mockAdvisorRepository struct {
	mu      sync.RWMutex
	clients []models.Client
}

func NewMockAdvisorRepository() *mockAdvisorRepository {
	return &mockAdvisorRepository{clients: mockClients()}
}

func (r *mockAdvisorRepository) GetDashboardStats(ctx context.Context) (models.AdvisorDashboardStats, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	totalAssets := int64(0)
	highRiskClients := 0
	activeClients := 0
	for _, client := range r.clients {
		if client.Status == models.ClientStatusInactive {
			continue
		}
		activeClients++
		totalAssets += client.Portfolio.TotalValue
		if client.RiskProfile == models.RiskAggressive || client.RiskProfile == models.RiskGrowth {
			highRiskClients++
		}
	}

	return models.AdvisorDashboardStats{
		TotalClients:           activeClients,
		TotalAssetsUnderAdvice: totalAssets,
		HighRiskClients:        highRiskClients,
		ActiveDashboards:       16,
		WidgetUsageSummary: []models.WidgetUsageSummary{
			{Name: "Retirement Readiness", Count: 14},
			{Name: "Risk Comfort Check", Count: 11},
			{Name: "Savings Pot Planner", Count: 9},
			{Name: "Portfolio Lens", Count: 7},
		},
	}, nil
}

func (r *mockAdvisorRepository) ListClients(ctx context.Context, filters ClientFilters) ([]models.Client, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	results := make([]models.Client, 0, len(r.clients))
	search := strings.ToLower(strings.TrimSpace(filters.Search))

	for _, client := range r.clients {
		if client.Status == models.ClientStatusInactive {
			continue
		}
		if search != "" && !strings.Contains(strings.ToLower(client.Name), search) && !strings.Contains(strings.ToLower(client.Email), search) {
			continue
		}
		if filters.RiskProfile != "" && client.RiskProfile != filters.RiskProfile {
			continue
		}
		if filters.RetirementStage != "" && client.RetirementStage != filters.RetirementStage {
			continue
		}
		if filters.AssignedAdvisor != "" && client.AssignedAdvisor != filters.AssignedAdvisor {
			continue
		}
		results = append(results, client)
	}

	return results, nil
}

func (r *mockAdvisorRepository) GetClientByID(ctx context.Context, id string) (models.Client, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, client := range r.clients {
		if client.ID == id {
			return client, nil
		}
	}
	return models.Client{}, ErrClientNotFound
}

func allocation(stocks float64, bonds float64, cash float64, alternatives float64) []models.InvestmentAllocation {
	return []models.InvestmentAllocation{
		{Label: "Equities", Category: "stocks", Percentage: stocks},
		{Label: "Fixed income", Category: "bonds", Percentage: bonds},
		{Label: "Cash", Category: "cash", Percentage: cash},
		{Label: "Alternatives", Category: "alternatives", Percentage: alternatives},
	}
}

func mockClients() []models.Client {
	return []models.Client{
		client("client-001", "Avery Chen", 42, "avery.chen@example.com", models.RiskModerate, models.RetirementStageAccumulation, 875000, 96000, 515000, 3200, 1800000, 62, allocation(58, 28, 8, 6)),
		client("client-002", "Jordan Patel", 35, "jordan.patel@example.com", models.RiskGrowth, models.RetirementStageAccumulation, 245000, 41000, 122000, 2100, 1250000, 65, allocation(72, 14, 9, 5)),
		client("client-003", "Sam Rivera", 61, "sam.rivera@example.com", models.RiskConservative, models.RetirementStagePreRetirement, 1325000, 210000, 865000, 4500, 2100000, 66, allocation(38, 48, 10, 4)),
		client("client-004", "Mina Thompson", 58, "mina.thompson@example.com", models.RiskModerate, models.RetirementStagePreRetirement, 1640000, 185000, 1100000, 5200, 2400000, 64, allocation(52, 34, 8, 6)),
		client("client-005", "Noah Williams", 29, "noah.williams@example.com", models.RiskAggressive, models.RetirementStageAccumulation, 118000, 22000, 54000, 1450, 1050000, 67, allocation(82, 6, 6, 6)),
		client("client-006", "Priya Nair", 47, "priya.nair@example.com", models.RiskGrowth, models.RetirementStageAccumulation, 690000, 78000, 402000, 3600, 1750000, 63, allocation(68, 18, 7, 7)),
		client("client-007", "Lucas Bennett", 66, "lucas.bennett@example.com", models.RiskConservative, models.RetirementStageRetired, 1510000, 260000, 980000, 0, 1900000, 66, allocation(32, 52, 12, 4)),
		client("client-008", "Elena Garcia", 54, "elena.garcia@example.com", models.RiskModerate, models.RetirementStagePreRetirement, 910000, 102000, 590000, 3900, 1800000, 65, allocation(55, 31, 9, 5)),
		client("client-009", "Marcus Lee", 39, "marcus.lee@example.com", models.RiskAggressive, models.RetirementStageAccumulation, 420000, 51000, 238000, 2800, 1550000, 64, allocation(80, 8, 5, 7)),
		client("client-010", "Olivia Brooks", 63, "olivia.brooks@example.com", models.RiskConservative, models.RetirementStageRetired, 1220000, 190000, 820000, 0, 1700000, 63, allocation(35, 50, 11, 4)),
		client("client-011", "Theo Martin", 45, "theo.martin@example.com", models.RiskModerate, models.RetirementStageAccumulation, 760000, 84000, 455000, 3400, 1600000, 65, allocation(57, 29, 8, 6)),
		client("client-012", "Grace Kim", 51, "grace.kim@example.com", models.RiskGrowth, models.RetirementStageAccumulation, 980000, 118000, 620000, 4100, 2050000, 64, allocation(70, 16, 7, 7)),
		client("client-013", "Ethan Ross", 57, "ethan.ross@example.com", models.RiskModerate, models.RetirementStagePreRetirement, 1185000, 130000, 790000, 4400, 2200000, 65, allocation(53, 33, 8, 6)),
		client("client-014", "Sophia Ahmed", 33, "sophia.ahmed@example.com", models.RiskGrowth, models.RetirementStageAccumulation, 315000, 52000, 178000, 2300, 1350000, 66, allocation(74, 12, 8, 6)),
		client("client-015", "Daniel Murphy", 60, "daniel.murphy@example.com", models.RiskConservative, models.RetirementStagePreRetirement, 1430000, 170000, 955000, 3900, 2000000, 64, allocation(40, 45, 10, 5)),
		client("client-016", "Isabella Carter", 44, "isabella.carter@example.com", models.RiskModerate, models.RetirementStageAccumulation, 625000, 69000, 365000, 3100, 1500000, 65, allocation(60, 26, 8, 6)),
		client("client-017", "Benjamin Foster", 37, "benjamin.foster@example.com", models.RiskAggressive, models.RetirementStageAccumulation, 385000, 47000, 210000, 2600, 1450000, 67, allocation(84, 5, 5, 6)),
		client("client-018", "Amara Wilson", 68, "amara.wilson@example.com", models.RiskConservative, models.RetirementStageRetired, 1725000, 310000, 1125000, 0, 2100000, 67, allocation(30, 54, 12, 4)),
		client("client-019", "Henry O'Neill", 49, "henry.oneill@example.com", models.RiskModerate, models.RetirementStageAccumulation, 845000, 91000, 525000, 3700, 1750000, 65, allocation(59, 27, 8, 6)),
		client("client-020", "Laila Hassan", 56, "laila.hassan@example.com", models.RiskGrowth, models.RetirementStagePreRetirement, 1090000, 125000, 705000, 4300, 2150000, 64, allocation(66, 20, 7, 7)),
	}
}

func client(id string, name string, age int, email string, risk models.RiskProfile, stage models.RetirementStage, total int64, savings int64, retirement int64, monthly int64, goal int64, targetAge int, allocation []models.InvestmentAllocation) models.Client {
	progress := int(float64(retirement) / float64(goal) * 100)
	if progress > 100 {
		progress = 100
	}

	return models.Client{
		ID:              id,
		Name:            name,
		Age:             age,
		Email:           email,
		MobileNumber:    "+1 555 0100",
		AssignedAdvisor: "Advisor User",
		Status:          models.ClientStatusActive,
		RiskProfile:     risk,
		InvestmentGoal:  "Long-term retirement security",
		PortfolioID:     "portfolio-" + id,
		CreatedAt:       time.Now().Add(-48 * time.Hour),
		RetirementStage: stage,
		Portfolio: models.Portfolio{
			TotalValue:           total,
			SavingsPotBalance:    savings,
			RetirementPotBalance: retirement,
			MonthlyContribution:  monthly,
			Allocation:           allocation,
		},
		RetirementGoal: models.RetirementGoal{
			TargetAmount: goal,
			TargetAge:    targetAge,
			Progress:     progress,
		},
	}
}
