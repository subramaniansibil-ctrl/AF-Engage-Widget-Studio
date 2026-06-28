import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Portfolio, RetirementGoal } from '../../features/advisor/advisorApi';
import type { Simulation } from '../../features/client/clientApi';
import type { IncomeSustainabilityInput, OnefeeSimulationInput, TwoPotSimulationInput } from '../../features/simulations/simulationsApi';
import type { DashboardAssignment } from '../../features/widgets/widgetsApi';
import { WidgetMetric } from './WidgetCard';

export interface SimulationSnapshot {
  inputs: Record<string, string>;
  results: Record<string, string>;
  summary: string;
}

interface WorkspaceProps {
  assignment: DashboardAssignment;
  portfolio: Portfolio;
  retirementGoal: RetirementGoal;
  clientAge: number;
  loadedSimulation?: Simulation;
  onSnapshotChange: (snapshot: SimulationSnapshot) => void;
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const compactCurrency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });

export function InteractiveWidgetWorkspace(props: WorkspaceProps) {
  if (props.assignment.widgetId === 'two-pot-impact') return <TwoPotEditor {...props} />;
  if (props.assignment.widgetId === 'onefee-wealth-reclaim') return <OnefeeEditor {...props} />;
  if (props.assignment.widgetId === 'income-sustainability') return <IncomeEditor {...props} />;
  return <GenericEditor {...props} />;
}

function TwoPotEditor({ assignment, portfolio, retirementGoal, clientAge, loadedSimulation, onSnapshotChange }: WorkspaceProps) {
  const configuredYears = number(assignment.configuration.options.projectionYears, 20);
  const effectiveClientAge = clientAge > 0 ? clientAge : Math.max(retirementGoal.targetAge - configuredYears, 18);
  const [input, setInput] = useState<TwoPotSimulationInput>(() => twoPotInitial(assignment, portfolio, retirementGoal, effectiveClientAge, loadedSimulation));
  const output = useMemo(() => calculateTwoPot(input), [input]);
  const chart = useMemo(() => [
    { scenario: 'Baseline', value: output.baselineRetirementValue },
    { scenario: 'Selected', value: output.projectedRetirementValue },
    { scenario: 'Impact', value: output.projectedRetirementLoss },
  ], [output]);
  useEffect(() => onSnapshotChange({
    inputs: stringify(input),
    results: { estimatedTax: currency.format(output.estimatedTax), netWithdrawal: currency.format(output.netWithdrawal), projectedRetirementLoss: currency.format(output.projectedRetirementLoss), projectedRetirementValue: currency.format(output.projectedRetirementValue), goalCompletion: `${Math.round(output.projectedRetirementValue / Math.max(retirementGoal.targetAmount, 1) * 100)}%` },
    summary: `Net withdrawal ${currency.format(output.netWithdrawal)} with an illustrated retirement impact of ${currency.format(output.projectedRetirementLoss)}.`,
  }), [onSnapshotChange, output, input, retirementGoal.targetAmount]);

  const retirementAge = effectiveClientAge + input.yearsToRetirement;
  return <WorkspaceLayout controls={<>
    <ScenarioSelect label="Withdrawal strategy" value={scenarioFromWithdrawal(input.withdrawalAmount, portfolio.savingsPotBalance)} options={['No withdrawal', 'Moderate withdrawal', 'Maximum available withdrawal']} onChange={(scenario) => setInput({ ...input, withdrawalAmount: scenario === 'No withdrawal' ? 0 : scenario === 'Maximum available withdrawal' ? portfolio.savingsPotBalance : Math.min(25000, portfolio.savingsPotBalance) })} />
    <NumberControl label="Withdrawal amount" value={input.withdrawalAmount} min={0} max={portfolio.savingsPotBalance} step={1000} prefix="$" onChange={(withdrawalAmount) => setInput({ ...input, withdrawalAmount })} />
    <NumberControl label="Tax rate" value={input.taxRate} min={0} max={45} step={1} suffix="%" onChange={(taxRate) => setInput({ ...input, taxRate })} />
    <NumberControl label="Retirement age" value={retirementAge} min={effectiveClientAge + 1} max={75} step={1} onChange={(age) => setInput({ ...input, yearsToRetirement: Math.max(age - effectiveClientAge, 1) })} />
    <NumberControl label="Expected annual return" value={input.expectedGrowthRate} min={0} max={12} step={0.5} suffix="%" onChange={(expectedGrowthRate) => setInput({ ...input, expectedGrowthRate })} />
  </>} metrics={<>
    <WidgetMetric label="Estimated tax" value={currency.format(output.estimatedTax)} />
    <WidgetMetric label="Net withdrawal" value={currency.format(output.netWithdrawal)} />
    <WidgetMetric label="Retirement impact" value={currency.format(output.projectedRetirementLoss)} />
    <WidgetMetric label="Projected value" value={currency.format(output.projectedRetirementValue)} />
  </>} chart={<ResponsiveContainer width="100%" height="100%"><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="scenario" /><YAxis tickFormatter={(value) => compactCurrency.format(Number(value))} width={68} /><Tooltip formatter={(value) => currency.format(Number(value))} /><Bar dataKey="value" fill="#00a878" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer>} insight={`At retirement age ${retirementAge}, this scenario preserves an illustrated ${Math.max(0, Math.round(output.projectedRetirementValue / Math.max(output.baselineRetirementValue, 1) * 100))}% of the baseline retirement value.`} />;
}

function OnefeeEditor({ assignment, portfolio, loadedSimulation, onSnapshotChange }: WorkspaceProps) {
  const [input, setInput] = useState<OnefeeSimulationInput>(() => onefeeInitial(assignment, portfolio, loadedSimulation));
  const output = useMemo(() => calculateOnefee(input), [input]);
  const chart = useMemo(() => Array.from({ length: input.investmentTerm + 1 }, (_, year) => ({ year, currentFees: compoundWithFee(input.portfolioValue, input.expectedGrowthRate / 100, input.currentFeePercentage / 100, year), onefee: compoundWithFee(input.portfolioValue, input.expectedGrowthRate / 100, input.onefeePercentage / 100, year) })), [input]);
  useEffect(() => onSnapshotChange({
    inputs: stringify(input),
    results: { currentFeeCost: currency.format(output.currentFeeCost), onefeeCost: currency.format(output.onefeeCost), estimatedSavings: currency.format(output.estimatedSavings), projectedWealthDifference: currency.format(output.projectedWealthDifference), investmentGrowth: currency.format(output.onefeeEndingValue) },
    summary: `Illustrated fee savings of ${currency.format(output.estimatedSavings)} over ${input.investmentTerm} years.`,
  }), [input, onSnapshotChange, output]);
  return <WorkspaceLayout controls={<>
    <NumberControl label="Portfolio value" value={input.portfolioValue} min={50000} max={3000000} step={25000} prefix="$" onChange={(portfolioValue) => setInput({ ...input, portfolioValue })} />
    <NumberControl label="Current fee" value={input.currentFeePercentage} min={0.25} max={2.5} step={0.05} suffix="%" onChange={(currentFeePercentage) => setInput({ ...input, currentFeePercentage })} />
    <NumberControl label="Onefee assumption" value={input.onefeePercentage} min={0.1} max={1.5} step={0.05} suffix="%" onChange={(onefeePercentage) => setInput({ ...input, onefeePercentage })} />
    <NumberControl label="Investment duration" value={input.investmentTerm} min={1} max={40} step={1} suffix=" years" onChange={(investmentTerm) => setInput({ ...input, investmentTerm })} />
    <NumberControl label="Expected annual return" value={input.expectedGrowthRate} min={0} max={12} step={0.5} suffix="%" onChange={(expectedGrowthRate) => setInput({ ...input, expectedGrowthRate })} />
  </>} metrics={<>
    <WidgetMetric label="Current fee cost" value={currency.format(output.currentFeeCost)} />
    <WidgetMetric label="Onefee cost" value={currency.format(output.onefeeCost)} />
    <WidgetMetric label="Estimated savings" value={currency.format(output.estimatedSavings)} />
    <WidgetMetric label="Wealth difference" value={currency.format(output.projectedWealthDifference)} />
  </>} chart={<ResponsiveContainer width="100%" height="100%"><LineChart data={chart}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="year" /><YAxis tickFormatter={(value) => compactCurrency.format(Number(value))} width={68} /><Tooltip formatter={(value) => currency.format(Number(value))} /><Line type="monotone" dataKey="currentFees" stroke="#dc6b57" strokeWidth={2.5} dot={false} name="Current fee path" /><Line type="monotone" dataKey="onefee" stroke="#00a878" strokeWidth={2.5} dot={false} name="Onefee path" /></LineChart></ResponsiveContainer>} insight={`The lower-fee path illustrates ${currency.format(output.projectedWealthDifference)} more wealth after ${input.investmentTerm} years.`} />;
}

function IncomeEditor({ assignment, portfolio, retirementGoal, loadedSimulation, onSnapshotChange }: WorkspaceProps) {
  const [input, setInput] = useState<IncomeSustainabilityInput>(() => incomeInitial(assignment, portfolio, retirementGoal, loadedSimulation));
  const output = useMemo(() => calculateIncome(input), [input]);
  const chart = useMemo(() => buildIncomeChart(input), [input]);
  useEffect(() => onSnapshotChange({
    inputs: stringify(input),
    results: { annualDrawdownRate: `${output.annualDrawdownRate.toFixed(1)}%`, estimatedLongevity: `${output.estimatedLongevity} years`, sustainabilityScore: `${output.sustainabilityScore}/100`, riskLevel: output.riskLevel, projectedEndingBalance: currency.format(output.projectedEndingBalance), expectedRetirementIncome: currency.format(input.monthlyIncome) },
    summary: `${output.riskLevel} illustrated risk with a sustainability score of ${output.sustainabilityScore}/100.`,
  }), [input, onSnapshotChange, output]);
  return <WorkspaceLayout controls={<>
    <ScenarioSelect label="Market scenario" value={marketScenario(input.annualGrowthRate)} options={['Conservative market', 'Balanced market', 'Growth market']} onChange={(scenario) => setInput({ ...input, annualGrowthRate: scenario === 'Conservative market' ? 3.5 : scenario === 'Growth market' ? 7.5 : 5 })} />
    <NumberControl label="Retirement portfolio" value={input.retirementPortfolioValue} min={50000} max={3000000} step={5000} prefix="$" onChange={(retirementPortfolioValue) => setInput({ ...input, retirementPortfolioValue })} />
    <NumberControl label="Monthly retirement income" value={input.monthlyIncome} min={500} max={20000} step={250} prefix="$" onChange={(monthlyIncome) => setInput({ ...input, monthlyIncome })} />
    <NumberControl label="Expected annual return" value={input.annualGrowthRate} min={0} max={12} step={0.5} suffix="%" onChange={(annualGrowthRate) => setInput({ ...input, annualGrowthRate })} />
    <NumberControl label="Inflation assumption" value={input.inflationRate} min={0} max={10} step={0.5} suffix="%" onChange={(inflationRate) => setInput({ ...input, inflationRate })} />
    <NumberControl label="Retirement duration" value={input.retirementYears} min={5} max={45} step={1} suffix=" years" onChange={(retirementYears) => setInput({ ...input, retirementYears })} />
  </>} metrics={<>
    <WidgetMetric label="Drawdown rate" value={`${output.annualDrawdownRate.toFixed(1)}%`} />
    <WidgetMetric label="Portfolio longevity" value={`${output.estimatedLongevity} years`} />
    <WidgetMetric label="Sustainability" value={`${output.sustainabilityScore}/100`} />
    <WidgetMetric label="Risk level" value={output.riskLevel} />
  </>} chart={<ResponsiveContainer width="100%" height="100%"><LineChart data={chart}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="year" /><YAxis tickFormatter={(value) => compactCurrency.format(Number(value))} width={68} /><Tooltip formatter={(value) => currency.format(Number(value))} /><Line type="monotone" dataKey="balance" stroke="#00a878" strokeWidth={2.5} dot={false} name="Projected balance" /></LineChart></ResponsiveContainer>} insight={`This scenario supports an estimated ${output.estimatedLongevity} years of income with a ${output.riskLevel.toLowerCase()} illustrated risk level.`} progress={output.sustainabilityScore} />;
}

function GenericEditor({ assignment, loadedSimulation, onSnapshotChange }: WorkspaceProps) {
  const [values, setValues] = useState<Record<string, string>>(loadedSimulation?.inputs ?? assignment.configuration.options);
  useEffect(() => onSnapshotChange({ inputs: values, results: values, summary: 'Custom widget scenario.' }), [onSnapshotChange, values]);
  return <WorkspaceLayout controls={<>{Object.entries(values).map(([key, value]) => <label key={key} className="block rounded-md border border-ink/10 p-3"><span className="text-xs font-semibold text-ink/55">{humanize(key)}</span><input className="mt-2 min-h-10 w-full rounded-md border border-ink/10 px-3 text-sm" value={value} onChange={(event) => setValues({ ...values, [key]: event.target.value })} /></label>)}</>} metrics={<WidgetMetric label="Configured fields" value={String(Object.keys(values).length)} />} chart={<div className="grid h-full place-items-center text-sm text-ink/50">Visualization updates from configured values.</div>} insight="Explore the values and save a named scenario for future comparison." />;
}

function WorkspaceLayout({ controls, metrics, chart, insight, progress }: { controls: React.ReactNode; metrics: React.ReactNode; chart: React.ReactNode; insight: string; progress?: number }) {
  return <div className="grid items-start gap-5 xl:grid-cols-[350px_minmax(0,1fr)]">
    <section className="rounded-md border border-ink/10 bg-white/60 p-4 shadow-sm dark:border-white/10 dark:bg-white/5"><h3 className="text-sm font-semibold">Explore your scenario</h3><p className="mt-1 text-xs text-ink/50 dark:text-white/50">Changes recalculate instantly and do not alter advisor defaults.</p><div className="mt-4 space-y-3">{controls}</div></section>
    <div className="space-y-4"><motion.div layout className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics}</motion.div>{progress !== undefined && <div className="rounded-md border border-ink/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5"><div className="flex justify-between text-xs"><span>Sustainability progress</span><strong>{progress}%</strong></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink/8 dark:bg-white/10"><motion.div className="h-full rounded-full bg-sage" animate={{ width: `${progress}%` }} transition={{ duration: 0.35 }} /></div></div>}<motion.div layout className="h-72 rounded-md border border-ink/10 bg-white/60 p-3 shadow-sm dark:border-white/10 dark:bg-white/5">{chart}</motion.div><div className="rounded-md border border-sage/20 bg-sage/8 p-4"><p className="text-xs font-semibold uppercase text-sage">Key insight</p><p className="mt-2 text-sm leading-6 text-ink/70 dark:text-white/70">{insight}</p></div></div>
  </div>;
}

function NumberControl({ label, value, min, max, step, prefix, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; prefix?: string; suffix?: string; onChange: (value: number) => void }) {
  return <label className="block rounded-md border border-ink/10 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5"><span className="text-xs font-semibold text-ink/60 dark:text-white/60">{label}</span><div className="mt-2 flex items-center gap-2"><span className="text-xs text-ink/45">{prefix}</span><input aria-label={label} type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(clamp(Number(event.target.value), min, max))} className="min-h-9 min-w-0 flex-1 rounded-md border border-ink/10 bg-white px-2 text-sm font-semibold outline-none focus:border-sage dark:border-white/10 dark:bg-ink" /><span className="shrink-0 text-xs text-ink/45">{suffix}</span></div><input aria-label={`${label} slider`} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-3 w-full accent-sage" /></label>;
}

function ScenarioSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="block rounded-md border border-ink/10 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5"><span className="text-xs font-semibold text-ink/60 dark:text-white/60">{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-10 w-full rounded-md border border-ink/10 bg-white px-2 text-sm font-semibold outline-none focus:border-sage dark:border-white/10 dark:bg-ink">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function twoPotInitial(assignment: DashboardAssignment, portfolio: Portfolio, goal: RetirementGoal, age: number, simulation?: Simulation): TwoPotSimulationInput {
  const years = number(assignment.configuration.options.projectionYears, Math.max(goal.targetAge - age, 10));
  const scenario = assignment.configuration.options.withdrawalScenario ?? 'Moderate withdrawal';
  const baseline = { savingsPotBalance: portfolio.savingsPotBalance, retirementPotBalance: portfolio.retirementPotBalance, withdrawalAmount: scenario === 'No withdrawal' ? 0 : scenario.includes('Maximum') ? portfolio.savingsPotBalance : Math.min(25000, portfolio.savingsPotBalance), taxRate: 25, yearsToRetirement: years, expectedGrowthRate: 6 };
  return simulation ? { ...baseline, ...parseNumbers(simulation.inputs) } : baseline;
}
function onefeeInitial(assignment: DashboardAssignment, portfolio: Portfolio, simulation?: Simulation): OnefeeSimulationInput { const fees = (assignment.configuration.options.feeComparison ?? '1.25% vs 0.75%').match(/[\d.]+/g)?.map(Number) ?? [1.25, 0.75]; const baseline = { portfolioValue: portfolio.totalValue, currentFeePercentage: fees[0], onefeePercentage: fees[1], investmentTerm: number(assignment.configuration.options.projectionYears, 15), expectedGrowthRate: 6 }; return simulation ? { ...baseline, ...parseNumbers(simulation.inputs) } : baseline; }
function incomeInitial(assignment: DashboardAssignment, portfolio: Portfolio, goal: RetirementGoal, simulation?: Simulation): IncomeSustainabilityInput { const scenario = assignment.configuration.options.scenario ?? assignment.configuration.options.stressScenario ?? 'Balanced market'; const baseline = { retirementPortfolioValue: portfolio.retirementPotBalance, monthlyIncome: number(assignment.configuration.options.monthlyIncomeTarget, 4500), annualGrowthRate: scenario.includes('Conservative') ? 3.5 : scenario.includes('Growth') ? 7.5 : 5, inflationRate: 3, retirementYears: number(assignment.configuration.options.projectionYears, Math.max(goal.targetAge - 35, 25)) }; return simulation ? { ...baseline, ...parseNumbers(simulation.inputs) } : baseline; }

function calculateTwoPot(input: TwoPotSimulationInput) { const withdrawal = Math.min(input.withdrawalAmount, input.savingsPotBalance); const estimatedTax = withdrawal * input.taxRate / 100; const total = input.savingsPotBalance + input.retirementPotBalance; const multiplier = Math.pow(1 + input.expectedGrowthRate / 100, input.yearsToRetirement); const baselineRetirementValue = total * multiplier; const projectedRetirementValue = (total - withdrawal) * multiplier; return { estimatedTax, netWithdrawal: withdrawal - estimatedTax, projectedRetirementLoss: baselineRetirementValue - projectedRetirementValue, projectedRetirementValue, baselineRetirementValue }; }
function calculateOnefee(input: OnefeeSimulationInput) { const noFee = compound(input.portfolioValue, input.expectedGrowthRate / 100, input.investmentTerm); const currentFeeEndingValue = compoundWithFee(input.portfolioValue, input.expectedGrowthRate / 100, input.currentFeePercentage / 100, input.investmentTerm); const onefeeEndingValue = compoundWithFee(input.portfolioValue, input.expectedGrowthRate / 100, input.onefeePercentage / 100, input.investmentTerm); const currentFeeCost = noFee - currentFeeEndingValue; const onefeeCost = noFee - onefeeEndingValue; return { currentFeeCost, onefeeCost, estimatedSavings: Math.max(currentFeeCost - onefeeCost, 0), projectedWealthDifference: onefeeEndingValue - currentFeeEndingValue, onefeeEndingValue }; }
function calculateIncome(input: IncomeSustainabilityInput) { const annualIncome = input.monthlyIncome * 12; const annualDrawdownRate = input.retirementPortfolioValue > 0 ? annualIncome / input.retirementPortfolioValue * 100 : 0; let balance = input.retirementPortfolioValue; let income = annualIncome; let estimatedLongevity = input.retirementYears; for (let year = 1; year <= 60; year += 1) { balance = balance * (1 + input.annualGrowthRate / 100) - income; if (balance <= 0) { estimatedLongevity = year; break; } income *= 1 + input.inflationRate / 100; if (year === input.retirementYears) estimatedLongevity = year; } const projectedEndingBalance = projectIncomeBalance(input, input.retirementYears); const sustainabilityScore = Math.round(clamp(estimatedLongevity / input.retirementYears * 70 + Math.max(0, (7 - annualDrawdownRate) / 7) * 20 + (projectedEndingBalance > 0 ? 10 : 0), 0, 100)); return { annualDrawdownRate, estimatedLongevity, sustainabilityScore, riskLevel: sustainabilityScore < 45 ? 'High' : sustainabilityScore < 70 ? 'Moderate' : 'Low', projectedEndingBalance }; }
function buildIncomeChart(input: IncomeSustainabilityInput) { let income = input.monthlyIncome * 12; let balance = input.retirementPortfolioValue; return Array.from({ length: input.retirementYears + 1 }, (_, year) => { if (year > 0) { balance = Math.max(balance * (1 + input.annualGrowthRate / 100) - income, 0); income *= 1 + input.inflationRate / 100; } return { year, balance }; }); }
function compound(value: number, rate: number, years: number) { return value * Math.pow(1 + rate, years); }
function compoundWithFee(value: number, growth: number, fee: number, years: number) { let balance = value; for (let year = 0; year < years; year += 1) balance = Math.max(balance * (1 + growth) * (1 - fee), 0); return balance; }
function projectIncomeBalance(input: IncomeSustainabilityInput, years: number) { let income = input.monthlyIncome * 12; let balance = input.retirementPortfolioValue; for (let year = 0; year < years; year += 1) { balance = balance * (1 + input.annualGrowthRate / 100) - income; income *= 1 + input.inflationRate / 100; } return balance; }
function stringify(input: object) { return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, String(value)])); }
function parseNumbers(input: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(input).flatMap(([key, value]) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? [[key, parsed]] : [];
    }),
  );
}
function number(value: string | undefined, fallback: number) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
function clamp(value: number, min: number, max: number) { return Math.min(Math.max(Number.isFinite(value) ? value : min, min), max); }
function scenarioFromWithdrawal(value: number, savings: number) { return value <= 0 ? 'No withdrawal' : value >= savings ? 'Maximum available withdrawal' : 'Moderate withdrawal'; }
function marketScenario(rate: number) { return rate <= 4 ? 'Conservative market' : rate >= 7 ? 'Growth market' : 'Balanced market'; }
function humanize(value: string) { return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase()); }
