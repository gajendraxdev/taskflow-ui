import type React from 'react';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContainer from '../components/auth/AuthContainer';
import PublicRoute from '../components/auth/PublicRoute';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import { API_ROUTES } from '../constants/apiRoutes';
import { useHttpRequest } from '../hooks/useHttpRequest';
import { notify } from '../utils/notify';

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const forgotPassword = useHttpRequest({
    url: API_ROUTES.auth.forgotPassword,
    method: 'POST',
    manual: true,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return notify.error('Please enter your email');

    const response = await forgotPassword.execute({ email });

    if (response.error) {
      return notify.error(response.error.message || 'Something went wrong');
    }

    setSent(true);
  };

  if (sent) {
    return (
      <PublicRoute>
        <AuthContainer heading="Check your email">
          <div className="flex flex-col gap-4 mt-4 text-center">
            <p className="text-main text-sm">
              If <span className="font-semibold">{email}</span> is registered,
              you'll receive a password reset link shortly.
            </p>
            <p className="text-main/60 text-xs">
              The link expires in <strong>15 minutes</strong>. Check your spam
              folder if you don't see it.
            </p>
            <Link
              to="/signin"
              className="text-btn-primary text-sm font-medium hover:underline"
            >
              Return to login
            </Link>
          </div>
        </AuthContainer>
      </PublicRoute>
    );
  }

  return (
    <PublicRoute>
      <AuthContainer heading="Can't login?">
        <form
          action="#"
          className="w-full flex flex-col gap-2 mt-2"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-main text-sm font-medium">
              We'll send a reset link to{' '}
              <span className="text-status-overdue">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-main text-sm p-2 outline-none border border-main/50 focus:border-btn-primary rounded-sm"
              placeholder="Enter your email"
              required
            />
          </div>

          <Button
            type="submit"
            className="rounded-sm"
            disabled={forgotPassword.loading}
          >
            {forgotPassword.loading ? (
              <div className="flex items-center justify-center transition-all animate-pulse ease-in-out">
                <Loader className="" duration="1" />
              </div>
            ) : (
              <span className="font-medium">Send Reset Link</span>
            )}
          </Button>
        </form>

        <div className="flex items-center justify-center gap-2 p-3 text-sm text-btn-primary mt-4">
          <Link to="/signin">Return to login</Link>
        </div>
      </AuthContainer>
    </PublicRoute>
  );
};

export default ResetPassword;
