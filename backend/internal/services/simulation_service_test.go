package services

import (
	"context"
	"testing"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
)

func TestCalculateTwoPotClampsWithdrawalAndIncludesDisclaimer(t *testing.T) {
	service := NewSimulationService()

	response := service.CalculateTwoPot(context.Background(), models.TwoPotSimulationRequest{
		SavingsPotBalance:    10000,
		RetirementPotBalance: 90000,
		WithdrawalAmount:     25000,
		TaxRate:              20,
		YearsToRetirement:    10,
		ExpectedGrowthRate:   6,
	})

	if response.NetWithdrawal != 8000 {
		t.Fatalf("expected net withdrawal to use clamped savings pot amount, got %.2f", response.NetWithdrawal)
	}
	if response.IllustrationDisclaimer == "" {
		t.Fatal("expected illustration disclaimer")
	}
}

func TestCalculateIncomeSustainabilityRiskBands(t *testing.T) {
	service := NewSimulationService()

	response := service.CalculateIncomeSustainability(context.Background(), models.IncomeSustainabilityRequest{
		RetirementPortfolioValue: 250000,
		MonthlyIncome:            6000,
		AnnualGrowthRate:         4,
		InflationRate:            5,
		RetirementYears:          30,
	})

	if response.SustainabilityScore >= 70 {
		t.Fatalf("expected constrained income scenario to avoid low-risk score, got %d", response.SustainabilityScore)
	}
	if response.RiskLevel == "" {
		t.Fatal("expected risk level")
	}
}
