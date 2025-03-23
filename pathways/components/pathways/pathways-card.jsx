import React from "react"
import { MoreHorizontal } from "lucide-react"

export default function PathwayCard({
  title,
  progress = 0,
  chapters = 0,
  onMoreClick,
  onViewClick,
  user,
  published
}) {


  return (
    <div className="relative bg-white p-6 border border-gray-200 rounded-lg shadow-md flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {onMoreClick && (
          <button
            onClick={onMoreClick}
            className="text-gray-400 hover:text-amber-600 focus:outline-none"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Progress */}
      {/* <div className="mb-3">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-black transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-sm text-gray-500">{progress}% complete</p>
      </div> */}
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
        // fill in for teacher or other roles
        <div>
          {published ? (
            <p className="text-green-500">Published</p>): (<p className="text-red-500">Not Published</p>)}
        </div>
      )}

      {/* Chapters */}
      <p className="text-sm text-gray-700 mb-4">
        {chapters} {chapters === 1 ? "chapter" : "chapters"}
      </p>

      {/* View Button */}
      {onViewClick && (
        <button
          onClick={onViewClick}
          className="mt-auto w-full bg-black text-white py-2 rounded hover:bg-amber-600 transition-colors"
        >
          View Pathway
        </button>
      )}
    </div>
  )
}
