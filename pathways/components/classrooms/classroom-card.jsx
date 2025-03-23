import React from "react"
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
}) {
  return (
    <div className="relative bg-white p-6 border border-gray-200 rounded-lg shadow-md flex flex-col">
      {/* Top Row: Title + More Options */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={onMoreClick}
          className="text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
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
        className="mt-auto w-full bg-black text-white py-2 rounded hover:bg-gray-800 focus:outline-none"
      >
        View Classroom
      </button>
    </div>
  )
}
