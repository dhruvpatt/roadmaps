// DashboardCard.jsx
import React from "react";
import { useRouter } from "next/router";

export default function DashboardCard({ id, title, subtitle, progress, type, user, published, buttonText = "View", href }) {
  const router = useRouter();

  const handleClick = () => router.push(href || `/${type}/${id}`);

  return (
    <div className="relative w-full max-w-sm bg-white rounded-lg shadow-md border-t-4 border-amber-600 p-6">
      <div className="h-[56px] flex flex-col justify-center">
        <h3 className="text-xl font-extrabold text-gray-900 leading-tight line-clamp-2">{title}</h3>
      </div>
      {subtitle && <p className="text-md text-gray-500 mt-1">{subtitle}</p>}

      {type === "pathways" && user?.role === "student" && (
        <>
          <div className="mt-4 h-2 bg-gray-300 rounded-full overflow-hidden">
            <div className="h-full bg-amber-600" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-sm text-gray-600">{progress}% complete</p>
        </>
      )}

      {type === "pathways" && user?.role !== "student" && (
        <p className={`mt-4 text-sm ${published ? "text-green-500" : "text-red-500"}`}>
          {published ? "Published" : "Not Published"}
        </p>
      )}

      <button
        onClick={handleClick}
        className="mt-4 w-full bg-black text-white py-2 rounded-lg text-sm hover:bg-amber-600 transition-colors"
      >
        {buttonText}
      </button>
    </div>
  );
}
