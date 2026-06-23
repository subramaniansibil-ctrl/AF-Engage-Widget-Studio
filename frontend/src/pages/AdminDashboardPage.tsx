export function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-sage">Admin dashboard</p>
        <h2 className="mt-1 text-3xl font-bold">Platform control center</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Placeholder area for managing advisors, clients, roles, and platform-wide widget governance.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <p className="text-sm text-ink/60">Advisors</p>
          <p className="mt-2 text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <p className="text-sm text-ink/60">Clients</p>
          <p className="mt-2 text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <p className="text-sm text-ink/60">Widgets</p>
          <p className="mt-2 text-2xl font-bold">0</p>
        </div>
      </section>
    </div>
  );
}
