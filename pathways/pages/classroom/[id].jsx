"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import ClassroomHeader from "../../components/classrooms/classroom-header";
import ClassroomTabs from "../../components/classrooms/classroom-tabs";
import fetchWithAuth from "@/lib/fetch_with_auth";
import withAuth from "@/lib/with_auth";

const ClassroomPage = ({ user }) => {
  const router = useRouter();
  const { id } = router.query;

  const [classroom, setClassroom] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchClassroom = async () => {
      setLoading(true);
      try {
        // Fetch classroom data
        const res = await fetchWithAuth(`/api/classroom/${id}/`);
        if (!res.ok) {
          throw new Error("Failed to load classroom");
        }
        const data = await res.json();
        console.log("Fetched classroom data:", data);
        setClassroom(data);
        setRole(user.role);


        // Track analytics (optional)
        // trackUserActivity({ userId: userData.id, classroomId: id, action: 'visit_classroom' });

      } catch (error) {
        console.error("Error loading classroom:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassroom();
  }, [id]);

  const handleInviteClick = () => {
    // TODO: Open invite modal
    console.log("Opening invite modal...");
  };

  const handleSettingsClick = () => {
    router.push(`/classroom/${classroom?.id}/settings`);
  };

  if (loading || !classroom || !user) {
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
        subtitle={classroom.details || classroom.description}
        code={classroom.join_id}
        teacher={classroom.teachers?.[0]?.first_name || "Instructor"}
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

export default withAuth(ClassroomPage)
