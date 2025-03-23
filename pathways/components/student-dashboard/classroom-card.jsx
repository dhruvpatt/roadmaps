import React from "react";
import { useRouter } from "next/router";
export default function ClassroomCard({ id, title, teacher, nextClass, pendingAssignments }) {

  const router = useRouter();

  const handleViewClassroom = () => {
    router.push(`/classroom/${id}`);
  };
  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-96">
      {/* Title */}
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>

      {/* Teacher */}
      <p className="text-sm text-gray-700">Teacher: {teacher}</p>

      {/* Next class */}
      <p className="text-sm text-gray-700">Next class: {nextClass}</p>

      {/* Pending assignments */}
      <p className="text-sm text-gray-700">
        Pending assignments: {pendingAssignments}
      </p>

      {/* Button */}
      <button
        type="button"
        className="mt-3 w-full bg-black text-white py-2 rounded-lg text-sm hover:bg-amber-600 hover:border-amber-600 transition-colors"
        onClick={handleViewClassroom}
      >
        View Classroom
      </button>
    </div>
  );
}
