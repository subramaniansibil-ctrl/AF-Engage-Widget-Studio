package repositories

import (
	"context"
	"database/sql"
	"strconv"
	"strings"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
)

type postgresAdvisorRepository struct {
	db *sql.DB
}

func NewPostgresAdvisorRepository(db *sql.DB) AdvisorRepository {
	return &postgresAdvisorRepository{db: db}
}

func (r *postgresAdvisorRepository) GetDashboardStats(ctx context.Context) (models.AdvisorDashboardStats, error) {
	var stats models.AdvisorDashboardStats
	err := r.db.QueryRowContext(ctx, `
		SELECT
			COUNT(c.id),
			COALESCE(SUM(p.total_value), 0),
			COUNT(c.id) FILTER (WHERE c.risk_profile IN ('GROWTH', 'AGGRESSIVE')),
			(SELECT COUNT(DISTINCT client_id) FROM dashboard_assignments WHERE published = TRUE)
		FROM clients c
		LEFT JOIN portfolios p ON p.client_id = c.id
	`).Scan(&stats.TotalClients, &stats.TotalAssetsUnderAdvice, &stats.HighRiskClients, &stats.ActiveDashboards)
	if err != nil {
		return models.AdvisorDashboardStats{}, err
	}

	rows, err := r.db.QueryContext(ctx, `
		SELECT w.name, COUNT(da.id)
		FROM widgets w
		LEFT JOIN dashboard_assignments da ON da.widget_id = w.id
		GROUP BY w.name
		ORDER BY COUNT(da.id) DESC, w.name
	`)
	if err != nil {
		return models.AdvisorDashboardStats{}, err
	}
	defer rows.Close()
	for rows.Next() {
		var item models.WidgetUsageSummary
		if err := rows.Scan(&item.Name, &item.Count); err != nil {
			return models.AdvisorDashboardStats{}, err
		}
		stats.WidgetUsageSummary = append(stats.WidgetUsageSummary, item)
	}

	return stats, rows.Err()
}

func (r *postgresAdvisorRepository) ListClients(ctx context.Context, filters ClientFilters) ([]models.Client, error) {
	query := `
		SELECT c.id, c.name, c.age, c.email, c.risk_profile, c.retirement_stage,
			p.id, p.total_value, p.savings_pot_balance, p.retirement_pot_balance, p.monthly_contribution,
			p.retirement_goal_target_amount, p.retirement_goal_target_age, p.retirement_goal_progress
		FROM clients c
		JOIN portfolios p ON p.client_id = c.id
		WHERE 1=1
	`
	args := []any{}
	if search := strings.TrimSpace(filters.Search); search != "" {
		args = append(args, "%"+strings.ToLower(search)+"%")
		query += " AND (LOWER(c.name) LIKE $" + argNumber(len(args)) + " OR LOWER(c.email) LIKE $" + argNumber(len(args)) + ")"
	}
	if filters.RiskProfile != "" {
		args = append(args, filters.RiskProfile)
		query += " AND c.risk_profile = $" + argNumber(len(args))
	}
	if filters.RetirementStage != "" {
		args = append(args, filters.RetirementStage)
		query += " AND c.retirement_stage = $" + argNumber(len(args))
	}
	query += " ORDER BY c.name"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	clients := []models.Client{}
	for rows.Next() {
		client, portfolioID, err := scanClient(rows)
		if err != nil {
			return nil, err
		}
		allocation, err := r.listAllocation(ctx, portfolioID)
		if err != nil {
			return nil, err
		}
		client.Portfolio.Allocation = allocation
		clients = append(clients, client)
	}
	return clients, rows.Err()
}

func (r *postgresAdvisorRepository) GetClientByID(ctx context.Context, id string) (models.Client, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT c.id, c.name, c.age, c.email, c.risk_profile, c.retirement_stage,
			p.id, p.total_value, p.savings_pot_balance, p.retirement_pot_balance, p.monthly_contribution,
			p.retirement_goal_target_amount, p.retirement_goal_target_age, p.retirement_goal_progress
		FROM clients c
		JOIN portfolios p ON p.client_id = c.id
		WHERE c.id = $1
	`, id)
	client, portfolioID, err := scanClient(row)
	if err == sql.ErrNoRows {
		return models.Client{}, ErrClientNotFound
	}
	if err != nil {
		return models.Client{}, err
	}
	allocation, err := r.listAllocation(ctx, portfolioID)
	if err != nil {
		return models.Client{}, err
	}
	client.Portfolio.Allocation = allocation
	return client, nil
}

type scanner interface {
	Scan(dest ...any) error
}

func scanClient(row scanner) (models.Client, string, error) {
	var client models.Client
	var portfolioID string
	err := row.Scan(
		&client.ID,
		&client.Name,
		&client.Age,
		&client.Email,
		&client.RiskProfile,
		&client.RetirementStage,
		&portfolioID,
		&client.Portfolio.TotalValue,
		&client.Portfolio.SavingsPotBalance,
		&client.Portfolio.RetirementPotBalance,
		&client.Portfolio.MonthlyContribution,
		&client.RetirementGoal.TargetAmount,
		&client.RetirementGoal.TargetAge,
		&client.RetirementGoal.Progress,
	)
	return client, portfolioID, err
}

func (r *postgresAdvisorRepository) listAllocation(ctx context.Context, portfolioID string) ([]models.InvestmentAllocation, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT label, category, percentage
		FROM investment_allocations
		WHERE portfolio_id = $1
		ORDER BY sort_order, label
	`, portfolioID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	allocation := []models.InvestmentAllocation{}
	for rows.Next() {
		var item models.InvestmentAllocation
		if err := rows.Scan(&item.Label, &item.Category, &item.Percentage); err != nil {
			return nil, err
		}
		allocation = append(allocation, item)
	}
	return allocation, rows.Err()
}

func argNumber(value int) string {
	return strconv.Itoa(value)
}
