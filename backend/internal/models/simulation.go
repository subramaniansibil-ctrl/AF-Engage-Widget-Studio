package models

type TwoPotSimulationRequest struct {
	SavingsPotBalance    float64 `json:"savingsPotBalance" binding:"gte=0"`
	RetirementPotBalance float64 `json:"retirementPotBalance" binding:"gte=0"`
	WithdrawalAmount     float64 `json:"withdrawalAmount" binding:"gte=0"`
	TaxRate              float64 `json:"taxRate" binding:"gte=0,lte=60"`
	YearsToRetirement    int     `json:"yearsToRetirement" binding:"gte=0,lte=60"`
	ExpectedGrowthRate   float64 `json:"expectedGrowthRate" binding:"gte=-20,lte=20"`
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
	PortfolioValue       float64 `json:"portfolioValue" binding:"gte=0"`
	CurrentFeePercentage float64 `json:"currentFeePercentage" binding:"gte=0,lte=5"`
	OnefeePercentage     float64 `json:"onefeePercentage" binding:"gte=0,lte=5"`
	InvestmentTerm       int     `json:"investmentTerm" binding:"gte=0,lte=60"`
	ExpectedGrowthRate   float64 `json:"expectedGrowthRate" binding:"gte=-20,lte=20"`
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
	RetirementPortfolioValue float64 `json:"retirementPortfolioValue" binding:"gte=0"`
	MonthlyIncome            float64 `json:"monthlyIncome" binding:"gte=0"`
	AnnualGrowthRate         float64 `json:"annualGrowthRate" binding:"gte=-20,lte=20"`
	InflationRate            float64 `json:"inflationRate" binding:"gte=0,lte=20"`
	RetirementYears          int     `json:"retirementYears" binding:"gte=1,lte=60"`
}

type IncomeSustainabilityResponse struct {
	AnnualDrawdownRate     float64 `json:"annualDrawdownRate"`
	EstimatedLongevity     int     `json:"estimatedLongevity"`
	SustainabilityScore    int     `json:"sustainabilityScore"`
	RiskLevel              string  `json:"riskLevel"`
	ProjectedEndingBalance float64 `json:"projectedEndingBalance"`
	IllustrationDisclaimer string  `json:"illustrationDisclaimer"`
}
