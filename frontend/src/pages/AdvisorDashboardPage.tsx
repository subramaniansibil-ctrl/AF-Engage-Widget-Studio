import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useGetStatusQuery } from '../features/api/apiSlice';

const journeyMix = [
  { name: 'Planning', value: 4 },
  { name: 'Risk', value: 3 },
  { name: 'Education', value: 5 },
  { name: 'Portfolio', value: 2 },
];

export function AdvisorDashboardPage() {
  const { data: status, isLoading } = useGetStatusQuery();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-sage">Advisor dashboard</p>
        <h2 className="mt-1 text-3xl font-bold">Financial journey workspace</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Placeholder dashboard for advisors to assemble personalized client journeys from reusable widgets.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <p className="text-sm text-ink/60">API status</p>
          <p className="mt-2 text-2xl font-bold">{isLoading ? 'Checking' : status?.environment}</p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <p className="text-sm text-ink/60">Journey templates</p>
          <p className="mt-2 text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <p className="text-sm text-ink/60">Widget drafts</p>
          <p className="mt-2 text-2xl font-bold">0</p>
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
        <h3 className="text-lg font-semibold">Widget category placeholder</h3>
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={journeyMix}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8e1e8" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#5a7f71" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
