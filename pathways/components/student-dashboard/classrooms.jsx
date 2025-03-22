// import React, { useRef } from "react";
// import { ChevronLeft, ChevronRight } from "lucide-react";
// import ClassroomCard from "./classroom-card";
// import { useRouter } from "next/navigation";

// export default function YourClassrooms() {
//   const router = useRouter();
//   const handleClick = () => {
//     router.push("join-classroom");
//   }

//   const scrollRef = useRef(null);

//   // Mock data
//   const classrooms = [
//     { id: 1, title: "Algebra 101", teacher: "Mr. Johnson", nextClass: "Tomorrow, 10:00 AM", pendingAssignments: 2 },
//     { id: 2, title: "Computer Science Basics", teacher: "Ms. Williams", nextClass: "Wednesday, 2:00 PM", pendingAssignments: 1 },
//     { id: 3, title: "Physics Fundamentals", teacher: "Dr. Smith", nextClass: "Friday, 1:30 AM", pendingAssignments: 0 },
//     { id: 4, title: "History of Arts", teacher: "Mrs. Carter", nextClass: "Monday, 9:00 AM", pendingAssignments: 3 },
//     { id: 5, title: "Biology 101", teacher: "Dr. Greene", nextClass: "Thursday, 11:00 AM", pendingAssignments: 4 },
//     { id: 6, title: "Chemistry Basics", teacher: "Mr. Brown", nextClass: "Tuesday, 12:00 PM", pendingAssignments: 2 },
//     { id: 7, title: "English Literature", teacher: "Mrs. Davis", nextClass: "Friday, 3:00 PM", pendingAssignments: 1 },
//   ];

//   const scrollAmount = 320 * 4; // Scrolls 4 cards at a time

//   const scrollLeft = () => {
//     if (scrollRef.current) {
//       scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
//     }
//   };

//   const scrollRight = () => {
//     if (scrollRef.current) {
//       scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
//     }
//   };

//   return (
//     <div className="max-w-[1200px] mx-auto">
//       <div className="flex items-center justify-between mt-6 md:mt-8">
//         <h2 className="text-black text-2xl md:text-3xl font-black">Your Classrooms</h2>
//         <button
//           type="button"
//           className="border border-black text-white rounded px-4 py-2 bg-black
//                     hover:bg-amber-600 hover:border-amber-600 transition-colors"
//           onClick={handleClick}
//         >
//           Join Classroom
//         </button>
//       </div>
//       <div className="relative">
//         {/* Left Arrow */}
//         <button
//           onClick={scrollLeft}
//           className="hidden md:block absolute left-[-2rem] top-1/2 -translate-y-1/2 z-10
//                      bg-white p-2 rounded-full shadow hover:bg-gray-100 focus:outline-none"
//         >
//           <ChevronLeft />
//         </button>

//         {/* Scrollable Row */}
//         <div className="overflow-hidden">
//           <div
//             ref={scrollRef}
//             className="flex space-x-4 px-1 py-2 scroll-smooth"
//             style={{ width: "1300px", overflowX: "scroll", scrollBehavior: "smooth" }}
//           >
//             {classrooms.map((classroom) => (
//               <div 
//                 key={classroom.id} 
//                 className="w-[280px] flex-shrink-0 bg-white shadow-md rounded-xl p-4 border border-gray-200"
//               >
//                 <h3 className="font-bold text-lg">{classroom.title}</h3>
//                 <p className="text-gray-600 text-sm">Teacher: {classroom.teacher}</p>
//                 <p className="text-gray-500 text-xs">Next class: {classroom.nextClass}</p>
//                 <p className="text-gray-500 text-xs">
//                   Pending assignments: <span className="font-semibold">{classroom.pendingAssignments}</span>
//                 </p>

//                 {/* View Classroom Button */}
//                 <button className="mt-3 w-full bg-black text-white py-2 rounded-lg text-sm">
//                   View Classroom
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Right Arrow */}
//         <button
//           onClick={scrollRight}
//           className="hidden md:block absolute right-[-2rem] top-1/2 -translate-y-1/2 z-10
//                      bg-white p-2 rounded-full shadow hover:bg-gray-100 focus:outline-none"
//         >
//           <ChevronRight />
//         </button>
//       </div>
//     </div>
//   );
// }
import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function YourClassrooms() {
  const router = useRouter();
  const handleClick = () => {
    router.push("join-classroom");
  };

  const scrollRef = useRef(null);

  // Mock data
  const classrooms = [
    { id: 1, title: "Algebra 101", teacher: "Mr. Johnson", nextClass: "Tomorrow, 10:00 AM", pendingAssignments: 2 },
    { id: 2, title: "Computer Science Basics", teacher: "Ms. Williams", nextClass: "Wednesday, 2:00 PM", pendingAssignments: 1 },
    { id: 3, title: "Physics Fundamentals", teacher: "Dr. Smith", nextClass: "Friday, 1:30 AM", pendingAssignments: 0 },
    { id: 4, title: "History of Arts", teacher: "Mrs. Carter", nextClass: "Monday, 9:00 AM", pendingAssignments: 3 },
    { id: 5, title: "Biology 101", teacher: "Dr. Greene", nextClass: "Thursday, 11:00 AM", pendingAssignments: 4 },
    { id: 6, title: "Chemistry Basics", teacher: "Mr. Brown", nextClass: "Tuesday, 12:00 PM", pendingAssignments: 2 },
    { id: 7, title: "English Literature", teacher: "Mrs. Davis", nextClass: "Friday, 3:00 PM", pendingAssignments: 1 },
  ];

  // Scroll 4 cards at a time (280–320px each)
  const scrollAmount = 320 * 4;

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="mx-auto max-w-screen-xl px-4">
      {/* Header */}
      <div className="flex items-center justify-between mt-6 md:mt-8">
        <h2 className="text-black text-2xl md:text-3xl font-black">Your Classrooms</h2>
        <button
          type="button"
          className="border border-black text-white rounded px-4 py-2 bg-black
                     hover:bg-amber-600 hover:border-amber-600 transition-colors"
          onClick={handleClick}
        >
          Join Classroom
        </button>
      </div>

      {/* Carousel container */}
      <div className="relative mt-4">
        {/* Left Arrow (outside) */}
        <button
          onClick={scrollLeft}
          className="hidden md:block absolute -left-12 top-1/2 -translate-y-1/2 z-10
                     bg-white p-2 rounded-full shadow hover:bg-gray-100 focus:outline-none"
        >
          <ChevronLeft />
        </button>

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="w-full overflow-x-auto flex space-x-4 py-2 scroll-smooth"
        >
          {classrooms.map((classroom) => (
            <div 
              key={classroom.id} 
              className="w-[280px] flex-shrink-0 bg-white shadow-md rounded-xl p-4 border border-gray-200"
            >
              <h3 className="font-bold text-lg">{classroom.title}</h3>
              <p className="text-gray-600 text-sm">Teacher: {classroom.teacher}</p>
              <p className="text-gray-500 text-xs">Next class: {classroom.nextClass}</p>
              <p className="text-gray-500 text-xs">
                Pending assignments: <span className="font-semibold">{classroom.pendingAssignments}</span>
              </p>

              <button className="mt-3 w-full bg-black text-white py-2 rounded-lg text-sm hover:bg-amber-600 hover:border-amber-600 transition-colors">
                View Classroom
              </button>
            </div>
          ))}
        </div>

        {/* Right Arrow (outside) */}
        <button
          onClick={scrollRight}
          className="hidden md:block absolute -right-12 top-1/2 -translate-y-1/2 z-10
                     bg-white p-2 rounded-full shadow hover:bg-gray-100 focus:outline-none"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
