import { useState } from "react";
import { Router, X } from "lucide-react";
import mockStudents from "../../data/mockStudents";
import emitter from "@/mitt";
import fetchWithAuth from "@/lib/fetch_with_auth";
import { useRouter } from "next/navigation";

export default function CreateClassroomModal({ isOpen, onClose, user }) {
  const [form, setForm] = useState({ name: "", details: "" });


  const router = useRouter();
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const createClassroom = async (data) => {
    try {
      const res = await fetchWithAuth("api/classroom/create/", {
        method: "POST",
        body: JSON.stringify(data),
      });
      var reply = await res.json();
      console.log("Classroom created:", reply);
      emitter.emit("update-classrooms");
      router.push(`/classroom/${reply.id}`);
    } catch (error) {
      console.error("Failed to create classroom", error);
    }
  };

  const handleSubmit = () => {
    const classroom = {
      name: form.name.trim(),
      details: form.details.trim(),
    };
    createClassroom(classroom);
    onClose();
    setForm({ name: "", details: "" });

  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative animate-slide-up text-gray-800">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-amber-800 mb-4">
          Create Classroom
        </h2>

        <div className="space-y-4">
          {/* Classroom Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Classroom Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="e.g. Algebra 101"
            />
          </div>

          {/* Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Details
            </label>
            <textarea
              name="details"
              value={form.details}
              onChange={handleInputChange}
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Describe the classroom, students, or goals..."
            />
          </div>


          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
