import React from "react";
import { Input } from "@/components/ui/input";

export default function SignupFormFields({
  formData,
  handleChange,
  errors,
  role,
  handleFavoriteChange
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Input name="first_name" placeholder="First name" value={formData.first_name} onChange={handleChange} required />
        <Input name="last_name" placeholder="Last name" value={formData.last_name} onChange={handleChange} required />
      </div>
      <Input name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
      <Input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
      <Input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
      <Input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />

      {role === "student" && (
        <>
          <Input name="age" placeholder="Age" value={formData.age} onChange={handleChange} required />
          <Input name="grade" placeholder="Grade" value={formData.grade} onChange={handleChange} required />
          {parseInt(formData.age) <= 13 && (
            <Input name="parent_email" placeholder="Parent Email" value={formData.parent_email} onChange={handleChange} required />
          )}
        </>
      )}

      {errors.general && <p className="text-sm text-red-600">{errors.general}</p>}
    </>
  );
}
