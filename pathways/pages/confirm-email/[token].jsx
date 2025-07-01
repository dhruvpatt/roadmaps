import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import EmailConfirmationCard from "@/components/EmailConfirmationCard";
import backendUrl from "@backendUrl";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const { token } = router.query;

  const [step, setStep] = useState(0); // 0 = confirm button, 1 = success, 2 = error
  const [isLoading, setIsLoading] = useState(false);
  const [orgCode, setOrgCode] = useState(null);

  const handleConfirm = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/confirm-email/${token}/`);
      const data = await res.json();

      if (res.ok) {
        setOrgCode(data.organization_code || null);
        setStep(1);
        setTimeout(() => router.push("/login"), 4000);
      } else {
        setStep(2);
      }
    } catch (err) {
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4 py-16">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="confirm"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            className="bg-white p-8 rounded-xl shadow space-y-4 max-w-md w-full"
          >
            <h1 className="text-xl font-semibold text-amber-900">Confirm Your Email</h1>
            <p className="text-gray-700">Press the button below to confirm your email address.</p>
            <Button onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? "Confirming..." : "Confirm Email"}
            </Button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="success"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            className="bg-white p-8 rounded-xl shadow space-y-4 max-w-md w-full"
          >
            <h1 className="text-xl font-bold text-green-700">Email Confirmed</h1>
            <p className="text-gray-700">You're all set! Redirecting to the login page.</p>
            {orgCode && (
              <p className="text-gray-700">
                Your organization code has been sent to your email. Share it with your team!
              </p>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="error"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            className="bg-white p-8 rounded-xl shadow space-y-4 max-w-md w-full"
          >
            <h1 className="text-xl font-bold text-red-700">Invalid or Expired Link</h1>
            <p className="text-gray-700">This email confirmation link is no longer valid.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
