import React, { useEffect, useState } from "react";
import { Lock, User, BookOpen } from "lucide-react";
import TeacherStat from "./teacher-stat-card";
import { useRouter } from "next/navigation";
import backendUrl from '@/backendUrl'
export default function TeacherStats() {
  const [stats, setStats] = useState([]);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const usr = JSON.parse(localStorage.getItem("user"));
    if (!usr) {
      router.push("/login");
      return;
    }

    setUser(usr);

    const fetchTeacherAnalytics = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/teacher-analytics/${usr.id}/`);
        const data = await response.json();
        console.log(data)
        // Format data into stats for display
        const formattedStats = [
          {
            title: "Active Classrooms",
            value: data.classrooms || 0,
            Icon: Lock,
          },
          {
            title: "Total Students",
            value: data.total_students || 0,
            Icon: User,
          },
          {
            title: "Active Pathways",
            value: data.active_pathways || 0,
            Icon: BookOpen,
          },
        ];

        setStats(formattedStats);
      } catch (error) {
        console.error("Failed to fetch teacher stats:", error);
      }
    };

    fetchTeacherAnalytics();
  }, [router]);

  return (
    // Same container styling as your scrollable section
    <div className="mx-auto px-4">
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
