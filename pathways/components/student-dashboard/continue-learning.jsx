import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CourseCard from "./pathway-card";

export default function ContinueLearning() {
  const scrollRef = useRef(null);

  // Mock data: add as many courses as you want
  const courses = [
    {
      id: 1,
      title: "Algebra Fundamentals",
      subtitle: "Solving Equations",
      progress: 75,
      hoursLeft: 2,
    },
    {
      id: 2,
      title: "Introduction to Programming",
      subtitle: "Variables and Data Types",
      progress: 45,
      hoursLeft: 4,
    },
    {
      id: 3,
      title: "Physics Mechanics",
      subtitle: "Newton's Laws of Motion",
      progress: 20,
      hoursLeft: 6,
    },
    {
      id: 4,
      title: "Chemistry Basics",
      subtitle: "Atomic Structure",
      progress: 60,
      hoursLeft: 3,
    },
    // Add more if needed
  ];

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      <h2 className="text-xl font-bold mb-4">Continue Learning</h2>

      <div className="relative">
        {/* Left Arrow (hidden on small screens) */}
        <button
          onClick={scrollLeft}
          className="hidden md:block absolute left-[-1.5rem] top-1/2 -translate-y-1/2 z-10
                     bg-white p-2 rounded-full shadow hover:bg-gray-100 focus:outline-none"
        >
          <ChevronLeft />
        </button>

        {/* Scrollable Row */}
        <div
          ref={scrollRef}
          className="overflow-x-auto flex flex-nowrap space-x-4 px-1 py-2 scroll-smooth"
        >
          {courses.map((course) => (
            <CourseCard key={course.id} {...course} />
          ))}
        </div>

        {/* Right Arrow (hidden on small screens) */}
        <button
          onClick={scrollRight}
          className="hidden md:block absolute right-[-1.5rem] top-1/2 -translate-y-1/2 z-10
                     bg-white p-2 rounded-full shadow hover:bg-gray-100 focus:outline-none"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
