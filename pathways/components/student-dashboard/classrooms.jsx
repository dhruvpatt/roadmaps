import React, { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import ClassroomCard from "./classroom-card"

export default function YourClassrooms() {
  const scrollRef = useRef(null)

  // Mock data: Add as many classrooms as you want
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
    // ...add more if needed
  ]

  // Scroll left by 300px
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: "smooth" })
    }
  }

  // Scroll right by 300px
  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" })
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      <h2 className="text-xl font-bold mb-4">Your Classrooms</h2>

      <div className="relative">
        {/* Left Chevron (hidden on small screens) */}
        <button
          onClick={scrollLeft}
          className="hidden md:block absolute left-[-1.5rem] top-1/2 -translate-y-1/2 z-10
                     bg-white p-2 rounded-full shadow hover:bg-gray-100 focus:outline-none"
        >
          <ChevronLeft />
        </button>

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="overflow-x-auto flex flex-nowrap space-x-4 px-1 py-2 scroll-smooth"
        >
          {classrooms.map((classroom) => (
            <ClassroomCard key={classroom.id} {...classroom} />
          ))}
        </div>

        {/* Right Chevron (hidden on small screens) */}
        <button
          onClick={scrollRight}
          className="hidden md:block absolute right-[-1.5rem] top-1/2 -translate-y-1/2 z-10
                     bg-white p-2 rounded-full shadow hover:bg-gray-100 focus:outline-none"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  )
}
