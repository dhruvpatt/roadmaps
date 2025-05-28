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
    { id: 1, name: "Lab Report 1", points: 100, type: "assignment", weight: 20 },
    { id: 2, name: "Cell Quiz", points: 50, type: "quiz", weight: 15 },
    { id: 3, name: "Midterm", points: 200, type: "exam", weight: 50 },
    { id: 4, name: "Participation", points: 25, type: "participation", weight: 15 },
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
  const [showImportForm, setShowImportForm] = useState(false);
  const [showExportForm, setShowExportForm] = useState(false);
  const [importAssignmentId, setImportAssignmentId] = useState("");
  const [exportAssignmentId, setExportAssignmentId] = useState("");
  const [csvData, setCsvData] = useState(null);
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
    let weightedTotal = 0;
    let totalWeight = 0;
    
    gradebook.assignments.forEach(assignment => {
      if (student.grades[assignment.id] !== undefined) {
        // Calculate percentage for this assignment
        const percentage = (student.grades[assignment.id] / assignment.points) * 100;
        // Add weighted percentage to total
        weightedTotal += percentage * assignment.weight;
        totalWeight += assignment.weight;
      }
    });
    
    // Calculate final weighted percentage
    const weightedPercentage = totalWeight > 0 ? Math.round(weightedTotal / totalWeight) : 0;
    
    return {
      percentage: weightedPercentage,
      weightedGrade: weightedPercentage
    };
  };

  const calculateAssignmentAverage = (aid) => {
    const assignment = gradebook.assignments.find(a => a.id === aid);
    if (!assignment) return 0;
    
    const percentages = gradebook.students.map(s => {
      const grade = s.grades[aid] || 0;
      return (grade / assignment.points) * 100;
    });
    
    const avgPercentage = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    return Math.round(avgPercentage);
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
  
  const handleCsvImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setShowImportForm(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target.result;
      const rows = csvText.split('\n').filter(row => row.trim());

      console.log("Raw CSV Data:", rows);
      
      // Skip header row and parse data
      const parsedData = rows.slice(1).map(row => {
        const columns = row.split(',');
        return {
          studentId: columns[0]?.trim(),
          studentName: columns[1]?.trim(),
          grade: columns[2]?.trim()
        };
      }).filter(item => item.studentId && item.grade);

      console.log("Parsed CSV Data:", parsedData);
      
      setCsvData(parsedData);
    };
    
    reader.readAsText(file);
  };
  
  const processImport = () => {
    if (!csvData || !importAssignmentId) return;
    
    const aid = parseInt(importAssignmentId, 10);
    if (isNaN(aid)) return;
    
    // Update gradebook with imported data
    setGradebook(prev => {
      const updatedStudents = [...prev.students];
      
      csvData.forEach(row => {
        const studentId = parseInt(row.studentId, 10);
        const grade = parseFloat(row.grade);
        
        if (!isNaN(studentId) && !isNaN(grade)) {
          const studentIndex = updatedStudents.findIndex(s => s.id === studentId);
          if (studentIndex !== -1) {
            updatedStudents[studentIndex] = {
              ...updatedStudents[studentIndex],
              grades: {
                ...updatedStudents[studentIndex].grades,
                [aid]: grade
              }
            };
          }
        }
      });
      
      return {
        ...prev,
        students: updatedStudents
      };
    });
    
    // Reset import state
    setShowImportForm(false);
    setImportAssignmentId("");
    setCsvData(null);
    document.getElementById('csvFileInput').value = '';
  };
  
  const exportFullGradebook = () => {
    // Create header row with student info and all assignments
    let csvContent = "Student ID,Student Name,";
    gradebook.assignments.forEach(a => {
      csvContent += `${a.name},`;
    });
    csvContent += "Total Grade\n";
    
    // Add data for each student
    gradebook.students.forEach(student => {
      csvContent += `${student.id},${student.name},`;
      gradebook.assignments.forEach(a => {
        const grade = student.grades[a.id] !== undefined ? student.grades[a.id] : "";
        csvContent += `${grade},`;
      });
      const total = calculateStudentTotal(student);
      csvContent += `${total.weightedGrade}%\n`;
    });
    
    // Create and trigger download
    downloadCsv(csvContent, "Gradebook.csv");
    setShowExportForm(false);
  };
  
  const exportSingleAssignment = () => {
    if (!exportAssignmentId) return;
    
    const aid = parseInt(exportAssignmentId, 10);
    if (isNaN(aid)) return;
    
    const assignment = gradebook.assignments.find(a => a.id === aid);
    if (!assignment) return;
    
    // Create CSV content
    let csvContent = "Student ID,Student Name,Grade\n";
    
    gradebook.students.forEach(student => {
      const grade = student.grades[aid] !== undefined ? student.grades[aid] : "";
      csvContent += `${student.id},${student.name},${grade}\n`;
    });
    
    // Create and trigger download
    downloadCsv(csvContent, `${assignment.name.replace(/\\s+/g, '_')}_grades.csv`);
    setShowExportForm(false);
    setExportAssignmentId("");
  };
  
  const downloadCsv = (content, filename) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white cursor-pointer"
            >
              + Add Grade
            </Button>
            <Button
              variant="outline"
              className="px-4 py-2 rounded-lg border-gray-300 cursor-pointer hover:bg-amber-600 hover:text-white"
              onClick={() => document.getElementById('csvFileInput').click()}
            >
              <Upload className="w-4 h-4 mr-2" /> Import
              <input
                id="csvFileInput"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCsvImport}
              />
            </Button>
            <Button
              variant="outline"
              className="px-4 py-2 rounded-lg border-gray-300 cursor-pointer hover:bg-amber-600 hover:text-white"
              onClick={() => setShowExportForm(true)}
            >
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button
              variant="outline"
              className="px-4 py-2 rounded-lg border-gray-300 cursor-pointer hover:bg-amber-600 hover:text-white"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Report
            </Button>
          </div>
        </div>

        {/* Export Form */}
        {showExportForm && (
          <Card className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
            <CardHeader>
              <CardTitle>Export Grades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Export Options</h3>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      onClick={exportFullGradebook}
                      className="w-full justify-start rounded-lg hover:bg-amber-600 hover:text-white cursor-pointer"
                    >
                      <Download className="w-4 h-4 mr-2" /> Export Full Gradebook
                    </Button>
                    
                    <div className="pt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Export Single Assignment
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={exportAssignmentId}
                          onChange={(e) => setExportAssignmentId(e.target.value)}
                          className="block w-full rounded-lg border border-gray-300 h-10"
                        >
                          <option value="">Select assignment</option>
                          {gradebook.assignments.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                        <Button 
                          variant="outline" 
                          onClick={exportSingleAssignment}
                          disabled={!exportAssignmentId}
                          className="rounded-lg hover:bg-amber-600 hover:text-white cursor-pointer"
                        >
                          Export
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowExportForm(false);
                            setExportAssignmentId("");
                          }}
                          className="rounded-lg hover:bg-amber-600 hover:text-white cursor-pointer"
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Import CSV Form */}
        {showImportForm && (
          <Card className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
            <CardHeader>
              <CardTitle>Import Grades from CSV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  {csvData ? `${csvData.length} records found in CSV file.` : 'Processing CSV file...'}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  CSV format: File should have a header row followed by data rows with Student ID, Student Name, and Grade.
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Assignment for Import
                </label>
                <select
                  value={importAssignmentId}
                  onChange={(e) => setImportAssignmentId(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 h-10"
                >
                  <option value="">Select assignment</option>
                  {gradebook.assignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportForm(false);
                    setCsvData(null);
                    document.getElementById('csvFileInput').value = '';
                  }}
                  className="rounded-lg hover:bg-amber-600 hover:text-white cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  variant="outline" 
                  onClick={processImport}
                  disabled={!csvData || !importAssignmentId}
                  className="rounded-lg hover:bg-amber-600 hover:text-white cursor-pointer"
                >
                  Import Grades
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
                    className="mt-1 block w-full rounded-lg border border-gray-300 h-10"
                  >
                    <option value="">Select Student</option>
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
                    className="mt-1 block w-full rounded-lg border border-gray-300 h-10"
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
                  className="rounded-lg hover:bg-amber-600 hover:text-white cursor-pointer"
                >
                  Cancel
                </Button>
                <Button variant="outline" onClick={handleAddGrade} className="rounded-lg hover:bg-amber-600 hover:text-white cursor-pointer">
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
                        {a.points} pts | Avg: {calculateAssignmentAverage(a.id)}% | Weight: {a.weight}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center bg-gray-50 px-6 py-3">
                    Grade
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
                        <div
                          className={`text-xs ${
                            totals.weightedGrade >= 90
                              ? "text-green-600"
                              : totals.weightedGrade >= 80
                              ? "text-blue-600"
                              : totals.weightedGrade >= 70
                              ? "text-yellow-600"
                              : totals.weightedGrade >= 60
                              ? "text-orange-600"
                              : "text-red-600"
                          }`}
                        >
                          {totals.weightedGrade}%
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
