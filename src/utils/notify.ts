import toast from 'react-hot-toast';

/**
 * Thin wrapper around react-hot-toast.
 * Swap the underlying library here without touching every call site.
 */
export const notify = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg),
  loading: (msg: string) => toast.loading(msg),
  dismiss: () => toast.dismiss(),
} as const;
