
import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const generateMockStudents = () =>
  Array.from({ length: 23 }).map((_, i) => ({
    id: i + 1,
    name: `Student ${i + 1}`,
    email: `student${i + 1}@example.com`,
    progress: Math.floor(Math.random() * 41) + 60,
    notes: [`Initial note for student ${i + 1}`],
  }));

export default function StudentsComponent() {
  const [students, setStudents] = useState(generateMockStudents());
  const [expandedRows, setExpandedRows] = useState({});
  const [newNotes, setNewNotes] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNoteChange = (id, value) => {
    setNewNotes((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddNote = (id) => {
    if (!newNotes[id]) return;
  
    const updated = students.map((student) =>
      student.id === id
        ? { ...student, notes: [...student.notes, newNotes[id]] }
        : student
    );
  
    setStudents(updated); // ✅ Update state to trigger re-render
    setNewNotes((prev) => ({ ...prev, [id]: "" }));
  };
  

  // Pagination logic
  const indexOfLast = currentPage * studentsPerPage;
  const indexOfFirst = indexOfLast - studentsPerPage;
  const currentStudents = students.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(students.length / studentsPerPage);

  return (
    <div className="bg-white rounded-lg border border-gray-400 p-6 shadow-sm">
      <h2 className="text-4xl font-bold text-black mb-1">Students</h2>
      <p className="text-xl text-gray-500 mb-4">Manage students enrolled in this classroom</p>

      <div className="overflow-x-auto">
        <table className="min-w-full text-md text-left border border-gray-400 rounded-lg">
          <thead>
            <tr className="bg-gray-100 text-gray-600 font-medium">
              <th className="px-4 py-3 border-b">Name</th>
              <th className="px-4 py-3 border-b">Email</th>
              <th className="px-4 py-3 border-b">Progress</th>
              <th className="px-4 py-3 border-b w-8"></th>
            </tr>
          </thead>
          <tbody>
            {currentStudents.map((student) => (
              <React.Fragment key={student.id}>
                <tr className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                    <button
                      onClick={() => toggleRow(student.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedRows[student.id] ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {student.name}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{student.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-600"
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 font-semibold">{student.progress}%</span>
                    </div>
                  </td>
                  <td></td>
                </tr>

                {expandedRows[student.id] && (
                  <tr className="bg-amber-50">
                    <td colSpan="4" className="px-6 py-4">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-amber-800">Notes</p>
                        <ul className="list-disc list-inside text-sm text-gray-700">
                          {student.notes.map((note, index) => (
                            <li key={index}>{note}</li>
                          ))}
                        </ul>
                        <div className="flex gap-2 mt-2">
                          <input
                            value={newNotes[student.id] || ""}
                            onChange={(e) => handleNoteChange(student.id, e.target.value)}
                            className="flex-1 border border-gray-300 rounded px-3 py-1 text-sm"
                            placeholder="Add a note..."
                          />
                          <button
                            onClick={() => handleAddNote(student.id)}
                            className="bg-amber-600 text-white text-sm px-3 py-1 rounded hover:bg-amber-700"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <p className="text-sm text-gray-500">
          Showing {indexOfFirst + 1} to {Math.min(indexOfLast, students.length)} of {students.length} students
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded text-sm text-gray-700 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded text-sm text-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
