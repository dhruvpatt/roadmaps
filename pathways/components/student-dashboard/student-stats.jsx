// StudentStats.jsx
import { BookOpen } from "lucide-react"
import StudentStatCard from "./student-stat-card"
import {useState, useEffect, useRef} from 'react'
import backendUrl from '../../backendUrl'
export default function StudentStats() {
  const [analytics, setAnalytics] = useState({
      active_roadmaps: 0,
      completed_roadmaps: 0,
      total_roadmaps: 0,
    });

  const [user, setUser] = useState({})
  const hasRun = useRef(false);

  useEffect(() => {
    const usr = JSON.parse(localStorage.getItem("user"));
    console.log("user", usr);

    if (!usr) {
        router.push("/login");
        return;
    }

    setUser(usr);

    const fetchAnalytics = async () => {

        try {
            const endpoint = usr.role === "student"
                ? `${backendUrl}/api/student-analytics/${usr.id}/`
                : `${backendUrl}/api/teacher-analytics/${usr.id}/`;

            const res = await fetch(endpoint);
            const data = await res.json();

            console.log("Analytics data:", data);
            setAnalytics(data);
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
        }
    };

    if (!hasRun.current) {
        hasRun.current = true;
        fetchAnalytics();
    }
  }, []);
  return (
    <div className="grid grid-cols-3 gap-8">
      <StudentStatCard
        title="Pathways in progress"
        value={analytics.active_roadmaps}
        Icon={BookOpen}
      />
      <StudentStatCard
        title="Completed Pathways"
        value={analytics.completed_roadmaps}
        Icon={BookOpen}
      />
      <StudentStatCard
        title="Total Pathways"
        value={analytics.total_roadmaps}
        Icon={BookOpen}
      />
    </div>
  )
}
