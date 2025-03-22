import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";

export default function UserProfile() {
  const router = useRouter();
  const { userId } = router.query; // Get userId from URL
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = "http://127.0.0.1:8000/api/users"; // Django API endpoint

  useEffect(() => {
    if (userId) {
      fetch(`${API_BASE_URL}/${userId}/`)
        .then((res) => res.json())
        .then((data) => {
          setUser(data);
          setFormData(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching user:", err);
          setError("Failed to load user data.");
          setLoading(false);
        });
    }
  }, [userId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/${userId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update user");

      const updatedUser = await response.json();
      setUser(updatedUser);
      setEditMode(false);
    } catch (err) {
      console.error("Error updating user:", err);
      setError("Failed to update user data.");
    }
  };

  if (loading) return <p className="text-center">Loading user...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;

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
