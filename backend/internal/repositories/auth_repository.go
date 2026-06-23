package repositories

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"sync"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidToken       = errors.New("invalid token")
)

type AuthRepository interface {
	Authenticate(ctx context.Context, email string, password string) (models.User, string, error)
	GetUserByToken(ctx context.Context, token string) (models.User, error)
	RevokeToken(ctx context.Context, token string) error
}

type mockUserRecord struct {
	user     models.User
	password string
}

type mockAuthRepository struct {
	mu     sync.RWMutex
	users  map[string]mockUserRecord
	tokens map[string]models.User
}

func NewMockAuthRepository() AuthRepository {
	return &mockAuthRepository{
		users: map[string]mockUserRecord{
			"advisor@afengage.com": {
				user: models.User{
					ID:    "user_advisor_001",
					Name:  "Advisor User",
					Email: "advisor@afengage.com",
					Role:  models.RoleAdvisor,
				},
				password: "password123",
			},
			"client@afengage.com": {
				user: models.User{
					ID:    "user_client_001",
					Name:  "Client User",
					Email: "client@afengage.com",
					Role:  models.RoleClient,
				},
				password: "password123",
			},
			"admin@afengage.com": {
				user: models.User{
					ID:    "user_admin_001",
					Name:  "Admin User",
					Email: "admin@afengage.com",
					Role:  models.RoleAdmin,
				},
				password: "password123",
			},
		},
		tokens: make(map[string]models.User),
	}
}

func (r *mockAuthRepository) Authenticate(ctx context.Context, email string, password string) (models.User, string, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	record, ok := r.users[email]
	if !ok || record.password != password {
		return models.User{}, "", ErrInvalidCredentials
	}

	token, err := generateMockToken()
	if err != nil {
		return models.User{}, "", err
	}
	r.tokens[token] = record.user

	return record.user, token, nil
}

func (r *mockAuthRepository) GetUserByToken(ctx context.Context, token string) (models.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	user, ok := r.tokens[token]
	if !ok {
		return models.User{}, ErrInvalidToken
	}

	return user, nil
}

func (r *mockAuthRepository) RevokeToken(ctx context.Context, token string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	delete(r.tokens, token)
	return nil
}

func generateMockToken() (string, error) {
	bytes := make([]byte, 24)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return "mock_" + hex.EncodeToString(bytes), nil
}
