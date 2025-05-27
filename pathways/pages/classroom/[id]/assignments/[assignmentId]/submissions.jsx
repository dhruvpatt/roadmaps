"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  Eye,
  Search,
  Filter,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  Star,
  MoreVertical,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const fetchSubmissions = async (classroomId, assignmentId) => {
  return [
    {
      id: 1,
      studentName: "Alice Johnson",
      studentEmail: "alice@school.edu",
      submittedAt: "2025-01-28T17:00:00Z",
      files: ["report.pdf", "analysis.xlsx"],
      grade: 92,
      feedback:
        "Excellent analysis! Your interpretation of the data shows deep understanding.",
      status: "graded",
      isLate: false,
      timeSpent: "3h 45m",
    },
    {
      id: 2,
      studentName: "Bob Smith",
      studentEmail: "bob@school.edu",
      submittedAt: "2025-01-28T18:30:00Z",
      files: ["report.docx"],
      grade: 85,
      feedback: "Good work, add more detail to conclusions.",
      status: "graded",
      isLate: true,
      timeSpent: "2h 30m",
    },
    {
      id: 3,
      studentName: "Carol Davis",
      studentEmail: "carol@school.edu",
      submittedAt: "2025-01-29T14:15:00Z",
      files: ["presentation.pptx", "notes.pdf"],
      grade: null,
      feedback: "",
      status: "submitted",
      isLate: false,
      timeSpent: "4h 20m",
    },
    {
      id: 4,
      studentName: "David Wilson",
      studentEmail: "david@school.edu",
      submittedAt: null,
      files: [],
      grade: null,
      feedback: "",
      status: "missing",
      isLate: true,
      timeSpent: "0h",
    },
  ];
};

const getStatusBadge = (status, isLate) => {
  const variants = {
    graded: {
      variant: "default",
      icon: CheckCircle,
      text: "Graded",
      className: "bg-green-100 text-green-800 border-green-200",
    },
    submitted: {
      variant: "secondary",
      icon: Clock,
      text: "Pending Review",
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
    missing: {
      variant: "destructive",
      icon: AlertCircle,
      text: "Missing",
      className: "bg-red-100 text-red-800 border-red-200",
    },
  };

  const config = variants[status];
  const Icon = config.icon;

  return (
    <div className="flex gap-2">
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
      {isLate && status !== "missing" && (
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-200"
        >
          Late
        </Badge>
      )}
    </div>
  );
};

export default function AssignmentSubmissionsPage() {
  const router = useRouter();
  const { id: classroomId, assignmentId } = router.query;
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    if (!router.isReady) return;
    (async () => {
      const data = await fetchSubmissions(classroomId, assignmentId);
      setSubmissions(data);
      setLoading(false);
    })();
  }, [router.isReady, classroomId, assignmentId]);

  const filteredAndSortedSubmissions = submissions
    .filter((s) => {
      const matchesSearch = s.studentName
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesFilter = filterStatus === "all" || s.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.studentName.localeCompare(b.studentName);
        case "grade":
          return (b.grade || 0) - (a.grade || 0);
        case "submitted":
          return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  const stats = {
    total: submissions.length,
    graded: submissions.filter((s) => s.status === "graded").length,
    pending: submissions.filter((s) => s.status === "submitted").length,
    missing: submissions.filter((s) => s.status === "missing").length,
    avgGrade:
      submissions.filter((s) => s.grade).reduce((acc, s) => acc + s.grade, 0) /
        submissions.filter((s) => s.grade).length || 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="mr-4"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Assignment Submissions
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Grades
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="border-2 border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">
                    Total Students
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Graded</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.graded}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pending}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Missing</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.missing}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Avg Grade</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.avgGrade.toFixed(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6 border-2 border-gray-100 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by student name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="graded">Graded</option>
                  <option value="submitted">Pending</option>
                  <option value="missing">Missing</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Sort by Name</option>
                  <option value="grade">Sort by Grade</option>
                  <option value="submitted">Sort by Submitted</option>
                  <option value="status">Sort by Status</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submissions List */}
        <div className="space-y-3">
          {filteredAndSortedSubmissions.map((sub) => (
            <Card
              key={sub.id}
              className="hover:shadow-lg transition-shadow border-2 border-gray-100 shadow-sm"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12 ring-2 ring-gray-200 bg-white text-black">
                      <AvatarFallback className=" text-black font-semibold">
                        {sub.studentName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {sub.studentName}
                        </h3>
                        {getStatusBadge(sub.status, sub.isLate)}
                      </div>
                      <p className="text-sm text-gray-500 mb-1">
                        {sub.studentEmail}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {sub.submittedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(sub.submittedAt).toLocaleString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {sub.timeSpent}
                        </span>
                        {sub.files.length > 0 && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {sub.files.length} file
                            {sub.files.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {sub.grade !== null && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {sub.grade}
                        </div>
                        <div className="text-xs text-gray-500">/ 100</div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {sub.status === "submitted" && (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Grade Now
                        </Button>
                      )}
                      {sub.status === "graded" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/classroom/${classroomId}/assignments/${assignmentId}/individualSubmission/${sub.id}`
                            )
                          }
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      )}
                      {sub.status === "missing" && (
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Remind
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {sub.feedback && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Feedback: </span>
                      {sub.feedback}
                    </p>
                  </div>
                )}

                {sub.files.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sub.files.map((file, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        <FileText className="w-3 h-3 mr-1" />
                        {file}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {filteredAndSortedSubmissions.length === 0 && (
            <Card className="border-2 border-gray-100 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Search className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No submissions found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter criteria.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
