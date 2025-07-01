"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/useAuth";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("organization_code");
    if (stored) setOrgCode(stored);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await login({ username, password, organization_code: orgCode });
      console.log("res", res)
      if (res.ok || res.organization) {
        localStorage.setItem("organization_code", orgCode);
        router.push("/dashboard");
      }
      else{
        let error = await res.json()
        setError(error.detail);
      }
    } catch (err) {
      console.log("err", err)
      setError("Unexpected error occurred");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 px-6 py-24">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header row */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center text-amber-700 hover:text-amber-900 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to home
          </button>
          <div className="text-xl font-bold">
            <span className="text-amber-600">Path</span>
            <span className="text-amber-800">ways</span>
          </div>
        </div>

        {/* Org Code Input Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-amber-800 mb-2">Organization Code</h2>
          <p className="text-sm text-gray-600 mb-3">
            Please enter your organization code. This links your login to the correct school or group.
          </p>
          <Input
            placeholder="Enter organization code"
            value={orgCode}
            onChange={(e) => setOrgCode(e.target.value)}
          />
        </div>

        {/* Login Form */}
        <div className="bg-white p-8 rounded-lg shadow space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-amber-900">Log in to your account</h1>
            <p className="text-sm text-gray-600 mt-1">
              Enter your username and password to access your dashboard.
            </p>
          </div>

          {error != "" && <div className="bg-red-50 text-red-600 p-3 rounded-md">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <Input
                id="username"
                placeholder="yourusername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link href="/request-password-reset" className="text-sm text-amber-600 hover:text-amber-800">
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
              variant="ok"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <div className="text-center text-sm mt-4">
            <p className="text-amber-700">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-amber-600 hover:text-amber-800 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
