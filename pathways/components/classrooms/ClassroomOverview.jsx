import { useEffect, useState } from "react";
import { Users, BookOpen, BarChart2, CircleCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import backendUrl from "@/backendUrl";
import PathwayGrid from "@/components/pathways/PathwayGrid";


export default function ClassroomOverview({ isTeacher = false, classroomCode = null, classroomId = null }) {
  const router = useRouter();
  const [user, setUser] = useState({});
  const [classroom, setClassroom] = useState({});
  const [stats, setStats] = useState([]);
  const [pathways, setPathways] = useState([]);

  useEffect(() => {
    const usr = JSON.parse(localStorage.getItem("user"));
    if (!usr) {
      router.push("/login");
      return;
    }
    setUser(usr);

    if (isTeacher && classroomId) {
      fetchClassroom(usr, classroomId);
    } else {
      loadMockData();
    }
  }, []);

  const fetchClassroom = async (user, id) => {
    try {
      const res = await fetch(`${backendUrl}/api/classrooms/${id}}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const ret = await res.json();

      setClassroom(ret.classroom || {});
      setPathways(Array.isArray(ret.pathways) ? ret.pathways : []);

      const studentsCount = ret.classroom?.students?.length || 0;
      const pathwayCount = ret.pathways?.length || 0;

      setStats([
        {
          label: "Total Students",
          value: studentsCount,
          icon: Users,
          bg: "bg-blue-100",
          text: "text-blue-700",
        },
        {
          label: "Total Pathways",
          value: pathwayCount,
          icon: BookOpen,
          bg: "bg-green-100",
          text: "text-green-700",
        },
        {
          label: "Average Grade",
          value: "87%",
          icon: BarChart2,
          bg: "bg-amber-100",
          text: "text-amber-700",
        },
      ]);
    } catch (error) {
      console.error("Failed to fetch classroom", error);
      setPathways([]);
    }
  };

  const loadMockData = () => {

    const avgProgress =
      pathways.reduce((sum, p) => sum + p.progress, 0) / pathways.length;

    setStats([
      {
        label: "Total Pathways",
        value: pathways.length,
        icon: BookOpen,
        bg: "bg-green-100",
        text: "text-green-700",
      },
      {
        label: "Overall Progress",
        value: `${Math.round(avgProgress)}%`,
        icon: CircleCheck,
        bg: "bg-blue-100",
        text: "text-blue-700",
      },
      {
        label: "Average Grade",
        value: "N/A",
        icon: BarChart2,
        bg: "bg-amber-100",
        text: "text-amber-700",
      },
    ]);
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map(({ label, value, icon: Icon, bg, text }, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-lg shadow border border-gray-200 flex items-center"
          >
            <div className={`p-3 rounded-full ${bg} ${text} mr-4`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <PathwayGrid
        title={"Class Pathways"}
        classroomId={classroomId}
      />
    </div>
  );
}
