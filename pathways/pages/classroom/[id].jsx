import ClassroomHeader from "../../components/classrooms/ClassroomHeader";
import ClassroomTabs from "../../components/classrooms/ClassroomTabs";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import backendUrl from "@/backendUrl";

const Classroom = () => {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [user, setUser] = useState({});
  const [classroomId, setClassroomId] = useState(null);
  const [classroomCode, setClassroomCode] = useState("");
  const [classroom, setClassroom] = useState({});
  const [showInviteModal, setShowInviteModal] = useState(false); // used in onInviteClick

  useEffect(() => {
    const { id } = router.query;
    const classroomId = Array.isArray(id) ? id[0] : id;

    // Wait until router query is available
    if (!classroomId) {
      console.log("Waiting for classroomId...");
      return;
    }

    const usr = JSON.parse(localStorage.getItem("user"));
    if (!usr) {
      console.warn("No user found in localStorage. Redirecting to login...");
      router.push("/login");
      return;
    }

    setUser(usr);
    setRole(usr.role);
    setClassroomId(classroomId);
    console.log("Loaded classroom ID:", classroomId);

    fetchClassroom(usr, classroomId);
  }, [router.query]);

  const fetchClassroom = async (user, id) => {
    if (!id || !user?.id) {
      console.warn("Missing classroom_id or user_id in fetchClassroom");
      return;
    }

    try {
      console.log("Fetching classroom with ID:", id);
      const res = await fetch(`${backendUrl}/api/classrooms/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const ret = await res.json();
      console.log("Fetched classroom:", ret);

      setClassroomCode(ret.join_id);
      setClassroom(ret);
      return ret;
    } catch (error) {
      console.error("Failed to fetch classroom", error);
    }
  };
  return (
    <div className="flex-1 px-6 md:px-12 py-8 bg-gray-100 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {classroomId && user?.id ? (
          <>
            <ClassroomHeader
              title={classroom.name || "Loading..."}
              subtitle=""
              code={classroom.join_id}
              onInviteClick={() => setShowInviteModal(true)}
            />

            <ClassroomTabs
              classroomCode={classroomCode}
              classroomId={classroomId}
              isTeacher={role === "teacher"}
            />
          </>
        ) : (
          <div className="text-gray-600 text-center py-12">Loading classroom...</div>
        )}
      </div>
    </div>
  );
};

export default Classroom;
