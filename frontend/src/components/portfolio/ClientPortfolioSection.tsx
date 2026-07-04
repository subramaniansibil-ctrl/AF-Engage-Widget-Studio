import { WalletCards } from 'lucide-react';
import type { Portfolio } from '../../features/advisor/advisorApi';
import { zarCurrency as currency } from '../../utils/currency';

const portfolioFields: Array<{ label: string; key: keyof Portfolio }> = [
  { label: 'Total Portfolio Value', key: 'totalValue' },
  { label: 'Savings Pot Balance', key: 'savingsPotBalance' },
  { label: 'Retirement Pot Balance', key: 'retirementPotBalance' },
  { label: 'Monthly Income', key: 'monthlyIncome' },
  { label: 'Monthly Expenses', key: 'monthlyExpenses' },
  { label: 'Monthly Savings', key: 'monthlySavings' },
  { label: 'Net Worth', key: 'netWorth' },
];

export function ClientPortfolioSection({ portfolio }: Readonly<{ portfolio: Portfolio }>) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-sage/10 text-sage">
          <WalletCards className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-semibold">Client portfolio</h3>
          <p className="mt-1 text-sm text-ink/60 dark:text-white/60">Current financial snapshot used across planning widgets.</p>
        </div>
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {portfolioFields.map((field) => (
          <div key={field.key} className="rounded-md border border-ink/10 bg-ink/[0.025] p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <dt className="text-xs font-semibold uppercase text-ink/45 dark:text-white/45">{field.label}</dt>
            <dd className="mt-2 text-xl font-bold text-ink dark:text-white">{currency.format(numberOrZero(portfolio[field.key]))}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function numberOrZero(value: number | undefined) {
  return Number.isFinite(value) ? value : 0;
}
