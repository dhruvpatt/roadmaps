import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import fetchWithAuth from "@/lib/fetch_with_auth";
import emitter from "@/mitt";
import ClassroomCard from "@/components/classrooms/ClassroomCard";
import CreateClassroomModal from "@/components/modals/CreateClassroomModal";
import { Button } from "@/components/ui/button";

export default function ClassroomList({
  user,
  condensed = false,
  updateClassroomCount,
  setDrawerOpen,
}) {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(user?.role === "teacher");
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();

  useEffect(() => {
    const savedQuery = localStorage.getItem("classroomSearchQuery") || "";
    setSearchQuery(savedQuery);
    fetchClassrooms(1, savedQuery);

    emitter.on("update-classrooms", () => fetchClassrooms(1, searchQuery));
    return () => emitter.off("update-classrooms");
  }, []);

  const fetchClassrooms = async (pageNum = 1, query = "") => {
    if (pageNum < 1 || pageNum > totalPages) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(
        `api/classroom/?page=${pageNum}&search=${encodeURIComponent(query)}`
      );
      const data = await res.json();

      setClassrooms(data.results || []);
      setTotalPages(Math.max(1, Math.ceil(data.count / 15)));
      setPage(pageNum);

      if (typeof updateClassroomCount === "function") {
        updateClassroomCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch classrooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const createClassroom = async (data) => {
    try {
      const res = await fetchWithAuth("api/classroom/create/", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await res.json();
      await fetchClassrooms(1, searchQuery);
    } catch (error) {
      console.error("Failed to create classroom", error);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    localStorage.setItem("classroomSearchQuery", query);
    fetchClassrooms(1, query);
  };

  const handleDelete = async (classroomId) => {
    try {
      const res = await fetchWithAuth(`api/classroom/${classroomId}/`, {
        method: "DELETE",
      });
      if (res.ok) {
        setClassrooms((prev) => prev.filter((c) => c.id !== classroomId));
        emitter.emit("update-classrooms");
      } else {
        console.error("Failed to delete classroom");
      }
    } catch (error) {
      console.error("Error deleting classroom:", error);
    }
  };

  return (
    <div className="flex-1 text-gray-800">
      {!condensed && (
        <>
          <h1 className="text-black text-3xl md:text-4xl font-bold mb-2 px-6">
            Your Classrooms
          </h1>
          <p className="text-gray-600 text-lg md:text-2xl mb-8 px-6">
            Manage Your Classrooms and Student Groups
          </p>
        </>
      )}

      {!condensed && (
        <div className="px-6">
          <input
            type="text"
            placeholder="Search classrooms..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full p-2 mb-4 border border-gray-300 rounded text-gray-800"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-6">
        {isTeacher ? (
          <button
            onClick={() => {
              if (setDrawerOpen) {
                setDrawerOpen(true);
              } else {
                setShowModal(true);
              }
            }}
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:bg-gray-50 cursor-pointer"
          >
            <p className="text-sm md:text-base">Create a new classroom for your students</p>
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
          <div className="col-span-full text-center text-gray-500 italic py-10">
            No classrooms found.
          </div>
        ) : (
          classrooms.map((classroom) => (
            <ClassroomCard
              key={classroom.id}
              classroomId={classroom.id}
              title={classroom.name}
              subtitle={classroom.join_id}
              students={classroom.students.length}
              onViewClick={() => router.push(`/classroom/${classroom.id}`)}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {!condensed && (
        <div className="mt-6 pb-6 flex justify-center space-x-4 text-gray-800">
          <Button
            onClick={() => fetchClassrooms(page - 1, searchQuery)}
            disabled={page <= 1}
            className="w-10 h-10 flex items-center justify-center disabled:opacity-40"
            variant="outline"
          >
            <ChevronLeft className="w-4 h-4 text-gray-100" />
          </Button>
          <span className="self-center">
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => fetchClassrooms(page + 1, searchQuery)}
            disabled={page >= totalPages}
            className="w-10 h-10 flex items-center justify-center disabled:opacity-40"
            variant="outline"
          >
            <ChevronRight className="w-4 h-4 text-gray-100" />
          </Button>
        </div>
      )}

      {!setDrawerOpen && (
        <CreateClassroomModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onCreate={createClassroom}
          user={user}
        />
      )}
    </div>
  );
}
