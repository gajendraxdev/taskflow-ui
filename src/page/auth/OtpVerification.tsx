import type { FormEvent, KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthContainer from '../../components/auth/AuthContainer';
import PublicRoute from '../../components/auth/PublicRoute';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import { API_ROUTES } from '../../constants/apiRoutes';
import { useHttpRequest } from '../../hooks/useHttpRequest';
import type { RootState } from '../../redux/store';
import { handleAuthSuccess } from '../../utils/authHelpers';
import { notify } from '../../utils/notify';

const OtpVerification: React.FC<{ maxDigit?: number }> = ({ maxDigit = 6 }) => {
  const [inputs, setInputs] = useState<string[]>(new Array(maxDigit).fill(''));
  const inpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Email priority: Redux → route state → sessionStorage
  const email: string =
    user?.email ||
    (location.state as { email?: string } | null)?.email ||
    sessionStorage.getItem('otp_email') ||
    '';

  const verifyRequest = useHttpRequest({
    url: API_ROUTES.auth.verifyOtp,
    method: 'POST',
    manual: true,
  });

  const resendRequest = useHttpRequest({
    url: API_ROUTES.auth.resendOtp,
    method: 'POST',
    manual: true,
  });

  useEffect(() => {
    inpRefs.current[0]?.focus();
  }, []);

  // Persist email so a page refresh doesn't lose it
  useEffect(() => {
    if (email) sessionStorage.setItem('otp_email', email);
  }, [email]);

  const handleOnChange = (value: string, index: number) => {
    const tvalue = value.trim();

    if (tvalue.length === maxDigit) {
      setInputs([...tvalue]);
      inpRefs.current[maxDigit - 1]?.focus();
      return;
    }

    if (!tvalue || Number.isNaN(Number(value))) {
      notify.dismiss();
      notify.error('Only numbers allowed');
      return;
    }

    const newInps = [...inputs];
    newInps[index] = value.slice(-1);
    setInputs(newInps);

    if (tvalue) inpRefs.current[index + 1]?.focus();
  };

  const handleBackSpace = (e: KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      inpRefs.current[idx - 1]?.focus();
      const newInps = [...inputs];
      newInps[idx] = '';
      setInputs(newInps);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) {
      notify.error('Session expired. Please login again.');
      return navigate('/signin');
    }

    const validInputs = inputs.filter((inp) => inp && inp.trim() !== '');
    if (validInputs.length < maxDigit) {
      return notify.error('Please enter a valid OTP');
    }

    const response = await verifyRequest.execute({
      email,
      otp: validInputs.join(''),
    });

    if (response.error) {
      return notify.error(response.error.message || 'OTP verification failed');
    }

    handleAuthSuccess(dispatch, response.data.token, { email });
    sessionStorage.removeItem('otp_email');

    notify.success('OTP verified successfully 🎉');
    navigate('/dashboard');
  };

  const handleResend = async () => {
    if (!email) {
      notify.error('Session expired. Please login again.');
      return navigate('/signin');
    }

    const response = await resendRequest.execute({ email });

    if (response.error) {
      return notify.error(response.error.message || 'Failed to resend OTP');
    }

    setInputs(new Array(maxDigit).fill(''));
    inpRefs.current[0]?.focus();
    notify.success('OTP resent! Check your email.');
  };

  return (
    <PublicRoute>
      <AuthContainer
        heading="We've emailed you a code"
        description={`To complete your account setup, enter the code we've sent to: ${email}`}
      >
        <form
          className="w-full mt-5 flex flex-col gap-5"
          onSubmit={handleSubmit}
        >
          <div className="flex justify-evenly">
            {inputs.map((input, idx) => (
              <input
                // biome-ignore lint/suspicious/noArrayIndexKey: stable index for OTP inputs
                key={idx}
                type="text"
                className="w-12 h-12 border border-gray-text focus:border-2 rounded focus:border-btn-primary outline-none text-center"
                value={input}
                onChange={(e) => handleOnChange(e.target.value, idx)}
                ref={(inp) => {
                  // biome-ignore lint/style/noNonNullAssertion: ref assignment
                  inpRefs.current[idx] = inp!;
                }}
                onKeyDown={(e) => handleBackSpace(e, idx)}
              />
            ))}
          </div>

          <Button
            className="w-full"
            type="submit"
            disabled={verifyRequest.loading}
          >
            {verifyRequest.loading ? (
              <div className="flex items-center justify-center transition-all animate-pulse ease-in-out">
                <Loader className="" duration="1" />
              </div>
            ) : (
              'Verify'
            )}
          </Button>
        </form>

        <div className="flex items-center justify-center gap-2 p-3 text-sm mt-4">
          <p className="text-main/60">Didn't receive it?</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendRequest.loading}
            className="text-btn-primary font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {resendRequest.loading ? 'Sending...' : 'Resend OTP'}
          </button>
        </div>
      </AuthContainer>
    </PublicRoute>
  );
};

export default OtpVerification;
