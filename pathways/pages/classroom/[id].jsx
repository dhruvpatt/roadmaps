import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import ClassroomHeader from "@/components/classrooms/classroom-header";
import ClassroomTabs from "@/components/classrooms/classroom-tabs";
import ClassroomTabsStudent from "@/components/classrooms/classroom-tabs-student";
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
      const res = await fetch(`${backendUrl}/get-classroom/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ classroom_id: id, user_id: user.id }),
      });

      const ret = await res.json();
      console.log("Fetched classroom:", ret);

      setClassroomCode(ret.join_id);
      setClassroom(ret.classroom);
      return ret;
    } catch (error) {
      console.error("Failed to fetch classroom", error);
    }
  };

  return (
    <div className="flex flex-col bg-gray-100 min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 px-6 md:px-12 py-8 bg-gray-100 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {/* Classroom Header */}
            <ClassroomHeader
              title={classroom.name || "Loading..."}
              subtitle=""
              code={classroom.join_id}
              onInviteClick={() => setShowInviteModal(true)}
            />

            {/* Conditional Tabs */}
            {role === "student" ? (
              <ClassroomTabsStudent classroomCode={classroomCode} user={user} />
            ) : (
              <ClassroomTabs classroomCode={classroomCode} id={classroomId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Classroom;
