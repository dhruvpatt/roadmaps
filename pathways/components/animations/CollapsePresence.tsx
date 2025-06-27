import React, { useLayoutEffect, useRef, useState } from "react";

export function CollapsePresence({
  show,
  children,
  duration = 300,
  onCollapseStart,
  onCollapseEnd,
}: {
  show: boolean;
  children: React.ReactNode;
  duration?: number;
  onCollapseStart?: () => void;
  onCollapseEnd?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(show);
  const [fadeOutPhase, setFadeOutPhase] = useState(false);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (show) {
      setVisible(true);
      setFadeOutPhase(false);

      requestAnimationFrame(() => {
        el.style.maxHeight = "0px";
        el.style.overflow = "hidden";
        void el.offsetHeight;

        // Expansion: animate to buffer height (e.g. 1000px)
        el.style.transition = `max-height ${duration}ms linear`;
        el.style.maxHeight = "1000px";

        setTimeout(() => {
          el.style.maxHeight = "none"; // Let it grow freely
          el.style.overflow = "";
        }, duration + 16);
      });
    } else if (visible) {
      const fullHeight = el.scrollHeight;
      el.style.maxHeight = `${fullHeight}px`;
      el.style.overflow = "hidden";
      void el.offsetHeight;

      el.style.transition = `max-height ${duration}ms linear`;
      el.style.maxHeight = "0px";

      setFadeOutPhase(true);
      onCollapseStart?.();

      setTimeout(() => {
        setVisible(false);
        setFadeOutPhase(false);
        onCollapseEnd?.();
      }, duration);
    }
  }, [show, duration, visible, onCollapseStart, onCollapseEnd]);

  return (
    <div
      ref={containerRef}
      style={{
        overflow: "hidden",
        willChange: "max-height",
      }}
    >
      {visible && (
        <div
          className={`collapse-content ${
            fadeOutPhase ? "animate-fade-out-opacity" : "animate-fade-in"
          }`}
          style={{ willChange: "opacity" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
