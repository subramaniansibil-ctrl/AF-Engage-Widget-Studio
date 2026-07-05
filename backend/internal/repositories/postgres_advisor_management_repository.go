package repositories

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"github.com/af-engage-widget-studio/backend/internal/models"
)

func (r *postgresAdvisorRepository) ListManagedAdvisors(ctx context.Context, filters models.AdvisorManagementFilters) ([]models.Advisor, int, error) {
	query := managedAdvisorSelect + " WHERE u.role = 'ADVISOR'"
	args := []any{}
	if search := strings.TrimSpace(filters.Search); search != "" {
		args = append(args, "%"+strings.ToLower(search)+"%")
		placeholder := "$" + argNumber(len(args))
		query += " AND (LOWER(u.id) LIKE " + placeholder + " OR LOWER(u.name) LIKE " + placeholder + " OR LOWER(u.email) LIKE " + placeholder + ")"
	}
	if filters.Status != "" {
		args = append(args, filters.Status)
		query += " AND u.status = $" + argNumber(len(args))
	}
	query += " GROUP BY u.id, u.name, u.email, u.status, u.created_at"
	countQuery := "SELECT COUNT(*) FROM (" + query + ") AS advisor_count"
	query += " ORDER BY u.created_at DESC, u.name"
	totalItems, err := r.countManagedAdvisors(ctx, countQuery, args...)
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

	advisors := []models.Advisor{}
	for rows.Next() {
		advisor, err := scanManagedAdvisor(rows)
		if err != nil {
			return nil, 0, err
		}
		advisors = append(advisors, advisor)
	}
	return advisors, totalItems, rows.Err()
}

func (r *postgresAdvisorRepository) countManagedAdvisors(ctx context.Context, query string, args ...any) (int, error) {
	var totalItems int
	if err := r.db.QueryRowContext(ctx, query, args...).Scan(&totalItems); err != nil {
		return 0, err
	}
	return totalItems, nil
}

func (r *postgresAdvisorRepository) GetManagedAdvisorByID(ctx context.Context, id string) (models.Advisor, error) {
	advisor, err := scanManagedAdvisor(r.db.QueryRowContext(ctx, managedAdvisorSelect+" WHERE u.role = 'ADVISOR' AND u.id = $1 GROUP BY u.id, u.name, u.email, u.status, u.created_at", id))
	if errors.Is(err, sql.ErrNoRows) {
		return models.Advisor{}, ErrAdvisorNotFound
	}
	return advisor, err
}

func (r *postgresAdvisorRepository) CreateManagedAdvisor(ctx context.Context, request models.AdvisorUpsertRequest) (models.Advisor, error) {
	if err := r.ensureUniqueAdvisor(ctx, request.ID, request.Email, ""); err != nil {
		return models.Advisor{}, err
	}
	password := request.Password
	if password == "" {
		password = "password123"
	}
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO users (id, name, email, password_hash, role, status)
		VALUES ($1, $2, LOWER($3), $4, 'ADVISOR', $5)
	`, request.ID, request.Name, request.Email, password, request.Status)
	if err != nil {
		return models.Advisor{}, err
	}
	return r.GetManagedAdvisorByID(ctx, request.ID)
}

func (r *postgresAdvisorRepository) UpdateManagedAdvisor(ctx context.Context, id string, request models.AdvisorUpsertRequest) (models.Advisor, error) {
	if _, err := r.GetManagedAdvisorByID(ctx, id); err != nil {
		return models.Advisor{}, err
	}
	if err := r.ensureUniqueAdvisor(ctx, id, request.Email, id); err != nil {
		return models.Advisor{}, err
	}
	args := []any{id, request.Name, request.Email, request.Status}
	query := "UPDATE users SET name = $2, email = LOWER($3), status = $4"
	if request.Password != "" {
		args = append(args, request.Password)
		query += ", password_hash = $5"
	}
	query += " WHERE id = $1 AND role = 'ADVISOR'"
	if _, err := r.db.ExecContext(ctx, query, args...); err != nil {
		return models.Advisor{}, err
	}
	return r.GetManagedAdvisorByID(ctx, id)
}

func (r *postgresAdvisorRepository) DeactivateManagedAdvisor(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, "UPDATE users SET status = 'INACTIVE' WHERE id = $1 AND role = 'ADVISOR'", id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrAdvisorNotFound
	}
	return nil
}

func (r *postgresAdvisorRepository) ensureUniqueAdvisor(ctx context.Context, id, email, excludeID string) error {
	var existingID string
	err := r.db.QueryRowContext(ctx, `
		SELECT id FROM users
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
		return ErrDuplicateAdvisorID
	}
	return ErrDuplicateAdvisorEmail
}

const managedAdvisorSelect = `
	SELECT u.id, u.name, u.email, u.status, COALESCE(COUNT(c.id) FILTER (WHERE c.status = 'ACTIVE'), 0), u.created_at
	FROM users u
	LEFT JOIN clients c ON c.assigned_advisor = u.name
`

func scanManagedAdvisor(row scanner) (models.Advisor, error) {
	var advisor models.Advisor
	err := row.Scan(&advisor.ID, &advisor.Name, &advisor.Email, &advisor.Status, &advisor.ClientCount, &advisor.CreatedAt)
	return advisor, err
}
