import React, { type ChangeEvent, type FormEvent, useState } from 'react';
import { FaEye, FaEyeSlash, FaFingerprint } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import GoogleIcon from '/Google_new.svg';
import MsIcon from '/MS.svg';
import AuthContainer from '../../components/auth/AuthContainer';
import PublicRoute from '../../components/auth/PublicRoute';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import { API_ROUTES } from '../../constants/apiRoutes';
import { apiEndpoint } from '../../constants/env';
import { setAuthData } from '../../features/auth/authSlice';
import { useHttpRequest } from '../../hooks/useHttpRequest';
import { handleAuthSuccess } from '../../utils/authHelpers';
import { notify } from '../../utils/notify';

const Login: React.FC = () => {
  // -----------------------------------------------------------
  // states
  // -----------------------------------------------------------
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginPayload, setLoginPayload] = useState<{
    email: string | undefined;
    password: string | undefined;
  }>({
    email: undefined,
    password: undefined,
  });

  const [formError, setFormError] = useState<{
    email: string | null;
    password: string | null;
  }>({
    email: null,
    password: null,
  });

  const [userFound, setUserFound] = useState<boolean | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  // -----------------------------------------------------------
  // hooks
  // -----------------------------------------------------------
  const {
    data: userData,
    execute,
    loading,
  } = useHttpRequest({
    url: API_ROUTES.auth.check,
    method: 'POST',
    manual: true,
    axiosConfig: { headers: { 'Content-Type': 'application/json' } },
  });

  const userSignupWith = userData?.userSignedUpWith;

  const login = useHttpRequest({
    url: API_ROUTES.auth.signin,
    method: 'POST',
    manual: true,
    axiosConfig: { headers: { 'Content-Type': 'application/json' } },
  });

  const dispatch = useDispatch();

  const navigate = useNavigate();

  // -----------------------------------------------------------
  // handlers
  // -----------------------------------------------------------

  const checkUser = async () => {
    const user = await execute({ email: loginPayload.email });
    if (user.error) {
      return notify.error(user.error.message);
    }
    setUserFound(true);
  };

  const onFormSubmitHandler = async (e: FormEvent) => {
    e.preventDefault();

    const errorObj: { email: string | null; password: string | null } = {
      email: null,
      password: null,
    };
    let hasError = false;

    if (!loginPayload.email) {
      errorObj.email = 'Email is required';
      hasError = true;
    }
    if (userSignupWith === 'EMAIL' && !loginPayload.password) {
      errorObj.password = 'Please enter password';
      hasError = true;
    }

    setFormError(errorObj);
    if (hasError) return;

    if (userSignupWith === 'EMAIL' && loginPayload.email === userData?.email) {
      const loginResponse = await login.execute(loginPayload);

      if (loginResponse.error) {
        return notify.error(loginResponse.error?.message || 'Login Failed');
      }

      dispatch(setAuthData({ email: loginPayload.email }));
      return navigate('/otpverification');
    } else {
      await checkUser();
    }
  };

  const handleOnchange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target;
    type FieldName = 'email' | 'password';
    const fieldName = name as FieldName;
    setFormError((prev) => ({
      ...prev,
      [fieldName]: null,
    }));

    setLoginPayload((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handlePasskeySignIn = async () => {
    if (!loginPayload.email) {
      setFormError((prev) => ({ ...prev, email: 'Enter your email first' }));
      return;
    }
    setPasskeyLoading(true);
    try {
      const { startAuthentication } = await import('@simplewebauthn/browser');
      const axios = (await import('axios')).default;

      // 1. Get options from server
      const optionsResp = await axios.post(
        `${apiEndpoint}/${API_ROUTES.auth.passkey.loginOptions}`,
        { email: loginPayload.email },
      );
      const options = optionsResp.data.data;

      // 2. Trigger browser WebAuthn prompt
      const credential = await startAuthentication({ optionsJSON: options });

      // 3. Verify with server
      const verifyResp = await axios.post(
        `${apiEndpoint}/${API_ROUTES.auth.passkey.loginVerify}`,
        { email: loginPayload.email, credential },
      );

      const { token } = verifyResp.data.data;
      handleAuthSuccess(dispatch, token);
      notify.success('Signed in with passkey!');
      navigate('/');
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      notify.error(
        axiosErr?.response?.data?.error ||
          axiosErr?.message ||
          'Passkey sign-in failed',
      );
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <PublicRoute>
      <AuthContainer heading={'Login to continue'}>
        {/* form */}
        <form
          action="#"
          className="w-full flex flex-col gap-2 mt-2"
          onSubmit={onFormSubmitHandler}
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-main text-sm font-medium">
              Email <span className="text-status-overdue">*</span>
            </label>

            <div className="relative ">
              <input
                type="email"
                id="email"
                name="email"
                aria-label="login-email"
                className={`w-full text-main text-sm p-2 outline-none ring-1 focus:ring-1 focus:ring-btn-primary  rounded-sm ${
                  formError.email
                    ? 'ring-1 ring-priority-high focus:ring-1 focus:ring-priority-high'
                    : ''
                }}`}
                onChange={handleOnchange}
                value={(loginPayload.email as string) || ''}
                placeholder="Enter your email"
              />

              {formError.email && (
                <div className="absolute -top-9.5 right-2 z-10 bg-priority-high text-white px-3 py-1 rounded shadow-md text-xs font-semibold fade-in">
                  {formError.email}
                </div>
              )}
            </div>

            {userFound !== null && userSignupWith === 'GOOGLE' && (
              <p className="text-xs font-medium text-status-overdue py-2">
                We Found you last Signed up with Google, Please try to{' '}
                <span className="text-btn-primary cursor-pointer font-bold">
                  Login With Google
                </span>
              </p>
            )}

            {userFound !== null && userSignupWith === 'MICROSOFT' && (
              <p className="text-xs font-medium text-status-overdue py-1">
                We Found you last Signed up with MICROSOFT, Please try to{' '}
                <span className="text-btn-primary cursor-pointer font-bold">
                  Login With Microsoft Account
                </span>
              </p>
            )}

            {userFound === false && (
              <p className="text-xs font-medium text-status-overdue py-1">
                You are not registered on TaskFlow yet, Please{' '}
                <Link
                  to="/signup"
                  className="text-btn-primary cursor-pointer font-bold"
                >
                  Signup{' '}
                </Link>
                first.
              </p>
            )}
          </div>

          {userFound !== null && userSignupWith === 'EMAIL' && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="password"
                className="text-main text-sm font-medium"
              >
                Password <span className="text-status-overdue">*</span>
              </label>

              <div className="relative">
                <div className="relative w-full">
                  {loginPayload.password &&
                    (!showPassword ? (
                      <FaEye
                        className="absolute right-[10px] top-[50%] -translate-y-1/2"
                        onClick={() => setShowPassword(true)}
                      />
                    ) : (
                      <FaEyeSlash
                        className="absolute right-[10px] top-[50%] -translate-y-1/2"
                        onClick={() => setShowPassword(false)}
                      />
                    ))}

                  <input
                    type={showPassword ? 'text' : 'password'}
                    aria-label="login-password"
                    id="password"
                    name="password"
                    className={`w-full text-main text-sm p-2 outline-none ring-1 focus:ring-1 focus:ring-btn-primary rounded-sm ${
                      formError.password
                        ? 'ring-1 ring-priority-high focus:ring-1 focus:ring-priority-high'
                        : ''
                    }`}
                    onChange={handleOnchange}
                    value={(loginPayload.password as string) || ''}
                    placeholder="Enter Password"
                  />
                </div>
                {formError.password && (
                  <div className="absolute -top-9.5 right-2 z-10 bg-priority-high text-white px-3 py-1 rounded shadow-md text-xs font-semibold fade-in">
                    {formError.password}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex gap-2 items-center">
            <input type="checkbox" id="remember" className="" />
            <label htmlFor="remember" className="text-main text-sm font-medium">
              Remember me
            </label>
          </div>

          <Button type="submit" className="rounded-sm" disabled={login.loading}>
            {(login.loading || loading) && (
              <div className="flex items-center justify-center transition-all animate-pulse ease-in-out">
                <Loader className="" duration="1" />
              </div>
            )}
            {!login.loading && !loading && userSignupWith === 'EMAIL' && (
              <span className="font-medium">Login</span>
            )}
            {!login.loading && !loading && !userSignupWith && (
              <span className="font-medium">Continue</span>
            )}
            {!login.loading &&
              !loading &&
              userSignupWith &&
              userSignupWith !== 'EMAIL' && (
                <span className="font-medium">Continue</span>
              )}
          </Button>
        </form>

        {/* option */}
        <p className="text-main/60 text-sm font-medium mt-2 p-3">
          Or continue with:
        </p>

        {/* options */}
        <div className="flex flex-col gap-4 w-full items-center justify-center">
          <div className="cursor-pointer hover:bg-secondary-bg border border-main/50 w-full p-2 text-sm rounded-sm font-bold text-center flex items-center justify-center gap-2">
            <img src={GoogleIcon} alt="Google icon" className="w-5" />
            <span>Google</span>
          </div>
          <div className="cursor-pointer hover:bg-secondary-bg border border-main/50 w-full p-2 text-sm rounded-sm font-bold text-center flex items-center justify-center gap-2">
            <img src={MsIcon} alt="Ms icon" className="w-5" />
            <span>Microsoft</span>
          </div>
          <button
            type="button"
            onClick={handlePasskeySignIn}
            disabled={passkeyLoading}
            className="cursor-pointer hover:bg-secondary-bg border border-main/50 w-full p-2 text-sm rounded-sm font-bold text-center flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {passkeyLoading ? (
              <Loader className="" duration="1" />
            ) : (
              <>
                <FaFingerprint className="text-btn-primary text-lg" />
                <span>Sign in with Passkey</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 p-3 text-sm text-btn-primary mt-4">
          <p>
            <Link to="/resetpassword">Can't Login?</Link>
          </p>
          <span className="text-main/60">•</span>
          <p>
            <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </AuthContainer>
    </PublicRoute>
  );
};

export default Login;
