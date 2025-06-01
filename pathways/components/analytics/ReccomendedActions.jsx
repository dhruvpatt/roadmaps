import React from "react";

export default function RecommendedActions({title="Recommended Actions"}) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-inner space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-2">Struggles</h4>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Difficulty retaining terminology from molecular biology.</li>
            <li>Below average scores on conceptual assignments.</li>
            <li>Low engagement in week 1 and 2 check-ins.</li>
          </ul>
        </div>
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-2">Suggested Improvements</h4>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Reinforce key terms with flashcard reviews.</li>
            <li>Assign one-on-one tutoring for conceptual explanations.</li>
            <li>Use conversational LLM check-ins weekly to boost reflection.</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {[1, 2, 3].map((_, idx) => (
          <div
            key={idx}
            className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
          >
            <div className="text-yellow-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m2.121-4.379A9.004 9.004 0 0012 3a9.003 9.003 0 00-8.485 5.121A9.004 9.004 0 003 12c0 4.971 4.029 9 9 9s9-4.029 9-9a8.963 8.963 0 00-2.379-6.379z"
                />
              </svg>
            </div>
            <div className="text-sm text-gray-700">
              <h5 className="font-semibold mb-1">Interactive Concept Maps</h5>
              <p>
                Use visual tools that help the student relate biological
                processes and terminology more intuitively.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
