"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import backendUrl from "@/backendUrl";

/**
 * Example auth hook placeholder.
 * Replace with your actual auth logic or remove if unnecessary.
 */
function useAuth() {
  return {
    signup: async (data) => {
      console.log("Signup data:", data);
      // Simulate success with a short delay
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
    role: "student",
  });
  const [error, setError] = useState("");
  const { signup, isLoading } = useAuth();
  const router = useRouter();

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle role change
  const handleRoleChange = (e) => {
    setFormData((prev) => ({ ...prev, role: e.target.value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    delete formData.confirmPassword;
    console.log("Form data:", formData);
    try {
      const res = await fetch(`${backendUrl}/api/create-user/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      
      if (!res.ok){
        console.error("Error creating user:", res);
        setError("Try a different email.");
        setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
        return;
      }
      const ret = await res.json();
      if (res.ok){
        console.log("User created successfully:", ret);
        localStorage.setItem("user", JSON.stringify(ret));
        router.push("/dashboard");
      }
      

    } catch (error){
      console.error("Error creating user:", error);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 px-6 py-24">
      <div className="w-full max-w-2xl">
        {/* Header Row */}
        <div className="flex justify-between items-center mb-6">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="p-0 inline-flex items-center justify-center rounded-md px-4 py-2 font-medium 
                       transition-colors focus:outline-none text-amber-700 hover:text-amber-900 
                       hover:bg-transparent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </button>
          <div className="flex items-center gap-1 text-xl font-bold">
            <span className="text-amber-600">Path</span>
            <span className="text-amber-800">ways</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-amber-900 mb-6">
            Create your account
          </h1>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="first_name"
                  className="text-sm font-medium text-gray-700"
                >
                  First Name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm 
                             shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 
                             focus:ring-amber-600 focus:border-amber-600"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="last_name"
                  className="text-sm font-medium text-gray-700"
                >
                  Last Name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm 
                             shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 
                             focus:ring-amber-600 focus:border-amber-600"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm 
                           shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 
                           focus:ring-amber-600 focus:border-amber-600"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm 
                           shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 
                           focus:ring-amber-600 focus:border-amber-600"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirm_password}
                onChange={handleChange}
                required
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm 
                           shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 
                           focus:ring-amber-600 focus:border-amber-600"
              />
            </div>

            {/* Role Selection */}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-gray-700">
                I am a:
              </legend>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="student"
                    name="role"
                    value="student"
                    checked={formData.role === "student"}
                    onChange={handleRoleChange}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <label
                    htmlFor="student"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Student
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="teacher"
                    name="role"
                    value="teacher"
                    checked={formData.role === "teacher"}
                    onChange={handleRoleChange}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <label
                    htmlFor="teacher"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Teacher
                  </label>
                </div>
              </div>
            </fieldset>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center rounded-md px-4 py-3 
                         font-medium transition-colors focus:outline-none bg-amber-600 
                         hover:bg-amber-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={async (e) => await handleSubmit(e)}
            >
              {isLoading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          {/* Link to Login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-amber-700">
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
    </div>
  );
}
