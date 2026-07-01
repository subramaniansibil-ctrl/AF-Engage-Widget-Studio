import { motion } from 'framer-motion';
import { CircleHelp, Lightbulb, MoveRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Portfolio, RetirementGoal } from '../../features/advisor/advisorApi';
import type { Simulation } from '../../features/client/clientApi';
import type { IncomeSustainabilityInput, OnefeeSimulationInput, TwoPotSimulationInput } from '../../features/simulations/simulationsApi';
import type { DashboardAssignment } from '../../features/widgets/widgetsApi';
import { WidgetMetric } from './WidgetCard';
import { compactZarCurrency as compactCurrency, CURRENCY_SYMBOL, zarCurrency as currency } from '../../utils/currency';

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
    <ControlGroup title="Your withdrawal" description="Start with the amount you may need from your accessible savings pot.">
      <NumberControl label="Savings pot balance" description="The amount currently available in your accessible savings pot. Change it to explore a different starting balance." tooltip="For an assigned client, this starts with their portfolio value. Editing it only changes this simulation." value={input.savingsPotBalance} min={0} max={1000000} step={5000} prefix={CURRENCY_SYMBOL} onChange={(savingsPotBalance) => setInput({ ...input, savingsPotBalance, withdrawalAmount: Math.min(input.withdrawalAmount, savingsPotBalance) })} />
      <ScenarioSelect label="How much would you like to withdraw?" description="Choose a quick starting point. You can fine-tune the amount below." value={scenarioFromWithdrawal(input.withdrawalAmount, input.savingsPotBalance)} options={['No withdrawal', 'Moderate withdrawal', 'Maximum available withdrawal']} onChange={(scenario) => setInput({ ...input, withdrawalAmount: scenario === 'No withdrawal' ? 0 : scenario === 'Maximum available withdrawal' ? input.savingsPotBalance : Math.min(25000, input.savingsPotBalance) })} />
      <NumberControl label="Withdrawal amount" description="The cash you plan to take out now. A larger withdrawal leaves less invested for retirement." value={input.withdrawalAmount} min={0} max={input.savingsPotBalance} step={1000} prefix={CURRENCY_SYMBOL} onChange={(withdrawalAmount) => setInput({ ...input, withdrawalAmount })} />
      <NumberControl label="Estimated tax on the withdrawal" description="The percentage of the withdrawal expected to go to tax. Use your likely rate or ask your advisor." tooltip="This is an estimate, not a tax calculation." value={input.taxRate} min={0} max={45} step={1} suffix="%" onChange={(taxRate) => setInput({ ...input, taxRate })} />
    </ControlGroup>
    <ControlGroup title="Your retirement plan" description="These assumptions show how the money left invested could grow.">
      <NumberControl label="Planned retirement age" description="The age when you expect to start using your retirement savings." value={retirementAge} min={effectiveClientAge + 1} max={75} step={1} onChange={(age) => setInput({ ...input, yearsToRetirement: Math.max(age - effectiveClientAge, 1) })} />
      <NumberControl label="Expected yearly investment growth" description="The average percentage your invested money may grow each year before retirement." tooltip="Investment returns can rise or fall. This is an illustration, not a guarantee." value={input.expectedGrowthRate} min={0} max={12} step={0.5} suffix="%" onChange={(expectedGrowthRate) => setInput({ ...input, expectedGrowthRate })} />
    </ControlGroup>
  </>} metrics={<>
    <WidgetMetric label="Estimated tax" value={currency.format(output.estimatedTax)} />
    <WidgetMetric label="Net withdrawal" value={currency.format(output.netWithdrawal)} />
    <WidgetMetric label="Retirement impact" value={currency.format(output.projectedRetirementLoss)} />
    <WidgetMetric label="Projected value" value={currency.format(output.projectedRetirementValue)} />
  </>} chart={<ResponsiveContainer width="100%" height="100%"><BarChart data={chart} margin={{ bottom: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="scenario" label={{ value: 'Retirement outcome', position: 'insideBottom', offset: -4 }} /><YAxis tickFormatter={(value) => compactCurrency.format(Number(value))} width={96} label={{ value: 'Projected value', angle: -90, position: 'insideLeft' }} /><Tooltip formatter={(value) => currency.format(Number(value))} /><Legend verticalAlign="top" /><Bar dataKey="value" name="Projected amount" fill="#00a878" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer>} chartTitle="How a withdrawal changes your retirement value" chartDescription="Compare the value with no withdrawal, your selected withdrawal, and the long-term amount given up." mainResult={{ label: 'Cash you receive after estimated tax', value: currency.format(output.netWithdrawal), detail: `${currency.format(output.projectedRetirementLoss)} less may be available at retirement.` }} howWorks="We subtract your withdrawal and estimated tax, then grow the remaining retirement savings using your selected yearly return until retirement." insight={`At retirement age ${retirementAge}, this scenario preserves an illustrated ${Math.max(0, Math.round(output.projectedRetirementValue / Math.max(output.baselineRetirementValue, 1) * 100))}% of the value you could have without a withdrawal.`} nextStep="Try a smaller withdrawal and compare the retirement impact. Save the option that best balances today’s need with your future goal." />;
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
    <ControlGroup title="Your investment" description="Tell us how much is invested and how long it may stay invested.">
      <NumberControl label="Current investment value" description="The total value of the investments whose fees you want to compare." value={input.portfolioValue} min={50000} max={3000000} step={25000} prefix={CURRENCY_SYMBOL} onChange={(portfolioValue) => setInput({ ...input, portfolioValue })} />
      <NumberControl label="Years you plan to stay invested" description="The number of years fees and investment growth will build up." value={input.investmentTerm} min={1} max={40} step={1} suffix=" years" onChange={(investmentTerm) => setInput({ ...input, investmentTerm })} />
      <NumberControl label="Expected yearly investment growth" description="The average growth expected each year before fees are deducted." tooltip="Actual investment returns will vary and are not guaranteed." value={input.expectedGrowthRate} min={0} max={12} step={0.5} suffix="%" onChange={(expectedGrowthRate) => setInput({ ...input, expectedGrowthRate })} />
    </ControlGroup>
    <ControlGroup title="Fees to compare" description="Enter the yearly percentage charged by each option.">
      <NumberControl label="Your current yearly fee" description="The percentage of your investment charged each year under the current option." value={input.currentFeePercentage} min={0.25} max={2.5} step={0.05} suffix="%" onChange={(currentFeePercentage) => setInput({ ...input, currentFeePercentage })} />
      <NumberControl label="Alternative yearly fee" description="The lower fee you want to compare with your current fee." tooltip="Even a small percentage difference can add up over many years." value={input.onefeePercentage} min={0.1} max={1.5} step={0.05} suffix="%" onChange={(onefeePercentage) => setInput({ ...input, onefeePercentage })} />
    </ControlGroup>
  </>} metrics={<>
    <WidgetMetric label="Current fee cost" value={currency.format(output.currentFeeCost)} />
    <WidgetMetric label="Onefee cost" value={currency.format(output.onefeeCost)} />
    <WidgetMetric label="Estimated savings" value={currency.format(output.estimatedSavings)} />
    <WidgetMetric label="Wealth difference" value={currency.format(output.projectedWealthDifference)} />
  </>} chart={<ResponsiveContainer width="100%" height="100%"><LineChart data={chart} margin={{ bottom: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="year" label={{ value: 'Years invested', position: 'insideBottom', offset: -4 }} /><YAxis tickFormatter={(value) => compactCurrency.format(Number(value))} width={96} label={{ value: 'Investment value', angle: -90, position: 'insideLeft' }} /><Tooltip formatter={(value) => currency.format(Number(value))} /><Legend verticalAlign="top" /><Line type="monotone" dataKey="currentFees" stroke="#dc6b57" strokeWidth={2.5} dot={false} name="Current fee" /><Line type="monotone" dataKey="onefee" stroke="#00a878" strokeWidth={2.5} dot={false} name="Alternative fee" /></LineChart></ResponsiveContainer>} chartTitle="How fees affect your investment over time" chartDescription="The gap between the lines is the extra investment value kept when the yearly fee is lower." mainResult={{ label: 'Potential extra investment value', value: currency.format(output.projectedWealthDifference), detail: `Based on staying invested for ${input.investmentTerm} years.` }} howWorks="We grow the same starting investment along two paths, deducting each yearly fee along the way. The difference shows the long-term cost of the higher fee." insight={`The lower-fee option could leave you with ${currency.format(output.projectedWealthDifference)} more after ${input.investmentTerm} years.`} nextStep="Check the fees on your latest statement, update both values, and discuss whether switching costs or product differences affect the comparison." />;
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
    <ControlGroup title="Your retirement income" description="Set the savings available at retirement and the monthly income you want.">
      <NumberControl label="Savings available at retirement" description="The amount expected to fund your retirement income when this plan starts." value={input.retirementPortfolioValue} min={50000} max={3000000} step={5000} prefix={CURRENCY_SYMBOL} onChange={(retirementPortfolioValue) => setInput({ ...input, retirementPortfolioValue })} />
      <NumberControl label="Monthly income you want" description="The amount you plan to withdraw each month in today’s money." value={input.monthlyIncome} min={500} max={20000} step={250} prefix={CURRENCY_SYMBOL} onChange={(monthlyIncome) => setInput({ ...input, monthlyIncome })} />
      <NumberControl label="How many years income should last?" description="The length of retirement you want this plan to cover." value={input.retirementYears} min={5} max={45} step={1} suffix=" years" onChange={(retirementYears) => setInput({ ...input, retirementYears })} />
    </ControlGroup>
    <ControlGroup title="Future assumptions" description="Explore how investment growth and rising living costs affect the plan.">
      <ScenarioSelect label="Choose a market outlook" description="Pick a simple starting assumption for investment growth." value={marketScenario(input.annualGrowthRate)} options={['Conservative market', 'Balanced market', 'Growth market']} onChange={(scenario) => setInput({ ...input, annualGrowthRate: scenario === 'Conservative market' ? 3.5 : scenario === 'Growth market' ? 7.5 : 5 })} />
      <NumberControl label="Expected yearly investment growth" description="The average percentage the remaining retirement savings may grow each year." tooltip="Returns change over time and may be negative. This value is only an assumption." value={input.annualGrowthRate} min={0} max={12} step={0.5} suffix="%" onChange={(annualGrowthRate) => setInput({ ...input, annualGrowthRate })} />
      <NumberControl label="Expected yearly rise in living costs" description="How much prices may increase each year. Your income withdrawals rise by this amount." tooltip="This is commonly called inflation." value={input.inflationRate} min={0} max={10} step={0.5} suffix="%" onChange={(inflationRate) => setInput({ ...input, inflationRate })} />
    </ControlGroup>
  </>} metrics={<>
    <WidgetMetric label="Drawdown rate" value={`${output.annualDrawdownRate.toFixed(1)}%`} />
    <WidgetMetric label="Portfolio longevity" value={`${output.estimatedLongevity} years`} />
    <WidgetMetric label="Sustainability" value={`${output.sustainabilityScore}/100`} />
    <WidgetMetric label="Risk level" value={output.riskLevel} />
  </>} chart={<ResponsiveContainer width="100%" height="100%"><LineChart data={chart} margin={{ bottom: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="year" label={{ value: 'Years into retirement', position: 'insideBottom', offset: -4 }} /><YAxis tickFormatter={(value) => compactCurrency.format(Number(value))} width={96} label={{ value: 'Savings remaining', angle: -90, position: 'insideLeft' }} /><Tooltip formatter={(value) => currency.format(Number(value))} /><Legend verticalAlign="top" /><Line type="monotone" dataKey="balance" stroke="#00a878" strokeWidth={2.5} dot={false} name="Savings remaining" /></LineChart></ResponsiveContainer>} chartTitle="How long your retirement savings may last" chartDescription="Follow the line to see how withdrawals, investment growth, and rising living costs change the balance each year." mainResult={{ label: 'Estimated time your income can last', value: `${output.estimatedLongevity} years`, detail: `${output.riskLevel} risk · ${output.sustainabilityScore}/100 sustainability score.` }} howWorks="Each year we grow the remaining savings, subtract your income, and increase that income with living costs. The score reflects whether the money lasts for your selected retirement period." insight={`This plan may support about ${output.estimatedLongevity} years of income. Its illustrated risk is ${output.riskLevel.toLowerCase()}.`} nextStep="If the score feels low, try a smaller monthly income, a shorter target period, or more starting savings. Save a realistic option to discuss with your advisor." progress={output.sustainabilityScore} />;
}

function GenericEditor({ assignment, loadedSimulation, onSnapshotChange }: WorkspaceProps) {
  const [values, setValues] = useState<Record<string, string>>(loadedSimulation?.inputs ?? assignment.configuration.options);
  useEffect(() => onSnapshotChange({ inputs: values, results: values, summary: 'Custom widget scenario.' }), [onSnapshotChange, values]);
  return <WorkspaceLayout controls={<ControlGroup title="Scenario details" description="Adjust any value to explore a different outcome.">{Object.entries(values).map(([key, value]) => <label key={key} className="block rounded-md border border-ink/10 bg-white/40 p-3"><span className="text-sm font-semibold text-ink/70">{humanize(key)}</span><p className="mt-1 text-xs leading-5 text-ink/50">Change this value to see how it affects the scenario.</p><input className="mt-3 min-h-10 w-full rounded-md border border-ink/10 px-3 text-sm" value={value} onChange={(event) => setValues({ ...values, [key]: event.target.value })} /></label>)}</ControlGroup>} metrics={<WidgetMetric label="Values included" value={String(Object.keys(values).length)} />} chart={<div className="grid h-full place-items-center px-6 text-center text-sm text-ink/50">A visualization will appear when this widget provides chart-ready results.</div>} chartTitle="Scenario overview" chartDescription="Your configured values update as you type." mainResult={{ label: 'Scenario ready', value: `${Object.keys(values).length} values`, detail: 'Review the inputs before saving this scenario.' }} howWorks="This custom widget keeps the configured values together so you can explore and save a scenario." insight="Review each value and adjust anything that does not match your situation." nextStep="When the values look right, save the scenario so you can return to it later." />;
}

interface WorkspaceLayoutProps {
  controls: React.ReactNode;
  metrics: React.ReactNode;
  chart: React.ReactNode;
  chartTitle: string;
  chartDescription: string;
  mainResult: { label: string; value: string; detail: string };
  howWorks: string;
  insight: string;
  nextStep: string;
  progress?: number;
}

function WorkspaceLayout({ controls, metrics, chart, chartTitle, chartDescription, mainResult, howWorks, insight, nextStep, progress }: WorkspaceLayoutProps) {
  return <div className="space-y-5">
    <section className="rounded-md border border-sage/20 bg-sage/[0.06] p-4 sm:p-5">
      <div className="flex items-start gap-3"><span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sage/12 text-sage"><Lightbulb className="h-4 w-4" /></span><div><h3 className="font-semibold">How this works</h3><p className="mt-1 max-w-4xl text-sm leading-6 text-ink/65 dark:text-white/65">{howWorks}</p></div></div>
    </section>
    <div className="grid items-start gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
      <section className="rounded-md border border-ink/10 bg-white/60 p-4 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-5"><h3 className="text-lg font-semibold">Build your scenario</h3><p className="mt-1 text-sm leading-6 text-ink/55 dark:text-white/55">Start with the example values, then adjust one item at a time. Results update instantly.</p><div className="mt-5 space-y-5">{controls}</div></section>
      <div className="min-w-0 space-y-4">
        <motion.section layout aria-live="polite" className="rounded-md border border-sage/25 bg-gradient-to-br from-sage/15 to-white p-5 shadow-sm dark:to-ink"><p className="text-xs font-bold uppercase tracking-wide text-sage">Most important result</p><p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{mainResult.value}</p><p className="mt-1 text-sm font-semibold text-ink/70 dark:text-white/70">{mainResult.label}</p><p className="mt-2 text-sm leading-6 text-ink/55 dark:text-white/55">{mainResult.detail}</p></motion.section>
        <motion.div layout className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics}</motion.div>
        {progress !== undefined && <section aria-label="Sustainability score" className="rounded-md border border-ink/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">Plan sustainability score</p><p className="mt-1 text-xs text-ink/50">Higher means the selected income is more likely to last for the full period.</p></div><strong className="text-2xl text-sage">{progress}/100</strong></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-ink/8 dark:bg-white/10"><motion.div className="h-full rounded-full bg-sage" animate={{ width: `${progress}%` }} transition={{ duration: 0.35 }} /></div></section>}
        <motion.section layout className="rounded-md border border-ink/10 bg-white/60 p-4 shadow-sm dark:border-white/10 dark:bg-white/5"><h3 className="text-base font-semibold">{chartTitle}</h3><p className="mt-1 text-xs leading-5 text-ink/50 dark:text-white/50">{chartDescription}</p><div className="mt-4 h-72 min-w-0 sm:h-80">{chart}</div></motion.section>
        <section className="grid gap-3 md:grid-cols-2"><div className="rounded-md border border-sage/20 bg-sage/8 p-4"><p className="text-xs font-bold uppercase tracking-wide text-sage">What this means</p><p className="mt-2 text-sm leading-6 text-ink/70 dark:text-white/70">{insight}</p></div><div className="rounded-md border border-gold/25 bg-gold/8 p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink/60 dark:text-white/60">What to do next <MoveRight className="h-4 w-4" /></p><p className="mt-2 text-sm leading-6 text-ink/70 dark:text-white/70">{nextStep}</p></div></section>
      </div>
    </div>
  </div>;
}

function ControlGroup({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <fieldset className="space-y-3"><legend className="text-sm font-bold text-ink/80 dark:text-white/80">{title}</legend><p className="-mt-2 text-xs leading-5 text-ink/50 dark:text-white/50">{description}</p>{children}</fieldset>;
}

interface NumberControlProps { label: string; description: string; tooltip?: string; value: number; min: number; max: number; step: number; prefix?: string; suffix?: string; onChange: (value: number) => void }
function NumberControl({ label, description, tooltip, value, min, max, step, prefix, suffix, onChange }: NumberControlProps) {
  return <label className="block rounded-md border border-ink/10 bg-white/40 p-3 transition focus-within:border-sage/60 dark:border-white/10 dark:bg-white/5"><span className="flex items-center gap-1.5 text-sm font-semibold text-ink/75 dark:text-white/75">{label}{tooltip && <span className="group/help relative inline-flex" title={tooltip}><CircleHelp className="h-3.5 w-3.5 text-sage" aria-label={tooltip} /><span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-56 -translate-x-1/2 rounded-md bg-ink px-3 py-2 text-xs font-normal leading-5 text-white shadow-panel group-hover/help:block group-focus-within/help:block">{tooltip}</span></span>}</span><span className="mt-1 block text-xs leading-5 text-ink/50 dark:text-white/50">{description}</span><span className="mt-3 flex items-center gap-2"><span className="text-xs text-ink/45">{prefix}</span><input aria-label={label} type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(clamp(Number(event.target.value), min, max))} className="min-h-10 min-w-0 flex-1 rounded-md border border-ink/10 bg-white px-2 text-sm font-semibold outline-none focus:border-sage dark:border-white/10 dark:bg-ink" /><span className="shrink-0 text-xs text-ink/45">{suffix}</span></span><input aria-label={`${label} slider`} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-3 w-full accent-sage" /><span className="mt-1 flex justify-between text-[10px] text-ink/35"><span>{prefix}{min}{suffix}</span><span>{prefix}{max}{suffix}</span></span></label>;
}

function ScenarioSelect({ label, description, value, options, onChange }: { label: string; description: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="block rounded-md border border-ink/10 bg-white/40 p-3 transition focus-within:border-sage/60 dark:border-white/10 dark:bg-white/5"><span className="text-sm font-semibold text-ink/75 dark:text-white/75">{label}</span><span className="mt-1 block text-xs leading-5 text-ink/50 dark:text-white/50">{description}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="mt-3 min-h-10 w-full rounded-md border border-ink/10 bg-white px-2 text-sm font-semibold outline-none focus:border-sage dark:border-white/10 dark:bg-ink">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
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
