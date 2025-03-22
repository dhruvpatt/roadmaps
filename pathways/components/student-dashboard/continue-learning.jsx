import React, { useState } from "react";
import CourseCard from "./pathway-card";

export default function ContinueLearning() {
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 5;

  const blocks = 4;

  // Mock data with unique IDs
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
    {
      id: 5,
      title: "Biology Fundamentals",
      subtitle: "Cell Structure",
      progress: 50,
      hoursLeft: 5,
    },
    {
      id: 6,
      title: "Geometry",
      subtitle: "Shapes & Theorems",
      progress: 30,
      hoursLeft: 2,
    },
    {
      id: 7,
      title: "Advanced Physics",
      subtitle: "Quantum Mechanics",
      progress: 10,
      hoursLeft: 8,
    },
    // Add more courses as needed
  ];

  const totalPages = Math.ceil(courses.length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const currentCourses = courses.slice(startIndex, startIndex + cardsPerPage);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <div className="mx-auto">
      {/* Cards Container */}
      <div className="flex flex-wrap gap-4">
        {currentCourses.map((course) => (
          <CourseCard key={course.id} {...course} />
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex items-center justify-center space-x-4">
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
