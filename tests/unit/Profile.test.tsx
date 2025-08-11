import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import Profile from '@/pages/Profile';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const updateUserMock = vi.fn();
const fromMock = vi.fn();
const updateTableMock = vi.fn().mockResolvedValue({ data: null, error: null });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      updateUser: (...args: any[]) => updateUserMock(...args),
    },
    from: () => ({ update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
  }
}));

const setCurrentUserMock = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuthContext: () => ({
    currentUser: {
      id: 'u1',
      email: 'user@example.com',
      name: 'Old Name',
      role: 'admin',
      organization_id: 'org1',
      is_active: true,
    },
    setCurrentUser: setCurrentUserMock,
  })
}));

describe('Profile page', () => {
  beforeEach(() => {
    updateUserMock.mockReset();
    setCurrentUserMock.mockReset();
  });

  it('updates name and calls supabase update', async () => {
    updateUserMock.mockResolvedValue({ data: {}, error: null });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    fireEvent.click(screen.getByRole('button', { name: /Update Profile/i }));

    await vi.waitFor(() => expect(updateUserMock).toHaveBeenCalledWith({ data: { name: 'New Name' } }));
    expect(setCurrentUserMock).toHaveBeenCalled();
  });
});
