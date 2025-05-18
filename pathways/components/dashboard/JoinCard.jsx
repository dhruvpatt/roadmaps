// JoinCard.jsx
import React from "react";
import { useRouter } from "next/navigation";

export default function JoinCard({ href = "/join-classroom", label = "Join a new classroom with a code", button = "Join Classroom" }) {
  const router = useRouter();

  return (
    <div className="border-2 border-dashed border-amber-200 rounded-lg p-6 text-center bg-white mt-8">
      <p className="text-black text-lg mb-4">{label}</p>
      <button
        className="border border-black text-black rounded px-4 py-2 hover:bg-black hover:text-white transition-colors"
        onClick={() => router.push(href)}
      >
        {button}
      </button>
    </div>
  );
}
