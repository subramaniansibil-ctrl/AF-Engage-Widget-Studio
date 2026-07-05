package repositories

import (
	"context"
	"database/sql"
	"strings"
	"sync"

	"github.com/af-engage-widget-studio/backend/internal/models"
)

type postgresAuthRepository struct {
	db     *sql.DB
	mu     sync.RWMutex
	tokens map[string]models.User
}

func NewPostgresAuthRepository(db *sql.DB) AuthRepository {
	return &postgresAuthRepository{db: db, tokens: make(map[string]models.User)}
}

func (r *postgresAuthRepository) Authenticate(ctx context.Context, email string, password string) (models.User, string, error) {
	var user models.User
	var storedPassword string
	var clientID sql.NullString
	err := r.db.QueryRowContext(ctx, `
		SELECT id, name, email, role, COALESCE(password_hash, ''), client_id, COALESCE(status, 'ACTIVE')
		FROM users
		WHERE LOWER(email) = LOWER($1)
	`, email).Scan(&user.ID, &user.Name, &user.Email, &user.Role, &storedPassword, &clientID, &user.Status)
	if err == sql.ErrNoRows || !verifyPassword(storedPassword, password) {
		return models.User{}, "", ErrInvalidCredentials
	}
	if err != nil {
		return models.User{}, "", err
	}
	if user.Status == string(models.AdvisorStatusInactive) {
		return models.User{}, "", ErrInvalidCredentials
	}
	if clientID.Valid {
		user.ClientID = clientID.String
	}

	token, err := generateMockToken()
	if err != nil {
		return models.User{}, "", err
	}
	r.mu.Lock()
	r.tokens[token] = user
	r.mu.Unlock()

	return user, token, nil
}

func (r *postgresAuthRepository) CreateUser(ctx context.Context, user models.User, password string) error {
	hashedPassword, err := hashPassword(password)
	if err != nil {
		return err
	}
	var clientID sql.NullString
	if user.ClientID != "" {
		clientID = sql.NullString{String: user.ClientID, Valid: true}
	}
	_, err = r.db.ExecContext(ctx, `
		INSERT INTO users (id, name, email, password_hash, role, client_id, status)
		VALUES ($1, $2, LOWER($3), $4, $5, $6, $7)
	`, user.ID, user.Name, user.Email, hashedPassword, user.Role, clientID, user.Status)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
			return ErrDuplicateClientEmail
		}
		return err
	}
	return nil
}

func (r *postgresAuthRepository) EmailExists(ctx context.Context, email string) (bool, error) {
	var exists bool
	err := r.db.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE LOWER(email) = LOWER($1))`, email).Scan(&exists)
	return exists, err
}

func (r *postgresAuthRepository) GetUserByToken(ctx context.Context, token string) (models.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	user, ok := r.tokens[token]
	if !ok {
		return models.User{}, ErrInvalidToken
	}
	return user, nil
}

func (r *postgresAuthRepository) RevokeToken(ctx context.Context, token string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.tokens, token)
	return nil
}
