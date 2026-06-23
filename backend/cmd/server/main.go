package main

import (
	"log"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/config"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/repositories"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/routes"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/services"
)

func main() {
	cfg := config.Load()
	statusRepository := repositories.NewStatusRepository(cfg)
	statusService := services.NewStatusService(statusRepository)
	router := routes.NewRouter(cfg, statusService)

	log.Printf("%s listening on %s", cfg.ServiceName, cfg.HTTPAddress)
	if err := router.Run(cfg.HTTPAddress); err != nil {
		log.Fatal(err)
	}
}
