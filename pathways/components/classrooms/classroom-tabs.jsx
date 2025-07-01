"use client";

import React, { useState } from "react";
import { useRouter } from "next/router";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";
import ClassroomStream from "./classroom-stream";
import ClassroomAssignments from "./classroom-assignments";
import ClassroomMaterials from "./classroom-materials";
import ClassroomTests from "./classroom-tests";
import ClassroomGradebook from "./classroom-gradebook";
import ClassroomStudents from "./classroom-students";
import ClassroomAttendance from "./classroom-attendance";
import CurriculumBuilder from "./CurriculumBuilder";
import CurriculumEditPage from "./CurriculumEditPage";


export default function ClassroomTabs({ classroom, isTeacher, user }) {
  const router = useRouter();
  console.log(router.query.tab)
  const initialTab = router.query.tab || "stream";
  const [activeTab, setActiveTab] = useState(initialTab);

  const setTabAndPush = (tabKey) => {
    setActiveTab(tabKey);
    const newQuery = new URLSearchParams(window.location.search);
    newQuery.set("tab", tabKey);
    router.push(`${window.location.pathname}?${newQuery.toString()}`);
  };

  const tabs = [
    { key: "stream", label: "Stream" },
    { key: "materials", label: "Materials" },
    { key: "assignments", label: "Assignments" },
    { key: "tests", label: "Tests" },
    ...(isTeacher
      ? [
        { key: "gradebook", label: "Gradebook" },
        { key: "students", label: "Students" },
        { key: "attendance", label: "Attendance" },
        { key: "curriculum", label: "Curriculum Builder" },
      ]
      : []),
  ];

  return (
    <div className="bg-white rounded-xl shadow">
      {/* Tab Navigation */}
      <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
        <nav className="flex justify-center overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTabAndPush(tab.key)}
              className={cn(
                "flex-shrink-0 px-4 py-3 text-m font-medium transition-colors whitespace-nowrap cursor-pointer",
                activeTab === tab.key
                  ? "border-b-2 border-amber-600 text-amber-600"
                  : "border-b-2 border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "stream" && (
          <ClassroomStream
            classroom={classroom}
            isTeacher={isTeacher}
            user={user}
          />
        )}
        {activeTab === "assignments" && (
          <ClassroomAssignments
            classroom={classroom}
            isTeacher={isTeacher}
            user={user}
          />
        )}
        {activeTab === "materials" && (
          <ClassroomMaterials
            classroom={classroom}
            isTeacher={isTeacher}
            user={user}
          />
        )}
        {activeTab === "tests" && (
          <ClassroomTests
            classroom={classroom}
            isTeacher={isTeacher}
            user={user}
          />
        )}
        {activeTab === "gradebook" && isTeacher && (
          <ClassroomGradebook classroom={classroom} user={user} />
        )}
        {activeTab === "students" && isTeacher && (
          <ClassroomStudents classroom={classroom} user={user} />
        )}
        {activeTab === "attendance" && isTeacher && (
          <ClassroomAttendance classroom={classroom} user={user} />
        )}
        {activeTab === "curriculum" && isTeacher && (
          <div className="text-center">
            <CurriculumEditPage classroomId={classroom.id} />
          </div>
        )}
      </div>
    </div>
  );
}

ClassroomTabs.propTypes = {
  classroom: PropTypes.object.isRequired,
  isTeacher: PropTypes.bool,
  user: PropTypes.object,
};

ClassroomTabs.defaultProps = {
  isTeacher: false,
  user: {},
};
