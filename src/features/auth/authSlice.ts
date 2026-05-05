import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// User interface with proper typing
export interface IUser {
  name: string | null;
  email: string | null;
  username: string | null;
  project: string | null;
  organization: null;
  otp: string | null;
  authToken: string | null;
}

// Auth state interface
export interface AuthState {
  user: IUser;
  isUserSignedUp: boolean;
  loading: boolean;
  error: string | null;
}

// Initial state with proper typing
const initialState: AuthState = {
  user: {
    name: null,
    email: null,
    username: null,
    organization: null,
    project: null,
    otp: null,
    authToken: null,
  },
  isUserSignedUp: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set user data
    setAuthData: (state, action: PayloadAction<Partial<IUser>>) => {
      state.user = { ...state.user, ...action.payload };
      state.error = null;
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Set signed up status
    setUserSignedUp: (state, action: PayloadAction<boolean>) => {
      state.isUserSignedUp = action.payload;
    },

    // Reset auth data
    resetAuthData: (state) => {
      state.user = initialState.user;
      state.isUserSignedUp = false;
      state.loading = false;
      state.error = null;
    },

    // Logout — clears state and localStorage
    logout: (state) => {
      state.user = initialState.user;
      state.isUserSignedUp = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('otp_email');
    },
  },
});

export const {
  setAuthData,
  setLoading,
  setError,
  setUserSignedUp,
  resetAuthData,
  logout,
} = authSlice.actions;
export default authSlice.reducer;
