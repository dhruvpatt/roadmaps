"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import ClassroomHeader from "../../components/classrooms/classroom-header";
import ClassroomTabs from "../../components/classrooms/classroom-tabs";
import CurriculumBuilder from "../../components/classrooms/CurriculumBuilder";
import fetchWithAuth from "@/lib/fetch_with_auth";
import withAuth from "@/lib/with_auth";

const ClassroomPage = ({ user }) => {
  const router = useRouter();
  const { id } = router.query;

  const [classroom, setClassroom] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCurriculumBuilder, setShowCurriculumBuilder] = useState(false);
  const [hasUnits, setHasUnits] = useState(false);

  const fetchClassroom = async () => {
    setLoading(true);
    try {
      // Fetch classroom data with units
      const res = await fetchWithAuth(`/api/classroom/${id}/`);
      if (!res.ok) {
        throw new Error("Failed to load classroom");
      }
      const data = await res.json();
      console.log("Fetched classroom data:", data);
      setClassroom(data);
      setRole(user.role);

      // Check if classroom has units
      const unitsExist = data.units && data.units.length > 0;
      setHasUnits(unitsExist);

      // If no units and user is teacher, show curriculum builder
      if (!unitsExist && user.role === "teacher") {
        setShowCurriculumBuilder(true);
      }
      // trackUserActivity...
    } catch (error) {
      console.error("Error loading classroom:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchClassroom();
    // eslint-disable-next-line
  }, [id, user.role]);

  const handleCurriculumCreated = async (newUnits) => {
    await fetchClassroom();
    setHasUnits(true);
    setShowCurriculumBuilder(false);
  };



  const handleInviteClick = () => {
    // TODO: Open invite modal
    console.log("Opening invite modal...");
  };

  const handleSettingsClick = () => {
    router.push(`/classroom/${classroom?.id}/settings`);
  };



  const handleCreateCurriculum = () => {
    setShowCurriculumBuilder(true);
  };

  const handleCancelCurriculumBuilder = () => {
    setShowCurriculumBuilder(false);
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

  // Show curriculum builder if no units exist and user is teacher
  if (showCurriculumBuilder && role === "teacher") {
    return (
      <div className="min-h-screen bg-white">
        <ClassroomHeader
          title={classroom.name}
          subtitle={classroom.details || classroom.description}
          code={classroom.join_id}
          teacher={classroom.teachers || "Instructor"}
          onInviteClick={handleInviteClick}
          onSettingsClick={handleSettingsClick}
        />

        <CurriculumBuilder
          classroomId={classroom.id}
          onCurriculumCreated={handleCurriculumCreated}
          onCancel={handleCancelCurriculumBuilder}
          hasExistingUnits={hasUnits}
        />
      </div>
    );
  }

  // Show empty state for students when no units exist
  if (!hasUnits && role === "student") {
    return (
      <div className="min-h-screen bg-white">
        <ClassroomHeader
          title={classroom.name}
          subtitle={classroom.details || classroom.description}
          code={classroom.join_id}
          teachers={classroom.teachers || "Instructor"}
          onInviteClick={handleInviteClick}
          onSettingsClick={handleSettingsClick}
        />

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Curriculum Coming Soon
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Your teacher is currently setting up the curriculum for this
              classroom. Check back soon to see your learning materials and
              assignments.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state for teachers when no units exist (with create button)
  if (!hasUnits && role === "teacher") {
    return (
      <div className="min-h-screen bg-white">
        <ClassroomHeader
          title={classroom.name}
          subtitle={classroom.details || classroom.description}
          code={classroom.join_id}
          teachers={classroom.teachers || "Instructor"}
          onInviteClick={handleInviteClick}
          onSettingsClick={handleSettingsClick}
        />

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Create Your Curriculum
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Get started by building your classroom curriculum. You can upload
              existing materials or create units from scratch to organize your
              teaching content.
            </p>
            <button
              onClick={handleCreateCurriculum}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Build Curriculum
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal classroom view with units
  return (
    <div className="min-h-screen bg-white">
      <ClassroomHeader
        title={classroom.name}
        subtitle={classroom.details || classroom.description}
        code={classroom.join_id}
        teachers={classroom.teachers || "Instructor"}
        onInviteClick={handleInviteClick}
        onSettingsClick={handleSettingsClick}
      />

      <ClassroomTabs
        classroom={classroom}
        isTeacher={role === "teacher"}
        user={user}
        onCreateCurriculum={handleCreateCurriculum}
      />
    </div>
  );
};

export default withAuth(ClassroomPage);
