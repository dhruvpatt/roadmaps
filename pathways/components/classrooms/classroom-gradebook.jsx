// components/classrooms/ClassroomGradebook.jsx
"use client";

import { useState } from "react";
import { Download, Upload, Save, X, FileSpreadsheet, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const mockGradebook = {
  assignments: [
    { id: 1, name: "Lab Report 1", points: 100, type: "assignment" },
    { id: 2, name: "Cell Quiz", points: 50, type: "quiz" },
    { id: 3, name: "Midterm", points: 200, type: "exam" },
    { id: 4, name: "Participation", points: 25, type: "participation" },
  ],
  students: [
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice@example.com",
      grades: { 1: 95, 2: 48, 3: 185, 4: 23 },
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob@example.com",
      grades: { 1: 87, 2: 45, 3: 172, 4: 25 },
    },
    {
      id: 3,
      name: "Carol Davis",
      email: "carol@example.com",
      grades: { 1: 92, 2: 50, 3: 195, 4: 24 },
    },
    {
      id: 4,
      name: "David Wilson",
      email: "david@example.com",
      grades: { 1: 78, 2: 42, 3: 158, 4: 22 },
    },
    {
      id: 5,
      name: "Eva Brown",
      email: "eva@example.com",
      grades: { 1: 98, 2: 49, 3: 188, 4: 25 },
    },
  ],
};

export default function ClassroomGradebook({ classroom, user }) {
  const [gradebook, setGradebook] = useState(mockGradebook);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [showAddGradeForm, setShowAddGradeForm] = useState(false);
  const [newGradeEntry, setNewGradeEntry] = useState({
    studentId: "",
    assignmentId: "",
    grade: "",
  });

  const handleEditGrade = (studentId, assignmentId, currentGrade) => {
    setEditingCell({ studentId, assignmentId });
    setEditValue(currentGrade != null ? String(currentGrade) : "");
  };

  const handleSaveGrade = () => {
    if (!editingCell) return;
    const parsed = parseFloat(editValue);
    if (isNaN(parsed)) return;
    setGradebook((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === editingCell.studentId
          ? {
              ...s,
              grades: { ...s.grades, [editingCell.assignmentId]: parsed },
            }
          : s
      ),
    }));
    setEditingCell(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const calculateStudentTotal = (student) => {
    const totalPts = gradebook.assignments.reduce(
      (sum, a) => sum + a.points,
      0
    );
    const earned = gradebook.assignments.reduce(
      (sum, a) => sum + (student.grades[a.id] || 0),
      0
    );
    return {
      earned,
      total: totalPts,
      percentage: Math.round((earned / totalPts) * 100),
    };
  };

  const calculateAssignmentAverage = (aid) => {
    const grades = gradebook.students.map((s) => s.grades[aid] || 0);
    const avg = grades.reduce((sum, g) => sum + g, 0) / grades.length;
    return Math.round(avg * 10) / 10;
  };

  const handleAddGrade = () => {
    const sid = parseInt(newGradeEntry.studentId, 10);
    const aid = parseInt(newGradeEntry.assignmentId, 10);
    const grd = parseFloat(newGradeEntry.grade);
    if (isNaN(sid) || isNaN(aid) || isNaN(grd)) return;

    setGradebook((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === sid ? { ...s, grades: { ...s.grades, [aid]: grd } } : s
      ),
    }));
    setShowAddGradeForm(false);
    setNewGradeEntry({ studentId: "", assignmentId: "", grade: "" });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-medium text-gray-900">Gradebook</h2>
            <p className="text-base text-gray-700">
              Manage and track student grades
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAddGradeForm(true)}
              className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white"
            >
              + Add Grade
            </Button>
            <Button
              variant="outline"
              className="px-4 py-2 rounded-lg border-gray-300"
            >
              <Upload className="w-4 h-4 mr-2" /> Import
            </Button>
            <Button
              variant="outline"
              className="px-4 py-2 rounded-lg border-gray-300"
            >
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button
              variant="outline"
              className="px-4 py-2 rounded-lg border-gray-300"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Report
            </Button>
          </div>
        </div>

        {/* Add Grade Form */}
        {showAddGradeForm && (
          <Card className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
            <CardHeader>
              <CardTitle>Add Grade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Student
                  </label>
                  <select
                    value={newGradeEntry.studentId}
                    onChange={(e) =>
                      setNewGradeEntry({
                        ...newGradeEntry,
                        studentId: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-lg border-gray-300"
                  >
                    <option value="">Select student</option>
                    {gradebook.students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Assignment
                  </label>
                  <select
                    value={newGradeEntry.assignmentId}
                    onChange={(e) =>
                      setNewGradeEntry({
                        ...newGradeEntry,
                        assignmentId: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-lg border-gray-300"
                  >
                    <option value="">Select assignment</option>
                    {gradebook.assignments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Grade
                  </label>
                  <Input
                    type="number"
                    value={newGradeEntry.grade}
                    onChange={(e) =>
                      setNewGradeEntry({
                        ...newGradeEntry,
                        grade: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddGradeForm(false)}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
                <Button onClick={handleAddGrade} className="rounded-lg">
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gradebook Table */}
        <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <CardContent className="p-0 overflow-auto rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-gray-300">
                  <TableHead className="sticky left-0 bg-white z-10 px-6 py-3">
                    Student
                  </TableHead>
                  {gradebook.assignments.map((a) => (
                    <TableHead key={a.id} className="text-center px-6 py-3">
                      <div className="font-medium">{a.name}</div>
                      <div className="text-xs text-gray-500">
                        {a.points} pts | Avg: {calculateAssignmentAverage(a.id)}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center bg-gray-50 px-6 py-3">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gradebook.students.map((student) => {
                  const totals = calculateStudentTotal(student);
                  return (
                    <TableRow
                      key={student.id}
                      className="border-t border-gray-200"
                    >
                      <TableCell className="sticky left-0 bg-white z-10 px-6 py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-xs text-gray-500">
                              {student.email}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => console.log("Email:", student.email)}
                            className="text-gray-500 hover:text-blue-600"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                      {gradebook.assignments.map((a) => {
                        const grade = student.grades[a.id];
                        const isEditing =
                          editingCell &&
                          editingCell.studentId === student.id &&
                          editingCell.assignmentId === a.id;
                        const pct =
                          grade != null
                            ? Math.round((grade / a.points) * 100)
                            : 0;

                        return (
                          <TableCell
                            key={a.id}
                            className="text-center px-6 py-3"
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-16 h-8 text-center"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleSaveGrade}
                                >
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-gray-50 p-2 rounded"
                                onClick={() =>
                                  handleEditGrade(student.id, a.id, grade)
                                }
                              >
                                <div className="font-medium">
                                  {grade != null ? grade : "-"}/{a.points}
                                </div>
                                <div
                                  className={`text-xs ${
                                    pct >= 90
                                      ? "text-green-600"
                                      : pct >= 80
                                      ? "text-blue-600"
                                      : pct >= 70
                                      ? "text-yellow-600"
                                      : pct >= 60
                                      ? "text-orange-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {grade != null ? `${pct}%` : "-"}
                                </div>
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center bg-gray-50 px-6 py-3">
                        <div className="font-medium">
                          {totals.earned}/{totals.total}
                        </div>
                        <div
                          className={`text-xs ${
                            totals.percentage >= 90
                              ? "text-green-600"
                              : totals.percentage >= 80
                              ? "text-blue-600"
                              : totals.percentage >= 70
                              ? "text-yellow-600"
                              : totals.percentage >= 60
                              ? "text-orange-600"
                              : "text-red-600"
                          }`}
                        >
                          {totals.percentage}%
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
