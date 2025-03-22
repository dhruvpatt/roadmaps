
import Navbar from "@/components/navbar"
import Sidebar from "@/components/sidebar"
import ClassroomHeader from "@/components/classrooms/classroom-header"
import ClassroomTabs from "@/components/classrooms/classroom-tabs"

const Classroom = () => {


    return (
        <div className="flex flex-col bg-gray-100 min-h-screen">
            <Navbar />
            <div className="flex flex-1">
                <Sidebar />
                <div className="flex-1 px-6 md:px-12 py-8 bg-gray-100 overflow-y-auto">
                    <div className="max-w-6xl mx-auto">
                        {/* Classroom Header Component */}
                        <ClassroomHeader
                        title="Algebra 101"
                        subtitle="Fundamental algebraic concepts for beginners"
                        code="ALGEBRA-101"
                        onInviteClick={() => setShowInviteModal(true)}
                        />

                        {/* You can continue your page content here */}
                        {/* ... */}
                        <ClassroomTabs />
                    </div>
            </div>
            </div>
        </div>
    )
}

export default Classroom;