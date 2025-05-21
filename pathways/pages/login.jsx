

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import backendUrl from "../backendUrl";

function useAuth() {
  return {
    login: async (email, password) => {
      console.log("Logging in with:", email, password);
      // Simulate success with a short delay
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    isLoading: false,
  };
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
      console.log(backendUrl)
      const res = await fetch(`${backendUrl}/api/login-with-email/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok){
        console.error("Login failed:", res);
        setError("Invalid email or password");
        return;
      }

      if (res.ok){
        const ret = await res.json();
        console.log("Login successful:", ret);
        localStorage.setItem("user", JSON.stringify(ret.user));
        router.push("/dashboard");
      }
    } catch (error){
      console.error("Login failed:", error);
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 px-6 py-24">
      <div className="w-full max-w-2xl">
        {/* Header row */}
        <div className="flex justify-between items-center mb-6">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="p-0 inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-colors focus:outline-none
                       text-amber-700 hover:text-amber-900 hover:bg-transparent"
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
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full rounded-md border border-gray-300 bg-white text-black
                           px-3 py-2 text-sm shadow-sm placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm text-amber-600 hover:text-amber-800">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full rounded-md border border-gray-300 bg-white text-black
                           px-3 py-2 text-sm shadow-sm placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center rounded-md px-4 py-2 font-medium
                         transition-colors focus:outline-none bg-amber-600 hover:bg-amber-700 text-white
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-amber-700">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-amber-600 hover:text-amber-800 font-medium">
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
