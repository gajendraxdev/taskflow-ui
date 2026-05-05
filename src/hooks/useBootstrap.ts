import axios from 'axios';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { API_ROUTES } from '../constants/apiRoutes';
import { apiEndpoint } from '../constants/env';
import {
  logout,
  setAuthData,
  setProfileLoaded,
} from '../features/auth/authSlice';

/**
 * Runs once on app mount.
 * If a token exists in localStorage, fetches the user profile and
 * hydrates Redux. If the token is expired/invalid (401), clears the
 * session and redirects to /signin.
 */
export const useBootstrap = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');

    // No token — mark as loaded so the app renders immediately
    if (!token) {
      dispatch(setProfileLoaded(true));
      return;
    }

    const fetchProfile = async () => {
      try {
        const resp = await axios.get(
          `${apiEndpoint}/${API_ROUTES.user.profile}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        // API returns { status, statusCode, data, error }
        const user = resp.data?.data;

        if (!user) {
          // Unexpected response shape — keep token, mark loaded
          dispatch(setProfileLoaded(true));
          return;
        }

        dispatch(
          setAuthData({
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            role: user.role,
            isActive: user.isActive,
            isEmailVerified: user.isEmailVerified,
            userSignedUpWith: user.userSignedUpWith,
            profileImageId: user.profileImageId,
            authToken: token,
          }),
        );
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;

        if (status === 401) {
          // Token expired or invalid — clear everything and redirect
          dispatch(logout());
          navigate('/signin', { replace: true });
        }
        // For network errors / 500s — keep the token, let the user continue.
        // Individual API calls will handle their own errors.
      } finally {
        dispatch(setProfileLoaded(true));
      }
    };

    fetchProfile();
  }, [dispatch, navigate]);
};
