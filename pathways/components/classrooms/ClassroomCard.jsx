import React, { useState, useRef, useEffect } from "react"
import { MoreHorizontal, Users, Calendar, Clock } from "lucide-react"
import CardDropdownMenu from "@components/CardDropdownMenu"

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
  classroomId,
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
    <div className="relative bg-white p-6 shadow-sm border border-gray-200 rounded-lg shadow-md flex flex-col">
      {/* Top Row: Title + More Options */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <CardDropdownMenu
          trigger={
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={onMoreClick}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          }
          items={[
            {
              label: "Edit",
              onClick: () => {
                // implement edit handler if needed
              },
            },
            {
              label: "Delete",
              onClick: () => onDelete?.(classroomId),
              className: "text-red-600"
            }
          ]}
        />
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
