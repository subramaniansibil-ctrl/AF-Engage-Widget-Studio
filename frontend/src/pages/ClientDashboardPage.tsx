export function ClientDashboardPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-sage">Client dashboard</p>
        <h2 className="mt-1 text-3xl font-bold">Personal journey overview</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Placeholder area for clients to view assigned widgets, planning milestones, and advisor guidance.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <h3 className="font-semibold">Assigned widgets</h3>
          <p className="mt-3 text-sm leading-6 text-ink/65">
            Future phases will show interactive financial planning modules here.
          </p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <h3 className="font-semibold">Advisor notes</h3>
          <p className="mt-3 text-sm leading-6 text-ink/65">
            Future phases will surface personalized context from the advisor.
          </p>
        </div>
      </section>
    </div>
  );
}
