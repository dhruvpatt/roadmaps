import React from "react";
// Example icons from lucide-react
import { Lock, User, BookOpen } from "lucide-react";
import TeacherStat from "./teacher-stat-card";

export default function TeacherStats() {
  // Mock data for demonstration
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
  );
}
