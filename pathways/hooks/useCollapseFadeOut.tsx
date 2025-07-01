import { useRef } from "react";

export function useCollapseFadeOut({ duration = 300 } = {}) {
  const ref = useRef<HTMLDivElement>(null);

  // Call this function to start fade + collapse, returns a Promise
  const collapseAndFade = () => {
    return new Promise<void>((resolve) => {
      const el = ref.current;
      if (!el) {
        resolve();
        return;
      }

      // Set height to current, then trigger transitions
      el.style.height = `${el.offsetHeight}px`;
      el.style.opacity = "1";
      el.style.overflow = "hidden";
      el.style.transition = "";

      void el.offsetHeight; // force reflow

      el.style.transition = `height ${duration}ms ease, opacity ${duration}ms ease`;
      el.style.height = "0px";
      el.style.opacity = "0";

      const onTransitionEnd = (e: TransitionEvent) => {
        if (e.propertyName === "height") {
          el.removeEventListener("transitionend", onTransitionEnd);
          resolve();
        }
      };
      el.addEventListener("transitionend", onTransitionEnd);
    });
  };

  return { ref, collapseAndFade };
}
