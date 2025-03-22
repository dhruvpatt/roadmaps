import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CourseCard from "./pathway-card";

export default function ContinueLearning() {
  const scrollRef = useRef(null);

  // Mock data
  const courses = [
    { id: 1, title: "Algebra Fundamentals", subtitle: "Solving Equations", progress: 75, hoursLeft: 2 },
    { id: 2, title: "Introduction to Programming", subtitle: "Variables and Data Types", progress: 45, hoursLeft: 4 },
    { id: 3, title: "Physics Mechanics", subtitle: "Newton's Laws of Motion", progress: 20, hoursLeft: 6 },
    { id: 4, title: "Chemistry Basics", subtitle: "Atomic Structure", progress: 60, hoursLeft: 3 },
    { id: 5, title: "Biology Fundamentals", subtitle: "Cell Structure", progress: 50, hoursLeft: 5 },
    { id: 6, title: "Geometry", subtitle: "Shapes & Theorems", progress: 30, hoursLeft: 2 },
    { id: 7, title: "Advanced Physics", subtitle: "Quantum Mechanics", progress: 10, hoursLeft: 8 },
  ];

  const scrollAmount = 300 * 4; // Each card is ~300px wide, so scroll by 4 cards

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mt-6 md:mt-8">
        <h2 className="text-black text-2xl md:text-3xl font-black">Continue Learning</h2>
      </div>
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={scrollLeft}
          className="hidden md:block absolute left-[-2rem] top-1/2 -translate-y-1/2 z-10
                     bg-white p-2 rounded-full shadow hover:bg-gray-100 focus:outline-none"
        >
          <ChevronLeft />
        </button>

        {/* Scrollable Row */}
        <div className="overflow-hidden">
          <div
            ref={scrollRef}
            className="flex space-x-4 px-1 py-2 scroll-smooth"
            style={{ width: "1200px", overflowX: "scroll", scrollBehavior: "smooth" }}
          >
            {courses.map((course) => (
              <div key={course.id} className="w-[280px] flex-shrink-0">
                <CourseCard {...course} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={scrollRight}
          className="hidden md:block absolute right-[-2rem] top-1/2 -translate-y-1/2 z-10
                     bg-white p-2 rounded-full shadow hover:bg-gray-100 focus:outline-none"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
