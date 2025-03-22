import Sidebar from "../components/sidebar";
import Navbar from "../components/navbar";
import StudentStats from "@/components/student-dashboard/student-stats";
const Dashboard = () => {
    return (
        <div className="flex flex-col bg-gray-100">
            <Navbar />
            <div className="flex flex-1">
                <Sidebar />
                <div className="flex-1 p-16">
                    <h1 className="text-black text-4xl font-bold">Welcome Back, Student</h1>
                    <p className="text-gray-600 text-2xl mb-8">Continue your learning journey</p>
                    <StudentStats />

                    <h2 className="text-black text-3xl font-black mt-8">Continue Learning</h2>
                </div>
                
            </div>

            
        </div>
    )

}

export default Dashboard;