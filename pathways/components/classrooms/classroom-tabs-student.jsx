import React, { useState } from "react";
import OverviewComponentStudent from "./overview-component-student";
import StudentsComponent from "./classroom-students";
export default function ClassroomTabsStudent() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { key: "overview", label: "Overview" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="bg-gray-100 rounded-xl px-4 py-2 flex space-x-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-sm md:text-base font-semibold px-4 py-2 rounded-lg transition-all
              ${
                activeTab === tab.key
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
        {activeTab === "overview" && <OverviewComponentStudent />}
      </div>
    </div>
  );
}
