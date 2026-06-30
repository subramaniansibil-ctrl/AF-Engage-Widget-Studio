import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Widget } from '../features/widgets/widgetsApi';
import { WidgetCard } from './WidgetLibraryPage';

describe('Widget library card navigation', () => {
  it('opens the widget detail route from the whole card without legacy actions', () => {
    const widget: Widget = {
      id: 'income-sustainability',
      name: 'Income Sustainability',
      description: 'Explore sustainable retirement income.',
      category: 'Retirement',
      icon: 'LineChart',
      status: 'ACTIVE',
      requiredDataPoints: [],
      defaultConfiguration: { id: 'config-1', clientId: '', widgetId: 'income-sustainability', options: { projectionYears: '25' } },
    };

    render(<MemoryRouter><WidgetCard widget={widget} /></MemoryRouter>);

    expect(screen.getByRole('link', { name: 'Open Income Sustainability' })).toHaveAttribute('href', '/advisor/widgets/income-sustainability');
    expect(screen.queryByRole('button', { name: /preview/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /configure/i })).not.toBeInTheDocument();
  });
});
