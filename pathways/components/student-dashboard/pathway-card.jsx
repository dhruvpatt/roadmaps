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
    <div className="relative w-full max-w-sm bg-white rounded-lg shadow-md border-t-4 border-amber-600 p-6">
      {/* Title & Subtitle */}
      <div className="h-[56px] flex flex-col justify-center">
        <h3 className="text-xl font-extrabold text-gray-900 leading-tight line-clamp-2">
          {title}
        </h3>
      </div>
      <p className="text-md text-gray-500 mt-1">{subtitle}</p>

      {/* Progress Bar */}
      <div className="mt-4 h-2 bg-gray-300 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-600"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stats (Completion % & Hours Left) */}
      <div className="flex justify-between text-md text-gray-600 mt-2">
        <p className="font-medium">{progress}% complete</p>
        <p className="font-medium">{hoursLeft} hours left</p>
      </div>

      {/* Continue Button */}
      <button
        type="button"
        className="mt-4 w-full bg-black text-white py-3 text-lg font-bold rounded-lg hover:bg-amber-600 hover:border-amber-600 transition-colors"
      >
        Continue
      </button>
    </div>
  );
}
