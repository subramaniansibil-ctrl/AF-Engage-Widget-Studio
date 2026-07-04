package repositories

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
)

func (r *postgresAdvisorRepository) ListManagedClients(ctx context.Context, filters models.ClientManagementFilters) ([]models.Client, int, error) {
	query := managedClientSelect + " WHERE 1=1"
	args := []any{}
	if search := strings.TrimSpace(filters.Search); search != "" {
		args = append(args, "%"+strings.ToLower(search)+"%")
		placeholder := "$" + argNumber(len(args))
		query += " AND (LOWER(c.id) LIKE " + placeholder + " OR LOWER(c.name) LIKE " + placeholder + " OR LOWER(c.email) LIKE " + placeholder + " OR LOWER(c.assigned_advisor) LIKE " + placeholder + ")"
	}
	if filters.Status != "" {
		args = append(args, filters.Status)
		query += " AND c.status = $" + argNumber(len(args))
	}
	if advisor := strings.TrimSpace(filters.AssignedAdvisor); advisor != "" {
		args = append(args, advisor)
		query += " AND c.assigned_advisor = $" + argNumber(len(args))
	}
	if filters.RecentlyCreated {
		query += " AND c.created_at >= NOW() - INTERVAL '30 days'"
	}
	countQuery := "SELECT COUNT(*) FROM (" + query + ") AS managed_clients_count"
	orderBy := "c.created_at"
	switch filters.SortBy {
	case "name":
		orderBy = "LOWER(c.name)"
	case "status":
		orderBy = "c.status"
	case "advisor":
		orderBy = "LOWER(c.assigned_advisor)"
	}
	direction := "DESC"
	if strings.EqualFold(filters.SortOrder, "asc") {
		direction = "ASC"
	}
	query += " ORDER BY " + orderBy + " " + direction + ", LOWER(c.name) ASC"
	totalItems, err := r.countManagedClients(ctx, countQuery, args...)
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
		client, err := scanManagedClient(rows)
		if err != nil {
			return nil, 0, err
		}
		clients = append(clients, client)
	}
	return clients, totalItems, rows.Err()
}

func (r *postgresAdvisorRepository) countManagedClients(ctx context.Context, query string, args ...any) (int, error) {
	var totalItems int
	if err := r.db.QueryRowContext(ctx, query, args...).Scan(&totalItems); err != nil {
		return 0, err
	}
	return totalItems, nil
}

func (r *postgresAdvisorRepository) GetManagedClientByID(ctx context.Context, id string) (models.Client, error) {
	client, err := scanManagedClient(r.db.QueryRowContext(ctx, managedClientSelect+" WHERE c.id = $1", id))
	if errors.Is(err, sql.ErrNoRows) {
		return models.Client{}, ErrClientNotFound
	}
	return client, err
}

func (r *postgresAdvisorRepository) CreateManagedClient(ctx context.Context, request models.ClientUpsertRequest) (models.Client, error) {
	if err := r.ensureUniqueClient(ctx, request.ID, request.Email, ""); err != nil {
		return models.Client{}, err
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return models.Client{}, err
	}
	defer tx.Rollback()

	risk := request.RiskProfile
	if risk == "" {
		risk = models.RiskModerate
	}
	portfolioReference := request.PortfolioID
	if portfolioReference == "" {
		portfolioReference = "portfolio-" + request.ID
	}
	var dateOfBirth any
	if request.DateOfBirth != "" {
		dateOfBirth = request.DateOfBirth
	}
	_, err = tx.ExecContext(ctx, `
		INSERT INTO clients (
			id, name, age, email, mobile_number, assigned_advisor, status, date_of_birth,
			risk_profile, retirement_stage, investment_goal, portfolio_reference, notes
		) VALUES ($1, $2, $3, LOWER($4), $5, $6, $7, $8, $9, 'ACCUMULATION', $10, $11, $12)
	`, request.ID, request.Name, ageFromDateOfBirth(request.DateOfBirth), request.Email, request.MobileNumber,
		request.AssignedAdvisor, request.Status, dateOfBirth, risk, request.InvestmentGoal, portfolioReference, request.Notes)
	if err != nil {
		return models.Client{}, err
	}
	_, err = tx.ExecContext(ctx, `
		INSERT INTO portfolios (
			id, client_id, total_value, savings_pot_balance, retirement_pot_balance, monthly_contribution,
			monthly_income, monthly_expenses, monthly_savings, net_worth,
			retirement_goal_target_amount, retirement_goal_target_age, retirement_goal_progress
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, 65, 0)
	`, "portfolio-"+request.ID, request.ID, nonNegativeInt64(request.Portfolio.TotalValue),
		nonNegativeInt64(request.Portfolio.SavingsPotBalance), nonNegativeInt64(request.Portfolio.RetirementPotBalance),
		nonNegativeInt64(request.Portfolio.MonthlyContribution), nonNegativeInt64(request.Portfolio.MonthlyIncome),
		nonNegativeInt64(request.Portfolio.MonthlyExpenses), nonNegativeInt64(request.Portfolio.MonthlySavings),
		nonNegativeInt64(request.Portfolio.NetWorth))
	if err != nil {
		return models.Client{}, err
	}
	if err := tx.Commit(); err != nil {
		return models.Client{}, err
	}
	return r.GetManagedClientByID(ctx, request.ID)
}

func (r *postgresAdvisorRepository) UpdateManagedClient(ctx context.Context, id string, request models.ClientUpsertRequest) (models.Client, error) {
	if _, err := r.GetManagedClientByID(ctx, id); err != nil {
		return models.Client{}, err
	}
	if err := r.ensureUniqueClient(ctx, id, request.Email, id); err != nil {
		return models.Client{}, err
	}
	risk := request.RiskProfile
	if risk == "" {
		risk = models.RiskModerate
	}
	var dateOfBirth any
	if request.DateOfBirth != "" {
		dateOfBirth = request.DateOfBirth
	}
	_, err := r.db.ExecContext(ctx, `
		UPDATE clients SET
			name = $2, age = $3, email = LOWER($4), mobile_number = $5, assigned_advisor = $6,
			status = $7, date_of_birth = $8, risk_profile = $9, investment_goal = $10,
			portfolio_reference = $11, notes = $12
		WHERE id = $1
	`, id, request.Name, ageFromDateOfBirth(request.DateOfBirth), request.Email, request.MobileNumber,
		request.AssignedAdvisor, request.Status, dateOfBirth, risk, request.InvestmentGoal, request.PortfolioID, request.Notes)
	if err != nil {
		return models.Client{}, err
	}
	updateResult, err := r.db.ExecContext(ctx, `
		UPDATE portfolios SET
			total_value = $2, savings_pot_balance = $3, retirement_pot_balance = $4, monthly_contribution = $5,
			monthly_income = $6, monthly_expenses = $7, monthly_savings = $8, net_worth = $9
		WHERE client_id = $1
	`, id, nonNegativeInt64(request.Portfolio.TotalValue), nonNegativeInt64(request.Portfolio.SavingsPotBalance),
		nonNegativeInt64(request.Portfolio.RetirementPotBalance), nonNegativeInt64(request.Portfolio.MonthlyContribution),
		nonNegativeInt64(request.Portfolio.MonthlyIncome), nonNegativeInt64(request.Portfolio.MonthlyExpenses),
		nonNegativeInt64(request.Portfolio.MonthlySavings), nonNegativeInt64(request.Portfolio.NetWorth))
	if err != nil {
		return models.Client{}, err
	}
	rowsAffected, err := updateResult.RowsAffected()
	if err != nil {
		return models.Client{}, err
	}
	if rowsAffected == 0 {
		_, err = r.db.ExecContext(ctx, `
			INSERT INTO portfolios (
				id, client_id, total_value, savings_pot_balance, retirement_pot_balance, monthly_contribution,
				monthly_income, monthly_expenses, monthly_savings, net_worth,
				retirement_goal_target_amount, retirement_goal_target_age, retirement_goal_progress
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, 65, 0)
		`, "portfolio-"+id, id, nonNegativeInt64(request.Portfolio.TotalValue),
			nonNegativeInt64(request.Portfolio.SavingsPotBalance), nonNegativeInt64(request.Portfolio.RetirementPotBalance),
			nonNegativeInt64(request.Portfolio.MonthlyContribution), nonNegativeInt64(request.Portfolio.MonthlyIncome),
			nonNegativeInt64(request.Portfolio.MonthlyExpenses), nonNegativeInt64(request.Portfolio.MonthlySavings),
			nonNegativeInt64(request.Portfolio.NetWorth))
		if err != nil {
			return models.Client{}, err
		}
	}
	return r.GetManagedClientByID(ctx, id)
}

func (r *postgresAdvisorRepository) DeactivateManagedClient(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, "UPDATE clients SET status = 'INACTIVE' WHERE id = $1", id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrClientNotFound
	}
	return nil
}

func (r *postgresAdvisorRepository) ensureUniqueClient(ctx context.Context, id, email, excludeID string) error {
	var existingID string
	err := r.db.QueryRowContext(ctx, `
		SELECT id FROM clients
		WHERE (LOWER(id) = LOWER($1) OR LOWER(email) = LOWER($2)) AND id <> $3
		ORDER BY CASE WHEN LOWER(id) = LOWER($1) THEN 0 ELSE 1 END
		LIMIT 1
	`, id, email, excludeID).Scan(&existingID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil
	}
	if err != nil {
		return err
	}
	if strings.EqualFold(existingID, id) {
		return ErrDuplicateClientID
	}
	return ErrDuplicateClientEmail
}

const managedClientSelect = `
	SELECT c.id, c.name, c.age, c.email, c.mobile_number, c.assigned_advisor, c.status,
		COALESCE(TO_CHAR(c.date_of_birth, 'YYYY-MM-DD'), ''), c.risk_profile, c.retirement_stage,
		c.investment_goal, COALESCE(NULLIF(c.portfolio_reference, ''), p.id, ''), c.notes, c.created_at,
		COALESCE(p.total_value, 0), COALESCE(p.savings_pot_balance, 0), COALESCE(p.retirement_pot_balance, 0), COALESCE(p.monthly_contribution, 0),
		COALESCE(p.monthly_income, 0), COALESCE(p.monthly_expenses, 0), COALESCE(p.monthly_savings, 0), COALESCE(p.net_worth, 0),
		COALESCE(p.retirement_goal_target_amount, 0), COALESCE(p.retirement_goal_target_age, 65), COALESCE(p.retirement_goal_progress, 0)
	FROM clients c
	LEFT JOIN portfolios p ON p.client_id = c.id
`

func scanManagedClient(row scanner) (models.Client, error) {
	var client models.Client
	err := row.Scan(
		&client.ID, &client.Name, &client.Age, &client.Email, &client.MobileNumber,
		&client.AssignedAdvisor, &client.Status, &client.DateOfBirth, &client.RiskProfile,
		&client.RetirementStage, &client.InvestmentGoal, &client.PortfolioID, &client.Notes,
		&client.CreatedAt, &client.Portfolio.TotalValue, &client.Portfolio.SavingsPotBalance,
		&client.Portfolio.RetirementPotBalance, &client.Portfolio.MonthlyContribution,
		&client.Portfolio.MonthlyIncome, &client.Portfolio.MonthlyExpenses,
		&client.Portfolio.MonthlySavings, &client.Portfolio.NetWorth,
		&client.RetirementGoal.TargetAmount, &client.RetirementGoal.TargetAge, &client.RetirementGoal.Progress,
	)
	return client, err
}

func nonNegativeInt64(value int64) int64 {
	if value < 0 {
		return 0
	}
	return value
}
