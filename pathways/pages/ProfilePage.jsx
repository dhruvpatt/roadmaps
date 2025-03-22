import React, { useState } from "react";
import Image from "next/image";

export default function ProfilePage() {
  const [user, setUser] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Student",
    bio: "Passionate about learning and technology.",
  });

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ ...user });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setUser(formData);
    setEditMode(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
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

      {editMode ? (
        <div className="mt-6 flex space-x-4">
          <button onClick={handleSave} className="bg-amber-600 text-white px-4 py-2 rounded">
            Save
          </button>
          <button onClick={() => setEditMode(false)} className="border px-4 py-2 rounded">
            Cancel
          </button>
        </div>
      ) : (
        <button onClick={() => setEditMode(true)} className="bg-amber-600 text-white px-4 py-2 rounded mt-6">
          Edit Profile
        </button>
      )}
    </div>
  );
}
