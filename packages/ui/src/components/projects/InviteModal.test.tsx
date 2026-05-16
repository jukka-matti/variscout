import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { InviteModal } from './InviteModal';

describe('InviteModal', () => {
  it('renders with form fields for email + role', () => {
    render(<InviteModal isOpen={true} onClose={() => {}} onInvite={() => {}} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
  });

  it('calls onInvite with email + role on submit', () => {
    const onInvite = vi.fn();
    render(<InviteModal isOpen={true} onClose={() => {}} onInvite={onInvite} />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'newbie@org.com' } });
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'member' } });
    fireEvent.click(screen.getByRole('button', { name: /invite/i }));
    expect(onInvite).toHaveBeenCalledWith({ email: 'newbie@org.com', role: 'member' });
  });

  it('shows three role options: Lead, Member, Sponsor', () => {
    render(<InviteModal isOpen={true} onClose={() => {}} onInvite={() => {}} />);
    const select = screen.getByLabelText(/role/i) as HTMLSelectElement;
    expect(Array.from(select.options).map(o => o.value)).toEqual(['lead', 'member', 'sponsor']);
  });

  it('does not render when isOpen is false', () => {
    render(<InviteModal isOpen={false} onClose={() => {}} onInvite={() => {}} />);
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
  });
});
