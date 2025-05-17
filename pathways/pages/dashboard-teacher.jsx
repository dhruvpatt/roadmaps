
import TeacherStats from "../components/teacher-dashboard/teacher-stats";
import ContinueLearning from "@/components/student-dashboard/YourPathways";
import YourClassrooms from "@/components/student-dashboard/YourClassrooms";
import JoinClassroomCard from "@/components/student-dashboard/join-classroom-card";

const DashboardTeacher = () => {
    return (


                    <div className="flex-1 p-16">
                        <h1 className="text-black text-4xl font-bold">Welcome Back, Teacher</h1>
                        <p className="text-gray-600 text-2xl mb-8">Continue your teaching journey</p>
                        <TeacherStats />
    
                        
                        <ContinueLearning />
                        <YourClassrooms />
                        <JoinClassroomCard />
                    </div>

)
}

export default DashboardTeacher;