import { useState } from "react";
import Sidebar from "../components/sidebar";
import Navbar from "../components/navbar";
import StudentStats from "@/components/student-dashboard/student-stats";
import ContinueLearning from "@/components/student-dashboard/continue-learning";
import YourClassrooms from "@/components/student-dashboard/classrooms";
import JoinClassroomCard from "@/components/student-dashboard/join-classroom-card";
import CreateClassroomModal from "@/components/modals/CreateClassroomModal";
import CreateRoadmapModal from "@/components/modals/CreateRoadmapModal";
import { Plus, BookOpenText, Map } from "lucide-react";

const Dashboard = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [showClassroomModal, setShowClassroomModal] = useState(false);
    const [showRoadmapModal, setShowRoadmapModal] = useState(false);

    return (
        <div className="flex flex-col bg-gray-100 min-h-screen">
            <Navbar />
            <div className="flex flex-1">
                <Sidebar />
                <div className="flex-1 p-16 relative">
                    <h1 className="text-black text-4xl font-bold">Welcome Back, Student</h1>
                    <p className="text-gray-600 text-2xl mb-8">Continue your learning journey</p>
                    <StudentStats />
                    <ContinueLearning />
                    <YourClassrooms />
                    <JoinClassroomCard />

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

                                    {/* Create Roadmap */}
                                    <div
                                        onClick={() => {
                                            setDrawerOpen(false);
                                            setShowRoadmapModal(true);
                                        }}
                                        className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-amber-50 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Map className="w-6 h-6 text-amber-700" />
                                            <div>
                                                <p className="text-sm font-semibold text-amber-900">Pathway</p>
                                                <p className="text-xs text-gray-500">Build a new roadmap</p>
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
                        onCreate={(data) => console.log("Classroom created:", data)}
                    />

                    <CreateRoadmapModal
                        isOpen={showRoadmapModal}
                        onClose={() => setShowRoadmapModal(false)}
                        onCreate={(data) => console.log("Roadmap created:", data)}
                    />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
