import React, { useState } from "react";
import {
  Users,
  UserCheck,
  Info,
  ClipboardList, BookOpenCheck, FileText, AlertCircle, BookType
} from "lucide-react";

import StatModal from "./DashboardStatModal";
import StatGrid from "./DashboardStatsGrid";


const mockDeadlines = [
  { date: new Date(2025, 5, 14), title: "Math Homework Due", type: "homework" },
  { date: new Date(2025, 5, 16), title: "Science Quiz", type: "test" },
  { date: new Date(2025, 5, 18), title: "History Presentation", type: "assignment" },
];

const getTypeIcon = (type) => {
  switch (type) {
    case "test":
      return <BookOpenCheck className="w-4 h-4 text-violet-600" />;
    case "assignment":
      return <FileText className="w-4 h-4 text-blue-600" />;
    case "homework":
    default:
      return <ClipboardList className="w-4 h-4 text-orange-600" />;
  }
};

const getUrgencyColor = (daysLeft, type) => {
  const base = type === "test" ? 3 : type === "assignment" ? 2 : 1;
  const urgency = base / Math.max(0.1, daysLeft / 2);
  console.log(`Urgency for ${type} with ${daysLeft} days left: ${urgency}`);
  if (urgency > 2) return "text-red-600";
  if (urgency > 1) return "text-orange-500";
  return "text-green-600";
};

const statStyle =
  "flex-shrink-0 w-[220px] bg-white rounded-xl shadow p-4 relative cursor-pointer";

const DashboardStats = ({ user, classroomCount = 0 }) => {
  const [activeModal, setActiveModal] = useState(null);

  const openModal = (key) => setActiveModal(key);
  const closeModal = () => setActiveModal(null);

  const stats = [
    {
      key: "classrooms",
      label: "Active Classrooms",
      value: classroomCount,
      icon: UserCheck,
      color: "bg-amber-100 text-amber-700",
    },
    {
      key: "students",
      label: "Total Students",
      value: 128,
      icon: Users,
      color: "bg-green-100 text-green-700",
    },
    {
      key: "homework",
      label: "Homework to Grade",
      value: 7,
      icon: ClipboardList,
      color: "bg-orange-100 text-orange-700",
    },
    {
      key: "assignments",
      label: "Assignments to Grade",
      value: 5,
      icon: FileText,
      color: "bg-blue-100 text-blue-700",
    },
    {
      key: "tests",
      label: "Tests Awaiting Review",
      value: 3,
      icon: BookOpenCheck,
      color: "bg-violet-100 text-violet-700",
    },
      {
      key: "check-ins",
      label: "Check-Ins Awaiting Review",
      value: 3,
      icon: BookType,
      color: "bg-violet-100 text-violet-700",
    },
  ];

  const renderModalContent = () => {
    const modalIcon = stats.find((s) => s.key === activeModal)?.icon;

    switch (activeModal) {
      case "classrooms":
        return (
          <StatModal title="Classrooms" isOpen onClose={closeModal} icon={modalIcon}>
            {[1, 2, 3].map((id) => (
              <div key={id} className="border p-4 rounded-lg">
                <p className="font-semibold text-gray-800">Classroom {id}</p>
                <p className="text-sm text-gray-500">Code: ABC{id}</p>
              </div>
            ))}
          </StatModal>
        );
      case "students":
        return (
          <StatModal title="Students" isOpen onClose={closeModal} icon={modalIcon}>
            {["Alice", "Bob", "Charlie"].map((name, idx) => (
              <div key={idx} className="border-b py-2 text-gray-800">
                {name}
              </div>
            ))}
          </StatModal>
        );
      case "homework":
      case "assignments":
      case "tests":
        const title =
          activeModal === "homework"
            ? "Homework to Grade"
            : activeModal === "assignments"
              ? "Assignments to Grade"
              : "Tests Awaiting Review";

        return (
          <StatModal title={title} isOpen onClose={closeModal} icon={modalIcon}>
            {[
              {
                classroom: "Science A",
                task: "Photosynthesis Essay",
                student: "Liam",
              },
              {
                classroom: "Math B",
                task: "Algebra Homework",
                student: "Maya",
              },
              {
                classroom: "History C",
                task: "WWII Report",
                student: "Zoe",
              },
            ].map((entry, idx) => (
              <div key={idx} className="border rounded-lg p-3">
                <p className="font-semibold text-gray-800">{entry.task}</p>
                <p className="text-sm text-gray-600">
                  {entry.student} — {entry.classroom}
                </p>
              </div>
            ))}
          </StatModal>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 mb-8 items-start">
        {/* Stats Grid Left Column */}
        <div>
          <StatGrid stats={stats} openModal={openModal} />
        </div>

        {/* Deadlines List Right Column */}
        <div className="bg-white rounded-xl shadow p-6 h-full min-h-[260px]">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Upcoming Deadlines
          </h2>
          <ul className="space-y-3">
            {mockDeadlines.map((event, idx) => {
              const now = new Date();
              const daysLeft = Math.ceil((event.date - now) / (1000 * 60 * 60 * 24));
              const urgencyColor = getUrgencyColor(daysLeft, event.type);

              return (
                <li
                  key={idx}
                  className="flex justify-between items-center bg-gray-50 rounded-md px-4 py-2"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-800">
                    {getTypeIcon(event.type)}
                    {event.title}
                  </div>

                  <div className="flex items-center gap-2">
                    <AlertCircle className={`w-4 h-4 ${urgencyColor}`} />
                    <span className="text-sm text-gray-600">
                      {event.date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

      </div>

      {renderModalContent()}

    </>
  );
};

export default DashboardStats;
