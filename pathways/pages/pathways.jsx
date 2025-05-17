import React from "react"

import PathwayCard from "@/components/pathways/pathways-card"
import { useRouter } from "next/navigation"
import CreatePathwayModal from "@/components/modals/CreatePathwayModal"
import { useState, useEffect } from "react"
import backendUrl from "@/backendUrl"

export default function Pathways() {
  const router = useRouter()
  const [showPathwayModal, setShowPathwayModal] = useState(false);
  const [user, setUser] = useState({});
  const [pathways, setPathways] = useState([]);

  useEffect(() => {
    const usr = JSON.parse(localStorage.getItem("user"));
    if (!usr) {
      router.push("/login");
    }
    setUser(usr);

    fetchPathways(usr);

  }, [])

  const fetchPathways = async (usr) => {

    try {
      const res = await fetch(`${backendUrl}/get-user-pathways/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: usr.id }),
      });
      const ret = await res.json();
      console.log("pathways", ret);
      setPathways(ret);
    } catch (error) {
      console.error("Failed to fetch pathways", error);
    }

  }
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

  const createPathway = async (data) => {
    try {
      const res = await fetch(`${backendUrl}/generate-pathway/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const ret = await res.json();
      console.log("ret", ret);

      return ret?.pathway;
    } catch (error) {
      console.error("Failed to create pathway", error);
    }
  }

  console.log("user", user);

  return (
    <>
      <div className="flex-1 p-6">
        <h1 className="text-black text-3xl md:text-4xl font-bold mb-2">
          Your Pathways
        </h1>
        <p className="text-gray-600 text-lg md:text-2xl mb-8">
          View and manage your personalized learning pathways
        </p>

        {/* Grid with "Create" first */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create Pathway Card FIRST */}
          <button
            onClick={() => {
              setShowPathwayModal(true);
            }}
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:bg-amber-100 cursor-pointer transition"
          >
            <p className="text-sm md:text-base font-medium text-gray-600">
              + Create a new learning pathway
            </p>
          </button>

          {/* Actual Pathway Cards */}
          {pathways.map((pathway) => (
            <PathwayCard
              key={pathway.id}
              title={pathway.title}
              progress={pathway.progress}
              chapters={Array.isArray(pathway.chapters) ? pathway.chapters.length : 0}
              onViewClick={() => router.push(`/pathways/${pathway.id}`)}
              user={user}
              published={pathway.published}
            />
          ))}
        </div>
        <CreatePathwayModal
          isOpen={showPathwayModal}
          onClose={() => setShowPathwayModal(false)}
          onCreate={async (data) => await createPathway(data)}
          user={user}
        />
      </div>
    </>
    )
}
