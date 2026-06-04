/**
 * API module that wraps backend calls for auth.
 * Keeping endpoint calls here gives screens a typed and reusable data access layer.
 */

import { fetchClient } from '../apiClient';

interface RegisterPayload {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}

export const authApi = {
  register: (data: RegisterPayload) =>
    fetchClient<{ message: string; pointsAwarded?: number }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  forgotPassword: (email: string) =>
    fetchClient<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (password: string, token: string) =>
    fetchClient<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
      headers: { Authorization: `Bearer ${token}` },
    }),

  verifyOtp: (email: string, token: string, type: 'signup' | 'recovery' | 'email_change') =>
    fetchClient<{ session: any; user: any }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, token, type }),
    }),

  resetPasswordWithOtp: (email: string, otp: string, newPassword: string) =>
    fetchClient<{ message: string }>('/auth/reset-password-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    }),
};
