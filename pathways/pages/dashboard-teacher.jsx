import Sidebar from "../components/sidebar";
import Navbar from "../components/navbar";
import TeacherStats from "../components/teacher-dashboard/teacher-stats";
import ContinueLearning from "@/components/student-dashboard/continue-learning";
import YourClassrooms from "@/components/student-dashboard/classrooms";
import JoinClassroomCard from "@/components/student-dashboard/join-classroom-card";

const DashboardTeacher = () => {
    return (

    
     <div className="flex flex-col bg-gray-100">
                <Navbar />
                <div className="flex flex-1">
                    <Sidebar />
                    <div className="flex-1 p-16">
                        <h1 className="text-black text-4xl font-bold">Welcome Back, Teacher</h1>
                        <p className="text-gray-600 text-2xl mb-8">Continue your teaching journey</p>
                        <TeacherStats />
    
                        
                        <ContinueLearning />
                        <YourClassrooms />
                        <JoinClassroomCard />
                    </div>
                    
                </div>
    
                
            </div>

)
}

export default DashboardTeacher;