package repositories

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"
	"sync"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidToken       = errors.New("invalid token")
)

type AuthRepository interface {
	Authenticate(ctx context.Context, email string, password string) (models.User, string, error)
	CreateUser(ctx context.Context, user models.User, password string) error
	EmailExists(ctx context.Context, email string) (bool, error)
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
	seedPassword, err := hashPassword("password123")
	if err != nil {
		seedPassword = "password123"
	}
	return &mockAuthRepository{
		users: map[string]mockUserRecord{
			"advisor@afengage.com": {
				user: models.User{
					ID:    "user_advisor_001",
					Name:  "Advisor User",
					Email: "advisor@afengage.com",
					Role:  models.RoleAdvisor,
					Status: string(models.AdvisorStatusActive),
				},
				password: seedPassword,
			},
			"client@afengage.com": {
				user: models.User{
					ID:       "user_client_001",
					Name:     "Avery Chen",
					Email:    "client@afengage.com",
					Role:     models.RoleClient,
					ClientID: "client-001",
				},
				password: seedPassword,
			},
			"admin@afengage.com": {
				user: models.User{
					ID:    "user_admin_001",
					Name:  "Admin User",
					Email: "admin@afengage.com",
					Role:  models.RoleAdmin,
				},
				password: seedPassword,
			},
		},
		tokens: make(map[string]models.User),
	}
}

func (r *mockAuthRepository) Authenticate(ctx context.Context, email string, password string) (models.User, string, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	key := strings.ToLower(strings.TrimSpace(email))
	record, ok := r.users[key]
	if !ok || !verifyPassword(record.password, password) {
		return models.User{}, "", ErrInvalidCredentials
	}

	token, err := generateMockToken()
	if err != nil {
		return models.User{}, "", err
	}
	r.tokens[token] = record.user

	return record.user, token, nil
}

func (r *mockAuthRepository) CreateUser(ctx context.Context, user models.User, password string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.users[strings.ToLower(user.Email)]; exists {
		return ErrDuplicateClientEmail
	}
	hashed, err := hashPassword(password)
	if err != nil {
		return err
	}
	r.users[strings.ToLower(user.Email)] = mockUserRecord{user: user, password: hashed}
	return nil
}

func (r *mockAuthRepository) EmailExists(ctx context.Context, email string) (bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	_, exists := r.users[strings.ToLower(strings.TrimSpace(email))]
	return exists, nil
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

func verifyPassword(storedPassword string, plainPassword string) bool {
	if storedPassword == "" {
		return false
	}
	if err := bcrypt.CompareHashAndPassword([]byte(storedPassword), []byte(plainPassword)); err == nil {
		return true
	}
	return storedPassword == plainPassword
}

func hashPassword(password string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashed), nil
}

func generateMockToken() (string, error) {
	bytes := make([]byte, 24)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return "mock_" + hex.EncodeToString(bytes), nil
}
