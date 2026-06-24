package models

type TwoPotSimulationRequest struct {
	SavingsPotBalance    float64 `json:"savingsPotBalance"`
	RetirementPotBalance float64 `json:"retirementPotBalance"`
	WithdrawalAmount     float64 `json:"withdrawalAmount"`
	TaxRate              float64 `json:"taxRate"`
	YearsToRetirement    int     `json:"yearsToRetirement"`
	ExpectedGrowthRate   float64 `json:"expectedGrowthRate"`
}

type TwoPotSimulationResponse struct {
	EstimatedTax             float64 `json:"estimatedTax"`
	NetWithdrawal            float64 `json:"netWithdrawal"`
	ProjectedRetirementLoss  float64 `json:"projectedRetirementLoss"`
	ProjectedRetirementValue float64 `json:"projectedRetirementValue"`
	BaselineRetirementValue  float64 `json:"baselineRetirementValue"`
	IllustrationDisclaimer   string  `json:"illustrationDisclaimer"`
}

type OnefeeSimulationRequest struct {
	PortfolioValue       float64 `json:"portfolioValue"`
	CurrentFeePercentage float64 `json:"currentFeePercentage"`
	OnefeePercentage     float64 `json:"onefeePercentage"`
	InvestmentTerm       int     `json:"investmentTerm"`
	ExpectedGrowthRate   float64 `json:"expectedGrowthRate"`
}

type OnefeeSimulationResponse struct {
	CurrentFeeCost            float64 `json:"currentFeeCost"`
	OnefeeCost                float64 `json:"onefeeCost"`
	EstimatedSavings          float64 `json:"estimatedSavings"`
	ProjectedWealthDifference float64 `json:"projectedWealthDifference"`
	CurrentFeeEndingValue     float64 `json:"currentFeeEndingValue"`
	OnefeeEndingValue         float64 `json:"onefeeEndingValue"`
	IllustrationDisclaimer    string  `json:"illustrationDisclaimer"`
}

type IncomeSustainabilityRequest struct {
	RetirementPortfolioValue float64 `json:"retirementPortfolioValue"`
	MonthlyIncome            float64 `json:"monthlyIncome"`
	AnnualGrowthRate         float64 `json:"annualGrowthRate"`
	InflationRate            float64 `json:"inflationRate"`
	RetirementYears          int     `json:"retirementYears"`
}

type IncomeSustainabilityResponse struct {
	AnnualDrawdownRate     float64 `json:"annualDrawdownRate"`
	EstimatedLongevity     int     `json:"estimatedLongevity"`
	SustainabilityScore    int     `json:"sustainabilityScore"`
	RiskLevel              string  `json:"riskLevel"`
	ProjectedEndingBalance float64 `json:"projectedEndingBalance"`
	IllustrationDisclaimer string  `json:"illustrationDisclaimer"`
}
