import { useEffect, useState } from "react";
import fetchWithAuth from "@/lib/fetch_with_auth";
import CurriculumBuilder from "./CurriculumBuilder";

export default function CurriculumEditPage({ classroomId }) {
  const [units, setUnits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCurriculum() {
      try {
        const res = await fetchWithAuth(`/api/curriculum/${classroomId}/`);
        if (!res.ok) throw new Error("Failed to fetch curriculum");
        const data = await res.json();
        console.log("Curriculum data:", data);
        setUnits(data.units);
      } catch (err) {
        console.error(err);
        setError("Unable to load curriculum.");
      } finally {
        setLoading(false);
      }
    }
    loadCurriculum();
  }, [classroomId]);

  if (loading) return <div>Loading curriculum...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <CurriculumBuilder
      classroomId={classroomId}
      onCurriculumCreated={(newUnits) => {
        console.log("Curriculum saved!", newUnits);
      }}
      onCancel={() => {
        console.log("Edit cancelled");
      }}
      hasExistingUnits={units.length > 0}
      initialUnits={units}
    />
  );
}
