"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SignupFormFields from "../components/SignupFormFields";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import backendUrl from "@backendUrl";
import EmailConfirmationCard from "@components/EmailConfirmationCard";
import { AnimatePresence, motion } from "framer-motion";

export default function OrganizationSignupPage() {
  const router = useRouter();

  const [orgDetails, setOrgDetails] = useState({
    name: "",
    logo: null,
    banner: null,
    primaryColor: "#f59e0b",
    secondaryColor: "#fcd34d",
    tertiaryColor: "#fef3c7",
  });

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setOrgDetails((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      if (name in orgDetails) {
        setOrgDetails((prev) => ({ ...prev, [name]: value }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const payload = new FormData();

    payload.append("name", orgDetails.name);
    payload.append("primary_color", orgDetails.primaryColor);
    payload.append("secondary_color", orgDetails.secondaryColor);
    payload.append("tertiary_color", orgDetails.tertiaryColor);
    if (orgDetails.logo) payload.append("logo", orgDetails.logo);
    if (orgDetails.banner) payload.append("banner", orgDetails.banner);

    payload.append("username", formData.username);
    payload.append("email", formData.email);
    payload.append("password", formData.password);
    payload.append("first_name", formData.first_name);
    payload.append("last_name", formData.last_name);

    try {
      const res = await fetch(`${backendUrl}/api/create-organization/`, {
        method: "POST",
        body: payload,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data?.detail || "Something went wrong.");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-6 py-16">
      <Button onClick={() => router.push("/")} className="absolute top-4 left-4">
        <ChevronLeft size={30} />
        <span>Home</span>
      </Button>
      <AnimatePresence mode="wait">
        {success ? (<motion.div
          key="confirmation"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="items-center"
        >
          <EmailConfirmationCard age={18} />
        </motion.div>) : (<div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left: Organization Customization Panel */}
          <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <h2 className="text-xl font-bold text-amber-900">Organization Details</h2>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <Input name="name" value={orgDetails.name} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Logo</label>
              <Input type="file" name="logo" accept="image/*" onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Banner</label>
              <Input type="file" name="banner" accept="image/*" onChange={handleChange} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-sm">Primary</label>
                <Input type="color" name="primaryColor" value={orgDetails.primaryColor} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <label className="block text-sm">Secondary</label>
                <Input type="color" name="secondaryColor" value={orgDetails.secondaryColor} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <label className="block text-sm">Tertiary</label>
                <Input type="color" name="tertiaryColor" value={orgDetails.tertiaryColor} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Right: Admin Signup Form / Confirmation */}


          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-md space-y-6"
            encType="multipart/form-data"
          >
            <h2 className="text-xl font-bold text-amber-900">Admin Account</h2>
            <SignupFormFields
              formData={formData}
              handleChange={handleChange}
              errors={{ general: error }}
              role="org_admin"
            />
            <Button type="submit" variant="ok" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Organization"}
            </Button>
          </motion.form>

        </div>)}

      </AnimatePresence>
    </div>
  );
}
