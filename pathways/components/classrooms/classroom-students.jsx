"use client";

import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  ChevronDown,
  ChevronUp,
  Mail,
  UserPlus,
  Download,
  BarChart3,
  MessageSquare,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

// Mock data for students
const mockStudents = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    enrolledAt: "2025-01-15T10:00:00Z",
    lastActive: "2025-01-25T14:30:00Z",
    progress: 85,
    notes: [
      "Excellent participation in class discussions",
      "Needs help with lab techniques",
    ],
    analytics: {
      assignmentsCompleted: 8,
      assignmentsTotal: 10,
      averageGrade: 92,
      timeSpentLearning: 45,
      engagementScore: 95,
      strugglingTopics: ["Cell Division"],
      strongTopics: ["Photosynthesis", "Genetics"],
    },
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@example.com",
    enrolledAt: "2025-01-15T10:00:00Z",
    lastActive: "2025-01-24T16:45:00Z",
    progress: 72,
    notes: ["Quiet but attentive", "Improving steadily"],
    analytics: {
      assignmentsCompleted: 7,
      assignmentsTotal: 10,
      averageGrade: 78,
      timeSpentLearning: 32,
      engagementScore: 68,
      strugglingTopics: ["Molecular Biology", "Cell Division"],
      strongTopics: ["Ecology"],
    },
  },
  {
    id: 3,
    name: "Carol Davis",
    email: "carol@example.com",
    enrolledAt: "2025-01-15T10:00:00Z",
    lastActive: "2025-01-25T12:20:00Z",
    progress: 94,
    notes: ["Top performer", "Helps other students"],
    analytics: {
      assignmentsCompleted: 10,
      assignmentsTotal: 10,
      averageGrade: 96,
      timeSpentLearning: 52,
      engagementScore: 98,
      strugglingTopics: [],
      strongTopics: ["All topics"],
    },
  },
];

export default function ClassroomStudents({ classroom, user }) {
  const [students, setStudents] = useState(mockStudents);
  const [expandedRows, setExpandedRows] = useState({});
  const [newNotes, setNewNotes] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  const router = useRouter();


  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNoteChange = (id, val) => {
    setNewNotes((prev) => ({ ...prev, [id]: val }));
  };

  const handleAddNote = (id) => {
    if (!newNotes[id]) return;
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, notes: [...s.notes, newNotes[id]] } : s
      )
    );
    setNewNotes((prev) => ({ ...prev, [id]: "" }));
  };

  const handleInvite = () => {
    console.log("Invite students");
  };

  const handleExport = () => {
    console.log("Export list");
  };

  const handleEmail = (email) => {
    console.log("Email:", email);
  };

  const handleMessage = (id) => {
    console.log("Message:", id);
  };

  const handleViewAnalytics = (id) => {
    router.push(`/analytics/${id}`);
  };

  const getBadge = (score) => {
    if (score >= 90)
      return <Badge className="bg-green-100 text-green-800">High</Badge>;
    if (score >= 70)
      return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low</Badge>;
  };

  const progressColor = (p) => {
    if (p >= 90) return "bg-green-500";
    if (p >= 80) return "bg-blue-500";
    if (p >= 70) return "bg-yellow-500";
    if (p >= 60) return "bg-orange-500";
    return "bg-red-500";
  };

  const formatDate = (dt) =>
    new Date(dt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Pagination
  const last = currentPage * studentsPerPage;
  const first = last - studentsPerPage;
  const pageStudents = students.slice(first, last);
  const totalPages = Math.ceil(students.length / studentsPerPage);

  return (
    <section className="bg-gray-50 min-h-screen py-6">
      <div className="max-w-6xl mx-auto px-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-medium text-gray-900">Students</h2>
            <p className="text-gray-700">Manage and track student progress</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleInvite}>
              <UserPlus /> Invite
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download /> Export
            </Button>
          </div>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold">{students.length}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold">
                {Math.round(
                  students.reduce((a, s) => a + s.analytics.averageGrade, 0) /
                  students.length
                )}
                %
              </div>
              <div className="text-sm text-gray-600">Avg Grade</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold">
                {Math.round(
                  students.reduce(
                    (a, s) => a + s.analytics.engagementScore,
                    0
                  ) / students.length
                )}
                %
              </div>
              <div className="text-sm text-gray-600">Avg Engage</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold">
                {
                  students.filter(
                    (s) =>
                      s.analytics.assignmentsCompleted ===
                      s.analytics.assignmentsTotal
                  ).length
                }
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Students */}
        <div className="space-y-4">
          {pageStudents.map((student) => (
            <Card
              key={student.id}
              className="p-4 shadow-sm rounded-lg bg-white"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRow(student.id)}
                  >
                    {expandedRows[student.id] ? <ChevronUp /> : <ChevronDown />}
                  </Button>
                  <div>
                    <div className="font-medium text-gray-900">
                      {student.name}
                    </div>
                    <div className="text-sm text-gray-500">{student.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`${progressColor(student.progress)} h-full`}
                        style={{ width: `${student.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold">
                      {student.progress}%
                    </span>
                  </div>
                  <div>{getBadge(student.analytics.engagementScore)}</div>
                  <div className="text-sm text-gray-600">
                    {formatDate(student.lastActive)}
                  </div>
                </div>
              </div>
              {expandedRows[student.id] && (
                <div className="mt-4 space-y-6">
                  {/* Analytics */}
                  <div>
                    <h4 className="flex items-center gap-2 font-medium text-gray-900 mb-2">
                      <BarChart3 /> Analytics
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="font-bold text-blue-600">
                          {student.analytics.assignmentsCompleted}/
                          {student.analytics.assignmentsTotal}
                        </div>
                        <div className="text-xs text-gray-600">Assignments</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="font-bold text-green-600">
                          {student.analytics.timeSpentLearning}h
                        </div>
                        <div className="text-xs text-gray-600">Time Spent</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="font-bold text-purple-600">
                          {student.analytics.strongTopics.length}
                        </div>
                        <div className="text-xs text-gray-600">Strong</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="font-bold text-orange-600">
                          {student.analytics.strugglingTopics.length}
                        </div>
                        <div className="text-xs text-gray-600">Needs Help</div>
                      </div>
                    </div>
                  </div>
                  {/* Notes */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700 mb-3 space-y-1">
                      {student.notes.map((note, i) => (
                        <li key={i}>{note}</li>
                      ))}
                    </ul>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add note..."
                        value={newNotes[student.id] || ""}
                        onChange={(e) =>
                          handleNoteChange(student.id, e.target.value)
                        }
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddNote(student.id)}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEmail(student.email)}
                    >
                      <Mail /> Email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMessage(student.id)}
                    >
                      <MessageSquare /> Message
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAnalytics(student.id)}
                    >
                      <BarChart3 /> Full Analytics
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing {first + 1}–{Math.min(last, students.length)} of{" "}
            {students.length}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

ClassroomStudents.propTypes = {
  classroom: PropTypes.object,
  user: PropTypes.object,
};
