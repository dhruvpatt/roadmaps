import React, { useState, useEffect } from "react";
import Link from "next/link";
// Replace these imports with your actual Navbar & Sidebar components
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import backendUrl from "@/backendUrl";

export default function JoinClassroomPage() {

  const [user, setUser] = useState({});
  useEffect(() => {
    const usr = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      router.push("/login");
    }
    setUser(usr);
  }, [])

  const [classroomCode, setClassroomCode] = useState("");

  const handleChange = (e) => {
    setClassroomCode(e.target.value);
  };

  const handleJoinClassroom = async () => {
    try {

      if (user.role === "student"){
        const res = await fetch(`${backendUrl}/classroom/join/student/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            join_id: classroomCode,
            user_id: user.id
          }),
        })
  
        const ret = await res.json();
        console.log("Joined classroom", ret);
      } else if (user.role === "teacher"){
        const res = await fetch(`${backendUrl}/classroom/join/teacher/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            join_id: classroomCode,
            user_id: user.id
          }),
        })
  
        const ret = await res.json();
        console.log("Joined classroom", ret);
        
      }
      
    } catch (error){
      console.error("error joining classroom", error)
    }

  }
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Layout */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Content Area */}
        <div className="flex-1 px-8 py-6">
          {/* Join Classroom Card */}
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            {/* Back Link (now at the top inside the box) */}
            <div className="mb-4">
              <Link
                href="/classrooms"
                className="text-sm text-amber-600 hover:text-amber-800"
              >
                &larr; Back to Classrooms
              </Link>
            </div>

            <h1 className="text-xl font-bold text-amber-900 mb-2">
              Join a Classroom
            </h1>
            <p className="text-sm text-gray-700 mb-4">
              Enter the classroom code provided by your teacher
            </p>

            <div className="mb-4">
              <label
                htmlFor="classroomCode"
                className="text-sm font-medium text-gray-700 block mb-1"
              >
                Classroom Code
              </label>
              <input
                id="classroomCode"
                type="text"
                value={classroomCode}
                onChange={handleChange}
                placeholder="Enter code, e.g. ABC123"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm 
                           focus:outline-none focus:ring-2 focus:ring-amber-600 
                           focus:border-amber-600 text-black"
              />
            </div>

            <button
              type="button"
              className="w-full bg-amber-600 text-white py-2 rounded font-semibold
                         hover:bg-amber-700 transition-colors"
              onClick={async () => await handleJoinClassroom()}
            >
              Join Classroom
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
