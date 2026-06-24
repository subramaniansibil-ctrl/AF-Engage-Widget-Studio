package repositories

import (
	"context"
	"database/sql"
	"sync"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
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
		SELECT id, name, email, role, COALESCE(password_hash, ''), client_id
		FROM users
		WHERE email = $1
	`, email).Scan(&user.ID, &user.Name, &user.Email, &user.Role, &storedPassword, &clientID)
	if err == sql.ErrNoRows || storedPassword != password {
		return models.User{}, "", ErrInvalidCredentials
	}
	if err != nil {
		return models.User{}, "", err
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
