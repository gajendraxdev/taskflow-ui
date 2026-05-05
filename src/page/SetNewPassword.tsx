import type React from 'react';
import { type FormEvent, useState } from 'react';
import { BsEye, BsEyeSlash } from 'react-icons/bs';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthContainer from '../components/auth/AuthContainer';
import PublicRoute from '../components/auth/PublicRoute';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import PasswordStrengthBar from '../components/ui/PasswordStrengthBar';
import { API_ROUTES } from '../constants/apiRoutes';
import { useHttpRequest } from '../hooks/useHttpRequest';
import { notify } from '../utils/notify';
import { getPasswordStrength } from '../utils/passwordStrength';

const SetNewPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  const navigate = useNavigate();
  const strength = getPasswordStrength(password);

  const resetPassword = useHttpRequest({
    url: API_ROUTES.auth.resetPassword,
    method: 'POST',
    manual: true,
  });

  if (!token || !email) {
    return (
      <PublicRoute>
        <AuthContainer heading="Invalid link">
          <div className="flex flex-col gap-4 mt-4 text-center">
            <p className="text-main/60 text-sm">
              This password reset link is invalid or has expired.
            </p>
            <Link
              to="/resetpassword"
              className="text-btn-primary text-sm font-medium hover:underline"
            >
              Request a new reset link
            </Link>
          </div>
        </AuthContainer>
      </PublicRoute>
    );
  }

  if (done) {
    return (
      <PublicRoute>
        <AuthContainer heading="Password updated!">
          <div className="flex flex-col gap-4 mt-4 text-center">
            <p className="text-main text-sm">
              Your password has been reset successfully.
            </p>
            <Button type="button" onClick={() => navigate('/signin')}>
              Login now
            </Button>
          </div>
        </AuthContainer>
      </PublicRoute>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword)
      return notify.error('Please fill in both fields');
    if (password !== confirmPassword)
      return notify.error('Passwords do not match');
    if (strength.percentage < 60)
      return notify.error('Please choose a stronger password');

    const response = await resetPassword.execute({
      email,
      token,
      newPassword: password,
    });

    if (response.error) {
      return notify.error(
        response.error.message || 'Reset failed. The link may have expired.',
      );
    }

    setDone(true);
  };

  return (
    <PublicRoute>
      <AuthContainer heading="Set new password">
        <form
          className="w-full flex flex-col gap-3 mt-2"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-main text-sm font-medium">
              New password <span className="text-status-overdue">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                className="text-main text-sm p-2 outline-none border border-main/50 focus:border-btn-primary rounded-sm w-full pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-3 text-main/60 cursor-pointer hover:text-main"
                onClick={() => setShowPassword((p) => !p)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <BsEyeSlash size={18} /> : <BsEye size={18} />}
              </button>
            </div>
            <PasswordStrengthBar
              level={strength.level}
              percentage={strength.percentage}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="confirmPassword"
              className="text-main text-sm font-medium"
            >
              Confirm password <span className="text-status-overdue">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
              className="text-main text-sm p-2 outline-none border border-main/50 focus:border-btn-primary rounded-sm"
              required
            />
          </div>

          <Button
            type="submit"
            className="rounded-sm"
            disabled={resetPassword.loading}
          >
            {resetPassword.loading ? (
              <div className="flex items-center justify-center transition-all animate-pulse ease-in-out">
                <Loader className="" duration="1" />
              </div>
            ) : (
              <span className="font-medium">Reset Password</span>
            )}
          </Button>
        </form>

        <div className="flex items-center justify-center gap-2 p-3 text-sm text-btn-primary mt-2">
          <Link to="/signin">Return to login</Link>
        </div>
      </AuthContainer>
    </PublicRoute>
  );
};

export default SetNewPassword;
