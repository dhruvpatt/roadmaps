import React, { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import  backendUrl  from '@/backendUrl';

export default function YourClassrooms() {
  const router = useRouter();
  const scrollRef = useRef(null);

  const [classrooms, setClassrooms] = useState([]);
  const [user, setUser] = useState(null);

  // Mock data
  const classrooms1 = [
    { id: 1, title: "Algebra 101", teacher: "Mr. Johnson", nextClass: "Tomorrow, 10:00 AM", pendingAssignments: 2 },
    { id: 2, title: "Computer Science Basics", teacher: "Ms. Williams", nextClass: "Wednesday, 2:00 PM", pendingAssignments: 1 },
    { id: 3, title: "Physics Fundamentals", teacher: "Dr. Smith", nextClass: "Friday, 1:30 AM", pendingAssignments: 0 },
    { id: 4, title: "History of Arts", teacher: "Mrs. Carter", nextClass: "Monday, 9:00 AM", pendingAssignments: 3 },
    { id: 5, title: "Biology 101", teacher: "Dr. Greene", nextClass: "Thursday, 11:00 AM", pendingAssignments: 4 },
    { id: 6, title: "Chemistry Basics", teacher: "Mr. Brown", nextClass: "Tuesday, 12:00 PM", pendingAssignments: 2 },
    { id: 7, title: "English Literature", teacher: "Mrs. Davis", nextClass: "Friday, 3:00 PM", pendingAssignments: 1 },
  ];

  const scrollAmount = 320 * classrooms.length;

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


  useEffect(() => {
    const usr = JSON.parse(localStorage.getItem("user"));
    if (!usr) {
      router.push("/login");
      return;
    }
    setUser(usr);

    fetchClassrooms(usr);
  }, []);

  const fetchClassrooms = async (usr) => {
    try {
      const response = await fetch(`${backendUrl}/get-user-classrooms/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: usr.id }),
      });
      console.log(response);
      const data = await response.json();

      console.log("ret", data)
      setClassrooms(data || []);
    } catch (error) {
      console.error("Failed to fetch classrooms:", error);
    }
  };

  return (
    <div className="mx-auto max-w-screen-2xl px-4">
      {/* Header */}
      <div className="flex items-center justify-between mt-6 md:mt-8">
        <h2 className="text-black text-2xl md:text-3xl font-black">Your Classrooms</h2>
        {/* <button
          type="button"
          className="border border-black text-white rounded px-4 py-2 bg-black hover:bg-amber-600 hover:border-amber-600 transition-colors"
          onClick={handleClick}
        >
          Join Classroom
        </button> */}
      </div>

      {classrooms.length === 0 ? (
        <div className="mt-6 text-gray-600 italic">You are not enrolled in any classrooms yet.</div>
      ) : (
        <div className="relative mt-4">
          {/* Left Arrow */}
          <button
            onClick={scrollLeft}
            className="hidden md:block absolute -left-12 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow hover:bg-gray-100 focus:outline-none"
          >
            <ChevronLeft className="text-black" />
          </button>

          {/* Scrollable classroom cards */}
          <div
            ref={scrollRef}
            className="w-full overflow-x-auto flex space-x-4 py-2 scroll-smooth"
          >
            {classrooms.map((classroom) => (
              <div
                key={classroom.id}
                className="w-[280px] flex-shrink-0 bg-white shadow-md rounded-xl p-4 border border-gray-200"
              >
                <h3 className="font-bold text-lg text-black">{classroom.name}</h3>
                <p className="text-gray-600 text-sm">Classroom ID: {classroom.join_id}</p>
                <button
                  className="mt-3 w-full bg-black text-white py-2 rounded-lg text-sm hover:bg-amber-600 hover:border-amber-600 transition-colors"
                  onClick={() => router.push(`/classroom/${classroom.id}`)}
                >
                  View Classroom
                </button>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={scrollRight}
            className="hidden md:block absolute -right-12 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow hover:bg-gray-100 focus:outline-none"
          >
            <ChevronRight className="text-black" />
          </button>
        </div>
      )}
    </div>
  );
}
