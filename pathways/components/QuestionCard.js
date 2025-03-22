// components/QuestionCard.js
import { useState } from "react";

const QuestionCard = ({ data, onAnswer }) => {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    // Only submit if input isn't empty
    if (input.trim() !== "") {
      onAnswer({ id: data.id, answer: input });
      setInput(""); // Clear out the input (optional)
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md text-amber-900 space-y-6">
      <h2 className="text-2xl font-semibold">{data.question}</h2>

      {data.type === "multiple" ? (
        /* ----------------------------------
           MULTIPLE CHOICE (BUTTONS)
        ------------------------------------- */
        <div className="space-y-4">
          {data.options.map((option, idx) => (
            <button
              key={idx}
              className="w-full text-left bg-amber-100 hover:bg-amber-200 text-amber-900 px-4 py-3 rounded-md font-medium transition duration-200 shadow-sm"
              onClick={() => onAnswer({ id: data.id, answer: option })}
            >
              {option}
            </button>
          ))}
        </div>
      ) : data.type === "dropdown" ? (
        /* ----------------------------------
           DROPDOWN SELECT
        ------------------------------------- */
        <div className="space-y-4">
          <select
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600"
          >
            <option value="" disabled>
              -- Choose an option --
            </option>
            {data.options.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button
            onClick={handleSubmit}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-md font-medium transition duration-200"
          >
            Next
          </button>
        </div>
      ) : (
        /* ----------------------------------
           TEXT INPUT (Default fallback)
        ------------------------------------- */
        <div className="space-y-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer..."
            className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600"
          />
          <button
            onClick={handleSubmit}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-md font-medium transition duration-200"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
