import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

import ProfileSection from "../components/profile/ProfileSection";
import QuizSection from "../components/profile/QuizSection";
import BasicInfoSection from "../components/profile/BasicInfoSection";
import InitialUserQuizData from "@/data/InitialUserQuizData";
import backendUrl from "@/backendUrl";

export default function settings() {
  const router = useRouter();
  const [user, setUser] = useState({});
  const [formData, setFormData] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/login");
      return;
    }
    const usr = JSON.parse(stored);
    setUser(usr);
    setFormData({ ...usr });
  }, []);

  const userQuizBranch = InitialUserQuizData[0];

  const sections = [
    {
      title: "User Information",
      content: (
        <BasicInfoSection
          user={user}
          onNameChange={(newName) =>
            setUser((prev) => ({ ...prev, first_name: newName }))
          }
        />
      ),
    },
    {
      title: "Preferences Quiz",
      content: (
        <QuizSection
          user={user}
          userQuizBranch={userQuizBranch}
          onQuizUpdate={(answers) =>
            setUser((prev) => ({ ...prev, quizAnswers: answers }))
          }
        />
      ),
    },
  ];

  const filteredSections = sections.filter((section) =>
    section.title.toLowerCase().includes(search.toLowerCase())
  );

  return (

        <div className="flex-1 p-6">
          {/* Page Title */}
          <h1 className="text-black text-3xl md:text-4xl font-bold mb-2">Settings</h1>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search settings..."
            className="mb-6 w-full px-4 py-3 text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-amber-500"
          />

          {/* Dynamic Sections */}
          {filteredSections.map((section, index) => (
            <ProfileSection key={index} title={section.title}>
              {section.content}
            </ProfileSection>
          ))}

          {/* No results */}
          {filteredSections.length === 0 && (
            <p className="text-gray-500 italic">No matching settings found.</p>
          )}
        </div>

  );
}
