// __tests__/HubGoalForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HubGoalForm } from '../HubGoalForm';

describe('HubGoalForm', () => {
  it('renders textarea + scaffold chips + examples link', () => {
    render(<HubGoalForm onConfirm={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: /process goal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ purpose/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ customer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ what matters/i })).toBeInTheDocument();
    expect(screen.getByText(/see examples/i)).toBeInTheDocument();
  });

  it('clicking + Purpose chip inserts "Purpose: " into textarea', () => {
    render(<HubGoalForm onConfirm={vi.fn()} />);
    const textarea = screen.getByRole('textbox', { name: /process goal/i }) as HTMLTextAreaElement;
    fireEvent.click(screen.getByRole('button', { name: /\+ purpose/i }));
    expect(textarea.value).toContain('Purpose:');
  });

  it('Continue calls onConfirm with the narrative', () => {
    const onConfirm = vi.fn();
    render(<HubGoalForm onConfirm={onConfirm} />);
    const textarea = screen.getByRole('textbox', { name: /process goal/i });
    fireEvent.change(textarea, { target: { value: 'We mold barrels.' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onConfirm).toHaveBeenCalledWith('We mold barrels.');
  });

  it('Skip calls onSkip', () => {
    const onSkip = vi.fn();
    render(<HubGoalForm onConfirm={vi.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole('button', { name: /skip framing/i }));
    expect(onSkip).toHaveBeenCalled();
  });
});
