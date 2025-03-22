import React from "react";

/**
 * Renders a course card with a title, subtitle, progress bar, stats, and a button.
 *
 * @param {string} title       - The main title (e.g., "Algebra Fundamentals")
 * @param {string} subtitle    - A short description or subtitle (e.g., "Solving Equations")
 * @param {number} progress    - Completion percentage (0–100)
 * @param {number} hoursLeft   - Hours left for the course or pathway
 */
export default function PathwayCard({ title, subtitle, progress, hoursLeft }) {
  return (
    <div className="relative w-full max-w-sm bg-white rounded-lg shadow-md border-t-4 border-orange-500 p-6">
      {/* Title & Subtitle */}
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{subtitle}</p>

      {/* Progress Bar */}
      <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-black"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stats (Completion % & Hours Left) */}
      <div className="flex justify-between text-sm text-gray-700 mt-2">
        <p>{progress}% complete</p>
        <p>{hoursLeft} hours left</p>
      </div>

      {/* Continue Button */}
      <button
        type="button"
        className="mt-4 w-full bg-black text-white py-2 rounded hover:bg-gray-800"
      >
        Continue
      </button>
    </div>
  );
}
