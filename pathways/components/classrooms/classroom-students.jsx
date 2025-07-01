"use client";

import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  ChevronDown,
  ChevronUp,
  Mail,
  UserPlus,
  Download,
  BarChart3,
  MessageSquare,
  Eye,
  FileText,
  Calendar,
  Target,
  Users,
  Award,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import fetchWithAuth from "@/lib/fetch_with_auth";
// Mock data for students with enriched analytics

export default function ClassroomStudents({ classroom, user }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});
  const [newNotes, setNewNotes] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const studentsPerPage = 10;
  const router = useRouter();

  useEffect(() => {
    if (!classroom?.id) return;

    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await fetchWithAuth(
          `/api/classrooms/${classroom.id}/students/`
        );
        if (!res.ok) {
          throw new Error("Failed to fetch students", res);
        }
        const data = await res.json(); // <── parse here

        console.log("Fetched students:", data);
        setStudents(data ?? []); // paginator-aware
      } catch (err) {
        console.error("Failed to load students:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [classroom?.id]);

  if (loading) {
    return (
      <section className="p-6 text-gray-500">Loading students&hellip;</section>
    );
  }

  const toggleRow = (id) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleNoteChange = (id, val) =>
    setNewNotes((prev) => ({ ...prev, [id]: val }));

  const handleDeleteNote = async (studentId, noteIndex) => {
    try {
      await fetchWithAuth(
        `/api/classrooms/${classroom.id}/students/${studentId}/delete_note/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ noteIndex }),
        }
      );

      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? {
                ...s,
                notes: s.notes.filter((_, i) => i !== noteIndex),
              }
            : s
        )
      );
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const handleAddNote = async (studentId) => {
    const note = newNotes[studentId];
    if (!note) return;

    try {
      const res = await fetchWithAuth(
        `/api/classrooms/${classroom.id}/students/${studentId}/notes/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: note }),
        }
      );

      if (!res.ok) throw new Error("Failed to add note");

      const updatedNotes = await res.json();

      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId ? { ...s, notes: updatedNotes } : s
        )
      );

      setNewNotes((prev) => ({ ...prev, [studentId]: "" }));
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  // Actions
  const handleInvite = () => console.log("Invite students");
  const handleExport = () => console.log("Export list");
  const handleViewAnalytics = (id) => router.push(`/analytics/${id}`);
  const handleBulkEmail = () => console.log("Bulk email to all students");
  const handleGenerateReport = () =>
    console.log("Generate class performance report");

  // Badge helper
  const getCompletionBadge = (rate) => {
    if (rate === 1)
      return <Badge className="bg-green-100 text-green-800">100%</Badge>;
    if (rate >= 0.8)
      return <Badge className="bg-blue-100 text-blue-800">80%+</Badge>;
    if (rate >= 0.6)
      return <Badge className="bg-amber-100 text-amber-800">60%+</Badge>;
    return <Badge className="bg-red-100 text-red-800">Below 60%</Badge>;
  };

  const formatDateTime = (dt) =>
    new Date(dt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Filtering
  const filteredStudents = students.filter((s) => {
    const matches =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matches) return false;
    if (filterBy === "high") return s.analytics.averageQuizScore >= 90;
    if (filterBy === "struggling") return s.analytics.averageQuizScore < 70;
    if (filterBy === "active") return s.analytics.forumPostsCount >= 10;
    return true;
  });

  // Pagination
  const last = currentPage * studentsPerPage;
  const first = last - studentsPerPage;
  const pageStudents = filteredStudents.slice(first, last);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  // Class averages
  const classAverages = {
    completionRate:
      (students.reduce(
        (sum, s) => sum + s.analytics.assignmentCompletionRate,
        0
      ) /
        students.length) *
      100,
    avgQuizScore:
      students.reduce((sum, s) => sum + s.analytics.averageQuizScore, 0) /
      students.length,
    avgForumPosts:
      students.reduce((sum, s) => sum + s.analytics.forumPostsCount, 0) /
      students.length,
  };

  return (
    <section className="bg-white py-8">
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">
              Class Dashboard
            </h2>
            <p className="text-gray-600">
              Overview of student performance metrics
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleBulkEmail}
              className="flex items-center gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl"
            >
              <Mail className="w-4 h-4" /> Email All
            </Button>
            <Button
              variant="outline"
              onClick={handleGenerateReport}
              className="flex items-center gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl"
            >
              <FileText className="w-4 h-4" /> Report
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="rounded-2xl shadow-lg border border-gray-200 bg-white hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-amber-100 rounded-xl w-fit mx-auto mb-3">
                <Users className="w-6 h-6 text-amber-700" />
              </div>
              <div className="text-2xl font-bold text-black">
                {students.length}
              </div>
              <div className="text-sm text-gray-600">Total Students</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-lg border border-gray-200 bg-white hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-green-100 rounded-xl w-fit mx-auto mb-3">
                <Award className="w-6 h-6 text-green-700" />
              </div>
              <div className="text-2xl font-bold text-black">
                {Math.round(classAverages.completionRate)}%
              </div>
              <div className="text-sm text-gray-600">Avg Completion</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-lg border border-gray-200 bg-white hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-blue-100 rounded-xl w-fit mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-blue-700" />
              </div>
              <div className="text-2xl font-bold text-black">
                {classAverages.avgQuizScore.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Avg Quiz Score</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-lg border border-gray-200 bg-white hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-purple-100 rounded-xl w-fit mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-purple-700" />
              </div>
              <div className="text-2xl font-bold text-black">
                {Math.round(classAverages.avgForumPosts)}
              </div>
              <div className="text-sm text-gray-600">Avg Forum Posts</div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl border-gray-300 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="all">All Students</option>
              <option value="high">High Performers</option>
              <option value="struggling">Needs Help</option>
              <option value="active">Highly Active Forums</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredStudents.length} student
            {filteredStudents.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Students List */}
        <div className="space-y-6">
          {pageStudents.map((student) => (
            <Card
              key={student.id}
              className="shadow-sm border border-gray-200 rounded-2xl p-6 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div className="flex items-center gap-3 w-full sm:w-2/3">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <Users className="w-6 h-6 text-amber-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-black mb-1">
                      {student.name}
                    </h3>
                    <p className="text-gray-500 text-sm">{student.email}</p>
                    <p className="text-gray-400 text-xs">
                      Last active: {formatDateTime(student.lastActive)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 sm:mt-0">
                  {getCompletionBadge(
                    student.analytics.assignmentCompletionRate
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRow(student.id)}
                    className="text-amber-700 hover:bg-amber-100 rounded-lg"
                  >
                    {expandedRows[student.id] ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex items-center gap-2 bg-amber-100 px-3 py-2 rounded-full text-sm font-medium text-amber-800">
                  <Award className="w-4 h-4" />
                  {student.analytics.averageQuizScore}% Avg Quiz
                </div>
                <div className="flex items-center gap-2 bg-amber-100 px-3 py-2 rounded-full text-sm font-medium text-amber-800">
                  <MessageSquare className="w-4 h-4" />
                  {student.analytics.forumPostsCount} Posts
                </div>
                <div className="flex items-center gap-2 bg-amber-100 px-3 py-2 rounded-full text-sm font-medium text-amber-800">
                  <Clock className="w-4 h-4" />
                  {student.analytics.totalTimeSpentHours}h Spent
                </div>
              </div>

              {/* Expanded Details */}
              {expandedRows[student.id] && (
                <div className="border-t border-amber-200 pt-6 space-y-6">
                  {/* Detailed Analytics */}
                  <div>
                    <h4 className="flex items-center gap-2 font-medium text-gray-900 mb-3">
                      <BarChart3 className="w-4 h-4" /> Detailed Analytics
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="p-3 bg-green-50 rounded-xl border border-green-200 text-center">
                        <div className="font-bold text-green-700 text-lg">
                          {Math.round(
                            student.analytics.assignmentCompletionRate * 100
                          )}
                          %
                        </div>
                        <div className="text-xs text-green-600">
                          Completion Rate
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
                        <div className="font-bold text-blue-700 text-lg">
                          {student.analytics.averageQuizScore}%
                        </div>
                        <div className="text-xs text-blue-600">Quiz Score</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-center">
                        <div className="font-bold text-purple-700 text-lg">
                          {student.analytics.forumPostsCount}
                        </div>
                        <div className="text-xs text-purple-600">
                          Forum Posts
                        </div>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-center">
                        <div className="font-bold text-orange-700 text-lg">
                          {student.analytics.liveSessionAttendance}
                        </div>
                        <div className="text-xs text-orange-600">
                          Live Sessions
                        </div>
                      </div>
                    </div>

                    {/* Topic Tags */}
                    {student.analytics.strongTopics.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-green-700 mb-2">
                          Strong Topics:
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {student.analytics.strongTopics.map((t, i) => (
                            <Badge
                              key={i}
                              className="bg-green-100 text-green-800 border-green-200"
                            >
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {student.analytics.strugglingTopics.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-red-700 mb-2">
                          Needs Help With:
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {student.analytics.strugglingTopics.map((t, i) => (
                            <Badge
                              key={i}
                              className="bg-red-100 text-red-800 border-red-200"
                            >
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Teacher Notes & Actions */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Teacher Notes
                    </h4>

                    {student.notes.length === 0 && (
                      <p className="text-sm text-gray-500 italic">
                        No notes yet.
                      </p>
                    )}

                    <div className="flex flex-col gap-2">
                      {student.notes.map((note, i) => (
                        <div
                          key={i}
                          className="relative p-3 bg-yellow-50 border border-yellow-300 rounded-xl shadow-sm"
                        >
                          <p className="text-sm text-gray-800 pr-10">{note}</p>
                          <button
                            onClick={() => handleDeleteNote(student.id, i)}
                            className="absolute top-2 right-3 text-red-600 text-xs hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Input
                        placeholder="Add a note..."
                        value={newNotes[student.id] || ""}
                        onChange={(e) =>
                          handleNoteChange(student.id, e.target.value)
                        }
                        className="rounded-xl border-gray-300 focus:ring-amber-500 focus:border-amber-500"
                      />
                      <Button
                        onClick={() => handleAddNote(student.id)}
                        className="bg-amber-600 text-white hover:bg-amber-700 rounded-xl"
                      >
                        Add
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 mt-5">
                      <Button
                        variant="outline"
                        onClick={() => handleViewAnalytics(student.id)}
                        className="flex items-center gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl"
                      >
                        <BarChart3 className="w-4 h-4" /> Full Analytics
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-6">
            <div className="text-sm text-gray-500">
              Showing {first + 1}–{Math.min(last, filteredStudents.length)} of{" "}
              {filteredStudents.length} students
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={
                        currentPage === page
                          ? "bg-amber-600 text-white hover:bg-amber-700 rounded-lg"
                          : "border-amber-300 text-amber-700 hover:bg-amber-50 rounded-lg"
                      }
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                className="border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

ClassroomStudents.propTypes = {
  classroom: PropTypes.object,
  user: PropTypes.object,
};
