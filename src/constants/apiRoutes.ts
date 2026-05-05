/**
 * Central API route registry.
 * All endpoint strings live here — no magic strings in components.
 */
export const API_ROUTES = {
  auth: {
    check: 'user/auth/check',
    signup: 'user/auth/signup',
    signin: 'user/auth/signin',
    verifyOtp: 'user/auth/otp/verify',
    resendOtp: 'user/auth/otp/resend',
    forgotPassword: 'user/auth/forgot-password',
    resetPassword: 'user/auth/reset-password',
    suggestUsernames: (name: string) =>
      `user/auth/suggest-usernames?name=${name}`,
  },
  user: {
    profile: 'user/profile',
    projectMembers: 'user/project-members',
  },
  tasks: {
    list: 'task',
    detail: (id: string) => `task/${id}`,
    create: 'task',
    update: (id: string) => `task/${id}`,
    delete: (id: string) => `task/${id}`,
  },
  documents: {
    upload: 'document',
    detail: (id: string) => `document/${id}`,
    signedUrl: 'document/url',
    delete: (id: string) => `document/${id}`,
  },
} as const;
