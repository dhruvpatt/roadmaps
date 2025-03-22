import React from "react";
import { Lock, User, BookOpen } from "lucide-react";
import TeacherStat from "./teacher-stat-card";

export default function TeacherStats() {
  const stats = [
    {
      title: "Active Classrooms",
      value: 4,
      subtext: "2 classes today",
      Icon: Lock,
    },
    {
      title: "Total Students",
      value: 87,
      subtext: "+12 this month",
      Icon: User,
    },
    {
      title: "Active Pathways",
      value: 6,
      subtext: "2 need review",
      Icon: BookOpen,
    },
  ];

  return (
    // Same container styling as your scrollable section
    <div className="mx-auto max-w-screen-2xl px-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-6">
        {stats.map((stat) => (
          <TeacherStat
            key={stat.title}
            title={stat.title}
            value={stat.value}
            subtext={stat.subtext}
            Icon={stat.Icon}
          />
        ))}
      </div>
    </div>
  );
}
