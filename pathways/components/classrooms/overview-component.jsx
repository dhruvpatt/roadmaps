// // // import { useState, useEffect } from "react";
// // // import { Users, BookOpen, BarChart2 } from "lucide-react";
// // // import PathwayCard from "@/components/pathways/pathways-card";
// // // import CreateRoadmapModal from "@/components/modals/CreateRoadmapModal";
// // // import { useRouter } from "next/navigation";
// // // import backendUrl from "@/backendUrl";

// // // export default function OverviewComponent({ classroomCode, classroomId }) {
// // //   const router = useRouter();
// // //   const [showRoadmapModal, setShowRoadmapModal] = useState(false);
// // //   const [user, setUser] = useState({});
// // //   const [classroom, setClassroom] = useState({});
// // //   const [stats, setStats] = useState([]);

// // //   useEffect(() => {
// // //     const usr = JSON.parse(localStorage.getItem("user"));
// // //     if (!usr){
// // //       router.push("/login")
// // //     }
// // //     setUser(usr);
// // //     fetchClassroom(usr, classroomId);
    
// // //   }, [stats])
  
// // //   const fetchClassroom = async (user, id) => {
// // //           try {
// // //               console.log("Fetching classroom", id);
// // //               const res = await fetch(`${backendUrl}/get-classroom/`, {
// // //                   method: "POST",
// // //                   headers: {
// // //                       "Content-Type": "application/json",
// // //                   },
// // //                   body: JSON.stringify({ classroom_id: id, user_id: user.id }),
// // //               });
  
// // //               const ret = await res.json();
// // //               console.log("Classroom", ret);
// // //               setClassroom(ret);
// // //               const stat = [
// // //               {
// // //                 label: "Total Students",
// // //                 value: ret.students.length,
// // //                 icon: Users,
// // //                 bg: "bg-blue-100",
// // //                 text: "text-blue-700",
// // //               },
// // //               {
// // //                 label: "Total Pathways",
// // //                 value: ret.subjects.length,
// // //                 icon: BookOpen,
// // //                 bg: "bg-green-100",
// // //                 text: "text-green-700",
// // //               },
// // //               {
// // //                 label: "Average Grade",
// // //                 value: "87%",
// // //                 icon: BarChart2,
// // //                 bg: "bg-amber-100",
// // //                 text: "text-amber-700",
// // //               },
// // //             ];
// // //             setStats(stat)
  
// // //           } catch (error){
// // //               console.error("Failed to fetch classroom", error);
// // //           }
  
// // //       }

// // //   const mockPathways = [
// // //     { id: 1, title: "Algebra Fundamentals", progress: 75, chapters: 10 },
// // //     { id: 2, title: "Introduction to Programming", progress: 45, chapters: 8 },
// // //     { id: 3, title: "Physics Mechanics", progress: 20, chapters: 12 },
// // //     { id: 4, title: "Chemistry Basics", progress: 60, chapters: 9 },
// // //     { id: 5, title: "Biology Essentials", progress: 50, chapters: 7 },
// // //   ];



// // //   const createRoadmap = async (data) => {
// // //       try {
// // //           const res = await fetch(`${backendUrl}/generate-roadmap/`, {
// // //               method: "POST",
// // //               headers: { "Content-Type": "application/json" },
// // //               body: JSON.stringify(data),
// // //           });

// // //           const ret = await res.json();
// // //           console.log("ret", ret);

// // //           return ret?.roadmap;
// // //       } catch (error){
// // //           console.error("Failed to create roadmap", error);
// // //       }
// // //   }

// // //   const handleCreateNewPathway = () => setShowModal(true);

// // //   return (
// // //     <div className="space-y-10">
// // //       {/* Overview Stats */}
// // //       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
// // //         {stats.map(({ label, value, icon: Icon, bg, text }, i) => (
// // //           <div
// // //             key={i}
// // //             className="bg-white p-5 rounded-lg shadow border border-gray-200 flex items-center"
// // //           >
// // //             <div className={`p-3 rounded-full ${bg} ${text} mr-4`}>
// // //               <Icon className="w-5 h-5" />
// // //             </div>
// // //             <div>
// // //               <p className="text-sm text-gray-500 font-medium">{label}</p>
// // //               <p className="text-xl font-bold text-gray-900">{value}</p>
// // //             </div>
// // //           </div>
// // //         ))}
// // //       </div>

// // //       {/* Pathways Grid */}
// // //       <h1 className="text-2xl text-black font-bold ml-4">Your Pathways</h1>
// // //       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
// // //         {/* Create Pathway Card FIRST */}
// // //         <button
// // //           onClick={() => {
// // //             setShowRoadmapModal(true);
// // //         }}
// // //           className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:bg-amber-100 cursor-pointer transition"
// // //         >
// // //           <p className="text-sm md:text-base font-medium text-gray-600">
// // //             + Create a new learning pathway
// // //           </p>
// // //         </button>

// // //         {/* Actual Pathway Cards */}
// // //         {mockPathways.map((pathway) => (
// // //           <PathwayCard
// // //             key={pathway.id}
// // //             title={pathway.title}
// // //             progress={pathway.progress}
// // //             chapters={pathway.chapters}
// // //             onViewClick={() => router.push(`/pathways/${pathway.id}`)}
// // //             user={user}
// // //           />
// // //         ))}
// // //       </div>

// // //       {/* Create Modal */}
// // //       <CreateRoadmapModal
// // //           isOpen={showRoadmapModal}
// // //           onClose={() => setShowRoadmapModal(false)}
// // //           onCreate={async (data) => await createRoadmap(data)}
// // //           user={user}
// // //       />
// // //     </div>
// // //   );
// // // }
// // import { useState, useEffect } from "react";
// // import { Users, BookOpen, BarChart2 } from "lucide-react";
// // import PathwayCard from "@/components/pathways/pathways-card";
// // import CreateRoadmapModal from "@/components/modals/CreateRoadmapModal";
// // import { useRouter } from "next/navigation";
// // import backendUrl from "@/backendUrl";

// // export default function OverviewComponent({ classroomCode, classroomId }) {
// //   const router = useRouter();
// //   const [showRoadmapModal, setShowRoadmapModal] = useState(false);
// //   const [user, setUser] = useState({});
// //   const [classroom, setClassroom] = useState({});
// //   const [stats, setStats] = useState([]);
// //   const [pathways, setPathways] = useState([]);

// //   useEffect(() => {
// //     const usr = JSON.parse(localStorage.getItem("user"));
// //     if (!usr) {
// //       router.push("/login");
// //       return;
// //     }
// //     setUser(usr);
// //     fetchClassroom(usr, classroomId);
// //   }, []); // Only run once on mount

// //   const fetchClassroom = async (user, id) => {
// //     try {
// //       console.log("Fetching classroom", id);
// //       const res = await fetch(`${backendUrl}/get-classroom/`, {
// //         method: "POST",
// //         headers: {
// //           "Content-Type": "application/json",
// //         },
// //         body: JSON.stringify({ classroom_id: id, user_id: user.id }),
// //       });

// //       const ret = await res.json();
// //       console.log("Classroom", ret);
// //       setClassroom(ret);

// //       const studentsCount = Array.isArray(ret.students) ? ret.students.length : 0;
// //       const pathwaysCount = Array.isArray(ret.subjects) ? ret.subjects.length : 0;

// //       const stat = [
// //         {
// //           label: "Total Students",
// //           value: studentsCount,
// //           icon: Users,
// //           bg: "bg-blue-100",
// //           text: "text-blue-700",
// //         },
// //         {
// //           label: "Total Pathways",
// //           value: pathwaysCount,
// //           icon: BookOpen,
// //           bg: "bg-green-100",
// //           text: "text-green-700",
// //         },
// //         {
// //           label: "Average Grade",
// //           value: "87%",
// //           icon: BarChart2,
// //           bg: "bg-amber-100",
// //           text: "text-amber-700",
// //         },
// //       ];
// //       setStats(stat);
// //       setPathways(ret.subjects);
// //     } catch (error) {
// //       console.error("Failed to fetch classroom", error);
// //     }
// //   };

// //   const mockPathways = [
// //     { id: 1, title: "Algebra Fundamentals", progress: 75, chapters: 10 },
// //     { id: 2, title: "Introduction to Programming", progress: 45, chapters: 8 },
// //     { id: 3, title: "Physics Mechanics", progress: 20, chapters: 12 },
// //     { id: 4, title: "Chemistry Basics", progress: 60, chapters: 9 },
// //     { id: 5, title: "Biology Essentials", progress: 50, chapters: 7 },
// //   ];

// //   const createRoadmap = async (data) => {
// //     try {
// //       const res = await fetch(`${backendUrl}/generate-roadmap/`, {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify(data),
// //       });

// //       const ret = await res.json();
// //       console.log("ret", ret);

// //       return ret?.roadmap;
// //     } catch (error) {
// //       console.error("Failed to create roadmap", error);
// //     }
// //   };

// //   return (
// //     <div className="space-y-10">
// //       {/* Overview Stats */}
// //       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
// //         {stats.map(({ label, value, icon: Icon, bg, text }, i) => (
// //           <div
// //             key={i}
// //             className="bg-white p-5 rounded-lg shadow border border-gray-200 flex items-center"
// //           >
// //             <div className={`p-3 rounded-full ${bg} ${text} mr-4`}>
// //               <Icon className="w-5 h-5" />
// //             </div>
// //             <div>
// //               <p className="text-sm text-gray-500 font-medium">{label}</p>
// //               <p className="text-xl font-bold text-gray-900">{value}</p>
// //             </div>
// //           </div>
// //         ))}
// //       </div>

// //       {/* Pathways Grid */}
// //       <h1 className="text-2xl text-black font-bold ml-4">Your Pathways</h1>
// //       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
// //         {/* Create Pathway Card FIRST */}
// //         <button
// //           onClick={() => {
// //             setShowRoadmapModal(true);
// //           }}
// //           className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:bg-amber-100 cursor-pointer transition"
// //         >
// //           <p className="text-sm md:text-base font-medium text-gray-600">
// //             + Create a new learning pathway
// //           </p>
// //         </button>

// //         {/* Actual Pathway Cards */}
// //         {pathways.map((pathway) => (
// //           <PathwayCard
// //             key={pathway.id}
// //             title={pathway.title}
// //             progress={pathway.progress}
// //             chapters={pathway.chapters}
// //             onViewClick={() => router.push(`/pathways/${pathway.id}`)}
// //             user={user}
// //           />
// //         ))}
// //       </div>

// //       {/* Create Modal */}
// //       <CreateRoadmapModal
// //         isOpen={showRoadmapModal}
// //         onClose={() => setShowRoadmapModal(false)}
// //         onCreate={async (data) => await createRoadmap(data)}
// //         user={user}
// //       />
// //     </div>
// //   );
// // }

// import { useState, useEffect } from "react";
// import { Users, BookOpen, BarChart2 } from "lucide-react";
// import PathwayCard from "@/components/pathways/pathways-card";
// import CreateRoadmapModal from "@/components/modals/CreateRoadmapModal";
// import { useRouter } from "next/navigation";
// import backendUrl from "@/backendUrl";

// export default function OverviewComponent({ classroomCode, classroomId }) {
//   const router = useRouter();
//   const [showRoadmapModal, setShowRoadmapModal] = useState(false);
//   const [user, setUser] = useState({});
//   const [classroom, setClassroom] = useState({});
//   const [stats, setStats] = useState([]);
//   const [pathways, setPathways] = useState([]); // Always an array

//   useEffect(() => {
//     const usr = JSON.parse(localStorage.getItem("user"));
//     if (!usr) {
//       router.push("/login");
//       return;
//     }
//     setUser(usr);
//     fetchClassroom(usr, classroomId);
//   }, []);

//   const fetchClassroom = async (user, id) => {
//     try {
//       console.log("Fetching classroom", id);
//       const res = await fetch(`${backendUrl}/get-classroom/`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ classroom_id: id, user_id: user.id }),
//       });

//       const ret = await res.json();
//       console.log("Classroom", ret);
//       setClassroom(ret.classroom);
//       setPathways(ret.roadmaps);

//       const studentsCount = Array.isArray(ret.students) ? ret.students.length : 0;
//       const subjects = Array.isArray(ret.roadmaps) ? ret.roadmaps : [];

//       const stat = [
//         {
//           label: "Total Students",
//           value: studentsCount,
//           icon: Users,
//           bg: "bg-blue-100",
//           text: "text-blue-700",
//         },
//         {
//           label: "Total Pathways",
//           value: subjects.length,
//           icon: BookOpen,
//           bg: "bg-green-100",
//           text: "text-green-700",
//         },
//         {
//           label: "Average Grade",
//           value: "87%", // You can calculate this dynamically if needed
//           icon: BarChart2,
//           bg: "bg-amber-100",
//           text: "text-amber-700",
//         },
//       ];
//       setStats(stat);
//     } catch (error) {
//       console.error("Failed to fetch classroom", error);
//       setPathways([]); // Fallback to prevent map error
//     }
//   };

//   const createRoadmap = async (data) => {
//     try {

//       console.log("data", data)
//       const res = await fetch(`${backendUrl}/generate-roadmap/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data),
//       });

//       const ret = await res.json();
//       console.log("ret", ret);
//       return ret?.roadmap;
//     } catch (error) {
//       console.error("Failed to create roadmap", error);
//     }
//   };

//   return (
//     <div className="space-y-10">
//       {/* Overview Stats */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//         {stats.map(({ label, value, icon: Icon, bg, text }, i) => (
//           <div
//             key={i}
//             className="bg-white p-5 rounded-lg shadow border border-gray-200 flex items-center"
//           >
//             <div className={`p-3 rounded-full ${bg} ${text} mr-4`}>
//               <Icon className="w-5 h-5" />
//             </div>
//             <div>
//               <p className="text-sm text-gray-500 font-medium">{label}</p>
//               <p className="text-xl font-bold text-gray-900">{value}</p>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Pathways Grid */}
//       <h1 className="text-2xl text-black font-bold ml-4">Your Pathways</h1>
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//         {/* Create Pathway Card FIRST */}
//         <button
//           onClick={() => setShowRoadmapModal(true)}
//           className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:bg-amber-100 cursor-pointer transition"
//         >
//           <p className="text-sm md:text-base font-medium text-gray-600">
//             + Create a new learning pathway
//           </p>
//         </button>

//         {/* Actual Pathway Cards */}
//         {pathways.map((pathway) => (
//           <PathwayCard
//             key={pathway.id}
//             title={pathway.title || "Untitled Pathway"}
//             progress={pathway.progress || 0}
//             chapters={pathway.chapters || 0}
//             onViewClick={() => router.push(`/pathways/${pathway.id}`)}
//             user={user}
//           />
//         ))}
//       </div>

//       {/* Create Modal */}
//       <CreateRoadmapModal
//         isOpen={showRoadmapModal}
//         onClose={() => setShowRoadmapModal(false)}
//         onCreate={async (data) => await createRoadmap(data)}
//         user={user}
//         classroomCode={classroomCode}
//       />
//     </div>
//   );
// }
// import { useState, useEffect } from "react";
// import { Users, BookOpen, BarChart2 } from "lucide-react";
// import PathwayCard from "@/components/pathways/pathways-card";
// import CreateRoadmapModal from "@/components/modals/CreateRoadmapModal";
// import { useRouter } from "next/navigation";
// import backendUrl from "@/backendUrl";

// export default function OverviewComponent({ classroomCode, classroomId }) {
//   const router = useRouter();
//   const [showRoadmapModal, setShowRoadmapModal] = useState(false);
//   const [user, setUser] = useState({});
//   const [classroom, setClassroom] = useState({});
//   const [stats, setStats] = useState([]);
//   const [pathways, setPathways] = useState([]);

//   useEffect(() => {
//     const usr = JSON.parse(localStorage.getItem("user"));
//     if (!usr) {
//       router.push("/login");
//       return;
//     }
//     setUser(usr);
//     fetchClassroom(usr, classroomId);
//   }, []);

//   const fetchClassroom = async (user, id) => {
//     try {
//       console.log("Fetching classroom", id);
//       const res = await fetch(`${backendUrl}/get-classroom/`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ classroom_id: id, user_id: user.id }),
//       });

//       const ret = await res.json();
//       console.log("Classroom", ret);

//       setClassroom(ret.classroom || {});
//       setPathways(Array.isArray(ret.roadmaps) ? ret.roadmaps : []);

//       const studentsCount = Array.isArray(ret.students) ? ret.students.length : 0;
//       const roadmapCount = Array.isArray(ret.roadmaps) ? ret.roadmaps.length : 0;

//       const stat = [
//         {
//           label: "Total Students",
//           value: studentsCount,
//           icon: Users,
//           bg: "bg-blue-100",
//           text: "text-blue-700",
//         },
//         {
//           label: "Total Pathways",
//           value: roadmapCount,
//           icon: BookOpen,
//           bg: "bg-green-100",
//           text: "text-green-700",
//         },
//         {
//           label: "Average Grade",
//           value: "87%", // Replace with dynamic value if needed
//           icon: BarChart2,
//           bg: "bg-amber-100",
//           text: "text-amber-700",
//         },
//       ];
//       setStats(stat);
//     } catch (error) {
//       console.error("Failed to fetch classroom", error);
//       setPathways([]); // Safe fallback
//     }
//   };

//   const createRoadmap = async (data) => {
//     try {
//       console.log("data", data);
//       const res = await fetch(`${backendUrl}/generate-roadmap/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data),
//       });

//       const ret = await res.json();
//       console.log("ret", ret);
//       return ret?.roadmap;
//     } catch (error) {
//       console.error("Failed to create roadmap", error);
//     }
//   };

//   return (
//     <div className="space-y-10">
//       {/* Overview Stats */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//         {stats.map(({ label, value, icon: Icon, bg, text }, i) => (
//           <div
//             key={i}
//             className="bg-white p-5 rounded-lg shadow border border-gray-200 flex items-center"
//           >
//             <div className={`p-3 rounded-full ${bg} ${text} mr-4`}>
//               <Icon className="w-5 h-5" />
//             </div>
//             <div>
//               <p className="text-sm text-gray-500 font-medium">{label}</p>
//               <p className="text-xl font-bold text-gray-900">{value}</p>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Pathways Grid */}
//       <h1 className="text-2xl text-black font-bold ml-4">Your Pathways</h1>
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//         {/* Create Pathway Card FIRST */}
//         <button
//           onClick={() => setShowRoadmapModal(true)}
//           className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:bg-amber-100 cursor-pointer transition"
//         >
//           <p className="text-sm md:text-base font-medium text-gray-600">
//             + Create a new learning pathway
//           </p>
//         </button>

//         {/* Actual Pathway Cards */}
//         {(pathways || []).map((pathway) => (
//           <PathwayCard
//             key={pathway.id}
//             title={pathway.title || "Untitled Pathway"}
//             progress={pathway.progress || 0}
//             chapters={pathway.chapters || 0}
//             onViewClick={() => router.push(`/pathways/${pathway.id}`)}
//             user={user}
//           />
//         ))}
//       </div>

//       {/* Create Modal */}
//       <CreateRoadmapModal
//         isOpen={showRoadmapModal}
//         onClose={() => setShowRoadmapModal(false)}
//         onCreate={async (data) => await createRoadmap(data)}
//         user={user}
//         classroomCode={classroomCode}
//       />
//     </div>
//   );
// }
import { useState, useEffect } from "react";
import { Users, BookOpen, BarChart2 } from "lucide-react";
import PathwayCard from "@/components/pathways/pathways-card";
import CreateRoadmapModal from "@/components/modals/CreateRoadmapModal";
import { useRouter } from "next/navigation";
import backendUrl from "@/backendUrl";

export default function OverviewComponent({ classroomCode, classroomId }) {
  const router = useRouter();
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [user, setUser] = useState({});
  const [classroom, setClassroom] = useState({});
  const [stats, setStats] = useState([]);
  const [pathways, setPathways] = useState([]);

  useEffect(() => {
    const usr = JSON.parse(localStorage.getItem("user"));
    if (!usr) {
      router.push("/login");
      return;
    }
    setUser(usr);
    fetchClassroom(usr, classroomId);
  }, []);

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
      console.log("Classroom response:", ret);

      setClassroom(ret.classroom || {});
      setPathways(Array.isArray(ret.roadmaps) ? ret.roadmaps : []);
      console.log("pathways", pathways);
      const studentsCount = Array.isArray(ret.classroom?.students)
        ? ret.classroom.students.length
        : 0;
      const roadmapCount = Array.isArray(ret.roadmaps) ? ret.roadmaps.length : 0;

      const stat = [
        {
          label: "Total Students",
          value: studentsCount,
          icon: Users,
          bg: "bg-blue-100",
          text: "text-blue-700",
        },
        {
          label: "Total Pathways",
          value: roadmapCount,
          icon: BookOpen,
          bg: "bg-green-100",
          text: "text-green-700",
        },
        {
          label: "Average Grade",
          value: "87%", // Replace with real logic if needed
          icon: BarChart2,
          bg: "bg-amber-100",
          text: "text-amber-700",
        },
      ];
      setStats(stat);
    } catch (error) {
      console.error("Failed to fetch classroom", error);
      setPathways([]);
    }
  };

  const createRoadmap = async (data) => {
    try {
      const res = await fetch(`${backendUrl}/generate-roadmap/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const ret = await res.json();
      console.log("Generated roadmap:", ret);
      return ret?.roadmap;
    } catch (error) {
      console.error("Failed to create roadmap", error);
    }
  };

  return (
    <div className="space-y-10">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map(({ label, value, icon: Icon, bg, text }, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-lg shadow border border-gray-200 flex items-center"
          >
            <div className={`p-3 rounded-full ${bg} ${text} mr-4`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pathways Grid */}
      <h1 className="text-2xl text-black font-bold ml-4">Your Pathways</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create Pathway Card FIRST */}
        <button
          onClick={() => setShowRoadmapModal(true)}
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:bg-amber-100 cursor-pointer transition"
        >
          <p className="text-sm md:text-base font-medium text-gray-600">
            + Create a new learning pathway
          </p>
        </button>

        {/* Actual Pathway Cards */}
        {(pathways || []).map((pathway) => (
          <PathwayCard
            key={pathway.id}
            title={pathway.title || "Untitled Pathway"}
            progress={pathway.progress || 0}
            chapters={pathway.chapters?.length || 0}
            onViewClick={() => router.push(`/pathways/${pathway.id}`)}
            user={user}
          />
        ))}
      </div>

      {/* Create Modal */}
      <CreateRoadmapModal
        isOpen={showRoadmapModal}
        onClose={() => setShowRoadmapModal(false)}
        onCreate={async (data) => await createRoadmap(data)}
        user={user}
        classroomCode={classroomCode}
      />
    </div>
  );
}
