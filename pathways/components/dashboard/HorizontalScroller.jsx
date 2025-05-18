// HorizontalScroller.jsx
import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function HorizontalScroller({ title, items, renderItem }) {
  const scrollRef = useRef(null);
  const scrollAmount = 400;

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="mx-auto w-full px-4 max-w-screen-7xl">
      <div className="flex items-center justify-between mt-6 md:mt-8">
        <h2 className="text-black text-2xl md:text-3xl font-black">{title}</h2>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-600 italic mt-4">No entries found.</p>
      ) : (
        <div className="relative mt-4">
          <button onClick={() => scroll(-1)} className="hidden md:block absolute -left-12 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow hover:bg-gray-100">
            <ChevronLeft className="text-black" />
          </button>

          <div ref={scrollRef} className="w-full overflow-x-auto scroll-smooth">
            <div className="flex space-x-4 pb-2">
              {items.map(renderItem)}
            </div>
          </div>

          <button onClick={() => scroll(1)} className="hidden md:block absolute -right-12 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow hover:bg-gray-100">
            <ChevronRight className="text-black" />
          </button>
        </div>
      )}
    </div>
  );
}
