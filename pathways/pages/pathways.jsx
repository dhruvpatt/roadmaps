import React from "react"
import Navbar from "@/components/navbar"
import Sidebar from "@/components/sidebar"
import PathwayCard from "@/components/pathways/pathways-card"
import { useRouter } from "next/navigation"
import CreateRoadmapModal from "@/components/modals/CreateRoadmapModal"
import { useState } from "react"
import backendUrl from "@/backendUrl"

export default function Pathways() {
  const router = useRouter()
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const mockPathways = [
    {
      id: 1,
      title: "Algebra Fundamentals",
      progress: 75,
      chapters: 10,
    },
    {
      id: 2,
      title: "Introduction to Programming",
      progress: 45,
      chapters: 8,
    },
    {
      id: 3,
      title: "Physics Mechanics",
      progress: 20,
      chapters: 12,
    },
    {
      id: 4,
      title: "Chemistry Basics",
      progress: 60,
      chapters: 9,
    },
    {
      id: 5,
      title: "Biology Essentials",
      progress: 50,
      chapters: 7,
    },
  ]

  const createRoadmap = async (data) => {
      try {
          const res = await fetch(`${backendUrl}/generate-roadmap/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
          });

          const ret = await res.json();
          console.log("ret", ret);

          return ret?.roadmap;
      } catch (error){
          console.error("Failed to create roadmap", error);
      }
  }

  console.log("user", user);

  return (
    <div className="flex flex-col bg-gray-100 min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 p-6">
          <h1 className="text-black text-3xl md:text-4xl font-bold mb-2">
            Your Pathways
          </h1>
          <p className="text-gray-600 text-lg md:text-2xl mb-8">
            View and manage your personalized learning roadmaps
          </p>

          {/* Grid with "Create" first */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create Pathway Card FIRST */}
            <button
              onClick={() => {
                setShowRoadmapModal(true);
            }}
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
          <CreateRoadmapModal
              isOpen={showRoadmapModal}
              onClose={() => setShowRoadmapModal(false)}
              onCreate={async (data) => await createRoadmap(data)}
              user={user}
          />
        </div>
      </div>
    </div>
  )
}
