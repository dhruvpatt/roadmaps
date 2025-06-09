"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import ClassroomHeader from "../../components/classrooms/classroom-header";
import ClassroomTabs from "../../components/classrooms/classroom-tabs";

// Mock classroom data
const mockClassroom = {
  id: "1",
  name: "Biology 101",
  subject: "Biology",
  teacher: "Ms. Johnson",
  join_id: "ABC123",
  description:
    "Introduction to Biology - Exploring the fundamentals of life sciences",
  students: Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    name: `Student ${i + 1}`,
    email: `student${i + 1}@example.com`,
  })),
};

// Mock user data
const mockUser = {
  id: "teacher1",
  name: "Ms. Johnson",
  email: "johnson@school.edu",
  role: "teacher",
};

export default function ClassroomPage() {
  const router = useRouter();
  const [classroom, setClassroom] = useState(mockClassroom);
  const [user, setUser] = useState(mockUser);
  const [role, setRole] = useState("teacher");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { id } = router.query;
    if (!id) return;

    // TODO: Fetch classroom data from backend
    // fetchClassroom(id).then(setClassroom)

    // TODO: Get user from localStorage or auth context
    // const userData = JSON.parse(localStorage.getItem("user") || "{}")
    // setUser(userData)
    // setRole(userData.role)

    // TODO: Analytics - Track classroom visit
    // trackUserActivity({
    //   userId: user.id,
    //   classroomId: id,
    //   action: 'visit_classroom',
    //   timestamp: new Date().toISOString()
    // })

    setLoading(false);
  }, [router.query]);

  const handleInviteClick = () => {
    // TODO: Open invite modal
    console.log("Opening invite modal...");
  };

  const handleSettingsClick = () => {
    // TODO: Navigate to classroom settings
    router.push(`/classroom/${classroom.id}/settings`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading classroom...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <ClassroomHeader
        title={classroom.name}
        subtitle={classroom.description}
        code={classroom.join_id}
        teacher={classroom.teacher}
        subject={classroom.subject}
        onInviteClick={handleInviteClick}
        onSettingsClick={handleSettingsClick}
      />

      <ClassroomTabs
        classroom={classroom}
        isTeacher={role === "teacher"}
        user={user}
      />
    </div>
  );
}
