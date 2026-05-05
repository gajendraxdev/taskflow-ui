import { useCallback, useRef } from 'react';

// biome-ignore lint/suspicious/noExplicitAny: explanation
export const useDebouncedCallback = <T extends (...args: any[]) => void>(
  fn: T,
  delay: number = 500,
) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        fn(...args);
      }, delay);
    },
    [delay, fn],
  );
};
