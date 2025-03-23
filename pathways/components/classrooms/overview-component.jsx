import { useState, useEffect } from "react";
import { Users, BookOpen, BarChart2 } from "lucide-react";
import PathwayCard from "@/components/pathways/pathways-card";
import CreateRoadmapModal from "@/components/modals/CreateRoadmapModal";
import { useRouter } from "next/navigation";
import backendUrl from "@/backendUrl";

export default function OverviewComponent({ classroomCode }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));


  const mockPathways = [
    { id: 1, title: "Algebra Fundamentals", progress: 75, chapters: 10 },
    { id: 2, title: "Introduction to Programming", progress: 45, chapters: 8 },
    { id: 3, title: "Physics Mechanics", progress: 20, chapters: 12 },
    { id: 4, title: "Chemistry Basics", progress: 60, chapters: 9 },
    { id: 5, title: "Biology Essentials", progress: 50, chapters: 7 },
  ];

  const stats = [
    {
      label: "Total Students",
      value: 24,
      icon: Users,
      bg: "bg-blue-100",
      text: "text-blue-700",
    },
    {
      label: "Total Pathways",
      value: mockPathways.length,
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
  ];


  const createRoadmap = async (data) => {
      try {
          const res = await fetch(`${backendUrl}/generate-roadmap/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
          });

          const ret = await res.json();
          console.log("ret", ret);


      } catch (error){
          console.error("Failed to create roadmap", error);
      }
  }

  const handleCreateNewPathway = () => setShowModal(true);

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
          onClick={handleCreateNewPathway}
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:bg-amber-100 cursor-pointer transition"
        >
          <p className="text-sm md:text-base font-medium text-gray-600">
            + Create a new learning pathway
          </p>
        </button>

        {/* Actual Pathway Cards */}
        {mockPathways.map((pathway) => (
          <PathwayCard
            key={pathway.id}
            title={pathway.title}
            progress={pathway.progress}
            chapters={pathway.chapters}
            onViewClick={() => router.push(`/pathways/${pathway.id}`)}
          />
        ))}
      </div>

      {/* Create Modal */}
      <CreateRoadmapModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={async (newRoadmap) => {
          await createRoadmap(newRoadmap);
          setShowModal(false);
        }}
        user={user}
        classroomCode={classroomCode}

      />
    </div>
  );
}
