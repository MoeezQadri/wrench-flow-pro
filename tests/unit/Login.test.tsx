import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import Login from '@/pages/auth/Login';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const signInMock = vi.fn();
const navigateMock = vi.fn();

vi.mock('react-router-dom', async (orig) => {
  const actual = await orig();
  return {
    ...actual as any,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/context/AuthContext', () => ({
  useAuthContext: () => ({ signIn: signInMock, currentUser: null })
}));

describe('Login page', () => {
  beforeEach(() => {
    signInMock.mockReset();
    navigateMock.mockReset();
  });

  it('shows error for invalid credentials', async () => {
    signInMock.mockResolvedValue({ data: null, error: new Error('Invalid login credentials') });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Log in/i }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('navigates to home on success', async () => {
    signInMock.mockResolvedValue({ data: { access_token: 'x' }, error: null });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Log in/i }));

    // navigate('/') should be called
    await vi.waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/'));
  });
});
