import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NumberControl } from './InteractiveWidgetWorkspace';

describe('interactive widget number input', () => {
  it('allows replacing a value by typing and keeps the slider callback synchronized', () => {
    const change = vi.fn();
    render(<NumberControl label="Savings available" description="Test value" value={515000} min={50000} max={3000000} step={5000} prefix="R" onChange={change} />);
    const input = screen.getByLabelText('Savings available');
    fireEvent.change(input, { target: { value: '' } });
    expect(input).toHaveValue('');
    fireEvent.change(input, { target: { value: '650000' } });
    expect(input).toHaveValue('650000');
    expect(change).toHaveBeenLastCalledWith(650000);
  });

  it('clamps an out-of-range typed value only when editing is finished', () => {
    const change = vi.fn();
    render(<NumberControl label="Monthly income" description="Test value" value={4500} min={1000} max={100000} step={500} onChange={change} />);
    const input = screen.getByLabelText('Monthly income');
    fireEvent.change(input, { target: { value: '1000000' } });
    expect(input).toHaveValue('1000000');
    fireEvent.blur(input);
    expect(input).toHaveValue('100000');
    expect(change).toHaveBeenLastCalledWith(100000);
  });
});
