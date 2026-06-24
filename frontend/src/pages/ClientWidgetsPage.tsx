import { useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { WidgetCard, WidgetMetric, SliderField } from '../components/widgets/WidgetCard';
import type { Portfolio, RetirementGoal } from '../features/advisor/advisorApi';
import {
  useGetClientDashboardQuery,
  useGetClientWidgetsQuery,
  useSaveSimulationMutation,
} from '../features/client/clientApi';
import {
  useCalculateIncomeSustainabilityMutation,
  useCalculateOnefeeMutation,
  useCalculateTwoPotMutation,
  type IncomeSustainabilityInput,
  type OnefeeSimulationInput,
  type TwoPotSimulationInput,
} from '../features/simulations/simulationsApi';
import type { DashboardAssignment } from '../features/widgets/widgetsApi';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const percent = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
});

const disclaimer = 'Illustration only. Results use mock assumptions and are not financial advice.';

export function ClientWidgetsPage() {
  const { data: widgets = [], isLoading: isLoadingWidgets, isError } = useGetClientWidgetsQuery();
  const { data: dashboard, isLoading: isLoadingDashboard } = useGetClientDashboardQuery();

  if (isLoadingWidgets || isLoadingDashboard) {
    return <p className="text-sm text-ink/60">Loading your widgets...</p>;
  }

  if (isError || !dashboard) {
    return (
      <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-panel">
        <p className="font-semibold">We could not load your assigned widgets.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-sage">My widgets</p>
        <h2 className="mt-1 text-3xl font-bold">Interactive planning illustrations</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Adjust each scenario to see how the illustration changes. Saved simulations are shared back into your planning history.
        </p>
      </section>

      <section className="space-y-5">
        {widgets.map((widget) => (
          <AssignedWidget
            key={widget.id}
            assignment={widget}
            portfolio={dashboard.portfolioSummary}
            retirementGoal={dashboard.retirementGoalProgress}
          />
        ))}
      </section>

      {!widgets.length && (
        <div className="rounded-lg border border-dashed border-ink/15 bg-white p-8 shadow-panel">
          <p className="font-semibold">No widgets assigned yet</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink/60">
            Your advisor will publish personalized widgets here when your dashboard is ready.
          </p>
        </div>
      )}
    </div>
  );
}

function AssignedWidget({
  assignment,
  portfolio,
  retirementGoal,
}: {
  assignment: DashboardAssignment;
  portfolio: Portfolio;
  retirementGoal: RetirementGoal;
}) {
  if (assignment.widgetId === 'two-pot-impact') {
    return <TwoPotImpactWidget assignment={assignment} portfolio={portfolio} retirementGoal={retirementGoal} />;
  }
  if (assignment.widgetId === 'onefee-wealth-reclaim') {
    return <OnefeeWealthReclaimWidget assignment={assignment} portfolio={portfolio} />;
  }
  if (assignment.widgetId === 'income-sustainability') {
    return <IncomeSustainabilityWidget assignment={assignment} portfolio={portfolio} retirementGoal={retirementGoal} />;
  }

  return (
    <WidgetCard title={assignment.widgetName} description="This widget is assigned and ready for a future interactive module.">
      <p className="text-sm text-ink/60">{disclaimer}</p>
    </WidgetCard>
  );
}

function TwoPotImpactWidget({
  assignment,
  portfolio,
  retirementGoal,
}: {
  assignment: DashboardAssignment;
  portfolio: Portfolio;
  retirementGoal: RetirementGoal;
}) {
  const [input, setInput] = useState<TwoPotSimulationInput>({
    savingsPotBalance: portfolio.savingsPotBalance,
    retirementPotBalance: portfolio.retirementPotBalance,
    withdrawalAmount: Math.min(25000, portfolio.savingsPotBalance),
    taxRate: 25,
    yearsToRetirement: Math.max(retirementGoal.targetAge - 42, 10),
    expectedGrowthRate: 6,
  });
  const [saveSimulation, { isLoading: isSaving }] = useSaveSimulationMutation();
  const [calculateTwoPot] = useCalculateTwoPotMutation();
  const output = useMemo(() => calculateTwoPotLocal(input), [input]);
  const chartData = useMemo(() => buildTwoPotChart(input, output), [input, output]);

  async function save() {
    const serverOutput = await calculateTwoPot(input).unwrap();
    await saveSimulation({
      widgetId: assignment.widgetId,
      inputs: stringifyInputs(input),
      result: `Two-pot illustration saved: net withdrawal ${currency.format(serverOutput.netWithdrawal)}, projected retirement impact ${currency.format(serverOutput.projectedRetirementLoss)}.`,
    }).unwrap();
  }

  return (
    <WidgetCard
      title="Two-Pot Impact"
      description="Illustrates how a savings-pot withdrawal could affect tax, cash received, and a projected retirement balance."
    >
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="space-y-3">
          <SliderField label="Withdrawal amount" value={input.withdrawalAmount} min={0} max={portfolio.savingsPotBalance} step={1000} prefix="$" onChange={(withdrawalAmount) => setInput({ ...input, withdrawalAmount })} />
          <SliderField label="Tax rate" value={input.taxRate} min={0} max={45} step={1} suffix="%" onChange={(taxRate) => setInput({ ...input, taxRate })} />
          <SliderField label="Years to retirement" value={input.yearsToRetirement} min={1} max={35} step={1} suffix=" years" onChange={(yearsToRetirement) => setInput({ ...input, yearsToRetirement })} />
          <SliderField label="Expected growth" value={input.expectedGrowthRate} min={0} max={12} step={0.5} suffix="%" onChange={(expectedGrowthRate) => setInput({ ...input, expectedGrowthRate })} />
        </div>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <WidgetMetric label="Estimated tax" value={currency.format(output.estimatedTax)} />
            <WidgetMetric label="Net withdrawal" value={currency.format(output.netWithdrawal)} />
            <WidgetMetric label="Projected loss" value={currency.format(output.projectedRetirementLoss)} />
            <WidgetMetric label="Projected value" value={currency.format(output.projectedRetirementValue)} />
          </div>
          <div className="h-72 rounded-md border border-ink/10 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="scenario" />
                <YAxis tickFormatter={(value) => compactCurrency.format(Number(value))} width={72} />
                <Tooltip formatter={(value) => currency.format(Number(value))} />
                <Bar dataKey="value" fill="#5a7f71" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <SaveRow isSaving={isSaving} onSave={save} />
        </div>
      </div>
      <p className="mt-4 text-xs text-ink/50">{disclaimer}</p>
    </WidgetCard>
  );
}

function OnefeeWealthReclaimWidget({ assignment, portfolio }: { assignment: DashboardAssignment; portfolio: Portfolio }) {
  const [input, setInput] = useState<OnefeeSimulationInput>({
    portfolioValue: portfolio.totalValue,
    currentFeePercentage: 1.25,
    onefeePercentage: 0.75,
    investmentTerm: 15,
    expectedGrowthRate: 6,
  });
  const [saveSimulation, { isLoading: isSaving }] = useSaveSimulationMutation();
  const [calculateOnefee] = useCalculateOnefeeMutation();
  const output = useMemo(() => calculateOnefeeLocal(input), [input]);
  const chartData = useMemo(() => buildOnefeeChart(input), [input]);

  async function save() {
    const serverOutput = await calculateOnefee(input).unwrap();
    await saveSimulation({
      widgetId: assignment.widgetId,
      inputs: stringifyInputs(input),
      result: `Onefee illustration saved: estimated fee difference ${currency.format(serverOutput.estimatedSavings)} over ${input.investmentTerm} years.`,
    }).unwrap();
  }

  return (
    <WidgetCard
      title="Onefee Wealth Reclaim"
      description="Compares fee leakage between a current fee assumption and a Onefee-style assumption over time."
    >
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="space-y-3">
          <SliderField label="Portfolio value" value={input.portfolioValue} min={100000} max={2000000} step={25000} prefix="$" onChange={(portfolioValue) => setInput({ ...input, portfolioValue })} />
          <SliderField label="Current fee" value={input.currentFeePercentage} min={0.25} max={2.5} step={0.05} suffix="%" onChange={(currentFeePercentage) => setInput({ ...input, currentFeePercentage })} />
          <SliderField label="Onefee" value={input.onefeePercentage} min={0.1} max={1.5} step={0.05} suffix="%" onChange={(onefeePercentage) => setInput({ ...input, onefeePercentage })} />
          <SliderField label="Investment term" value={input.investmentTerm} min={1} max={30} step={1} suffix=" years" onChange={(investmentTerm) => setInput({ ...input, investmentTerm })} />
          <SliderField label="Expected growth" value={input.expectedGrowthRate} min={0} max={12} step={0.5} suffix="%" onChange={(expectedGrowthRate) => setInput({ ...input, expectedGrowthRate })} />
        </div>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <WidgetMetric label="Current fee cost" value={currency.format(output.currentFeeCost)} />
            <WidgetMetric label="Onefee cost" value={currency.format(output.onefeeCost)} />
            <WidgetMetric label="Estimated savings" value={currency.format(output.estimatedSavings)} />
            <WidgetMetric label="Wealth difference" value={currency.format(output.projectedWealthDifference)} />
          </div>
          <div className="h-72 rounded-md border border-ink/10 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value) => compactCurrency.format(Number(value))} width={72} />
                <Tooltip formatter={(value) => currency.format(Number(value))} />
                <Line type="monotone" dataKey="currentFees" stroke="#dc6b57" strokeWidth={2} dot={false} name="Current fee path" />
                <Line type="monotone" dataKey="onefee" stroke="#5a7f71" strokeWidth={2} dot={false} name="Onefee path" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <SaveRow isSaving={isSaving} onSave={save} />
        </div>
      </div>
      <p className="mt-4 text-xs text-ink/50">{disclaimer}</p>
    </WidgetCard>
  );
}

function IncomeSustainabilityWidget({
  assignment,
  portfolio,
  retirementGoal,
}: {
  assignment: DashboardAssignment;
  portfolio: Portfolio;
  retirementGoal: RetirementGoal;
}) {
  const [input, setInput] = useState<IncomeSustainabilityInput>({
    retirementPortfolioValue: portfolio.retirementPotBalance,
    monthlyIncome: 4500,
    annualGrowthRate: 5,
    inflationRate: 3,
    retirementYears: Math.max(retirementGoal.targetAge - 35, 25),
  });
  const [saveSimulation, { isLoading: isSaving }] = useSaveSimulationMutation();
  const [calculateIncome] = useCalculateIncomeSustainabilityMutation();
  const output = useMemo(() => calculateIncomeLocal(input), [input]);
  const chartData = useMemo(() => buildIncomeChart(input), [input]);

  async function save() {
    const serverOutput = await calculateIncome(input).unwrap();
    await saveSimulation({
      widgetId: assignment.widgetId,
      inputs: stringifyInputs(input),
      result: `Income sustainability illustration saved: ${serverOutput.riskLevel.toLowerCase()} risk, score ${serverOutput.sustainabilityScore}.`,
    }).unwrap();
  }

  return (
    <WidgetCard
      title="Income Sustainability"
      description="Illustrates how a monthly income level could interact with growth, inflation, and retirement duration."
    >
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="space-y-3">
          <SliderField label="Portfolio value" value={input.retirementPortfolioValue} min={100000} max={2000000} step={25000} prefix="$" onChange={(retirementPortfolioValue) => setInput({ ...input, retirementPortfolioValue })} />
          <SliderField label="Monthly income" value={input.monthlyIncome} min={1000} max={12000} step={250} prefix="$" onChange={(monthlyIncome) => setInput({ ...input, monthlyIncome })} />
          <SliderField label="Annual growth" value={input.annualGrowthRate} min={0} max={10} step={0.5} suffix="%" onChange={(annualGrowthRate) => setInput({ ...input, annualGrowthRate })} />
          <SliderField label="Inflation" value={input.inflationRate} min={0} max={8} step={0.5} suffix="%" onChange={(inflationRate) => setInput({ ...input, inflationRate })} />
          <SliderField label="Retirement years" value={input.retirementYears} min={5} max={40} step={1} suffix=" years" onChange={(retirementYears) => setInput({ ...input, retirementYears })} />
        </div>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <WidgetMetric label="Drawdown rate" value={`${percent.format(output.annualDrawdownRate)}%`} />
            <WidgetMetric label="Longevity" value={`${output.estimatedLongevity} years`} />
            <WidgetMetric label="Score" value={`${output.sustainabilityScore}/100`} />
            <WidgetMetric label="Risk" value={output.riskLevel} />
          </div>
          <div className="h-72 rounded-md border border-ink/10 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value) => compactCurrency.format(Number(value))} width={72} />
                <Tooltip formatter={(value) => currency.format(Number(value))} />
                <Line type="monotone" dataKey="balance" stroke="#5a7f71" strokeWidth={2} dot={false} name="Projected balance" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <SaveRow isSaving={isSaving} onSave={save} />
        </div>
      </div>
      <p className="mt-4 text-xs text-ink/50">{disclaimer}</p>
    </WidgetCard>
  );
}

function SaveRow({ isSaving, onSave }: { isSaving: boolean; onSave: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs leading-5 text-ink/55">Values are simulations based on mock assumptions.</p>
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        Save simulation
      </button>
    </div>
  );
}

function calculateTwoPotLocal(input: TwoPotSimulationInput) {
  const withdrawalAmount = Math.min(input.withdrawalAmount, input.savingsPotBalance);
  const estimatedTax = withdrawalAmount * (input.taxRate / 100);
  const netWithdrawal = withdrawalAmount - estimatedTax;
  const totalPortfolio = input.savingsPotBalance + input.retirementPotBalance;
  const growthMultiplier = Math.pow(1 + input.expectedGrowthRate / 100, input.yearsToRetirement);
  const baselineRetirementValue = totalPortfolio * growthMultiplier;
  const projectedRetirementValue = (totalPortfolio - withdrawalAmount) * growthMultiplier;
  const projectedRetirementLoss = baselineRetirementValue - projectedRetirementValue;
  return { estimatedTax, netWithdrawal, projectedRetirementLoss, projectedRetirementValue, baselineRetirementValue };
}

function calculateOnefeeLocal(input: OnefeeSimulationInput) {
  const noFee = compound(input.portfolioValue, input.expectedGrowthRate / 100, input.investmentTerm);
  const currentFeeEndingValue = compoundWithFee(input.portfolioValue, input.expectedGrowthRate / 100, input.currentFeePercentage / 100, input.investmentTerm);
  const onefeeEndingValue = compoundWithFee(input.portfolioValue, input.expectedGrowthRate / 100, input.onefeePercentage / 100, input.investmentTerm);
  const currentFeeCost = noFee - currentFeeEndingValue;
  const onefeeCost = noFee - onefeeEndingValue;
  return {
    currentFeeCost,
    onefeeCost,
    estimatedSavings: Math.max(currentFeeCost - onefeeCost, 0),
    projectedWealthDifference: onefeeEndingValue - currentFeeEndingValue,
  };
}

function calculateIncomeLocal(input: IncomeSustainabilityInput) {
  const annualIncome = input.monthlyIncome * 12;
  const annualDrawdownRate = input.retirementPortfolioValue > 0 ? (annualIncome / input.retirementPortfolioValue) * 100 : 0;
  let balance = input.retirementPortfolioValue;
  let income = annualIncome;
  let estimatedLongevity = input.retirementYears;
  for (let year = 1; year <= 60; year += 1) {
    balance = balance * (1 + input.annualGrowthRate / 100) - income;
    if (balance <= 0) {
      estimatedLongevity = year;
      break;
    }
    income *= 1 + input.inflationRate / 100;
    if (year === input.retirementYears) {
      estimatedLongevity = year;
    }
  }
  const projectedEndingBalance = projectIncomeBalance(input, input.retirementYears);
  const sustainabilityScore = Math.round(Math.min(100, Math.max(0, (estimatedLongevity / input.retirementYears) * 70 + Math.max(0, (7 - annualDrawdownRate) / 7) * 20 + (projectedEndingBalance > 0 ? 10 : 0))));
  const riskLevel = sustainabilityScore < 45 ? 'High' : sustainabilityScore < 70 ? 'Moderate' : 'Low';
  return { annualDrawdownRate, estimatedLongevity, sustainabilityScore, riskLevel, projectedEndingBalance };
}

function buildTwoPotChart(input: TwoPotSimulationInput, output: ReturnType<typeof calculateTwoPotLocal>) {
  return [
    { scenario: 'No withdrawal', value: output.baselineRetirementValue },
    { scenario: 'With withdrawal', value: output.projectedRetirementValue },
    { scenario: 'Impact', value: output.projectedRetirementLoss },
  ];
}

function buildOnefeeChart(input: OnefeeSimulationInput) {
  return Array.from({ length: input.investmentTerm + 1 }, (_, year) => ({
    year,
    currentFees: compoundWithFee(input.portfolioValue, input.expectedGrowthRate / 100, input.currentFeePercentage / 100, year),
    onefee: compoundWithFee(input.portfolioValue, input.expectedGrowthRate / 100, input.onefeePercentage / 100, year),
  }));
}

function buildIncomeChart(input: IncomeSustainabilityInput) {
  let income = input.monthlyIncome * 12;
  let balance = input.retirementPortfolioValue;
  return Array.from({ length: input.retirementYears + 1 }, (_, year) => {
    if (year > 0) {
      balance = Math.max(balance * (1 + input.annualGrowthRate / 100) - income, 0);
      income *= 1 + input.inflationRate / 100;
    }
    return { year, balance };
  });
}

function compound(value: number, rate: number, years: number) {
  return value * Math.pow(1 + rate, years);
}

function compoundWithFee(value: number, growthRate: number, feeRate: number, years: number) {
  let balance = value;
  for (let year = 0; year < years; year += 1) {
    balance *= 1 + growthRate;
    balance *= 1 - feeRate;
  }
  return Math.max(balance, 0);
}

function projectIncomeBalance(input: IncomeSustainabilityInput, years: number) {
  let income = input.monthlyIncome * 12;
  let balance = input.retirementPortfolioValue;
  for (let year = 0; year < years; year += 1) {
    balance = balance * (1 + input.annualGrowthRate / 100) - income;
    income *= 1 + input.inflationRate / 100;
  }
  return balance;
}

function stringifyInputs(input: object) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, String(value)]));
}
