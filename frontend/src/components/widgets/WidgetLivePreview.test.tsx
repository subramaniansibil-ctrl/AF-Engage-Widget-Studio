import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WidgetLivePreview } from './WidgetLivePreview';

describe('WidgetLivePreview', () => {
  it('updates displayed values when configuration changes', () => {
    const { rerender } = render(<WidgetLivePreview widgetId="income-sustainability" name="Income Sustainability" category="Retirement" values={{ monthlyIncomeTarget: '4500', projectionYears: '25', scenario: 'Balanced market' }} />);
    expect(screen.getByText('$4,500')).toBeInTheDocument();
    rerender(<WidgetLivePreview widgetId="income-sustainability" name="Income Sustainability" category="Retirement" values={{ monthlyIncomeTarget: '6200', projectionYears: '30', scenario: 'Conservative market' }} />);
    expect(screen.getByText('$6,200')).toBeInTheDocument();
    expect(screen.getByText('Conservative market')).toBeInTheDocument();
  });

  it('shows an empty state without preview data', () => {
    render(<WidgetLivePreview widgetId="custom" name="Custom widget" category="Custom Widgets" values={{}} />);
    expect(screen.getByText('No preview data available')).toBeInTheDocument();
  });
});
