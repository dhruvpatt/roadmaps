import React from "react"
import Navbar from "@/components/navbar"
import Sidebar from "@/components/sidebar"
import ClassroomCard from "@/components/classrooms/classroom-card"
import CreateClassroomModal from "@/components/modals/CreateClassroomModal"
import { useState, useEffect } from "react"

import { useRouter } from "next/navigation"
import backendUrl from "@/backendUrl"

export default function Classrooms() {
  const [user, setUser] = useState(null)
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() =>{
    const usr = JSON.parse(localStorage.getItem("user"))
    if (!usr){
      router.push("/login")
    }
    setUser(user);

    fetchClassrooms(usr)
    
  }, [])

  const [showModal, setShowModal] = useState(false)
  // Mock classroom data
  const mockClassrooms = [
    {
      id: 1,
      title: "Algebra 101",
      subtitle: "Fundamental algebraic concepts for beginners",
      students: 24,
      schedule: "Mon, Wed, Fri - 10:00 AM",
      lastActive: "Today",
    },
    {
      id: 2,
      title: "Computer Science Basics",
      subtitle: "Introduction to programming and computer science principles",
      students: 18,
      schedule: "Tue, Thu - 2:00 PM",
      lastActive: "1 day ago",
    },
    {
      id: 3,
      title: "Physics Fundamentals",
      subtitle: "Core concepts of physics including mechanics and energy",
      students: 20,
      schedule: "Mon, Wed - 11:00 AM",
      lastActive: "2 days ago",
    },
    {
      id: 4,
      title: "English Literature",
      subtitle: "Analysis of classic and contemporary literature",
      students: 16,
      schedule: "Tue, Thu - 10:00 AM",
      lastActive: "Today",
    },
    {
      id: 5,
      title: "History of Arts",
      subtitle: "Exploring various art movements and historical context",
      students: 12,
      schedule: "Wed, Fri - 3:00 PM",
      lastActive: "4 days ago",
    },
  ]

  const router = useRouter();

  const fetchClassrooms = async (usr) => {
    try {
      const res = await fetch(`${backendUrl}/get-user-classrooms/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: usr.id
        })
      });

      const ret = await res.json();
      setClassrooms(ret);
      console.log("fetched classrooms", ret)
    } catch (error){
      console.error("Failed to fetch classrooms:", error)
    }
  }

  const handleCreateNewClassroom = () => {
    setShowModal(true);
  }

  return (
    <div className="flex flex-col bg-gray-100 min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        {/* Reduced padding from p-16 to p-6 for a less spaced-out layout */}
        <div className="flex-1 p-6">
          <h1 className="text-black text-3xl md:text-4xl font-bold mb-2">
            Your Classrooms
          </h1>
          <p className="text-gray-600 text-lg md:text-2xl mb-8">
            Manage Your Classrooms and Student Groups
          </p>

          {/* Responsive Grid of Classroom Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create new classroom card FIRST */}
          <button
            onClick={handleCreateNewClassroom}
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:bg-gray-50 cursor-pointer"
          >
            <div>
              <p className="text-sm md:text-base">
                Create a new classroom for your students
              </p>
            </div>
          </button>

          {/* Render existing classrooms AFTER */}
          {classrooms.map((classroom) => (
            <ClassroomCard
              key={classroom.id}
              title={classroom.name}
              subtitle={classroom.join_id}
              students={classroom.students.length}
              onViewClick={() => router.push(`/classroom/${classroom.id}`)}
            />
          ))}
        </div>
        <CreateClassroomModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={(newClassroom) => {
          console.log("Created classroom:", newClassroom);
          // Optional: add to state if you want to update list live
          setShowModal(false);
        }}
      />


        </div>
      </div>
    </div>
  )
}
