package repositories

import (
	"strings"
	"testing"
)

func TestAdvisorDashboardScopeCteUsesScopedClientSet(t *testing.T) {
	cte := advisorDashboardScopeCte("Advisor User")
	if !strings.Contains(cte, "advisor_clients") {
		t.Fatalf("expected advisor dashboard scope to include advisor_clients CTE, got %q", cte)
	}
	if !strings.Contains(cte, "assigned_advisor = $1") {
		t.Fatalf("expected advisor dashboard scope to filter by assigned advisor, got %q", cte)
	}
}

func TestAdvisorDashboardScopeCteIsEmptyWithoutAdvisorName(t *testing.T) {
	cte := advisorDashboardScopeCte("")
	if cte != "" {
		t.Fatalf("expected empty scope for global dashboard stats, got %q", cte)
	}
}
