"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/useAuth";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "student",
    grade: "",
    age: "",
  });

  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  const { signup, isLoading } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
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

    // Convert age and grade to integers
    const payload = {
      ...formData,
      age: parseInt(formData.age, 10),
      grade: parseInt(formData.grade, 10),
    };
    delete payload.confirmPassword;

    try {
      const user = await signup(payload);
      print(user);
      if (user.role === "teacher") {
        router.push("/dashboard");
      } else {
        router.push("/settings");
      }
    } catch (err) {
      console.error("Signup error:", err);
      if (err instanceof Response) {
        const errorData = await err.json();
        setErrors(errorData || {});
      } else {
        setErrors({
          general: "An unexpected error occurred. Please try again.",
        });
      }
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

        <div className="bg-white p-8 rounded-xl shadow">
          <h1 className="text-3xl font-bold text-amber-900 mb-6">
            Create your account
          </h1>

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          {errors.general && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Username
              </label>
              <input
                type="text"
                name="username"
                id="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="yourusername"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none"
              />
              {errors.username && (
                <p className="text-sm text-red-600 mt-1">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email*
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            {/* First/Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="first_name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name*
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
                <label
                  htmlFor="last_name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name*
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

            {/* Grade */}
            <div>
              <label
                htmlFor="grade"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Grade*
              </label>
              <input
                type="number"
                min="1"
                max="12"
                name="grade"
                id="grade"
                placeholder="e.g. 10"
                value={formData.grade}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none"
              />
            </div>

            {/* Age */}
            <div>
              <label
                htmlFor="age"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Age*
              </label>
              <input
                type="text"
                name="age"
                id="age"
                placeholder="e.g. 15"
                value={formData.age}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password*
              </label>
              <input
                type="password"
                name="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password*
              </label>
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none"
              />
            </div>

            {/* Role */}
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">
                I am a:*
              </span>
              <div className="flex space-x-6">
                {["student", "teacher"].map((role) => (
                  <label
                    key={role}
                    className="flex items-center space-x-2 text-sm text-gray-700"
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={formData.role === role}
                      onChange={handleRoleChange}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
            >
              {isLoading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-amber-700">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-amber-600 hover:text-amber-800 font-medium"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
