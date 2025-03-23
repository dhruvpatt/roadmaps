import { useState } from "react";
import { X } from "lucide-react";
import mockStudents from "../../data/mockStudents";

export default function CreateClassroomModal({ isOpen, onClose, onCreate, user }) {
  const [form, setForm] = useState({ name: "", details: "" });
  const [search, setSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const filteredStudents = mockStudents.filter(
    (student) =>
      student.role === "student" &&
      `${student.firstName} ${student.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      !selectedStudents.find((s) => s.id === student.id)
  );

  const handleSelectStudent = (student) => {
    setSelectedStudents((prev) => [...prev, student]);
    setSearch(""); // Clear input after selection
  };

  const handleRemoveStudent = (id) => {
    setSelectedStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = () => {
    const classroom = {
      name: form.name.trim(),
      details: form.details.trim(),
      teacher_id: user.id,
    };

    onCreate(classroom);
    onClose();
    setForm({ name: "", details: "" });
    setSelectedStudents([]);
    setSearch("");
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

          {/* Student Search */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add Students
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Search by name..."
            /> */}
            {/* Filtered List */}
            {/* {search && filteredStudents.length > 0 && (
              <ul className="border border-gray-200 rounded shadow-sm max-h-40 overflow-y-auto bg-white">
                {filteredStudents.map((student) => (
                  <li
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    className="px-4 py-2 hover:bg-amber-50 cursor-pointer text-sm"
                  >
                    {student.firstName} {student.lastName}
                  </li>
                ))}
              </ul>
            )}
          </div> */}

          {/* Selected Students */}
          {/* {selectedStudents.length > 0 && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selected Students:
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedStudents.map((s) => (
                  <div
                    key={s.id}
                    className="bg-amber-100 text-amber-900 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                  >
                    {s.firstName} {s.lastName}
                    <button onClick={() => handleRemoveStudent(s.id)}>
                      <X className="w-4 h-4 text-amber-700 hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )} */}

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
