
import Navbar from "@/components/navbar"
import Sidebar from "@/components/sidebar"
import ClassroomHeader from "@/components/classrooms/classroom-header"
import ClassroomTabs from "@/components/classrooms/classroom-tabs"
import ClassroomTabsStudent from "@/components/classrooms/classroom-tabs-student"
import { useState, useEffect } from "react"
import {useRouter} from "next/router"
import backendUrl from "@/backendUrl"
const Classroom = () => {

    const router = useRouter();
    const [role, setRole] = useState("");
    const [user, setUser] = useState({});
    const [classroomId, setClassroomId] = useState(null);
    const [classroomCode, setClassroomCode] = useState("");

    useEffect(() => {
        console.log("Router query", router.query);
        const { id } = router.query;
      
        if (!id) return; // wait until the id is available
      
        const usr = JSON.parse(localStorage.getItem("user"));
        if (!usr) {
          router.push("/login");
          return;
        }
      
        setUser(usr);
        setRole(usr.role);
        setClassroomId(id);
        console.log("Loaded classroom ID:", id);
        console.log("here", usr, id);
      
        fetchClassroom(usr, id);
      }, [router.query]);

    const fetchClassroom = async (user, id) => {
        try {
            console.log("Fetching classroom", id);
            const res = await fetch(`${backendUrl}/get-classroom/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ classroom_id: id, user_id: user.id }),
            });

            const ret = await res.json();
            console.log("Classroom", ret);
            setClassroomCode(ret.join_id);

        } catch (error){
            console.error("Failed to fetch classroom", error);
        }

    }


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
                        {role === "student" ? <ClassroomTabsStudent classroomCode={classroomCode} /> : <ClassroomTabs classroomCode={classroomCode} />}

                    </div>
            </div>
            </div>
        </div>
    )
}

export default Classroom;