import { useEffect, useRef } from "react";
import { useMotionAnimation } from "@/contexts/MotionAnimationContext";

interface ResizableProps {
  children: React.ReactNode;
  duration?: number;
  easing?: string;
  disableAnimation?: boolean;
}

export function Resizable({
  children,
  duration = 300,
  easing = "ease-in-out",
  disableAnimation = false,
}: ResizableProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prevHeight = useRef<number | null>(null);
  const isAnimating = useRef(false);
  const { isAnimating: motionAnimating } = useMotionAnimation();
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const triggerAnimation = (oldHeight: number, newHeight: number) => {
      console.log(`[Resizable] Evaluating animation from ${oldHeight}px to ${newHeight}px`);

      if (
        disableAnimation ||
        motionAnimating ||
        isAnimating.current
      ) {
        console.log("[Resizable] Skipping animation: disabled, motionAnimating, or already animating", {
          disableAnimation,
          motionAnimating,
          isAnimating: isAnimating.current,
        });
        prevHeight.current = newHeight;
        return;
      }

      const delta = Math.abs(newHeight - oldHeight);
      if (newHeight === 0 || oldHeight === 0 || delta < 4) {
        console.log(`[Resizable] Skipping (no change or tiny delta: ${delta}px)`);
        prevHeight.current = newHeight;
        return;
      }

      isAnimating.current = true;
      observerRef.current?.disconnect();
      el.setAttribute("data-resizing", "true");
      console.log(`[Resizable] Triggering animation: ${oldHeight}px → ${newHeight}px`);

      el.style.height = `${oldHeight}px`;
      void el.offsetHeight;

      const animation = el.animate(
        [{ height: `${oldHeight}px` }, { height: `${newHeight}px` }],
        { duration, easing }
      );

      requestAnimationFrame(() => {
        el.style.height = `${newHeight}px`;
      });

      animation.onfinish = () => {
        isAnimating.current = false;
        el.style.height = "auto";
        el.removeAttribute("data-resizing");
        prevHeight.current = newHeight;
        console.log("[Resizable] Animation finished");

        // Re-observe element
        observerRef.current?.observe(el);
        console.log("[Resizable] Re-observing after animation");

        // 🔁 Post-settle pass: double-check for sneaky height changes
        setTimeout(() => {
          const postHeight = el.getBoundingClientRect().height;
          if (Math.abs(postHeight - newHeight) > 4) {
            console.log(`[Resizable] Post-settle height changed: ${newHeight}px → ${postHeight}px`);
            triggerAnimation(newHeight, postHeight);
          }
        }, 100);
      };
    };

    const resizeObserver = new ResizeObserver(() => {
      console.log("[Resizable] ResizeObserver fired");

      const el = ref.current;
      if (!el) return;

      const newHeight = el.getBoundingClientRect().height;
      const oldHeight = prevHeight.current ?? newHeight;

      clearTimeout((resizeObserver as any)._settleTimeout);
      (resizeObserver as any)._settleTimeout = setTimeout(() => {
        triggerAnimation(oldHeight, newHeight);
      }, 100);
    });

    observerRef.current = resizeObserver;
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
      clearTimeout((resizeObserver as any)._settleTimeout);
    };
  }, [motionAnimating, disableAnimation]);

  return (
    <div
      ref={ref}
      className="resizable overflow-hidden will-change-[height]"
    >
      {children}
    </div>
  );
}
