import React from "react";

export default function JoinClassroomCard() {
  return (
    <div className="border-2 border-dashed border-amber-200 rounded-lg p-6 text-center bg-white">
      <p className="text-black text-lg mb-4">
        Join a new classroom with a code
      </p>
      <button
        type="button"
        className="border border-black text-black rounded px-4 py-2 
                   hover:bg-black hover:text-white transition-colors"
      >
        Join Classroom
      </button>
    </div>
  );
}
