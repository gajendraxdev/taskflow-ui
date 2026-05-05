import React, { type ChangeEvent, type FormEvent, useState } from 'react';
import { BsEye } from 'react-icons/bs';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PublicRoute from '../../components/auth/PublicRoute';
import Sign from '../../components/auth/Sign';
import SignUpStepForm from '../../components/auth/SignUpStepForm';
import { StepTracker } from '../../components/auth/StepTracker';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Loader from '../../components/ui/Loader';
import PasswordStrengthBar from '../../components/ui/PasswordStrengthBar';
import TextTag from '../../components/ui/TextTag';
import { API_ROUTES } from '../../constants/apiRoutes';
import { ERROR_CODES, SIGN_UP_STEPS } from '../../constants/constants';
import { setAuthData } from '../../features/auth/authSlice';
import { useHttpRequest } from '../../hooks/useHttpRequest';
import { useMultiStepForm } from '../../hooks/useMultiStepForm';
import type { RootState } from '../../redux/store';
import type { AnyType } from '../../types/globalTypes';
import { checkRequiredFields } from '../../utils/checkRequiredFields';
import { notify } from '../../utils/notify';
import { getPasswordStrength } from '../../utils/passwordStrength';

export type SignupState = keyof typeof SIGN_UP_STEPS;

const Signup: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [userEmail, setUserEmail] = useState('');
  const [userData, setUserData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    organization: user?.name ? `${user.name.split(' ')[0]}'s Organization` : '',
    project: user?.name ? `${user.name.split(' ')[0]}'s Organization` : '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const { current, label, next, previous, goto } = useMultiStepForm(
    Object.keys(SIGN_UP_STEPS),
    SIGN_UP_STEPS,
  );
  const [completedSteps, setCompletedSteps] = useState<SignupState[]>([
    'initial',
  ]);

  const strength = getPasswordStrength(userData.password);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const checkUser = useHttpRequest({
    url: API_ROUTES.auth.check,
    method: 'POST',
  });

  const suggestions = useHttpRequest(
    {
      url: API_ROUTES.auth.suggestUsernames(userData.name),
      method: 'GET',
      immediate: userData.name !== '',
      debounceMs: 500,
    },
    [userData.name],
  );

  const completeSignup = useHttpRequest({
    url: API_ROUTES.auth.signup,
    method: 'POST',
  });

  // ------------------------------------------------
  // Event Handlers
  // ------------------------------------------------

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckUserExist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userEmail.trim()) {
      notify.error('Email is required.');
      return;
    }

    const response = await checkUser.execute({ email: userEmail });

    if (response?.data?.status)
      return notify.error('Email already exists. Please sign in.');

    if (
      response.error &&
      response.error.error_code === ERROR_CODES.USER_NOT_FOUND
    ) {
      dispatch(setAuthData({ email: userEmail }));

      setCompletedSteps((prev) =>
        prev.includes(current as SignupState)
          ? prev
          : [...prev, current as SignupState],
      );

      return next();
    }

    return notify.error(response.error?.message || 'Something went wrong');
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    switch (current) {
      case 'details': {
        const check = checkRequiredFields(userData, ['name', 'username']);

        if (check !== '') {
          return notify.error(
            `Please fill the required fields, Missing filled: ${check}`,
          );
        }

        dispatch(
          setAuthData({ name: userData.name, username: userData.username }),
        );

        setCompletedSteps((prev) =>
          prev.includes(current) ? prev : [...prev, current],
        );
        return next();
      }

      case 'password': {
        const check = checkRequiredFields(userData, [
          'password',
          'confirmPassword',
        ]);

        if (check !== '') {
          return notify.error(
            `Please fill the required fields, Missing filled: ${check}`,
          );
        }

        if (userData.password !== userData.confirmPassword) {
          return notify.error('Passwords do not match.');
        }

        if (strength.percentage < 60) {
          return notify.error('Please choose strong password!');
        }

        setCompletedSteps((prev) =>
          prev.includes(current) ? prev : [...prev, current],
        );
        return next();
      }

      case 'workspace': {
        const signupData = {
          user: {
            name: user.name,
            email: user.email,
            username: user.username,
            password: userData.password,
          },

          organization: {
            name: userData.organization,
            description: `${user.username}'s organization`,
          },

          project: {
            name: userData.project,
            description: `${user.username}'s project`,
          },
        };

        const response = await completeSignup.execute(signupData);

        if (response.error) {
          return notify.error(response.error.message);
        }

        dispatch(setAuthData({ ...user }));
        return navigate('/otpverification');
      }

      default:
        return;
    }
  };

  // ----------------------------
  // JSX SECTIONS
  // ----------------------------

  const InitialSignupForm = (
    <SignUpStepForm
      key="initial"
      handleSubmit={handleCheckUserExist as AnyType}
    >
      <Input
        type="email"
        id="email"
        onChange={(e) => setUserEmail(e.target.value)}
        value={userEmail}
        placeholder="Enter your email"
        name="email"
        label="Email"
        required
      />

      <Button
        type="submit"
        // className="rounded-sm items-center justify-center"
        disabled={checkUser.loading}
      >
        {!checkUser.loading && <span className="font-medium">Continue</span>}
        {checkUser.loading && (
          <div className="flex items-center justify-center gap 10 transition-all animate-pulse ease-in-out">
            <Loader className="" duration="1" />
          </div>
        )}
      </Button>
    </SignUpStepForm>
  );

  const ProceedWithSignupForm = (
    <SignUpStepForm key="proceed" handleSubmit={handleFormSubmit as AnyType}>
      <Input
        key="submitted_email"
        type="email"
        id="email"
        onChange={(e) => setUserEmail(e.target.value)}
        value={userEmail}
        placeholder="Enter your email"
        name="email"
        label="Email"
        required
        disabled
      />

      <Input
        key="fullname"
        type="text"
        id="fullname"
        onChange={handleOnChange}
        value={userData.name}
        placeholder="Enter your name"
        name="name"
        label="Fullname"
        required
      />

      <Input
        key="username"
        type="text"
        id="username"
        onChange={handleOnChange}
        value={userData.username}
        placeholder="Enter your username"
        name="username"
        label="Username"
        required
      />
      {suggestions?.data?.suggestions && (
        <div className="">
          <span className="text-main text-sm font-medium">
            Username suggestions
          </span>
          <div className="flex gap-1 flex-wrap">
            {suggestions?.data?.suggestions?.map((un: string) => (
              <TextTag
                key={un}
                text={un}
                className="cursor-pointer"
                onClick={() =>
                  setUserData((prev) => ({ ...prev, username: un }))
                }
              />
            ))}
          </div>
        </div>
      )}

      <Button
        type="submit"
        // className="rounded-sm items-center justify-center"
      >
        Continue
      </Button>
    </SignUpStepForm>
  );

  const PasswordForm = (
    <SignUpStepForm key="password" handleSubmit={handleFormSubmit as AnyType}>
      <span className="text-xs italic text-main">
        "A good password must include a mix of <strong>uppercase</strong> and{' '}
        <strong>lowercase</strong> letters,
        <strong>numbers</strong>, and <strong>special characters</strong>, and
        should be greater than <strong>8 characters long"</strong>.
      </span>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-main text-sm font-medium">
          Password <span className="text-status-overdue">*</span>
        </label>
        <div className="relative flex items-center">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            onChange={handleOnChange}
            value={userData.password}
            placeholder="Enter your password"
            name="password"
            autoComplete="new-password"
            className="text-main text-sm p-2 outline-none border border-main/50 focus:border-btn-primary rounded-sm w-full pr-10"
            required
          />
          <BsEye
            className="absolute right-3 text-main/60 cursor-pointer hover:text-main transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            size={18}
          />
        </div>
      </div>

      <Input
        type="password"
        id="confirmPassword"
        onChange={handleOnChange}
        value={userData.confirmPassword}
        placeholder="Enter confirm password"
        name="confirmPassword"
        label="Confirm Password"
        required
      />

      <PasswordStrengthBar
        level={strength.level}
        percentage={strength.percentage}
      />

      <Button
        type="submit"
        // className="rounded-sm items-center justify-center"
        disabled={checkUser.loading}
      >
        Continue
      </Button>
    </SignUpStepForm>
  );

  const WorkSpaceForm = (
    <SignUpStepForm key="workspace" handleSubmit={handleFormSubmit as AnyType}>
      <Input
        type="text"
        id="organization"
        onChange={handleOnChange}
        value={userData.organization}
        placeholder="Organization Name (User's can add people with limited or full access)"
        name="organization"
        label="Organization"
        required
      />

      <Input
        type="text"
        id="project"
        onChange={handleOnChange}
        value={userData.project}
        placeholder="Project"
        name="project"
        label="Project"
        required
      />

      <Button type="submit">
        {completeSignup.loading && (
          <div className="flex items-center justify-center gap 10 transition-all animate-pulse ease-in-out">
            <Loader className="" duration="1" />
          </div>
        )}
        {!completeSignup.loading && 'Continue'}
      </Button>
    </SignUpStepForm>
  );

  return (
    <PublicRoute>
      <Sign
        type="signup"
        current={current as SignupState}
        heading={label}
        otherOptions={current === 'initial'}
      >
        {
          {
            initial: InitialSignupForm,
            details: ProceedWithSignupForm,
            password: PasswordForm,
            workspace: WorkSpaceForm,
          }[current]
        }
        {current !== 'initial' && (
          <StepTracker
            completedSteps={completedSteps}
            goto={goto}
            onPrevious={previous}
            step={current as SignupState}
          />
        )}
      </Sign>
    </PublicRoute>
  );
};

export default Signup;
