import React, { useRef, useState, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Helper: ResizeObserver hook
function useResizeObserver<T extends HTMLElement>(
  callback: (height: number) => void
) {
  const ref = useRef<T | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const element = ref.current;
    function report() {
      callback(element.getBoundingClientRect().height);
    }
    report();

    // Listen for all resizes
    const ro = new window.ResizeObserver(() => {
      report();
    });
    ro.observe(element);

    return () => ro.disconnect();
    // We only want this to run once, not on every callback change!
    // eslint-disable-next-line
  }, []);
  return ref;
}

// Main component
export function Resizable({
  show,
  children,
  fade = false,
  duration = 0.3,
  className,
  style,
}: {
  show: boolean;
  children: React.ReactNode;
  fade?: boolean;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [height, setHeight] = useState<number>(0);
  const contentRef = useResizeObserver<HTMLDivElement>((h) => setHeight(h));

  // Used to keep the children in DOM while animating out
  const [shouldRender, setShouldRender] = useState(show);

  // Track show/hide to manage mounting/unmounting
  React.useEffect(() => {
    if (show) setShouldRender(true);
  }, [show, children]);

  function handleCollapseEnd() {
    if (!show) setShouldRender(false);
  }

  return (
    <AnimatePresence initial={false}>
      {shouldRender && (
        <motion.div
          key="resize"
          initial={{
            height: 0,
            opacity: fade ? 0 : 1,
          }}
          animate={{
            height: show ? height : "auto",
            opacity: show ? 1 : (fade ? 0 : 1),
            transition: {
              height: { duration, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: fade ? duration : 0 },
            },
          }}
          exit={{
            height: 0,
            opacity: fade ? 0 : 1,
            transition: {
              height: { duration, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: fade ? duration : 0 },
            },
          }}
          style={{
            overflow: "hidden",
            ...style,
          }}
          className={className}
          onAnimationComplete={handleCollapseEnd}
        >
          {/* The observed content */}
          <div ref={contentRef}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
