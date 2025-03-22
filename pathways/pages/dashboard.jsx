import { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import Navbar from "../components/navbar";
import StudentStats from "@/components/student-dashboard/student-stats";
import ContinueLearning from "@/components/student-dashboard/continue-learning";
import YourClassrooms from "@/components/student-dashboard/classrooms";
import JoinClassroomCard from "@/components/student-dashboard/join-classroom-card";
import CreateClassroomModal from "@/components/modals/CreateClassroomModal";
import CreateRoadmapModal from "@/components/modals/CreateRoadmapModal";
import { Plus, BookOpenText, Map } from "lucide-react";
import {useRouter} from "next/navigation"
import TeacherStats from "@/components/teacher-dashboard/teacher-stats";
import backendUrl from "@/backendUrl"

const Dashboard = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [showClassroomModal, setShowClassroomModal] = useState(false);
    const [showRoadmapModal, setShowRoadmapModal] = useState(false);
    const [analytics, setAnalytics] = useState({})
    const router = useRouter();
    const [user, setUser] = useState({});
    const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);
    useEffect(() => {
        const usr = JSON.parse(localStorage.getItem("user"));
        console.log("user", usr);
        if (!user) {
            router.push("/login");
        }

        setUser(usr);

        fetchRoadmaps(usr);


        const fetchAnalytics = async () => {
            try {
                const endpoint = usr.role === "student"
                    ? `${backendUrl}/api/student-analytics/${usr.id}/`
                    : `${backendUrl}/api/teacher-analytics/${usr.id}/`;

                console.log("ENDPOINT", endpoint)
                const res = await fetch(endpoint);
                const data = await res.json();

                console.log("Analytics data:", data);
                setAnalytics(analytics)
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            }
        };

        fetchAnalytics();

    },[]);

    const fetchRoadmaps = async (usr) => {
        try {
            console.log('userid', usr.id);
            const res = await fetch(`${backendUrl}/get-user-roadmaps/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: usr.id }),
            })

            const ret = await res.json();
            console.log("Roadmaps", ret);
        } catch (error){

            console.error("Failed to fetch roadmaps", error);

        }
    }

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

    const createClassroom = async (data) => {
        try {
            const res = await fetch(`${backendUrl}/classroom/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })
        } catch (error){
            console.error("Failed to create classroom", error);
        }

    }

    return (
        <div className="flex flex-col bg-gray-100 min-h-screen w-full min-h-screen">
            <Navbar />
            <div className="flex flex-1 flex-col md:flex-row">
                <Sidebar className="hidden md:block w-64" />
                <div className="flex-1 p-4 md:p-16 relative max-w-7xl mx-auto w-full">
                    <h1 className="text-black text-3xl md:text-4xl font-bold text-center md:text-left">Welcome Back {user.first_name}</h1>
                    {user.role === "student" ? (<p className="text-gray-600 text-lg md:text-2xl text-center md:text-left mb-6">Continue your learning journey</p>):
                    (<p className="text-gray-600 text-lg md:text-2xl text-center md:text-left mb-6">Continue your teaching journey</p>)
                    }

                    {user.role === "student" ? (<StudentStats />) : (<TeacherStats />)}
                    <ContinueLearning />
                    <YourClassrooms />

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
                        onCreate={async (data) => await createClassroom(data)}
                    />

                    <CreateRoadmapModal
                        isOpen={showRoadmapModal}
                        onClose={() => setShowRoadmapModal(false)}
                        onCreate={async (data) => await createRoadmap(data)}
                        user={user}
                    />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
