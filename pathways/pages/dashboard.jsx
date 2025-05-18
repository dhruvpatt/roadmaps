import { useState, useEffect } from "react";
import { Plus, BookOpenText, Map } from "lucide-react";
import { useRouter } from "next/navigation";
import backendUrl from "@/backendUrl";
import emitter from "@/mitt";

import DashboardStats from "@/components/dashboard/DashboardStats";
import YourPathways from "@/components/dashboard/YourPathways";
import YourClassrooms from "@/components/dashboard/YourClassrooms";
import CreateClassroomModal from "@/components/modals/CreateClassroomModal";
import CreatePathwayModal from "@/components/modals/CreatePathwayModal";

const Dashboard = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [showPathwayModal, setShowPathwayModal] = useState(false);
  const router = useRouter();
  const [user, setUser] = useState({});

  useEffect(() => {
    const usr = JSON.parse(localStorage.getItem("user"));
    if (!usr) {
      router.push("/login");
    } else {
      setUser(usr);
    }
  }, []);

  const createPathway = async (data) => {
    try {
      const res = await fetch(`${backendUrl}/generate-pathway/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const ret = await res.json();
      return ret?.pathway;
    } catch (error) {
      console.error("Failed to create pathway", error);
    }
  };

  const createClassroom = async (data) => {
    try {
      const res = await fetch(`${backendUrl}/classroom/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const ret = await res.json();
      emitter.emit("update-classrooms");
    } catch (error) {
      console.error("Failed to create classroom", error);
    }
  };

  return (
    <>
      <div className="max-w-6xl w-full mx-auto px-4">
        <h1 className="text-black text-3xl md:text-4xl font-bold text-center md:text-left">
          Welcome Back {user.first_name}
        </h1>
        <p className="text-gray-600 text-lg md:text-2xl text-center md:text-left mb-6">
          {user.role === "student"
            ? "Continue your learning journey"
            : "Continue your teaching journey"}
        </p>

        <DashboardStats user={user} />
        <YourPathways />
        <YourClassrooms />
      </div>

      {/* Floating + Button */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-amber-600 hover:bg-amber-700 text-white rounded-full p-4 shadow-lg"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Slide-Out Drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-md p-6 pb-8 mx-auto shadow-xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-amber-800">Create New</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Create Classroom */}
              {user.role === "teacher" && (
                <div
                  onClick={() => {
                    setDrawerOpen(false);
                    setShowClassroomModal(true);
                  }}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-amber-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <BookOpenText className="w-6 h-6 text-amber-700" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Classroom</p>
                      <p className="text-xs text-gray-500">Set up a new classroom</p>
                    </div>
                  </div>
                </div>
              )}
              {user.role === "student" && (
                <div
                  onClick={() => {
                    setDrawerOpen(false);
                    router.push("/join-classroom");
                  }}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-amber-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <BookOpenText className="w-6 h-6 text-amber-700" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Classroom</p>
                      <p className="text-xs text-gray-500">Join a Classroom</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Create Pathway */}
              <div
                onClick={() => {
                  setDrawerOpen(false);
                  setShowPathwayModal(true);
                }}
                className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-amber-50 transition"
              >
                <div className="flex items-center gap-3">
                  <Map className="w-6 h-6 text-amber-700" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Pathway</p>
                    <p className="text-xs text-gray-500">Build a new Pathway</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popups */}
      <CreateClassroomModal
        isOpen={showClassroomModal}
        onClose={() => setShowClassroomModal(false)}
        onCreate={async (data) => await createClassroom(data)}
        user={user}
      />

      <CreatePathwayModal
        isOpen={showPathwayModal}
        onClose={() => setShowPathwayModal(false)}
        onCreate={async (data) => await createPathway(data)}
        user={user}
      />
    </>
  );
};

export default Dashboard;