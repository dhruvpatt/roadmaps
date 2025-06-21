import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils"; // Or your classNames helper

export default function HorizontalScrollableTypes({ types }) {
  const scrollRef = useRef();
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  // Check if scroll is needed
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 0);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [types]);

  const handleScroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 80, behavior: "smooth" });
    setTimeout(checkScroll, 300); // Update after scroll
  };

  // Update buttons when scroll position changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll);
    return () => el.removeEventListener("scroll", checkScroll);
  }, []);

  return (
    <div className="relative">
      {showLeft && (
        <button
          className="absolute left-0 z-10 top-1/2 -translate-y-1/2 bg-white shadow rounded-full p-1"
          onClick={() => handleScroll(-1)}
          aria-label="Scroll types left"
          tabIndex={-1}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      <div
        ref={scrollRef}
        className={cn(
          "flex gap-2 overflow-x-auto no-scrollbar py-1 px-1 transition-all",
          "scroll-smooth"
        )}
        style={{ scrollbarWidth: "none" }}
      >
        {types.map((type) => (
          <span
            key={type.key}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap select-none",
              {
                "bg-amber-100 text-amber-700": type.key === "announcement",
                "bg-blue-100 text-blue-700": type.key === "file",
                "bg-green-100 text-green-700": type.key === "link",
                "bg-gray-100 text-gray-700": type.key === "general",
              }
            )}
          >
            {type.label}
          </span>
        ))}
      </div>
      {showRight && (
        <button
          className="absolute right-0 z-10 top-1/2 -translate-y-1/2 bg-white shadow rounded-full p-1"
          onClick={() => handleScroll(1)}
          aria-label="Scroll types right"
          tabIndex={-1}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
