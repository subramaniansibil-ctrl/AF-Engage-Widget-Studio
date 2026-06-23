import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, PiggyBank, Target, WalletCards } from 'lucide-react';
import type { ReactNode } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useGetClientByIdQuery } from '../features/advisor/advisorApi';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const allocationColors = ['#5a7f71', '#c7933d', '#dc6b57', '#17212f'];

export function AdvisorClientDetailPage() {
  const { clientId = '' } = useParams();
  const { data: client, isLoading, isError } = useGetClientByIdQuery(clientId);

  if (isLoading) {
    return <p className="text-sm text-ink/60">Loading client profile...</p>;
  }

  if (isError || !client) {
    return (
      <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-panel">
        <p className="font-semibold">Client not found</p>
        <Link to="/advisor/clients" className="mt-4 inline-flex text-sm font-semibold text-sage">
          Back to clients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/advisor/clients" className="inline-flex items-center gap-2 text-sm font-semibold text-sage">
        <ArrowLeft className="h-4 w-4" />
        Back to clients
      </Link>

      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-sage">Client profile</p>
            <h2 className="mt-1 text-3xl font-bold">{client.name}</h2>
            <p className="mt-2 text-sm text-ink/60">{client.email}</p>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <Badge label="Age" value={String(client.age)} />
            <Badge label="Risk" value={formatEnum(client.riskProfile)} />
            <Badge label="Stage" value={formatEnum(client.retirementStage)} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Portfolio value" value={currency.format(client.portfolio.totalValue)} icon={<WalletCards className="h-5 w-5" />} />
        <SummaryCard label="Savings pot" value={currency.format(client.portfolio.savingsPotBalance)} icon={<PiggyBank className="h-5 w-5" />} />
        <SummaryCard label="Retirement pot" value={currency.format(client.portfolio.retirementPotBalance)} icon={<Target className="h-5 w-5" />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <h3 className="text-lg font-semibold">Investment allocation</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-[280px_1fr]">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={client.portfolio.allocation} dataKey="percentage" nameKey="label" innerRadius={62} outerRadius={100}>
                    {client.portfolio.allocation.map((entry, index) => (
                      <Cell key={entry.category} fill={allocationColors[index % allocationColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 self-center">
              {client.portfolio.allocation.map((item, index) => (
                <div key={item.category} className="flex items-center justify-between rounded-md border border-ink/10 p-3">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: allocationColors[index % allocationColors.length] }} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <span className="text-sm text-ink/60">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <h3 className="text-lg font-semibold">Retirement goal progress</h3>
          <div className="mt-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm text-ink/60">Goal by age {client.retirementGoal.targetAge}</p>
                <p className="mt-1 text-2xl font-bold">{currency.format(client.retirementGoal.targetAmount)}</p>
              </div>
              <p className="text-2xl font-bold text-sage">{client.retirementGoal.progress}%</p>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-ink/10">
              <div className="h-full rounded-full bg-sage" style={{ width: `${client.retirementGoal.progress}%` }} />
            </div>
            <p className="mt-4 text-sm text-ink/65">
              Monthly contribution: {currency.format(client.portfolio.monthlyContribution)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
        <h3 className="text-lg font-semibold">Recommended widgets</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <WidgetRecommendation title="Retirement Readiness" />
          <WidgetRecommendation title="Risk Comfort Check" />
          <WidgetRecommendation title="Savings Pot Planner" />
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink/60">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
        <div className="rounded-md bg-sage/10 p-2 text-sage">{icon}</div>
      </div>
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 px-3 py-2">
      <p className="text-xs text-ink/55">{label}</p>
      <p className="font-semibold capitalize">{value}</p>
    </div>
  );
}

function WidgetRecommendation({ title }: { title: string }) {
  return (
    <div className="rounded-md border border-ink/10 p-4">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-ink/65">Suggested for this client profile and retirement journey.</p>
    </div>
  );
}

function formatEnum(value: string) {
  return value.toLowerCase().replace(/_/g, ' ');
}
