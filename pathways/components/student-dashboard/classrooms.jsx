import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ClassroomCard from "./classroom-card";

export default function YourClassrooms() {
  const scrollRef = useRef(null);

  // Mock data
  const classrooms = [
    { id: 1, title: "Algebra 101", teacher: "Mr. Johnson", nextClass: "Tomorrow, 10:00 AM", pendingAssignments: 2 },
    { id: 2, title: "Computer Science Basics", teacher: "Ms. Williams", nextClass: "Wednesday, 2:00 PM", pendingAssignments: 1 },
    { id: 3, title: "Physics Fundamentals", teacher: "Dr. Smith", nextClass: "Friday, 1:30 AM", pendingAssignments: 0 },
    { id: 4, title: "History of Arts", teacher: "Mrs. Carter", nextClass: "Monday, 9:00 AM", pendingAssignments: 3 },
    { id: 5, title: "Biology 101", teacher: "Dr. Greene", nextClass: "Thursday, 11:00 AM", pendingAssignments: 4 },
    { id: 6, title: "Chemistry Basics", teacher: "Mr. Brown", nextClass: "Tuesday, 12:00 PM", pendingAssignments: 2 },
    { id: 7, title: "English Literature", teacher: "Mrs. Davis", nextClass: "Friday, 3:00 PM", pendingAssignments: 1 },
  ];

  const scrollAmount = 320 * 4; // Scrolls 4 cards at a time

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
    <div className="max-w-[1300px] mx-auto">
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
            style={{ width: "1300px", overflowX: "scroll", scrollBehavior: "smooth" }}
          >
            {classrooms.map((classroom) => (
              <div 
                key={classroom.id} 
                className="w-[280px] flex-shrink-0 bg-white shadow-md rounded-xl p-4 border border-gray-200"
              >
                <h3 className="font-bold text-lg">{classroom.title}</h3>
                <p className="text-gray-600 text-sm">Teacher: {classroom.teacher}</p>
                <p className="text-gray-500 text-xs">Next class: {classroom.nextClass}</p>
                <p className="text-gray-500 text-xs">
                  Pending assignments: <span className="font-semibold">{classroom.pendingAssignments}</span>
                </p>

                {/* View Classroom Button */}
                <button className="mt-3 w-full bg-black text-white py-2 rounded-lg text-sm">
                  View Classroom
                </button>
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
