package config

import "os"

type Config struct {
	HTTPAddress string
	Environment string
	ServiceName string
}

func Load() Config {
	return Config{
		HTTPAddress: getEnv("HTTP_ADDRESS", ":8080"),
		Environment: getEnv("APP_ENV", "development"),
		ServiceName: getEnv("SERVICE_NAME", "af-engage-api"),
	}
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
