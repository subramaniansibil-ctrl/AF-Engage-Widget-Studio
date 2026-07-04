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

func NewPostgresAdvisorRepository(db *sql.DB) *postgresAdvisorRepository {
	return &postgresAdvisorRepository{db: db}
}

func (r *postgresAdvisorRepository) GetDashboardStats(ctx context.Context, advisorName string) (models.AdvisorDashboardStats, error) {
	var stats models.AdvisorDashboardStats
	args := []any{}
	if advisorName != "" {
		args = append(args, advisorName)
	}

	query := advisorDashboardScopeCte(advisorName) + `
		SELECT
			COUNT(c.id),
			COALESCE(SUM(p.total_value), 0),
			COUNT(c.id) FILTER (WHERE c.risk_profile IN ('GROWTH', 'AGGRESSIVE')),
			(
				SELECT COUNT(DISTINCT da.client_id)
				FROM dashboard_assignments da
				JOIN clients c ON c.id = da.client_id
				WHERE da.published = TRUE AND c.status = 'ACTIVE'` + advisorDashboardClientScope(advisorName) + `
			)
		FROM clients c
		LEFT JOIN portfolios p ON p.client_id = c.id
		WHERE c.status = 'ACTIVE'` + advisorDashboardClientScope(advisorName)

	err := r.db.QueryRowContext(ctx, query, args...).Scan(&stats.TotalClients, &stats.TotalAssetsUnderAdvice, &stats.HighRiskClients, &stats.ActiveDashboards)
	if err != nil {
		return models.AdvisorDashboardStats{}, err
	}

	rows, err := r.db.QueryContext(ctx, advisorDashboardScopeCte(advisorName)+`
		SELECT w.name, COALESCE(assignment_counts.assignment_count, 0) + COALESCE(simulation_counts.simulation_count, 0)
		FROM widgets w
		LEFT JOIN (
			SELECT da.widget_id, COUNT(*) AS assignment_count
			FROM dashboard_assignments da
			JOIN clients c ON c.id = da.client_id
			WHERE c.status = 'ACTIVE'`+advisorDashboardClientScope(advisorName)+`
			GROUP BY da.widget_id
		) assignment_counts ON assignment_counts.widget_id = w.id
		LEFT JOIN (
			SELECT sh.widget_id, COUNT(*) AS simulation_count
			FROM simulation_history sh
			JOIN clients c ON c.id = sh.client_id
			WHERE c.status = 'ACTIVE'`+advisorDashboardClientScope(advisorName)+`
			GROUP BY sh.widget_id
		) simulation_counts ON simulation_counts.widget_id = w.id
		ORDER BY COALESCE(assignment_counts.assignment_count, 0) + COALESCE(simulation_counts.simulation_count, 0) DESC, w.name
	`, args...)
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

func advisorDashboardScopeCte(advisorName string) string {
	if advisorName == "" {
		return ""
	}
	return `WITH advisor_clients AS (
		SELECT id
		FROM clients
		WHERE status = 'ACTIVE' AND assigned_advisor = $1
	) `
}

func advisorDashboardClientScope(advisorName string) string {
	if advisorName == "" {
		return ""
	}
	return " AND c.id IN (SELECT id FROM advisor_clients)"
}

func (r *postgresAdvisorRepository) ListClients(ctx context.Context, filters ClientFilters) ([]models.Client, int, error) {
	query := `
		SELECT c.id, c.name, c.age, c.email, c.mobile_number, c.assigned_advisor, c.status,
			COALESCE(TO_CHAR(c.date_of_birth, 'YYYY-MM-DD'), ''), c.risk_profile, c.retirement_stage,
			c.investment_goal, COALESCE(NULLIF(c.portfolio_reference, ''), p.id, ''), c.notes, c.created_at,
			COALESCE(p.total_value, 0), COALESCE(p.savings_pot_balance, 0), COALESCE(p.retirement_pot_balance, 0), COALESCE(p.monthly_contribution, 0),
			COALESCE(p.monthly_income, 0), COALESCE(p.monthly_expenses, 0), COALESCE(p.monthly_savings, 0), COALESCE(p.net_worth, 0),
			COALESCE(p.retirement_goal_target_amount, 0), COALESCE(p.retirement_goal_target_age, 65), COALESCE(p.retirement_goal_progress, 0)
		FROM clients c
		LEFT JOIN portfolios p ON p.client_id = c.id
		WHERE c.status = 'ACTIVE'
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
	if filters.AssignedAdvisor != "" {
		args = append(args, filters.AssignedAdvisor)
		query += " AND c.assigned_advisor = $" + argNumber(len(args))
	}
	countQuery := "SELECT COUNT(*) FROM (" + query + ") AS advisor_clients_count"
	query += " ORDER BY c.name"
	totalItems, err := r.countAdvisorClients(ctx, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	if filters.PageSize <= 0 {
		filters.PageSize = 10
	}
	if filters.Page <= 0 {
		filters.Page = 1
	}
	totalPages := (totalItems + filters.PageSize - 1) / filters.PageSize
	if totalPages < 1 {
		totalPages = 1
	}
	if filters.Page > totalPages {
		filters.Page = totalPages
	}
	query += " LIMIT $" + argNumber(len(args)+1) + " OFFSET $" + argNumber(len(args)+2)
	args = append(args, filters.PageSize, (filters.Page-1)*filters.PageSize)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	clients := []models.Client{}
	for rows.Next() {
		client, err := scanClient(rows)
		if err != nil {
			return nil, 0, err
		}
		clients = append(clients, client)
	}
	return clients, totalItems, rows.Err()
}

func (r *postgresAdvisorRepository) countAdvisorClients(ctx context.Context, query string, args ...any) (int, error) {
	var totalItems int
	if err := r.db.QueryRowContext(ctx, query, args...).Scan(&totalItems); err != nil {
		return 0, err
	}
	return totalItems, nil
}

func (r *postgresAdvisorRepository) GetClientByID(ctx context.Context, id string) (models.Client, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT c.id, c.name, c.age, c.email, c.mobile_number, c.assigned_advisor, c.status,
			COALESCE(TO_CHAR(c.date_of_birth, 'YYYY-MM-DD'), ''), c.risk_profile, c.retirement_stage,
			c.investment_goal, COALESCE(NULLIF(c.portfolio_reference, ''), p.id, ''), c.notes, c.created_at,
			COALESCE(p.total_value, 0), COALESCE(p.savings_pot_balance, 0), COALESCE(p.retirement_pot_balance, 0), COALESCE(p.monthly_contribution, 0),
			COALESCE(p.monthly_income, 0), COALESCE(p.monthly_expenses, 0), COALESCE(p.monthly_savings, 0), COALESCE(p.net_worth, 0),
			COALESCE(p.retirement_goal_target_amount, 0), COALESCE(p.retirement_goal_target_age, 65), COALESCE(p.retirement_goal_progress, 0)
		FROM clients c
		LEFT JOIN portfolios p ON p.client_id = c.id
		WHERE c.id = $1 AND c.status = 'ACTIVE'
	`, id)
	client, err := scanClient(row)
	if err == sql.ErrNoRows {
		return models.Client{}, ErrClientNotFound
	}
	if err != nil {
		return models.Client{}, err
	}
	return client, nil
}

type scanner interface {
	Scan(dest ...any) error
}

func scanClient(row scanner) (models.Client, error) {
	var client models.Client
	err := row.Scan(
		&client.ID,
		&client.Name,
		&client.Age,
		&client.Email,
		&client.MobileNumber,
		&client.AssignedAdvisor,
		&client.Status,
		&client.DateOfBirth,
		&client.RiskProfile,
		&client.RetirementStage,
		&client.InvestmentGoal,
		&client.PortfolioID,
		&client.Notes,
		&client.CreatedAt,
		&client.Portfolio.TotalValue,
		&client.Portfolio.SavingsPotBalance,
		&client.Portfolio.RetirementPotBalance,
		&client.Portfolio.MonthlyContribution,
		&client.Portfolio.MonthlyIncome,
		&client.Portfolio.MonthlyExpenses,
		&client.Portfolio.MonthlySavings,
		&client.Portfolio.NetWorth,
		&client.RetirementGoal.TargetAmount,
		&client.RetirementGoal.TargetAge,
		&client.RetirementGoal.Progress,
	)
	return client, err
}

func argNumber(value int) string {
	return strconv.Itoa(value)
}
