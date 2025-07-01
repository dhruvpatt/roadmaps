"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Resizable } from "@components/animations/Resizeable";
import EmailConfirmationCard from "@components/EmailConfirmationCard";

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("student");
  const [orgCode, setOrgCode] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    grade: "",
    age: "",
    parent_email: "",
    favorite_things: ["", "", ""]
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { signup, isLoading } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleFavoriteChange = (i, value) => {
    const updated = [...formData.favorite_things];
    updated[i] = value;
    setFormData((prev) => ({ ...prev, favorite_things: updated }));
  };

  const handleOrgSubmit = () => {
    if (!orgCode.trim()) {
      setErrors({ orgCode: "Organization code is required." });
      return;
    }
    setStep(2);
  };

  const handleRoleSelect = (selected) => {
    setRole(selected);
    setFormData((prev) => ({ ...prev, role: selected }));
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const payload = {
      ...formData,
      age: parseInt(formData.age, 10),
      grade: parseInt(formData.grade, 10),
      organization_code: orgCode,
    };
    delete payload.confirmPassword;

    try {
      const user = await signup(payload);
      setSubmitted(true);
    } catch (err) {
      if (err instanceof Response) {
        const errorData = await err.json();
        setErrors(errorData || {});
      } else {
        setErrors({ general: "An unexpected error occurred." });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 px-4 py-12">
      <Button
        onClick={() => router.push("/")}
        className="absolute top-4 left-4"
      >
        <ChevronLeft size={30} />
        <span>Home</span>
      </Button>

      <div className="w-full max-w-xl relative">
        {step > 1 && !submitted && (
          <button
            onClick={() => setStep(step - 1)}
            className="absolute -top-10 left-0 text-amber-700 hover:text-amber-900 text-sm flex items-center space-x-1"
          >
            <span><ChevronLeft></ChevronLeft></span>
            <span>Back</span>
          </button>
        )}
        <Resizable>
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="confirmation"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-8 rounded-xl shadow space-y-4"
              >
                <EmailConfirmationCard age={formData.age} />
              </motion.div>
            ) : (

              <motion.div
                key={`step-${step}`}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-8 rounded-xl shadow space-y-6"
              >
                {step === 1 && (
                  <>
                    <div className="bg-amber-100 border border-amber-300 text-amber-900 p-4 rounded-lg mb-4">
                      <h2 className="text-lg font-bold mb-1">Before you start</h2>
                      <p className="text-sm">
                        To create your account, you’ll need an organization code. This helps us
                        link you to your school or learning group,.
                        <br />
                        Ask your teacher or admin for this code before proceeding.
                      </p>
                    </div>

                    <h2 className="text-xl font-semibold text-amber-900">
                      Enter Organization Code
                    </h2>
                    <Input
                      value={orgCode}
                      onChange={(e) => setOrgCode(e.target.value)}
                      placeholder="Organization code"
                    />
                    {errors.orgCode && (
                      <p className="text-sm text-red-600">{errors.orgCode}</p>
                    )}
                    <Button onClick={handleOrgSubmit}>Continue</Button>
                  </>
                )}


                {step === 2 && (
                  <>
                    <h2 className="text-xl font-semibold text-amber-900">
                      Select your role
                    </h2>
                    <div className="flex gap-4">
                      <Button variant="ok" onClick={() => handleRoleSelect("student")}>Student</Button>
                      <Button variant="cancel" onClick={() => handleRoleSelect("teacher")}>Teacher</Button>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <SignupFormFields
                    formData={formData}
                    handleChange={handleChange}
                    errors={errors}
                    role={role}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Resizable>
      </div>
    </div>
  );
}
