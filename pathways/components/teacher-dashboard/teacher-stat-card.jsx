import React from "react";

/**
 * Renders a single teacher stat card with:
 * - A title (e.g., "Active Classrooms")
 * - A main value (e.g., "4")
 * - A subtext (e.g., "2 classes today")
 * - An optional icon
 */
export default function TeacherStat({ title, value, subtext, Icon }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-transparent flex flex-col h-full">
      {/* Top row: Title + optional Icon */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-600">{title}</h3>
        {Icon && <Icon className="w-5 h-5 text-amber-600" />}
      </div>

      {/* Main value */}
      <p className="text-3xl font-bold text-gray-900">{value}</p>

      {/* Subtext */}
      <p className="mt-auto text-sm text-gray-500">{subtext}</p>
    </div>
  );
}
