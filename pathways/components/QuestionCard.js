// components/QuestionCard.js
import { useState } from "react";

const QuestionCard = ({ data, onAnswer }) => {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (input !== "") {
      onAnswer({ id: data.id, answer: input });
      setInput("");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <h2 className="text-xl font-medium">{data.question}</h2>

      {data.type === "multiple" ? (
        <div className="space-y-2">
          {data.options.map((option, idx) => (
            <button
              key={idx}
              className="w-full bg-blue-100 hover:bg-blue-200 p-3 rounded text-left"
              onClick={() => onAnswer({ id: data.id, answer: option })}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col space-y-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="border border-gray-300 rounded p-2"
            placeholder="Type your answer..."
          />
          <button
            onClick={handleSubmit}
            className="self-end bg-blue-500 text-white px-4 py-2 rounded"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
