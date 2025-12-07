"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import CurriculumBuilder from "@/components/classrooms/CurriculumBuilder";
import fetchWithAuth from "@/lib/fetch_with_auth";

export default function CurriculumEditPage({ classroomId }) {
  const router = useRouter();
  const [initialUnits, setInitialUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 1) Fetch the existing curriculum on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetchWithAuth(`/api/curriculum/${classroomId}/`);
        if (!res.ok) throw new Error("Could not load curriculum");
        const { units } = await res.json();
        setInitialUnits(units);
      } catch (e) {
        setError(e.message);
        toast.error("Failed to load curriculum");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [classroomId]);

  // 2) When the user saves, PUT to our new “update” endpoint
  const handleSave = async (units) => {
    try {
      setError("");
      const res = await fetchWithAuth("/api/curriculum/update/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classroom_id: classroomId, units }),
      });

      if (!res.ok) {
        const { detail } = await res.json();
        throw new Error(detail || "Update failed");
      }

      toast.success("Curriculum saved successfully!");
      // e.g. navigate back after a small delay
    } catch (e) {
      setError(e.message);
      toast.error(`Save failed: ${e.message}`);
    }
  };

  if (loading) return <p className="p-6 text-center">Loading…</p>;
  if (error) return <p className="p-6 text-center text-red-600">{error}</p>;

  return (
    <CurriculumBuilder
      classroomId={classroomId}
      initialUnits={initialUnits}
      hasExistingUnits={true}
      onCurriculumCreated={handleSave}
      onCancel={() => router.back()}
    />
  );
}
