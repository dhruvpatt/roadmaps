"use client";

import { useState } from "react";
import PropTypes from "prop-types";
import Link from "next/link";
import {
  Plus,
  FileQuestion,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock tests data
const mockTests = [
  {
    id: 1,
    title: "Photosynthesis Quiz",
    description:
      "Test your understanding of the photosynthesis process and its components. Covering light-dependent reactions, Calvin Cycle, and photosynthetic pigments.",
    questions: 15,
    timeLimit: 30,
    dueDate: "2025-01-30T23:59:00Z",
    points: 75,
    status: "published",
    attempts: 18,
    totalStudents: 25,
    studentAttempt: {
      completed: true,
      score: 68,
      completedAt: "2025-01-25T14:30:00Z",
      timeSpent: 25,
    },
  },
  {
    id: 2,
    title: "Cell Structure Test",
    description:
      "Comprehensive test on plant and animal cell structures and organelles. Identify functions of nucleus, mitochondria, chloroplasts, ER, and Golgi apparatus.",
    questions: 25,
    timeLimit: 45,
    dueDate: "2025-02-05T23:59:00Z",
    points: 100,
    status: "published",
    attempts: 5,
    totalStudents: 25,
    studentAttempt: null,
  },
  {
    id: 3,
    title: "Midterm Exam",
    description:
      "Comprehensive midterm covering chapters 1–5: Biochemistry, Cell Structure, Genetics, Evolution, and Ecology.",
    questions: 50,
    timeLimit: 90,
    dueDate: "2025-02-15T23:59:00Z",
    points: 200,
    status: "draft",
    attempts: 0,
    totalStudents: 25,
    studentAttempt: null,
  },
];

export default function ClassroomTests({ classroom, isTeacher, user }) {
  const [tests, setTests] = useState(mockTests);

  // Delete a test
  const handleDeleteTest = (id) => {
    if (confirm("Delete this test?")) {
      setTests((prev) => prev.filter((x) => x.id !== id));
    }
  };

  // Teacher publishes a draft
  const handlePublishTest = (id) => {
    setTests((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status: "published" } : x))
    );
  };

  // Student starts a test
  const handleStartTest = (id) => {
    console.log("Start test", id);
  };

  // Teacher views results
  const handleViewResults = (id) => {
    console.log("View results", id);
  };

  // Badge logic with amber theme
  const getBadge = (t) => {
    if (isTeacher) {
      if (t.status === "draft")
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            Draft
          </Badge>
        );
      return (
        <Badge className="bg-cream-100 text-amber-900 border-amber-200">
          {t.attempts}/{t.totalStudents} completed
        </Badge>
      );
    }
    if (t.studentAttempt?.completed) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          Completed
        </Badge>
      );
    }
    if (t.status === "published") {
      return <Badge className="bg-amber-500 text-white">Available</Badge>;
    }
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200">
        Not Available
      </Badge>
    );
  };

  // Format ISO date → "Mon DD, YYYY HH:MM"
  const formatDate = (dt) =>
    new Date(dt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const isOverdue = (d) => new Date(d) < new Date();

  return (
    <section className="bg-gradient-to-br bg-white py-8">
      <div className="max-w-4xl mx-auto px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">
              Tests & Quizzes
            </h2>
          </div>
          {isTeacher && (
            <Link href="/create-test">
              <Button className="flex items-center gap-2 bg-amber-600 text-white hover:bg-amber-700 focus:ring-2 focus:ring-offset-1 focus:ring-amber-400 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="w-5 h-5" /> Create Test
              </Button>
            </Link>
          )}
        </div>

        {/* List of Tests */}
        <div className="space-y-6">
          {tests.map((test) => (
            <Card
              key={test.id}
              className="
                border border-gray-200 
                rounded-2xl shadow-lg 
                p-6 bg-white
                hover:shadow-xl hover:-translate-y-1
                transition-all duration-300
                backdrop-blur-sm
              "
            >
              {/* Header Row: Title + Badge + (Edit/Delete if teacher) */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div className="flex items-center gap-3 w-full sm:w-2/3">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <FileQuestion className="w-6 h-6 text-amber-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-black line-clamp-1 mb-1">
                      {test.title}
                    </h3>
                    <p className="text-gray-500 line-clamp-2 leading-relaxed">
                      {test.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3 sm:mt-0">
                  {getBadge(test)}
                  {isTeacher && (
                    <div className="flex items-center gap-1">
                      <Link href={`/create-test?edit=${test.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-700 hover:bg-amber-100 rounded-lg"
                          aria-label="Edit Test"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTest(test.id)}
                        className="text-red-600 hover:bg-red-50 rounded-lg"
                        aria-label="Delete Test"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex items-center gap-2 bg-amber-100 px-3 py-2 rounded-full text-sm font-medium text-amber-800">
                  <FileQuestion className="w-4 h-4" />
                  <span>{test.questions} Questions</span>
                </div>
                <div className="flex items-center gap-2 bg-amber-100 px-3 py-2 rounded-full text-sm font-medium text-amber-800">
                  <Clock className="w-4 h-4" />
                  <span>{test.timeLimit} minutes</span>
                </div>
                <div className="flex items-center gap-2 bg-amber-100 px-3 py-2 rounded-full text-sm font-medium text-amber-800">
                  <span>{test.points} points</span>
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                    isOverdue(test.dueDate)
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {isOverdue(test.dueDate) && (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span>Due {formatDate(test.dueDate)}</span>
                </div>
              </div>

              {/* Action Row */}
              {isTeacher ? (
                <div className="border-t border-amber-200 pt-4 flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => console.log("Edit questions", test.id)}
                    className="bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-400 border-amber-600 rounded-lg"
                  >
                    Edit Questions
                  </Button>
                  {test.status === "draft" ? (
                    <Button
                      size="sm"
                      onClick={() => handlePublishTest(test.id)}
                      className="bg-green-600 text-white hover:bg-green-700 focus:ring-green-400 rounded-lg"
                    >
                      Publish
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewResults(test.id)}
                      className="hover:bg-amber-50 border-amber-300 text-amber-700 rounded-lg"
                    >
                      <Eye className="w-4 h-4 mr-2" /> Results ({test.attempts})
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border-t border-amber-200 pt-4">
                  {test.studentAttempt?.completed ? (
                    <div className="flex flex-col gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center gap-2 text-green-700 font-medium">
                        <CheckCircle className="w-5 h-5" />
                        <span>
                          Completed on{" "}
                          {formatDate(test.studentAttempt.completedAt)}
                        </span>
                      </div>
                      <div className="text-amber-900">
                        Score:{" "}
                        <span className="font-bold text-amber-700">
                          {test.studentAttempt.score}/{test.points}
                        </span>
                      </div>
                      <div className="text-amber-700">
                        Time Spent: {test.studentAttempt.timeSpent} minutes
                      </div>
                    </div>
                  ) : test.status === "published" ? (
                    <Button
                      onClick={() => handleStartTest(test.id)}
                      className="flex items-center gap-2 bg-amber-600 text-white hover:bg-amber-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Play className="w-4 h-4" /> Start Test
                    </Button>
                  ) : (
                    <div className="text-amber-600 font-medium p-3 bg-amber-50 rounded-lg border border-amber-200">
                      Not Available
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

ClassroomTests.propTypes = {
  classroom: PropTypes.object,
  isTeacher: PropTypes.bool,
  user: PropTypes.shape({ name: PropTypes.string }),
};
