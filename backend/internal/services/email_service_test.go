package services

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/config"
)

func TestDashboardPublishedEmailTemplateIncludesPersonalizedSecureLink(t *testing.T) {
	body, err := renderDashboardPublishedEmail(DashboardPublishedEmail{
		ClientName: "Avery <Chen>", AdvisorName: "Advisor User",
		DashboardURL: "https://app.example.com/client/dashboard",
	})
	if err != nil {
		t.Fatalf("render email: %v", err)
	}
	for _, expected := range []string{"Avery &lt;Chen&gt;", "Advisor User", "https://app.example.com/client/dashboard", "View your dashboard"} {
		if !strings.Contains(body, expected) {
			t.Fatalf("expected email body to contain %q", expected)
		}
	}
	if strings.Contains(body, "Avery <Chen>") {
		t.Fatal("expected client name to be HTML escaped")
	}
}

func TestDisabledEmailServiceReturnsConfigurationError(t *testing.T) {
	service := NewEmailService(config.Config{EmailProvider: "disabled"})
	err := service.SendDashboardPublished(context.Background(), DashboardPublishedEmail{})
	if !errors.Is(err, ErrEmailNotConfigured) {
		t.Fatalf("expected ErrEmailNotConfigured, got %v", err)
	}
}
