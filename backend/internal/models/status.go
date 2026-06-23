package models

import "time"

type HealthResponse struct {
	Success bool   `json:"success"`
	Status  string `json:"status"`
	Service string `json:"service"`
}

type APIStatus struct {
	Service     string    `json:"service"`
	Environment string    `json:"environment"`
	Version     string    `json:"version"`
	Timestamp   time.Time `json:"timestamp"`
}
