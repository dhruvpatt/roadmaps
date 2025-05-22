import ClassroomOverview from "./ClassroomOverview";
import { useEffect, useState } from "react";
import StudentsComponent from "./ClassroomStudents";
import ClassroomBoard from "./ClassroomBoard";
import PathwayGrid from "@/components/pathways/PathwayGrid";



export default function ClassroomTabs({ classroom, isTeacher }) {
  const [activeTab, setActiveTab] = useState("overview");

  const [pathwaysNumber, setPathwaysNumber] = useState(0);

  const tabs = [
    { key: "overview", label: "Overview" },
    ...(isTeacher ? [{ key: "students", label: "Students" }] : []),
    { key: "board", label: "Board" },
    { key: "pathways", label: "Pathways" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="bg-gray-100 rounded-xl px-4 py-2 flex space-x-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-sm md:text-base font-semibold px-4 py-2 rounded-lg transition-all ${activeTab === tab.key
              ? "bg-amber-700 text-white"
              : "text-gray-500 hover:text-black"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === "overview" && (
          <ClassroomOverview
            isTeacher={isTeacher}
            classroom={classroom}
            pathwaysNumber={pathwaysNumber}
            setPathwaysNumber={setPathwaysNumber}
          />
        )}

        {activeTab === "students" && isTeacher && <StudentsComponent classroom={classroom} />}

        {activeTab === "board" && (
          <div>
            <ClassroomBoard classroom={classroom} />
          </div>
        )}

        {activeTab === "pathways" && classroom?.id && (
          <PathwayGrid
            title="Class Pathways"
            classroom={classroom}
            updatePathwaysNumber={setPathwaysNumber}
          />
        )}
      </div>

    </div>
  );
}
