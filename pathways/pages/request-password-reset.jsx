"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import backendUrl from "@backendUrl";

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const emailQuery = searchParams.get("email");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (emailQuery) setEmail(emailQuery);
  }, [emailQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setError("");

    try {
      const res = await fetch(`${backendUrl}/api/request-password-reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Something went wrong");

      setStatus("Check your email for the reset link.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 px-6 py-24">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md space-y-6">
        <h1 className="text-2xl font-bold text-amber-900">Forgot Password</h1>
        <p className="text-sm text-gray-600">
          We'll email you a link to reset your password.
        </p>

        {status && <p className="text-green-600">{status}</p>}
        {error && <p className="text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" variant="ok" className="w-full">
            Send Reset Link
          </Button>
        </form>
      </div>
    </div>
  );
}
