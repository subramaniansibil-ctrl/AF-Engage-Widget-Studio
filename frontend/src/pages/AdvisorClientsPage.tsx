import { ChangeEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import {
  RetirementStage,
  RiskProfile,
  useGetClientsQuery,
} from '../features/advisor/advisorApi';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const riskOptions: Array<{ label: string; value: RiskProfile | '' }> = [
  { label: 'All risk profiles', value: '' },
  { label: 'Conservative', value: 'CONSERVATIVE' },
  { label: 'Moderate', value: 'MODERATE' },
  { label: 'Growth', value: 'GROWTH' },
  { label: 'Aggressive', value: 'AGGRESSIVE' },
];

const stageOptions: Array<{ label: string; value: RetirementStage | '' }> = [
  { label: 'All retirement stages', value: '' },
  { label: 'Accumulation', value: 'ACCUMULATION' },
  { label: 'Pre-retirement', value: 'PRE_RETIREMENT' },
  { label: 'Retired', value: 'RETIRED' },
];

export function AdvisorClientsPage() {
  const [search, setSearch] = useState('');
  const [riskProfile, setRiskProfile] = useState<RiskProfile | ''>('');
  const [retirementStage, setRetirementStage] = useState<RetirementStage | ''>('');
  const filters = useMemo(() => ({ search, riskProfile, retirementStage }), [search, riskProfile, retirementStage]);
  const { data: clients = [], isFetching } = useGetClientsQuery(filters);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-sage">Client list</p>
        <h2 className="mt-1 text-3xl font-bold">Advisor client book</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Search, segment, and open client profiles for portfolio and retirement journey context.
        </p>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-panel">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_240px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-md border border-ink/15 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
            />
          </label>
          <select
            value={riskProfile}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setRiskProfile(event.target.value as RiskProfile | '')}
            className="rounded-md border border-ink/15 px-3 py-3 text-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
          >
            {riskOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={retirementStage}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setRetirementStage(event.target.value as RetirementStage | '')}
            className="rounded-md border border-ink/15 px-3 py-3 text-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
          >
            {stageOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-panel">
        <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
          <p className="text-sm font-semibold">{isFetching ? 'Refreshing clients...' : `${clients.length} clients`}</p>
          <p className="text-xs text-ink/55">Pagination-ready list view</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-ink/10">
            <thead className="bg-ink/5">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Client</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Age</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Risk</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Stage</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Portfolio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {clients.map((client) => (
                <tr key={client.id} className="transition hover:bg-sage/5">
                  <td className="px-4 py-3">
                    <Link to={`/advisor/clients/${client.id}`} className="font-semibold text-ink hover:text-sage">
                      {client.name}
                    </Link>
                    <p className="text-sm text-ink/60">{client.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{client.age}</td>
                  <td className="px-4 py-3 text-sm">{formatEnum(client.riskProfile)}</td>
                  <td className="px-4 py-3 text-sm">{formatEnum(client.retirementStage)}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium">{currency.format(client.portfolio.totalValue)}</td>
                </tr>
              ))}
              {!clients.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink/60">
                    No clients match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function formatEnum(value: string) {
  return value.toLowerCase().replace(/_/g, ' ');
}
