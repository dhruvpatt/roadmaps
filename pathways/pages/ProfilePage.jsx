import React, { useState, useEffect } from "react";
import Image from "next/image";
import InitialUserQuizData from "@/data/InitialUserQuizData";
import Sidebar from "../components/sidebar";
import Navbar from "../components/navbar";

export default function ProfilePage() {
  // Sample user data with a 'role' and empty 'quizAnswers'
  const [user, setUser] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Student",
    bio: "Passionate about learning and technology.",
    quizAnswers: {}  // <-- holds the user's quiz answers by question ID
  });

  // Clone of user data for editing
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ ...user });

  // Find the quiz branch matching the user's role (Student or Teacher)
  const userQuizBranch = InitialUserQuizData.find(
    (item) => item.branch === user.role
  );

  // Whenever the user changes, sync formData so the edit fields stay updated
  useEffect(() => {
    setFormData({ ...user });
  }, [user]);

  // Update top-level profile fields (name, email, bio, etc.)
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Update quiz answers
  // Each question has an `id`; we store answers in formData.quizAnswers[id]
  const handleQuizAnswerChange = (questionId, value) => {
    setFormData((prev) => ({
      ...prev,
      quizAnswers: {
        ...prev.quizAnswers,
        [questionId]: value
      }
    }));
  };

  // Save all changes back into 'user'
  const handleSave = () => {
    setUser(formData);
    setEditMode(false);
  };

  return (
  <div className="flex flex-col bg-gray-100 min-h-screen w-full min-h-screen">
    <Navbar />
    <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar className="hidden md:block w-64" />
      <div className="w-3/4 mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
        <div className="flex items-center space-x-6">
          <Image
            src="/profile-placeholder.png"
            alt="Profile Picture"
            width={80}
            height={80}
            className="rounded-full border"
          />
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-gray-500">{user.email}</p>
            <p className="text-sm text-gray-600">{user.role}</p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold">About Me</h3>
          {editMode ? (
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="w-full border rounded p-2 mt-2"
            />
          ) : (
            <p className="text-gray-700 mt-2">{user.bio}</p>
          )}
        </div>

        {/* Quiz Section — only show if we have questions for the user's role */}
        {userQuizBranch && userQuizBranch.questions && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold">Your Quiz Answers</h3>
            {userQuizBranch.questions.map((q) => (
              <div key={q.id} className="mt-4">
                <label className="block font-medium text-gray-700 mb-2">
                  {q.question}
                </label>

                {/* ---- HANDLE DIFFERENT QUESTION TYPES ---- */}
                {q.type === "multiple" ? (
                  /* RADIO BUTTONS */
                  <div className="space-y-2">
                    {q.options.map((option) => (
                      <label key={option} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={`question_${q.id}`}
                          value={option}
                          disabled={!editMode}
                          checked={formData.quizAnswers[q.id] === option}
                          onChange={(e) =>
                            handleQuizAnswerChange(q.id, e.target.value)
                          }
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                ) : q.type === "dropdown" ? (
                  /* DROPDOWN SELECT */
                  <select
                    className="w-full border rounded p-2"
                    disabled={!editMode}
                    value={formData.quizAnswers[q.id] || ""}
                    onChange={(e) => handleQuizAnswerChange(q.id, e.target.value)}
                  >
                    <option value="" disabled>
                      -- Select an option --
                    </option>
                    {q.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  /* TEXT AREA */
                  <textarea
                    className="w-full border rounded p-2"
                    disabled={!editMode}
                    value={formData.quizAnswers[q.id] || ""}
                    onChange={(e) => handleQuizAnswerChange(q.id, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        )}


        {editMode ? (
          <div className="mt-6 flex space-x-4">
            <button
              onClick={handleSave}
              className="bg-amber-600 text-white px-4 py-2 rounded"
            >
              Save
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="border px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="bg-amber-600 text-white px-4 py-2 rounded mt-6"
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  </div>
  );
}
