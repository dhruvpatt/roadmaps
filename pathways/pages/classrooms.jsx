import React from "react"
import ClassroomCard from "@/components/classrooms/classroom-card"
import CreateClassroomModal from "@/components/modals/CreateClassroomModal"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import backendUrl from "@/backendUrl"

export default function Classrooms() {
  const [user, setUser] = useState(null)
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();

  useEffect(() => {
    const usr = JSON.parse(localStorage.getItem("user"))
    if (!usr) {
      router.push("/login")
    }
    setUser(usr);
    setIsTeacher(usr.role === "teacher");

    const savedQuery = localStorage.getItem("classroomSearchQuery") || "";
    setSearchQuery(savedQuery);
    fetchClassrooms(usr, 1, savedQuery);
  }, [])

  const fetchClassrooms = async (usr, pageNum = 1, query = "") => {
    if (pageNum < 1 || pageNum > totalPages) return;
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/get-user-classrooms/?page=${pageNum}&search=${query}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: usr.id })
      });

      if (!res.ok) return;
      const data = await res.json();
      setClassrooms(data.results);
      setTotalPages(Math.max(1, Math.ceil(data.count / 15)));
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch classrooms:", error)
    } finally {
      setLoading(false);
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
      await fetchClassrooms(user, 1, searchQuery);
    } catch (error) {
      console.error("Failed to create classroom", error);
    }
  }

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    localStorage.setItem("classroomSearchQuery", query);
    fetchClassrooms(user, 1, query);
  }

  return (
    <div className="flex-1 p-6 text-gray-800">
      <h1 className="text-black text-3xl md:text-4xl font-bold mb-2">
        Your Classrooms
      </h1>
      <p className="text-gray-600 text-lg md:text-2xl mb-8">
        Manage Your Classrooms and Student Groups
      </p>

      <input
        type="text"
        placeholder="Search classrooms..."
        value={searchQuery}
        onChange={handleSearch}
        className="w-full p-2 mb-4 border border-gray-300 rounded text-gray-800"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isTeacher ? (
          <button
            onClick={() => setShowModal(true)}
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:bg-gray-50 cursor-pointer"
          >
            <div>
              <p className="text-sm md:text-base">
                Create a new classroom for your students
              </p>
            </div>
          </button>
        ) : (
          <button
            onClick={() => router.push("/join-classroom")}
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:bg-gray-50 cursor-pointer"
          >
            Join a Classroom
          </button>
        )}

        {loading ? (
          <div className="col-span-full text-center py-10">Loading...</div>
        ) : classrooms.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 italic py-10">No classrooms found.</div>
        ) : (
          classrooms.map((classroom) => (
            <ClassroomCard
              key={classroom.id}
              title={classroom.name}
              subtitle={classroom.join_id}
              students={classroom.students.length}
              onViewClick={() => router.push(`/classroom/${classroom.id}`)}
              onDelete={() => { }}
            />
          ))
        )}
      </div>

      <div className="mt-6 flex justify-center space-x-4 text-gray-800">
        <button
          onClick={() => fetchClassrooms(user, page - 1, searchQuery)}
          disabled={page <= 1}
          className="p-2 rounded bg-gray-200 disabled:opacity-50"
        >
          <ChevronLeft />
        </button>
        <span className="self-center">Page {page} of {totalPages}</span>
        <button
          onClick={() => fetchClassrooms(user, page + 1, searchQuery)}
          disabled={page >= totalPages}
          className="p-2 rounded bg-gray-200 disabled:opacity-50"
        >
          <ChevronRight />
        </button>
      </div>

      <CreateClassroomModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={async (newClassroom) => {
          await createClassroom(newClassroom);
          setShowModal(false);
        }}
        user={user}
      />
    </div>
  )
}
