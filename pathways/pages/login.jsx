"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

function useAuth() {
  return {
    login: async (email, password) => {
      console.log("Logging in with:", email, password);
      // Simulate success with a short delay
      await new Promise((r) => setTimeout(r, 500));
    },
    isLoading: false,
  };
}

function Button({ variant, className = "", children, disabled, ...props }) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-colors focus:outline-none";
  const variantStyles =
    variant === "ghost"
      ? "text-amber-700 hover:text-amber-900 hover:bg-transparent"
      : "bg-amber-600 hover:bg-amber-700 text-white";
  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${disabledStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 ${className}`}
      {...props}
    />
  );
}

function Label({ htmlFor, className = "", children, ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium text-gray-700 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      // If login succeeds, redirect or do something else:
      // router.push("/dashboard");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 px-6 py-24">
      {/* Outer container that centers the form */}
      <div className="w-full max-w-2xl">
        {/* Header row */}
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            className="p-0"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Button>
          <div className="flex items-center gap-1 text-xl font-bold">
            <span className="text-amber-600">Path</span>
            <span className="text-amber-800">ways</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-amber-900 mb-6">
            Log in to your account
          </h1>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-amber-600 hover:text-amber-800"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-amber-700">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-amber-600 hover:text-amber-800 font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials section */}
        <div className="mt-8 text-center text-sm text-amber-700">
          <p>For demo purposes:</p>
          <p>Teacher login: teacher@example.com</p>
          <p>Student login: student@example.com</p>
          <p>Any password will work</p>
        </div>
      </div>
    </div>
  );
}
