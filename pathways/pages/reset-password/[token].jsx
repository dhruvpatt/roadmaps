"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import backendUrl from "@backendUrl";

export default function ResetPasswordPage() {
    const router = useRouter();
    const { token } = router.query;

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirm) {
            setError("Passwords do not match");
            return;
        }

        try {
            const res = await fetch(`${backendUrl}/api/reset-password/${token}/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Something went wrong");

            setSuccess(true);
            setTimeout(() => router.push("/login"), 2500);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-amber-50 px-6 py-24">
            <div className="w-full max-w-md bg-white p-6 rounded-lg shadow space-y-6">
                <h1 className="text-xl font-bold text-amber-900">Reset your password</h1>

                {success ? (
                    <p className="text-green-600">
                        Your password has been updated! Redirecting to login...
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <p className="text-red-600 text-sm">{error}</p>}

                        <Input
                            type="password"
                            placeholder="New password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Input
                            type="password"
                            placeholder="Confirm password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                        />
                        <Button type="submit" variant="ok" className="w-full">
                            Reset Password
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}
