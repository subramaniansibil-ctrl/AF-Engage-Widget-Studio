package config

import "os"

type Config struct {
	HTTPAddress    string
	Environment    string
	ServiceName    string
	DataMode       string
	DatabaseURL    string
	MigrationsPath string
}

func Load() Config {
	return Config{
		HTTPAddress:    getEnv("HTTP_ADDRESS", ":8080"),
		Environment:    getEnv("APP_ENV", "development"),
		ServiceName:    getEnv("SERVICE_NAME", "af-engage-api"),
		DataMode:       getEnv("APP_DATA_MODE", "mock"),
		DatabaseURL:    getEnv("DATABASE_URL", "postgres://af_engage:af_engage_password@localhost:5432/af_engage?sslmode=disable"),
		MigrationsPath: getEnv("MIGRATIONS_PATH", "migrations"),
	}
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
