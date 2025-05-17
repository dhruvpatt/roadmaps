import React, { useState, useEffect } from "react";
import InitialUserQuizData from "@/data/InitialUserQuizData";
import backendUrl from "@/backendUrl";

export default function QuizSection({ user, onQuizUpdate }) {
  const [editMode, setEditMode] = useState(false);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const quiz = InitialUserQuizData[0];

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/users/${user.id}/`);
        const data = await res.json();
        const mappedAnswers = {};

        if (data.preferences && Array.isArray(data.preferences)) {
          for (const pref of data.preferences) {
            for (const q of quiz.questions) {
              if (pref.startsWith(q.question)) {
                const parts = pref.split("Answer:");
                mappedAnswers[q.id] = parts[1]?.trim() || "";
                break;
              }
            }
          }
        }

        setAnswers(mappedAnswers);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
    };

    if (user?.id) fetchUserDetails();
  }, [user]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const validate = () => {
    for (const q of quiz.questions) {
      const ans = answers[q.id];
      if (!ans || ans.trim() === "") {
        return `Missing answer: ${q.question}`;
      }
    }
    return null;
  };

  const buildPreferences = () => {
    return quiz.questions.map((q) => `${q.question} Answer: ${answers[q.id] || ""}`);
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`${backendUrl}/api/update-user-preferences/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          preferences: buildPreferences(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update preferences");
        return;
      }

      if (data.user?.preferences) {
        onQuizUpdate(answers);
        localStorage.setItem("user", JSON.stringify(data.user));
        setEditMode(false);
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 transition-all duration-300 ease-in-out">
      {quiz.questions.map((q) => (
        <div key={q.id} className="space-y-2">
          <p className="font-medium text-black">{q.question}</p>
          {q.type === "dropdown" ? (
            <select
              value={answers[q.id] || ""}
              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-black bg-white"
              disabled={!editMode}
            >
              <option value="" className="text-black">-- Select --</option>
              {q.options.map((opt) => (
                <option key={opt} value={opt} className="text-black">
                  {opt}
                </option>
              ))}
            </select>
          ) : q.type === "multiple" ? (
            <div className="flex flex-wrap gap-4">
              {q.options.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-black">
                  <input
                    type="radio"
                    name={`q${q.id}`}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => handleAnswerChange(q.id, opt)}
                    disabled={!editMode}
                  />
                  {opt}
                </label>
              ))}
            </div>
          ) : (
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 text-black"
              value={answers[q.id] || ""}
              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
              disabled={!editMode}
            />
          )}
        </div>
      ))}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex justify-end pt-4">
        {editMode ? (
          <div className="flex gap-4">
            <button
              onClick={() => setEditMode(false)}
              className="border px-4 py-2 rounded text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded transition"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="text-amber-700 hover:underline text-sm"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
