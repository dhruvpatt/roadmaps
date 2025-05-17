import { useState, useEffect } from "react";
import { Users, BookOpen, BarChart2 } from "lucide-react";
import PathwayCard from "@/components/pathways/pathways-card";
import CreatePathwayModal from "@/components/modals/CreatePathwayModal";
import { useRouter } from "next/navigation";
import backendUrl from "@/backendUrl";

export default function OverviewComponent({ classroomCode, classroomId }) {
  const router = useRouter();
  const [showPathwayModal, setShowPathwayModal] = useState(false);
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
    fetchClassroom(usr, classroomId);
  }, []);

  const fetchClassroom = async (user, id) => {
    try {
      console.log("Fetching classroom", id);
      const res = await fetch(`${backendUrl}/get-classroom/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ classroom_id: id, user_id: user.id }),
      });

      const ret = await res.json();
      console.log("Classroom response:", ret);

      setClassroom(ret.classroom || {});
      setPathways(Array.isArray(ret.pathways) ? ret.pathways : []);
      console.log("pathways", pathways);
      const studentsCount = Array.isArray(ret.classroom?.students)
        ? ret.classroom.students.length
        : 0;
      const pathwayCount = Array.isArray(ret.pathways) ? ret.pathways.length : 0;

      const stat = [
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
          value: "87%", // Replace with real logic if needed
          icon: BarChart2,
          bg: "bg-amber-100",
          text: "text-amber-700",
        },
      ];
      setStats(stat);
    } catch (error) {
      console.error("Failed to fetch classroom", error);
      setPathways([]);
    }
  };

  const createPathway = async (data) => {
    try {
      const res = await fetch(`${backendUrl}/generate-pathway/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const ret = await res.json();
      console.log("Generated pathway:", ret);
      return ret?.pathway;
    } catch (error) {
      console.error("Failed to create pathway", error);
    }
  };

  return (
    <div className="space-y-10">
      {/* Overview Stats */}
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

      {/* Pathways Grid */}
      <h1 className="text-2xl text-black font-bold ml-4">Your Pathways</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create Pathway Card FIRST */}
        <button
          onClick={() => setShowPathwayModal(true)}
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:bg-amber-100 cursor-pointer transition"
        >
          <p className="text-sm md:text-base font-medium text-gray-600">
            + Create a new learning pathway
          </p>
        </button>

        {/* Actual Pathway Cards */}
        {(pathways || []).map((pathway) => (
          <PathwayCard
            key={pathway.id}
            title={pathway.title || "Untitled Pathway"}
            progress={pathway.progress || 0}
            chapters={pathway.chapters?.length || 0}
            onViewClick={() => router.push(`/pathways/${pathway.id}`)}
            user={user}
          />
        ))}
      </div>

      {/* Create Modal */}
      <CreatePathwayModal
        isOpen={showPathwayModal}
        onClose={() => setShowPathwayModal(false)}
        onCreate={async (data) => await createPathway(data)}
        user={user}
        classroomCode={classroomCode}
      />
    </div>
  );
}
