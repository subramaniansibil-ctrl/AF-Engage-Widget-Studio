import { ChartNoAxesCombined, CircleDollarSign, Landmark, LayoutGrid } from 'lucide-react';

interface WidgetBrandIconProps {
  widgetId?: string;
  icon?: string;
  className?: string;
}

export function WidgetBrandIcon({ widgetId, icon, className = '' }: WidgetBrandIconProps) {
  const Icon = widgetId === 'two-pot-impact' || icon === 'Scale'
    ? Landmark
    : widgetId === 'onefee-wealth-reclaim' || icon === 'RefreshCcw'
      ? CircleDollarSign
      : widgetId === 'income-sustainability' || icon === 'LineChart'
        ? ChartNoAxesCombined
        : LayoutGrid;

  return (
    <span className={['grid h-10 w-10 shrink-0 place-items-center rounded-md border border-sage/20 bg-sage/10 text-sage', className].join(' ')}>
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}
