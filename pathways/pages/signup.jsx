"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import backendUrl from "@/backendUrl";

function useAuth() {
  return {
    signup: async (data) => {
      console.log("Signup data:", data);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    isLoading: false,
  };
}

export default function SignupPage() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const { signup, isLoading } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e) => {
    setFormData((prev) => ({ ...prev, role: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const payload = { ...formData };
    delete payload.confirmPassword;

    try {
      const res = await fetch(`${backendUrl}/api/create-user/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("Error creating user:", res);
        setError("Try a different email.");
        setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
        return;
      }

      const user = await res.json();
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "teacher") {
        router.push("/dashboard");
        return;
      } else {
        router.push("/ProfilePage");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 px-6 py-24 text-black">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-amber-700 hover:text-amber-900 flex items-center space-x-2 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to home</span>
          </button>
          <div className="text-xl font-bold">
            <span className="text-amber-600">Path</span>
            <span className="text-amber-800">ways</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white p-8 rounded-xl shadow">
          <h1 className="text-3xl font-bold text-amber-900 mb-6">Create your account</h1>

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Names */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  id="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  placeholder="First name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none"
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  id="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  placeholder="Last name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none"
              />
            </div>

            {/* Role */}
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">I am a:</span>
              <div className="flex space-x-6">
                <label className="flex items-center space-x-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={formData.role === "student"}
                    onChange={handleRoleChange}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>Student</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={formData.role === "teacher"}
                    onChange={handleRoleChange}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>Teacher</span>
                </label>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none"
            >
              {isLoading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-sm text-center text-amber-700">
            Already have an account?{" "}
            <Link href="/login" className="text-amber-600 hover:text-amber-800 font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
