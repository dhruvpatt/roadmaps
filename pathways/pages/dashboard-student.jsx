
import StudentStats from "@/components/student-dashboard/student-stats";
import ContinueLearning from "@/components/student-dashboard/YourPathways";
import YourClassrooms from "@/components/student-dashboard/YourClassrooms";
import JoinClassroomCard from "@/components/student-dashboard/join-classroom-card";
const DashboardStudent = () => {
    return (
                <div className="flex-1 p-16">
                    <h1 className="text-black text-4xl font-bold">Welcome Back, Student</h1>
                    <p className="text-gray-600 text-2xl mb-8">Continue your learning journey</p>
                    <StudentStats />

                    
                    <ContinueLearning />
                    <YourClassrooms />
                    <JoinClassroomCard />
                </div>
    )

}

export default DashboardStudent;