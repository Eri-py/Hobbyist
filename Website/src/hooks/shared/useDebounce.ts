import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number = 500) {
  const [debouncedValue, setdDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeout = setTimeout(() => setdDebouncedValue(value), delay);
    return () => clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}
