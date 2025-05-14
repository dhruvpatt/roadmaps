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
  const [isTeacher, setIsTeacher] = useState(false);
  useEffect(() =>{
    const usr = JSON.parse(localStorage.getItem("user"))
    if (!usr){
      router.push("/login")
    }
    setUser(usr);
    console.log(usr);
    setIsTeacher(usr.role === "teacher");

    fetchClassrooms(usr)
    
  }, [])

  const [showModal, setShowModal] = useState(false)
  // Mock classroom data
  
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

   const createClassroom = async (data) => {
          try {
              const res = await fetch(`${backendUrl}/classroom/create/`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data),
              })
  
              const ret = await res.json();
              console.log("ret", ret);
              await fetchClassrooms(user);
          } catch (error){
              console.error("Failed to create classroom", error);
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

          {isTeacher ? (
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
          ):(
            <button
            onClick={() => router.push("/join-classroom")}
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:bg-gray-50 cursor-pointer"
            >
              Join a Classroom
            </button>
          )}
          

          {/* Render existing classrooms AFTER */}
          {classrooms.map((classroom) => (
            <ClassroomCard
              key={classroom.id}
              title={classroom.name}
              subtitle={classroom.join_id}
              students={classroom.students.length}
              onViewClick={() => router.push(`/classroom/${classroom.id}`)}
              onDelete={() => {}}
            />
          ))}
        </div>
        <CreateClassroomModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={async (newClassroom) => {
          await createClassroom(newClassroom);
          // Optional: add to state if you want to update list live
          setShowModal(false);
        }}
        user={user}
      />


        </div>
      </div>
    </div>
  )
}
