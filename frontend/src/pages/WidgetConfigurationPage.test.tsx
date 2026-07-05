import { fireEvent, render, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { exportSimulationPdf, SimulationPrintReport, SimulationWorkflowActions } from '../components/widgets/SimulationActions';

const actionProps = { canSave: true, saving: false, updating: false, onExport: vi.fn(), onSaveAsNew: vi.fn().mockResolvedValue(undefined), onUpdate: vi.fn().mockResolvedValue(undefined), onReset: vi.fn() };

describe('Widget configuration simulation actions', () => {
  it('exports the current report through the PDF print flow', () => {
    const exportPdf = vi.fn();
    const { container } = render(<SimulationWorkflowActions {...actionProps} onExport={exportPdf} />);
    fireEvent.click(within(container).getByRole('button', { name: /Export PDF/ }));
    expect(exportPdf).toHaveBeenCalledOnce();
  });

  it('saves a named simulation', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<SimulationWorkflowActions {...actionProps} onSaveAsNew={save} />);
    const view = within(container);
    fireEvent.click(view.getByRole('button', { name: /^Save Simulation$/ }));
    expect(view.getByRole('heading', { name: 'Name this simulation' })).toBeInTheDocument();
    expect(view.getByRole('button', { name: 'Early Retirement' })).toBeInTheDocument();
    fireEvent.change(view.getByLabelText('Simulation name'), { target: { value: 'Client meeting option' } });
    fireEvent.click(view.getAllByRole('button', { name: /^Save Simulation$/ })[1]);
    await waitFor(() => expect(save).toHaveBeenCalledWith('Client meeting option'));
  });

  it('uses the shared PDF export and includes current report metadata', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    exportSimulationPdf();
    expect(print).toHaveBeenCalledOnce();
    const { container } = render(<SimulationPrintReport clientName="Avery Naidoo" clientEmail="avery@example.com" advisorName="Sarah Williams" widgetName="Two-Pot Impact" simulationName="Early Retirement" values={{ withdrawalAmount: '25000' }} />);
    const report = within(container);
    expect(report.getByText(/Avery Naidoo/)).toBeInTheDocument();
    expect(report.getByText(/Sarah Williams/)).toBeInTheDocument();
    expect(report.getByText(/Early Retirement/)).toBeInTheDocument();
    expect(report.getByText('Selected scenario values')).toBeInTheDocument();
    expect(report.getByText('Withdrawal Amount')).toBeInTheDocument();
    expect(report.getByText('25000')).toBeInTheDocument();
    expect(report.queryByText('Configuration and simulation values')).not.toBeInTheDocument();
    expect(report.queryByText('Simulation results')).not.toBeInTheDocument();
    print.mockRestore();
  });

  it('requires confirmation before resetting unsaved values', () => {
    const reset = vi.fn();
    const { container } = render(<SimulationWorkflowActions {...actionProps} onReset={reset} />);
    const view = within(container);
    fireEvent.click(view.getByRole('button', { name: 'Reset' }));
    expect(reset).not.toHaveBeenCalled();
    fireEvent.click(view.getByRole('button', { name: 'Reset simulation' }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it('disables saving until simulation values are available', () => {
    const { container } = render(<SimulationWorkflowActions {...actionProps} canSave={false} />);
    expect(within(container).getByRole('button', { name: /^Save Simulation$/ })).toBeDisabled();
  });

  it('uses one contextual save action for an opened simulation', () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<SimulationWorkflowActions {...actionProps} activeName="Early Retirement" onUpdate={update} />);
    const view = within(container);
    expect(view.getByText('Editing saved simulation')).toBeInTheDocument();
    expect(view.getByText('Early Retirement')).toBeInTheDocument();
    expect(view.getByRole('button', { name: 'Save as new' })).toBeInTheDocument();
    fireEvent.click(view.getByRole('button', { name: 'Save changes' }));
    expect(update).toHaveBeenCalledOnce();
  });
});
