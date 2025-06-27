import { useEffect, useState } from "react";

/**
 * Controls whether a component should stay mounted during collapse animation.
 */
export function usePresence(visible: boolean, duration: number) {
  const [present, setPresent] = useState(visible);

  useEffect(() => {
    if (visible) {
      setPresent(true);
    } else {
      const timeout = setTimeout(() => setPresent(false), duration);
      return () => clearTimeout(timeout);
    }
  }, [visible, duration]);

  return present;
}
