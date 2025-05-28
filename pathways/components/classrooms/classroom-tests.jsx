"use client";

import React, { useState } from "react";
import PropTypes from "prop-types";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Mock tests data
const mockTests = [
  {
    id: 1,
    title: "Photosynthesis Quiz",
    description:
      "Test your understanding of photosynthesis process and its components",
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
      "Comprehensive test on plant and animal cell structures and organelles",
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
    description: "Comprehensive midterm covering chapters 1-5",
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
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newTest, setNewTest] = useState({
    title: "",
    description: "",
    questions: 10,
    timeLimit: 30,
    points: 50,
    dueDate: "",
  });

  const resetForm = () => {
    setNewTest({
      title: "",
      description: "",
      questions: 10,
      timeLimit: 30,
      points: 50,
      dueDate: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleCreate = () => {
    const id = Date.now();
    const test = {
      id,
      ...newTest,
      status: "draft",
      attempts: 0,
      totalStudents: 25,
      studentAttempt: null,
    };
    setTests([test, ...tests]);
    resetForm();
  };

  const handleEdit = (id) => {
    const t = tests.find((x) => x.id === id);
    if (!t) return;
    setNewTest({
      title: t.title,
      description: t.description,
      questions: t.questions,
      timeLimit: t.timeLimit,
      points: t.points,
      dueDate: t.dueDate.slice(0, 16),
    });
    setEditingId(id);
    setShowForm(true);
  };

  const handleUpdate = () => {
    setTests(tests.map((x) => (x.id === editingId ? { ...x, ...newTest } : x)));
    resetForm();
  };

  const handleDelete = (id) => {
    if (confirm("Delete this test?")) {
      setTests(tests.filter((x) => x.id !== id));
    }
  };

  const handleStart = (id) => console.log("Start test", id);
  const handlePublish = (id) =>
    setTests(
      tests.map((x) => (x.id === id ? { ...x, status: "published" } : x))
    );
  const handleViewResults = (id) => console.log("View results", id);
  const handleEditQuestions = (id) => console.log("Edit questions", id);

  const getBadge = (t) => {
    if (isTeacher) {
      if (t.status === "draft")
        return <Badge className="rounded-lg">Draft</Badge>;
      return (
        <Badge className="rounded-lg">
          {t.attempts}/{t.totalStudents} completed
        </Badge>
      );
    }
    if (t.studentAttempt?.completed)
      return (
        <Badge className="bg-green-100 text-green-800 rounded-lg">
          Completed
        </Badge>
      );
    if (t.status === "published")
      return <Badge className="rounded-lg">Available</Badge>;
    return (
      <Badge className="rounded-lg" variant="outline">
        Not Available
      </Badge>
    );
  };

  const formatDate = (dt) =>
    new Date(dt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const isOverdue = (d) => new Date(d) < new Date();

  return (
    <section className="bg-gray-50 min-h-screen py-6">
      <div className="max-w-4xl mx-auto px-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-medium">Tests & Quizzes</h2>
            <p className="text-gray-600">
              Assess student understanding and progress
            </p>
          </div>
          {isTeacher && (
            <Button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition-colors"
            >
              <Plus />
              Create Test
            </Button>
          )}
        </div>
        {/* Form */}
        {showForm && isTeacher && (
          <Card className="shadow rounded-xl">
            <CardHeader>
              <CardTitle>{editingId ? "Edit Test" : "Create Test"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={newTest.title}
                  onChange={(e) =>
                    setNewTest({ ...newTest, title: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newTest.description}
                  onChange={(e) =>
                    setNewTest({ ...newTest, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Questions</Label>
                  <Input
                    type="number"
                    value={newTest.questions}
                    onChange={(e) =>
                      setNewTest({ ...newTest, questions: +e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Time (min)</Label>
                  <Input
                    type="number"
                    value={newTest.timeLimit}
                    onChange={(e) =>
                      setNewTest({ ...newTest, timeLimit: +e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Points</Label>
                  <Input
                    type="number"
                    value={newTest.points}
                    onChange={(e) =>
                      setNewTest({ ...newTest, points: +e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="datetime-local"
                    value={newTest.dueDate}
                    onChange={(e) =>
                      setNewTest({ ...newTest, dueDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline"  
                  className = "text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer"
                  onClick={resetForm}>
                    Cancel
                </Button>
                <Button 
                  onClick={editingId ? handleUpdate : handleCreate} 
                  variant="outline"
                  className="bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer">
                    {editingId ? "Update" : "Create"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Tests List */}
        <div className="space-y-6">
          {tests.map((test) => (
            <Card key={test.id} className="shadow rounded-xl p-6 bg-white">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
                  <FileQuestion className="w-6 h-6 text-purple-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900">{test.title}</h3>
                    <p className="text-gray-700 mt-1">{test.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getBadge(test)}
                  {isTeacher && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(test.id)}
                        className="text-blue-600 hover:bg-blue-50 cursor-pointer"
                      >
                        <Edit />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 cursor-pointer"
                        aria-label="Delete Test"
                        onClick={() => handleDelete(test.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                  <FileQuestion className="w-4 h-4" />
                  {test.questions} questions
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {test.timeLimit} min
                </span>
                <span>{test.points} points</span>
                <span
                  className={`${isOverdue(test.dueDate) ? "text-red-600" : ""} flex items-center`}
                >
                  {isOverdue(test.dueDate) && (
                    <AlertCircle className="w-4 h-4 text-red-600 ml-1" />
                  )}
                  <span>&nbsp; Due {formatDate(test.dueDate)}</span>
                </span>
              </div>
              {!isTeacher ? (
                <div className="border-t pt-4">
                  {test.studentAttempt?.completed ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle />
                        <span>
                          Completed on{" "}
                          {formatDate(test.studentAttempt.completedAt)}
                        </span>
                      </div>
                      <div>
                        Score:{" "}
                        <span className="text-blue-600">
                          {test.studentAttempt.score}/{test.points}
                        </span>
                      </div>
                      <div className="text-gray-600">
                        Time: {test.studentAttempt.timeSpent} min
                      </div>
                    </div>
                  ) : test.status === "published" ? (
                    <Button onClick={() => handleStart(test.id)}>
                      <Play className="mr-2" /> Start Test
                    </Button>
                  ) : (
                    <div className="text-gray-500">Not available</div>
                  )}
                </div>
              ) : (
                <div className="border-t pt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditQuestions(test.id)}
                    className="flex items-center gap-2 bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    Edit Questions
                  </Button>
                  {test.status === "draft" ? (
                    <Button 
                      size="sm" 
                      onClick={() => handlePublish(test.id)}
                      className="flex items-center gap-2 bg-green-600 text-white cursor-pointer hover:bg-green-700 transition-colors">
                        Publish
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewResults(test.id)}
                      className="cursor-pointer hover:bg-gray-200"
                    >
                      <Eye className="mr-1" /> Results ({test.attempts})
                    </Button>
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
  user: PropTypes.object,
};
