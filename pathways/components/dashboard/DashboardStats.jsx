import React from "react";
import { CircleDollarSign, UserCheck, ListChecks, BookOpenCheck } from "lucide-react";

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="flex items-center bg-white rounded-xl shadow p-4 w-full">
    <div className="bg-amber-100 p-3 rounded-full mr-4">
      <Icon className="w-6 h-6 text-amber-700" />
    </div>
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-xl font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);

const DashboardStats = ({ user, classroomCount = 0, pathwayCount = 0 }) => {
  const stats =
    user.role === "teacher"
      ? [
          // { label: "Modules Created", value: 0, icon: BookOpenCheck },
          { label: "Active Classrooms", value: classroomCount, icon: UserCheck },
          // { label: "Pathways Created", value: pathwayCount, icon: ListChecks },
        ]
      : [
          // { label: "Modules Completed", value: 0, icon: BookOpenCheck },
          { label: "Pathways Enrolled", value: pathwayCount, icon: ListChecks },
          // { label: "Classrooms Joined", value: classroomCount, icon: UserCheck },
        ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {stats.map((stat, idx) => (
        <StatCard key={idx} {...stat} />
      ))}
    </div>
  );
};


export default DashboardStats;
