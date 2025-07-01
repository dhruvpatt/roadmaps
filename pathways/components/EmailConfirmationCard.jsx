// components/EmailConfirmationCard.jsx
import React from "react";
import { motion } from "framer-motion";

export default function EmailConfirmationCard({ age }) {
  return (
    <motion.div
      key="done"
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      className="bg-white p-8 rounded-xl shadow space-y-4"
    >
      <h1 className="text-2xl font-bold text-amber-900">
        Check your email
      </h1>
      <p className="text-gray-700">
        Please confirm your email to complete registration.
      </p>
      {parseInt(age, 10) <= 13 && (
        <p className="text-gray-700">
          Your parent must also confirm their email to activate your account.
        </p>
      )}
    </motion.div>
  );
}
