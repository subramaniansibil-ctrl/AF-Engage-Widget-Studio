package services

import (
	"context"
	"math"

	"github.com/af-engage-widget-studio/backend/internal/models"
)

const simulationDisclaimer = "Illustration only. Results use mock assumptions and are not financial advice."

type SimulationService interface {
	CalculateTwoPot(ctx context.Context, request models.TwoPotSimulationRequest) models.TwoPotSimulationResponse
	CalculateOnefee(ctx context.Context, request models.OnefeeSimulationRequest) models.OnefeeSimulationResponse
	CalculateIncomeSustainability(ctx context.Context, request models.IncomeSustainabilityRequest) models.IncomeSustainabilityResponse
}

type simulationService struct{}

func NewSimulationService() SimulationService {
	return &simulationService{}
}

func (s *simulationService) CalculateTwoPot(ctx context.Context, request models.TwoPotSimulationRequest) models.TwoPotSimulationResponse {
	withdrawal := clamp(request.WithdrawalAmount, 0, request.SavingsPotBalance)
	taxRate := clamp(request.TaxRate, 0, 60) / 100
	growthRate := clamp(request.ExpectedGrowthRate, -20, 20) / 100
	years := maxInt(request.YearsToRetirement, 0)
	totalPortfolio := request.SavingsPotBalance + request.RetirementPotBalance

	estimatedTax := withdrawal * taxRate
	netWithdrawal := withdrawal - estimatedTax
	baselineValue := compound(totalPortfolio, growthRate, years)
	projectedValue := compound(totalPortfolio-withdrawal, growthRate, years)

	return models.TwoPotSimulationResponse{
		EstimatedTax:             roundCurrency(estimatedTax),
		NetWithdrawal:            roundCurrency(netWithdrawal),
		ProjectedRetirementLoss:  roundCurrency(baselineValue - projectedValue),
		ProjectedRetirementValue: roundCurrency(projectedValue),
		BaselineRetirementValue:  roundCurrency(baselineValue),
		IllustrationDisclaimer:   simulationDisclaimer,
	}
}

func (s *simulationService) CalculateOnefee(ctx context.Context, request models.OnefeeSimulationRequest) models.OnefeeSimulationResponse {
	portfolioValue := math.Max(request.PortfolioValue, 0)
	currentFeeRate := clamp(request.CurrentFeePercentage, 0, 5) / 100
	onefeeRate := clamp(request.OnefeePercentage, 0, 5) / 100
	growthRate := clamp(request.ExpectedGrowthRate, -20, 20) / 100
	years := maxInt(request.InvestmentTerm, 0)

	currentEndingValue := compoundWithAnnualFee(portfolioValue, growthRate, currentFeeRate, years)
	onefeeEndingValue := compoundWithAnnualFee(portfolioValue, growthRate, onefeeRate, years)
	currentNoFeeValue := compound(portfolioValue, growthRate, years)
	currentFeeCost := currentNoFeeValue - currentEndingValue
	onefeeCost := currentNoFeeValue - onefeeEndingValue
	estimatedSavings := math.Max(currentFeeCost-onefeeCost, 0)

	return models.OnefeeSimulationResponse{
		CurrentFeeCost:            roundCurrency(currentFeeCost),
		OnefeeCost:                roundCurrency(onefeeCost),
		EstimatedSavings:          roundCurrency(estimatedSavings),
		ProjectedWealthDifference: roundCurrency(onefeeEndingValue - currentEndingValue),
		CurrentFeeEndingValue:     roundCurrency(currentEndingValue),
		OnefeeEndingValue:         roundCurrency(onefeeEndingValue),
		IllustrationDisclaimer:    simulationDisclaimer,
	}
}

func (s *simulationService) CalculateIncomeSustainability(ctx context.Context, request models.IncomeSustainabilityRequest) models.IncomeSustainabilityResponse {
	portfolioValue := math.Max(request.RetirementPortfolioValue, 0)
	monthlyIncome := math.Max(request.MonthlyIncome, 0)
	annualIncome := monthlyIncome * 12
	growthRate := clamp(request.AnnualGrowthRate, -20, 20) / 100
	inflationRate := clamp(request.InflationRate, 0, 20) / 100
	targetYears := maxInt(request.RetirementYears, 1)

	drawdownRate := 0.0
	if portfolioValue > 0 {
		drawdownRate = annualIncome / portfolioValue * 100
	}

	balance := portfolioValue
	income := annualIncome
	longevity := targetYears
	for year := 1; year <= 60; year++ {
		balance = balance*(1+growthRate) - income
		if balance <= 0 {
			longevity = year
			break
		}
		income *= 1 + inflationRate
		if year == targetYears {
			longevity = year
		}
	}

	projectedEndingBalance := projectIncomeBalance(portfolioValue, annualIncome, growthRate, inflationRate, targetYears)
	score := sustainabilityScore(drawdownRate, longevity, targetYears, projectedEndingBalance)
	riskLevel := "Low"
	if score < 45 {
		riskLevel = "High"
	} else if score < 70 {
		riskLevel = "Moderate"
	}

	return models.IncomeSustainabilityResponse{
		AnnualDrawdownRate:     roundPercent(drawdownRate),
		EstimatedLongevity:     longevity,
		SustainabilityScore:    score,
		RiskLevel:              riskLevel,
		ProjectedEndingBalance: roundCurrency(math.Max(projectedEndingBalance, 0)),
		IllustrationDisclaimer: simulationDisclaimer,
	}
}

func compound(value float64, rate float64, years int) float64 {
	return value * math.Pow(1+rate, float64(years))
}

func compoundWithAnnualFee(value float64, growthRate float64, feeRate float64, years int) float64 {
	balance := value
	for range years {
		balance *= 1 + growthRate
		balance *= 1 - feeRate
	}
	return math.Max(balance, 0)
}

func projectIncomeBalance(value float64, income float64, growthRate float64, inflationRate float64, years int) float64 {
	balance := value
	currentIncome := income
	for range years {
		balance = balance*(1+growthRate) - currentIncome
		currentIncome *= 1 + inflationRate
	}
	return balance
}

func sustainabilityScore(drawdownRate float64, longevity int, targetYears int, endingBalance float64) int {
	longevityScore := clamp(float64(longevity)/float64(targetYears)*70, 0, 70)
	drawdownScore := clamp((7-drawdownRate)/7*20, 0, 20)
	reserveScore := 0.0
	if endingBalance > 0 {
		reserveScore = 10
	}
	return int(math.Round(clamp(longevityScore+drawdownScore+reserveScore, 0, 100)))
}

func clamp(value float64, min float64, max float64) float64 {
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}

func maxInt(value int, min int) int {
	if value < min {
		return min
	}
	return value
}

func roundCurrency(value float64) float64 {
	return math.Round(value*100) / 100
}

func roundPercent(value float64) float64 {
	return math.Round(value*10) / 10
}
