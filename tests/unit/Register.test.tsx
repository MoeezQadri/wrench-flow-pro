import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import Register from '@/pages/auth/Register';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const signUpMock = vi.fn();
vi.mock('@/context/AuthContext', () => ({
  useAuthContext: () => ({ signUp: signUpMock })
}));

describe('Register page - organization rules', () => {
  beforeEach(() => {
    signUpMock.mockReset();
  });

  it('shows helper text about organization rules', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    expect(
      screen.getByText(
        "Enter your organization name. If it doesn't exist, you'll become the admin of a new organization. If it already exists, contact your admin to be added."
      )
    ).toBeInTheDocument();
  });

  it('validates password mismatch on submit', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/Organization Name/i), { target: { value: 'Nova Motors' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'abc12345' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'abc123' } });

    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it('shows error when organization already exists', async () => {
    signUpMock.mockResolvedValue({ data: null, error: new Error('Organization already exists. Please contact your administrator to be added to this organization.') });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Smith' } });
    fireEvent.change(screen.getByLabelText(/Organization Name/i), { target: { value: 'Acme Inc' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Password123!' } });

    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    expect(
      await screen.findByText('Organization already exists. Please contact your administrator to be added to this organization.')
    ).toBeInTheDocument();
  });
});
