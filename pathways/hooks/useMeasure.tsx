import { useCallback, useLayoutEffect, useRef, useState } from "react";

export function useMeasure<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState(0);

  const measure = useCallback(() => {
    if (ref.current) {
      setHeight(ref.current.offsetHeight);
    }
  }, []);

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return [ref, height] as const;
}
