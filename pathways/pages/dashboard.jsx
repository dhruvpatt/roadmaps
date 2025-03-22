import Sidebar from "../components/sidebar";
import Navbar from "../components/navbar";
import StudentStats from "@/components/student-dashboard/student-stats";
import ContinueLearning from "@/components/student-dashboard/continue-learning";
import YourClassrooms from "@/components/student-dashboard/classrooms";
import JoinClassroomCard from "@/components/student-dashboard/join-classroom-card";
const Dashboard = () => {
    return (
        <div className="flex flex-col bg-gray-100 w-full min-h-screen">
            <Navbar />
            <div className="flex flex-1 flex-col md:flex-row">
                <Sidebar className="hidden md:block w-64" />
                <div className="flex-1 p-4 md:p-16 max-w-7xl mx-auto w-full">
                    <h1 className="text-black text-3xl md:text-4xl font-bold text-center md:text-left">Welcome Back, Student</h1>
                    <p className="text-gray-600 text-lg md:text-2xl text-center md:text-left mb-6">Continue your learning journey</p>
                    <StudentStats />
                    <ContinueLearning />
                    <YourClassrooms />
                </div>
            </div>
        </div>
    )

}

export default Dashboard;