import React, { useState } from "react";
import ClassroomCard from "./classroom-card";

export default function YourClassrooms() {
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 5;

  // Mock data with unique IDs
  const classrooms = [
    {
      id: 1,
      title: "Algebra 101",
      teacher: "Mr. Johnson",
      nextClass: "Tomorrow, 10:00 AM",
      pendingAssignments: 2,
    },
    {
      id: 2,
      title: "Computer Science Basics",
      teacher: "Ms. Williams",
      nextClass: "Wednesday, 2:00 PM",
      pendingAssignments: 1,
    },
    {
      id: 3,
      title: "Physics Fundamentals",
      teacher: "Dr. Smith",
      nextClass: "Friday, 1:30 AM",
      pendingAssignments: 0,
    },
    {
      id: 4,
      title: "History of Arts",
      teacher: "Mrs. Carter",
      nextClass: "Monday, 9:00 AM",
      pendingAssignments: 3,
    },
    {
      id: 5,
      title: "Biology 101",
      teacher: "Dr. Greene",
      nextClass: "Thursday, 11:00 AM",
      pendingAssignments: 4,
    },
    {
      id: 6,
      title: "Chemistry Basics",
      teacher: "Mr. Brown",
      nextClass: "Tuesday, 12:00 PM",
      pendingAssignments: 2,
    },
    {
      id: 7,
      title: "English Literature",
      teacher: "Mrs. Davis",
      nextClass: "Friday, 3:00 PM",
      pendingAssignments: 1,
    },
    // ... add more classrooms if needed
  ];

  const totalPages = Math.ceil(classrooms.length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const currentClassrooms = classrooms.slice(startIndex, startIndex + cardsPerPage);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return (
    <div className="mx-auto">
      <h2 className="text-black text-3xl font-black mt-8">Your Classrooms</h2>
      
      {/* Cards Container */}
      <div className="flex flex-wrap gap-4">
        {currentClassrooms.map((classroom) => (
          <ClassroomCard key={classroom.id} {...classroom} />
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
