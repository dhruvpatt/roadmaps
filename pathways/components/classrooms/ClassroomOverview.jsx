import { useEffect, useState } from "react";
import { Users, BookOpen, BarChart2, CircleCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import backendUrl from "@backendUrl";
import PathwayGrid from "@components/pathways/PathwayGrid";
import ClassroomBoard from "@components/classrooms/ClassroomBoard";


export default function ClassroomOverview({ classroom=null }) {
  const router = useRouter();
  const [user, setUser] = useState({});
  const [stats, setStats] = useState([]);
  const [pathways, setPathways] = useState([]);
  const [pathwaysNumber, setPathwaysNumber] = useState(0);

  useEffect(() => {
    const usr = JSON.parse(localStorage.getItem("user"));
    if (!usr) {
      router.push("/login");
      return;
    }
    setUser(usr);
  }, []);

  useEffect(() => {
    if (!classroom?.id) return;

    setStats([
      {
        label: "Total Students",
        value: classroom?.students?.length || 0,
        icon: Users,
        bg: "bg-blue-100",
        text: "text-blue-700",
      },
      {
        label: "Total Pathways",
        value: pathwaysNumber,
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
  }, [pathwaysNumber, classroom]);


  const fetchClassroom = async (user, id) => {
    try {
      const res = await fetch(`${backendUrl}/api/classroom/${id}/`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const ret = await res.json();

      setClassroom(ret || {});
      setPathways(Array.isArray(ret.pathways) ? ret.pathways : []);


      const studentsCount = ret?.students?.length || 0;
      setStats((prev) =>
        prev.map((stat) =>
          stat.label === "Total Students"
            ? { ...stat, value: studentsCount }
            : stat
        )
      );


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
            className="bg-white p-5 rounded-lg shadow shadow-sm border border-gray-200 flex items-center"
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

      <ClassroomBoard />

      {classroom?.id ? (
        <PathwayGrid
          title={"Class Pathways"}
          classroom={classroom}
          updatePathwaysNumber={setPathwaysNumber}
        />
      ) : (
        <div className="text-center text-gray-500 text-sm">Loading classroom pathways...</div>
      )}
    </div>
  );

}
