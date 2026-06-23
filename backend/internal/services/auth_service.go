package services

import (
	"context"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/repositories"
)

type AuthService interface {
	Login(ctx context.Context, request models.LoginRequest) (models.LoginResponse, error)
	Logout(ctx context.Context, token string) error
	GetCurrentUser(ctx context.Context, token string) (models.User, error)
}

type authService struct {
	repository repositories.AuthRepository
}

func NewAuthService(repository repositories.AuthRepository) AuthService {
	return &authService{repository: repository}
}

func (s *authService) Login(ctx context.Context, request models.LoginRequest) (models.LoginResponse, error) {
	user, token, err := s.repository.Authenticate(ctx, request.Email, request.Password)
	if err != nil {
		return models.LoginResponse{}, err
	}

	return models.LoginResponse{
		User:  user,
		Token: token,
	}, nil
}

func (s *authService) Logout(ctx context.Context, token string) error {
	if token == "" {
		return nil
	}
	return s.repository.RevokeToken(ctx, token)
}

func (s *authService) GetCurrentUser(ctx context.Context, token string) (models.User, error) {
	return s.repository.GetUserByToken(ctx, token)
}
