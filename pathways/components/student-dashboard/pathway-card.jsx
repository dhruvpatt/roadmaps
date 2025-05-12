import React from "react";
import { useRouter } from "next/router";

/**
 * Renders a pathway card with a title, subtitle, progress bar (for students),
 * published status (for teachers), and a continue button that navigates
 * to the pathway detail page using Next.js router.
 *
 * @param {string|number} id       - The unique identifier for the pathway
 * @param {string} title           - The pathway title
 * @param {string} subtitle        - The pathway subtitle or description
 * @param {number} progress        - Completion percentage (0–100)
 * @param {boolean} published      - Published status (for teacher view)
 * @param {{role: string}} user    - Current user object with `role` property
 */
export default function PathwayCard({ id, title, subtitle, progress, published, user }) {
  const router = useRouter();

  const handleContinue = () => {
    // Navigate to the Next.js dynamic route for this pathway
    router.push(`/pathways/${id}`);
  };

  return (
    <div className="relative w-full max-w-sm bg-white rounded-lg shadow-md border-t-4 border-amber-600 p-6">
      {/* Title & Subtitle */}
      <div className="h-[56px] flex flex-col justify-center">
        <h3 className="text-xl font-extrabold text-gray-900 leading-tight line-clamp-2">
          {title}
        </h3>
      </div>
      <p className="text-md text-gray-500 mt-1">{subtitle}</p>

      {/* Student Progress or Teacher Published Status */}
      {user.role === "student" ? (
        <>
          <div className="mt-4 h-2 bg-gray-300 rounded-full overflow-hidden">
            <div className="h-full bg-amber-600" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-md text-gray-600 mt-2">
            <p className="font-medium">{progress}% complete</p>
          </div>
        </>
      ) : (
        <div className="mt-4">
          {published ? (
            <p className="text-green-500">Published</p>
          ) : (
            <p className="text-red-500">Not Published</p>
          )}
        </div>
      )}

      {/* Continue Button */}
      <button
        type="button"
        onClick={handleContinue}
        className="mt-4 w-full bg-black text-white py-3 text-lg font-bold rounded-lg hover:bg-amber-600 hover:border-amber-600 transition-colors"
      >
        Continue
      </button>
    </div>
  );
}
