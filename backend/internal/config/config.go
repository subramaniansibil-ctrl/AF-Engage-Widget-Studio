package config

import "os"

type Config struct {
	HTTPAddress    string
	Environment    string
	ServiceName    string
	DataMode       string
	DatabaseURL    string
	MigrationsPath string
	CORSOrigins    string
	RateLimitRPM   string
	FrontendURL    string
	EmailProvider  string
	SMTPHost       string
	SMTPPort       string
	SMTPUsername   string
	SMTPPassword   string
	SMTPFromEmail  string
	SMTPFromName   string
	SMTPTLSMode    string
}

func Load() Config {
	return Config{
		HTTPAddress:    getEnv("HTTP_ADDRESS", ":8080"),
		Environment:    getEnv("APP_ENV", "development"),
		ServiceName:    getEnv("SERVICE_NAME", "af-engage-api"),
		DataMode:       getEnv("APP_DATA_MODE", "postgres"),
		DatabaseURL:    getEnv("DATABASE_URL", "postgres://af_engage:af_engage_password@localhost:5432/af_engage?sslmode=disable"),
		MigrationsPath: getEnv("MIGRATIONS_PATH", "migrations"),
		CORSOrigins:    getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173"),
		RateLimitRPM:   getEnv("RATE_LIMIT_RPM", "120"),
		FrontendURL:    getEnv("FRONTEND_URL", "http://localhost:5173"),
		EmailProvider:  getEnv("EMAIL_PROVIDER", "disabled"),
		SMTPHost:       getEnv("SMTP_HOST", ""),
		SMTPPort:       getEnv("SMTP_PORT", "587"),
		SMTPUsername:   getEnv("SMTP_USERNAME", ""),
		SMTPPassword:   getEnv("SMTP_PASSWORD", ""),
		SMTPFromEmail:  getEnv("SMTP_FROM_EMAIL", ""),
		SMTPFromName:   getEnv("SMTP_FROM_NAME", "Alexforbes Widget Studio"),
		SMTPTLSMode:    getEnv("SMTP_TLS_MODE", "starttls"),
	}
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
