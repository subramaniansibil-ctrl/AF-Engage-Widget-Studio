package models

import "time"

type AdvisorStatus string

const (
	AdvisorStatusActive   AdvisorStatus = "ACTIVE"
	AdvisorStatusInactive AdvisorStatus = "INACTIVE"
)

type Advisor struct {
	ID          string        `json:"id"`
	Name        string        `json:"name"`
	Email       string        `json:"email"`
	Status      AdvisorStatus `json:"status"`
	ClientCount int           `json:"clientCount"`
	CreatedAt   time.Time     `json:"createdAt,omitempty"`
}

type AdvisorManagementFilters struct {
	Search   string
	Status   AdvisorStatus
	Page     int
	PageSize int
}

type AdvisorUpsertRequest struct {
	ID       string        `json:"id" binding:"required,min=2,max=64"`
	Name     string        `json:"name" binding:"required,min=2,max=120"`
	Email    string        `json:"email" binding:"required,email"`
	Status   AdvisorStatus `json:"status" binding:"required,oneof=ACTIVE INACTIVE"`
	Password string        `json:"password" binding:"omitempty,min=8,max=120"`
}

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

type Portfolio struct {
	TotalValue           int64 `json:"totalValue"`
	SavingsPotBalance    int64 `json:"savingsPotBalance"`
	RetirementPotBalance int64 `json:"retirementPotBalance"`
	MonthlyContribution  int64 `json:"monthlyContribution"`
	MonthlyIncome        int64 `json:"monthlyIncome"`
	MonthlyExpenses      int64 `json:"monthlyExpenses"`
	MonthlySavings       int64 `json:"monthlySavings"`
	NetWorth             int64 `json:"netWorth"`
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
	MobileNumber    string          `json:"mobileNumber,omitempty"`
	AssignedAdvisor string          `json:"assignedAdvisor,omitempty"`
	Status          ClientStatus    `json:"status,omitempty"`
	DateOfBirth     string          `json:"dateOfBirth,omitempty"`
	RiskProfile     RiskProfile     `json:"riskProfile"`
	RetirementStage RetirementStage `json:"retirementStage"`
	InvestmentGoal  string          `json:"investmentGoal,omitempty"`
	PortfolioID     string          `json:"portfolioId,omitempty"`
	Notes           string          `json:"notes,omitempty"`
	CreatedAt       time.Time       `json:"createdAt,omitempty"`
	Portfolio       Portfolio       `json:"portfolio"`
	RetirementGoal  RetirementGoal  `json:"retirementGoal"`
}

type ClientStatus string

const (
	ClientStatusActive   ClientStatus = "ACTIVE"
	ClientStatusInactive ClientStatus = "INACTIVE"
)

type ClientManagementFilters struct {
	Search          string
	Status          ClientStatus
	AssignedAdvisor string
	RecentlyCreated bool
	SortBy          string
	SortOrder       string
	Page            int
	PageSize        int
}

type ClientUpsertRequest struct {
	ID              string       `json:"id" binding:"required,min=2,max=64"`
	Name            string       `json:"name" binding:"required,min=2,max=120"`
	Email           string       `json:"email" binding:"required,email"`
	MobileNumber    string       `json:"mobileNumber" binding:"required,min=7,max=30"`
	AssignedAdvisor string       `json:"assignedAdvisor" binding:"omitempty,min=2,max=120"`
	Status          ClientStatus `json:"status" binding:"required,oneof=ACTIVE INACTIVE"`
	DateOfBirth     string       `json:"dateOfBirth"`
	RiskProfile     RiskProfile  `json:"riskProfile" binding:"omitempty,oneof=CONSERVATIVE MODERATE GROWTH AGGRESSIVE"`
	InvestmentGoal  string       `json:"investmentGoal" binding:"max=240"`
	PortfolioID     string       `json:"portfolioId" binding:"max=80"`
	Portfolio       Portfolio    `json:"portfolio"`
	Notes           string       `json:"notes" binding:"max=1000"`
	Password        string       `json:"password" binding:"omitempty,min=8,max=120"`
	ConfirmPassword string       `json:"confirmPassword" binding:"omitempty"`
}

type BulkClientRow struct {
	RowNumber int                 `json:"rowNumber" binding:"required,gte=2"`
	Client    ClientUpsertRequest `json:"client" binding:"required"`
}

type BulkClientImportRequest struct {
	Rows []BulkClientRow `json:"rows" binding:"required,min=1"`
}

type ClientImportError struct {
	RowNumber int    `json:"rowNumber"`
	Field     string `json:"field"`
	Message   string `json:"message"`
}

type BulkClientImportResponse struct {
	Imported int                 `json:"imported"`
	Failed   int                 `json:"failed"`
	Clients  []Client            `json:"clients"`
	Errors   []ClientImportError `json:"errors"`
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
