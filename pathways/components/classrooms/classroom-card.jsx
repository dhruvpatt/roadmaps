import React, { useState, useRef, useEffect } from "react"
import { MoreHorizontal, Users, Calendar, Clock } from "lucide-react"

/**
 * Renders a classroom card with:
 * - A title
 * - A subtitle/description
 * - A students count
 * - A schedule
 * - Last active info
 * - A 'More' icon button
 * - A 'View Classroom' button
 */
export default function ClassroomCard({
  title,
  subtitle,
  students,
  onMoreClick,
  onViewClick,
  onDelete
}) {

  const [menuOpen, setMenuOpen] = useState(false)
  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const menuRef = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [menuOpen])

  return (
    <div className="relative bg-white p-6 border border-gray-200 rounded-lg shadow-md flex flex-col">
      {/* Top Row: Title + More Options */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <button
            type="button"
            onClick={() => {
              setMenuOpen((prev) => !prev)
              onMoreClick?.()
            }}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
          <MoreHorizontal className="w-5 h-5" />
        </button>
        {menuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 mt-4 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
            >
              <button
                type="button"
                onClick={() => {
                  onDelete?.()
                  setMenuOpen(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Delete
              </button>
            </div>
          )}
      </div>

      {/* Subtitle / Description */}
      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
        Classroom Code: {subtitle}
      </p>

      {/* Students */}
      <div className="flex items-center text-sm text-gray-700 mb-2">
        <Users className="w-4 h-4 mr-1" />
        <span>{students} students</span>
      </div>

      <div
      className="mb-12"
      ></div>

      {/* Schedule */}
      {/* <div className="flex items-center text-sm text-gray-700 mb-2">
        <Calendar className="w-4 h-4 mr-1" />
        <span>{schedule}</span>
      </div> */}

      {/* Last active */}
      {/* <div className="flex items-center text-sm text-gray-700 mb-4">
        <Clock className="w-4 h-4 mr-1" />
        <span>Last active: {lastActive}</span>
      </div> */}

      {/* Button */}
      <button
        type="button"
        onClick={onViewClick}
        className="mt-auto w-full bg-black text-white py-2 rounded focus:outline-none hover:bg-amber-600 transition-colors"
      >
        View Classroom
      </button>
    </div>
  )
}
