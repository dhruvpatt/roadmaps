"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/* ===============================
   PLACEHOLDER COMPONENTS
   Remove or replace these if you already
   have your own Button, Input, Label, etc.
================================= */

// Example auth hook placeholder:
function useAuth() {
  return {
    signup: async (data) => {
      console.log("Signup data:", data);
      // Simulate success with a short delay
      await new Promise((r) => setTimeout(r, 500));
    },
    isLoading: false,
  };
}

// Example Button placeholder
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

// Example Input placeholder
function Input({ className = "", ...props }) {
  return (
    <input
      className={`block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 ${className}`}
      {...props}
    />
  );
}

// Example Label placeholder
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

// Example RadioGroup placeholder
function RadioGroup({ children, value, onValueChange, className = "", ...props }) {
  // This will clone child RadioGroupItem elements to manage checked state
  return (
    <div className={className} {...props}>
      {React.Children.map(children, (child) => {
        if (child.type === RadioGroupItem) {
          return React.cloneElement(child, {
            checked: child.props.value === value,
            onChange: (e) => onValueChange(e.target.value),
          });
        }
        return child;
      })}
    </div>
  );
}

// Example RadioGroupItem placeholder
function RadioGroupItem({ id, value, checked, onChange }) {
  return (
    <input
      type="radio"
      id={id}
      value={value}
      checked={checked}
      onChange={onChange}
      className="text-amber-600 focus:ring-amber-500"
    />
  );
}

/* ===============================
   SIGNUP PAGE COMPONENT
================================= */

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const { signup, isLoading } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await signup({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      // On success, redirect or do something else:
      // router.push("/dashboard");
    } catch (err) {
      setError("Failed to create account. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 px-6 py-24">
      {/* Outer container that centers the form vertically and horizontally */}
      <div className="w-full max-w-2xl">
        {/* Top row: Back to home + Branding */}
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
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label>I am a:</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={handleRoleChange}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="student" />
                  <Label htmlFor="student" className="cursor-pointer">
                    Student
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="teacher" id="teacher" />
                  <Label htmlFor="teacher" className="cursor-pointer">
                    Teacher
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full py-3"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Sign up"}
            </Button>
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
