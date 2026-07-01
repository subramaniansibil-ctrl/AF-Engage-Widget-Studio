package models

type Role string

const (
	RoleAdvisor Role = "ADVISOR"
	RoleClient  Role = "CLIENT"
	RoleAdmin   Role = "ADMIN"
)

type User struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Role     Role   `json:"role"`
	ClientID string `json:"clientId,omitempty"`
	Status   string `json:"status,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	User  User   `json:"user"`
	Token string `json:"token"`
}
