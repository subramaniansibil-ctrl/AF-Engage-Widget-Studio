package models

type RiskProfile string

const (
	RiskConservative RiskProfile = "CONSERVATIVE"
	RiskModerate     RiskProfile = "MODERATE"
	RiskGrowth       RiskProfile = "GROWTH"
	RiskAggressive   RiskProfile = "AGGRESSIVE"
)

type RetirementStage string

const (
	RetirementStageAccumulation  RetirementStage = "ACCUMULATION"
	RetirementStagePreRetirement RetirementStage = "PRE_RETIREMENT"
	RetirementStageRetired       RetirementStage = "RETIRED"
)

type InvestmentAllocation struct {
	Label      string  `json:"label"`
	Category   string  `json:"category"`
	Percentage float64 `json:"percentage"`
}

type Portfolio struct {
	TotalValue           int64                  `json:"totalValue"`
	SavingsPotBalance    int64                  `json:"savingsPotBalance"`
	RetirementPotBalance int64                  `json:"retirementPotBalance"`
	MonthlyContribution  int64                  `json:"monthlyContribution"`
	Allocation           []InvestmentAllocation `json:"allocation"`
}

type RetirementGoal struct {
	TargetAmount int64 `json:"targetAmount"`
	TargetAge    int   `json:"targetAge"`
	Progress     int   `json:"progress"`
}

type Client struct {
	ID              string          `json:"id"`
	Name            string          `json:"name"`
	Age             int             `json:"age"`
	Email           string          `json:"email"`
	RiskProfile     RiskProfile     `json:"riskProfile"`
	RetirementStage RetirementStage `json:"retirementStage"`
	Portfolio       Portfolio       `json:"portfolio"`
	RetirementGoal  RetirementGoal  `json:"retirementGoal"`
}

type WidgetUsageSummary struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

type AdvisorDashboardStats struct {
	TotalClients           int                  `json:"totalClients"`
	TotalAssetsUnderAdvice int64                `json:"totalAssetsUnderAdvice"`
	HighRiskClients        int                  `json:"highRiskClients"`
	ActiveDashboards       int                  `json:"activeDashboards"`
	WidgetUsageSummary     []WidgetUsageSummary `json:"widgetUsageSummary"`
}
