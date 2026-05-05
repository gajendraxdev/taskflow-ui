import type { IUser } from '../features/auth/authSlice';
import { logout, setAuthData } from '../features/auth/authSlice';
import type { AppDispatch } from '../redux/store';
import { notify } from './notify';

/**
 * Called after OTP verification succeeds.
 * Stores the token and updates Redux in one place.
 */
export const handleAuthSuccess = (
  dispatch: AppDispatch,
  token: string,
  userData?: Partial<IUser>,
) => {
  dispatch(setAuthData({ ...userData, authToken: token }));
  localStorage.setItem('authToken', token);
};

/**
 * Clears all auth state — Redux, localStorage, sessionStorage.
 */
export const handleLogout = (dispatch: AppDispatch) => {
  dispatch(logout());
};

/**
 * Called when any API returns 401.
 * Clears session and shows a toast so the user knows why they were redirected.
 */
export const handleSessionExpiry = (dispatch: AppDispatch) => {
  dispatch(logout());
  notify.error('Session expired. Please login again.');
};

/**
 * Extracts a human-readable error message from any error shape.
 */
export const getErrorMessage = (error: unknown): string => {
  if (!error) return 'Something went wrong';
  if (typeof error === 'string') return error;
  const e = error as Record<string, unknown>;
  if (typeof e.message === 'string') return e.message;
  return 'Something went wrong';
};
