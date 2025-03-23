import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import InitialUserQuizData from "@/data/InitialUserQuizData";
import Sidebar from "../components/sidebar";
import Navbar from "../components/navbar";
import backendUrl from "@/backendUrl"

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState({});
  const [editMode, setEditMode] = useState(false);

  // Editable copy of user data
  const [formData, setFormData] = useState({});

  // For displaying error messages
  const [errorMessage, setErrorMessage] = useState("");

  // For simplicity, using the first quiz; if you have multiple, select based on user.role
  const userQuizBranch = InitialUserQuizData[0];

  // Load user data and set editMode based on preferences
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/login");
      return;
    }
    let usr = JSON.parse(stored);
  
    // If preferences exist, parse them and populate quizAnswers
    if (usr.preferences && usr.preferences.length > 0) {
      const quizAnswers = {};
      // Assuming the first 6 preferences correspond to the quiz questions in order
      userQuizBranch.questions.slice(0, 6).forEach((question, index) => {
        const pref = usr.preferences[index];
        if (pref) {
          // Split using "Answer:" and take the answer part (trim any extra whitespace)
          const parts = pref.split("Answer:");
          quizAnswers[question.id] = parts[1] ? parts[1].trim() : "";
        }
      });
      // Update the user object with the parsed quiz answers
      usr.quizAnswers = quizAnswers;
      // Set editMode to false since preferences exist
      setEditMode(false);
    } else {
      // If no preferences, default to edit mode
      setEditMode(true);
    }
  
    setUser(usr);
    setFormData({ ...usr });
  }, []);
  

  console.log("User", user);

  // Update top-level fields (e.g., first_name, last_name)
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Update quiz answers (storing answers keyed by question id)
  const handleQuizAnswerChange = (questionId, value) => {
    setFormData((prev) => ({
      ...prev,
      quizAnswers: {
        ...prev.quizAnswers,
        [questionId]: value,
      },
    }));
  };

  // Validate that required fields (profile and quiz) are filled in
  const validateForm = () => {
    const quizAnswers = formData.quizAnswers || {};
    for (const q of userQuizBranch.questions) {
      const ans = quizAnswers[q.id];
      if (!ans || ans.trim() === "") {
        return `Please answer all questions. Missing: "${q.question}"`;
      }
    }
    return "";
  };

  // Build preferences as an array of "question: answer" strings (only the first 6 items)
  const buildPreferences = () => {
    const quizAnswers = formData.quizAnswers || {};
    const allPreferences = userQuizBranch.questions.map((q) => {
      const ans = quizAnswers[q.id] || "";
      return `${q.question} Answer: ${ans}`;
    });
    return allPreferences.slice(0, 6);
  };

  // Save user data and make an API call to update preferences
  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
  
    const updatedPreferences = buildPreferences();
  
    // Create updated user object with new preferences
    const updatedUser = {
      ...formData,
      preferences: updatedPreferences,
    };
  
    try {
      const response = await fetch(`${backendUrl}/update-preferences/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: updatedUser.id,
          preferences: updatedPreferences,
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // If the returned user has preferences, parse them to populate quizAnswers
        if (data.user.preferences && data.user.preferences.length > 0) {
          const quizAnswers = {};
          userQuizBranch.questions.slice(0, 6).forEach((question, index) => {
            const pref = data.user.preferences[index];
            if (pref) {
              const parts = pref.split("Answer:");
              quizAnswers[question.id] = parts[1] ? parts[1].trim() : "";
            }
          });
          data.user.quizAnswers = quizAnswers;
        }
  
        // Update state and local storage
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        setErrorMessage("");
        setEditMode(false);
      } else {
        setErrorMessage(data.error || "Failed to update user preferences");
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to update user preferences");
    }
  };
  

  return (
    <div className="flex flex-col bg-gray-100 min-h-screen w-full">
      <Navbar />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar className="hidden md:block w-64" />

        <div className="w-3/4 mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
          <div className="flex items-center space-x-6">
            <div className="space-y-4">
              <h2 className="text-5xl text-amber-600 font-bold">
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-black text-3xl">{user.email}</p>
              {user.role === "student" && (
                <p className="text-black text-xl">Student</p>
              )}
              {user.role === "teacher" && (
                <p className="text-black text-xl">Teacher</p>
              )}
            </div>
          </div>

          {editMode ? (
            <>
              {errorMessage && (
                <div className="bg-red-100 text-red-700 p-2 my-4 rounded">
                  {errorMessage}
                </div>
              )}

              {/* Editable Quiz */}
              <div className="mt-6">
                <h3 className="text-xl font-bold mb-2">
                  User Quiz (all required)
                </h3>
                {userQuizBranch.questions.map((q) => {
                  const currentAnswer = formData.quizAnswers?.[q.id] || "";
                  return (
                    <div className="mt-4" key={q.id}>
                      <label className="font-semibold">
                        {q.question} *
                      </label>
                      <br />
                      {q.type === "dropdown" ? (
                        <select
                          value={currentAnswer}
                          onChange={(e) =>
                            handleQuizAnswerChange(q.id, e.target.value)
                          }
                          className="border p-2 w-full"
                        >
                          <option value="">-- Select --</option>
                          {q.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : q.type === "multiple" ? (
                        <div>
                          {q.options.map((opt) => (
                            <label key={opt} className="block">
                              <input
                                type="radio"
                                name={`q${q.id}`}
                                value={opt}
                                checked={currentAnswer === opt}
                                onChange={() =>
                                  handleQuizAnswerChange(q.id, opt)
                                }
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="text"
                          className="border p-2 w-full"
                          value={currentAnswer}
                          onChange={(e) =>
                            handleQuizAnswerChange(q.id, e.target.value)
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex space-x-4">
                <button
                  onClick={handleSave}
                  className="bg-amber-600 text-white px-4 py-2 rounded cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setErrorMessage("");
                    setEditMode(false);
                  }}
                  className="border px-4 py-2 rounded cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              {/* View-only Quiz (disabled fields) */}
              <div className="mt-6">
                <h3 className="text-xl font-bold mb-2">Your Quiz Answers</h3>
                {userQuizBranch.questions.map((q) => {
                  const currentAnswer = user.quizAnswers?.[q.id] || "";
                  return (
                    <div className="mt-4" key={q.id}>
                      <label className="font-semibold">
                        {q.question}
                      </label>
                      <br />
                      {q.type === "dropdown" ? (
                        <select
                          value={currentAnswer}
                          disabled
                          className="border p-2 w-full bg-gray-100 text-gray-600"
                        >
                          <option value="">-- Select --</option>
                          {q.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : q.type === "multiple" ? (
                        <div>
                          {q.options.map((opt) => (
                            <label key={opt} className="block">
                              <input
                                type="radio"
                                name={`q${q.id}`}
                                value={opt}
                                disabled
                                checked={currentAnswer === opt}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="text"
                          disabled
                          className="border p-2 w-full bg-gray-100 text-gray-600"
                          value={currentAnswer}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Button to switch to edit mode */}
              <button
                onClick={() => setEditMode(true)}
                className="bg-amber-600 text-white px-4 py-2 rounded mt-6 cursor-pointer"
              >
                Edit Profile
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
