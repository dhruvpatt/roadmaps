import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils"; // or your preferred classNames merge function

interface ResizableProps {
  children: React.ReactNode;
  className?: string;
  fade?: boolean;
  duration?: number;
  style?: React.CSSProperties;
  show?: boolean;
}

export function Resizable({
  children,
  className,
  fade = false,
  duration = 0.3,
  style,
  show = true,
}: ResizableProps) {
  const [height, setHeight] = React.useState<number | "auto">("auto");
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);

  const containerRef = React.useCallback((node: HTMLDivElement) => {
    if (node !== null) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        var observedHeight = entries?.[0]?.contentRect?.height + 20;
        if (show) {
          console.log(observedHeight)
          setHeight(observedHeight ?? "auto");
        }
      });
      resizeObserverRef.current.observe(node);
    } else if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }
  }, [show]);

  const motionStyle: React.CSSProperties = {
    height: show ? height : 0,
    opacity: fade ? (show ? 1 : 0) : 1,
    overflow: "hidden",
    ...style,
  };

  return (
    <motion.div
      style={motionStyle}
      animate={motionStyle}
      transition={{ duration, ease: [0.4, 0, 0.2, 1] }}
      className={cn("overflow-hidden", className)}
    >
      <div ref={containerRef}>{children}</div>
    </motion.div>
  );
}