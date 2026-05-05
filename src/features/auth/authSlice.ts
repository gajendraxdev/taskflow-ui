import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface IUser {
  // identity
  id: string | null;
  name: string | null;
  email: string | null;
  username: string | null;

  // role & status
  role: string | null;
  isActive: boolean | null;
  isEmailVerified: boolean | null;
  userSignedUpWith: 'EMAIL' | 'GOOGLE' | 'MICROSOFT' | null;

  // profile
  profileImageId: string | null;

  // workspace context (populated after profile load)
  organizationId: string | null;
  projectId: string | null;

  // auth
  authToken: string | null;

  // legacy — kept for signup flow compatibility
  otp: string | null;
  organization: null;
  project: string | null;
}

export interface AuthState {
  user: IUser;
  isUserSignedUp: boolean;
  profileLoaded: boolean; // true once GET /user/profile has resolved
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: {
    id: null,
    name: null,
    email: null,
    username: null,
    role: null,
    isActive: null,
    isEmailVerified: null,
    userSignedUpWith: null,
    profileImageId: null,
    organizationId: null,
    projectId: null,
    authToken: null,
    otp: null,
    organization: null,
    project: null,
  },
  isUserSignedUp: false,
  profileLoaded: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthData: (state, action: PayloadAction<Partial<IUser>>) => {
      state.user = { ...state.user, ...action.payload };
      state.error = null;
    },

    setProfileLoaded: (state, action: PayloadAction<boolean>) => {
      state.profileLoaded = action.payload;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    setUserSignedUp: (state, action: PayloadAction<boolean>) => {
      state.isUserSignedUp = action.payload;
    },

    resetAuthData: (state) => {
      state.user = initialState.user;
      state.isUserSignedUp = false;
      state.profileLoaded = false;
      state.loading = false;
      state.error = null;
    },

    logout: (state) => {
      state.user = initialState.user;
      state.isUserSignedUp = false;
      state.profileLoaded = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('otp_email');
    },
  },
});

export const {
  setAuthData,
  setProfileLoaded,
  setLoading,
  setError,
  setUserSignedUp,
  resetAuthData,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
