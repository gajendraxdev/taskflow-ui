import type { AxiosRequestConfig } from 'axios';
import axios, { AxiosError } from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { apiEndpoint } from '../constants/env';
import type { AnyType } from '../types/globalTypes';
import { handleSessionExpiry } from '../utils/authHelpers';

export type UseHttpRequestConfig = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: string;
  data?: AnyType | null;
  axiosConfig?: AxiosRequestConfig;
  manual?: boolean;
  immediate?: boolean;
  customUrl?: boolean;

  debounceMs?: number;
};

export interface UseHttpError {
  message: string;
  axiosError?: boolean;
  unexpectedError?: boolean;
  cancelled?: boolean;
  status?: number;
  error_code?: string;
  raw?: AnyType;
}

export interface UseHttpRequestResult {
  data: AnyType | null;
  error: UseHttpError | null;
}

export const useHttpRequest = (
  config: UseHttpRequestConfig,
  deps: AnyType[] = [],
) => {
  const {
    url,
    method = 'GET',
    data: initialData = null,
    manual = true,
    immediate = !manual,
    axiosConfig,
    customUrl = false,
    debounceMs,
  } = config;

  const api = customUrl ? url : `${apiEndpoint}/${url}`;

  const [data, setData] = useState<AnyType | null>(initialData);
  const [error, setError] = useState<UseHttpError | null>();
  const [loading, setLoading] = useState<boolean>(false);

  const mountRef = useRef<boolean>(true);
  const controller = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    mountRef.current = true;

    return () => {
      mountRef.current = false;
      controller.current?.abort();
      controller.current = null;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, []);

  const abort = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const execute = useCallback(
    async (
      data?: AnyType,
      clearPrev: boolean = true,
    ): Promise<UseHttpRequestResult> => {
      if (clearPrev) {
        abort();
      }

      setLoading(true);
      setError(null);

      const abc = new AbortController();
      controller.current = abc;

      try {
        const response = await axios({
          method,
          url: api,
          data: data || initialData || null,
          signal: abc.signal,
          ...axiosConfig,
        });

        if (!mountRef.current)
          return Promise.resolve({ data: response.data.data, error: null });
        setData(() => response.data.data);

        return { data: response.data.data, error: null };
        // biome-ignore lint/suspicious/noExplicitAny: explanation
      } catch (error: any) {
        if (!mountRef.current) return Promise.reject(error);

        const isCancelled =
          axios.isCancel?.(error) ||
          error?.name === 'CanceledError' ||
          error?.name === 'AbortError' ||
          error?.code === 'ERR_CANCELED';

        // cancel error
        if (isCancelled) {
          const e: UseHttpError = {
            cancelled: true,
            message: 'Request cancelled',
          };
          setError(e);
          setData(initialData);
          return { data: null, error: e };

          // axios error
        } else if (error instanceof AxiosError) {
          const status = error?.response?.status;

          // Session expired — clear auth and redirect
          if (status === 401) {
            handleSessionExpiry(dispatch);
            navigate('/signin', { replace: true });
          }

          const e: UseHttpError = {
            axiosError: true,
            status,
            message: error?.response?.data?.error ?? error.message,
            error_code: error?.response?.data?.code,
            raw: error,
          };
          setError((prev) => ({ ...prev, ...e }));
          setData(initialData);
          return { data: null, error: e };

          // unexpected error
        } else {
          const e: UseHttpError = {
            unexpectedError: true,
            message: 'An unknown error occurred, please contact admin!',
            raw: error,
          };
          setError(e);
          setData(initialData);
          return { data: null, error: e };
        }
      } finally {
        if (controller.current === abc) controller.current = null;
        if (mountRef.current) setLoading(false);
      }
    },

    [method, api, initialData, axiosConfig, abort, dispatch, navigate],
  );

  useEffect(() => {
    if (manual && !immediate) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (debounceMs && debounceMs > 0) {
      debounceRef.current = window.setTimeout(() => {
        execute().catch(() => {});
      }, debounceMs);

      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }
      };
    } else {
      execute().catch(() => {});
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: =
  }, deps);

  return { data, error, abort, loading, execute, setData };
};
