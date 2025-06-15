import React, { useEffect, useState, useRef } from "react";
import { MoreHorizontal } from "lucide-react";

export default function PathwayCard({
  title,
  progress = 0,
  chapters = 0,
  onMoreClick,
  onViewClick,
  onDelete,
  onEdit,
  published,
  pathwayId
}) {
  const [user, setUser] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const usr = JSON.parse(localStorage.getItem("user"));
    if (!usr) {
      router.push("/login");
    }
    setUser(usr);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="relative bg-white p-6 shadow-sm border border-gray-200 rounded-lg shadow-md flex flex-col">
      {/* Top row */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <div className="relative">
          <button
            onClick={() => {
              setMenuOpen(prev => !prev);
              onMoreClick?.();
            }}
            className="text-gray-400 hover:text-amber-600 focus:outline-none"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {menuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 top-5 mt-1 w-32 bg-white shadow-sm border border-gray-200 rounded-lg shadow-lg z-10"
            >
              <button
                type="button"
                onClick={() => {
                  onEdit?.(pathwayId);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete?.(pathwayId);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar (student) or status (teacher) */}
      {user.role === "student" ? (
        <>
          <div className="mt-4 h-2 bg-gray-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-600"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-md text-gray-600 mt-2">
            <p className="font-medium">{progress}% complete</p>
          </div>
        </>
      ) : (
        <div>
          {published ? (
            <p className="text-green-500">Published</p>
          ) : (
            <p className="text-red-500">Not Published</p>
          )}
        </div>
      )}

      {/* Chapters */}
      <p className="text-sm text-gray-700 mb-4">
        {chapters} {chapters === 1 ? "chapter" : "chapters"}
      </p>

      {/* View button */}
      {onViewClick && (
        <button
          onClick={onViewClick}
          className="mt-auto w-full bg-black text-white py-2 rounded hover:bg-amber-600 transition-colors"
        >
          View Pathway
        </button>
      )}
    </div>
  );
}
