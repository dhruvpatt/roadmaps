"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Users,
  Clock,
  Target,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Mock test results data
const mockTestData = {
  id: 1,
  title: "Photosynthesis Quiz",
  description:
    "Test your understanding of the photosynthesis process and its components.",
  questions: 15,
  timeLimit: 30,
  points: 75,
  dueDate: "2025-01-30T23:59:00Z",
  createdAt: "2025-01-20T10:00:00Z",
  totalStudents: 25,
  completedStudents: 18,
  averageScore: 62.3,
  averageTime: 23.5,
  passRate: 72,
};

const mockStudentResults = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@school.edu",
    score: 68,
    percentage: 90.7,
    timeSpent: 25,
    completedAt: "2025-01-25T14:30:00Z",
    status: "completed",
    correctAnswers: 13,
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@school.edu",
    score: 71,
    percentage: 94.7,
    timeSpent: 22,
    completedAt: "2025-01-25T15:45:00Z",
    status: "completed",
    correctAnswers: 14,
  },
  {
    id: 3,
    name: "Carol Davis",
    email: "carol@school.edu",
    score: 45,
    percentage: 60.0,
    timeSpent: 28,
    completedAt: "2025-01-26T09:15:00Z",
    status: "completed",
    correctAnswers: 9,
  },
  {
    id: 4,
    name: "David Wilson",
    email: "david@school.edu",
    score: 0,
    percentage: 0,
    timeSpent: 0,
    completedAt: null,
    status: "not_started",
    correctAnswers: 0,
  },
  {
    id: 5,
    name: "Emma Brown",
    email: "emma@school.edu",
    score: 63,
    percentage: 84.0,
    timeSpent: 27,
    completedAt: "2025-01-27T11:20:00Z",
    status: "completed",
    correctAnswers: 12,
  },
];

const mockQuestionAnalysis = [
  {
    id: 1,
    question: "What is the primary function of chlorophyll?",
    correctRate: 85,
    difficulty: "Easy",
  },
  {
    id: 2,
    question: "Which stage of photosynthesis produces ATP?",
    correctRate: 72,
    difficulty: "Medium",
  },
  {
    id: 3,
    question: "What is the chemical formula for glucose?",
    correctRate: 94,
    difficulty: "Easy",
  },
  {
    id: 4,
    question: "Describe the Calvin Cycle process",
    correctRate: 45,
    difficulty: "Hard",
  },
  {
    id: 5,
    question: "What factors affect photosynthesis rate?",
    correctRate: 67,
    difficulty: "Medium",
  },
];

// Score distribution data for the bar chart
const scoreData = [
  { range: "90-100%", count: 4, fill: "hsl(var(--chart-1))" },
  { range: "80-89%", count: 6, fill: "hsl(var(--chart-2))" },
  { range: "70-79%", count: 5, fill: "hsl(var(--chart-3))" },
  { range: "60-69%", count: 2, fill: "hsl(var(--chart-4))" },
  { range: "Below 60%", count: 1, fill: "hsl(var(--chart-5))" },
];

const chartConfig = {
  count: {
    label: "Students",
  },
  "90-100%": {
    label: "90-100%",
    color: "hsl(var(--chart-1))",
  },
  "80-89%": {
    label: "80-89%",
    color: "hsl(var(--chart-2))",
  },
  "70-79%": {
    label: "70-79%",
    color: "hsl(var(--chart-3))",
  },
  "60-69%": {
    label: "60-69%",
    color: "hsl(var(--chart-4))",
  },
  "Below 60%": {
    label: "Below 60%",
    color: "hsl(var(--chart-5))",
  },
};

export default function TestResults() {
  const [activeTab, setActiveTab] = useState("overview");

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Completed
          </Badge>
        );
      case "not_started":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Not Started
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            In Progress
          </Badge>
        );
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/tests">
            <Button
              variant="ghost"
              size="sm"
              className="text-amber-700 hover:bg-amber-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tests
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-black">
              {mockTestData.title}
            </h1>
            <p className="text-gray-500 mt-1">{mockTestData.description}</p>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Export Results
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { id: "overview", label: "Overview" },
            { id: "students", label: "Student Results" },
            { id: "questions", label: "Question Analysis" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-amber-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Completion Rate</p>
                    <p className="text-2xl font-bold text-black">
                      {mockTestData.completedStudents}/
                      {mockTestData.totalStudents}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Average Score</p>
                    <p className="text-2xl font-bold text-black">
                      {mockTestData.averageScore}%
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg. Time</p>
                    <p className="text-2xl font-bold text-black">
                      {mockTestData.averageTime} min
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pass Rate</p>
                    <p className="text-2xl font-bold text-black">
                      {mockTestData.passRate}%
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Score Distribution Chart */}
            <Card className="p-6 border border-gray-200 rounded-xl">
              <h3 className="text-lg font-semibold text-black mb-4">
                Score Distribution
              </h3>
              <ChartContainer config={chartConfig} className="min-h-[300px]">
                <BarChart
                  accessibilityLayer
                  data={scoreData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <XAxis
                    dataKey="range"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    label={{
                      value: "Number of Students",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar
                    dataKey="count"
                    strokeWidth={2}
                    radius={8}
                    fill="var(--color-count)"
                  />
                </BarChart>
              </ChartContainer>
            </Card>
          </div>
        )}

        {/* Student Results Tab */}
        {activeTab === "students" && (
          <Card className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 font-semibold text-black">
                      Student
                    </th>
                    <th className="text-left p-4 font-semibold text-black">
                      Status
                    </th>
                    <th className="text-left p-4 font-semibold text-black">
                      Score
                    </th>
                    <th className="text-left p-4 font-semibold text-black">
                      Correct
                    </th>
                    <th className="text-left p-4 font-semibold text-black">
                      Time
                    </th>
                    <th className="text-left p-4 font-semibold text-black">
                      Completed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockStudentResults.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-black">
                            {student.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {student.email}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(student.status)}</td>
                      <td className="p-4">
                        {student.status === "completed" ? (
                          <div>
                            <span
                              className={`font-bold ${getScoreColor(
                                student.percentage
                              )}`}
                            >
                              {student.score}/{mockTestData.points}
                            </span>
                            <span className="text-gray-500 ml-2">
                              ({student.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {student.status === "completed" ? (
                          <span className="text-black">
                            {student.correctAnswers}/{mockTestData.questions}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {student.status === "completed" ? (
                          <span className="text-black">
                            {student.timeSpent} min
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {student.completedAt ? (
                          <span className="text-gray-600">
                            {formatDate(student.completedAt)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Question Analysis Tab */}
        {activeTab === "questions" && (
          <div className="space-y-4">
            {mockQuestionAnalysis.map((question) => (
              <Card
                key={question.id}
                className="p-6 border border-gray-200 rounded-xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-black mb-2">
                      Question {question.id}: {question.question}
                    </h4>
                    <div className="flex items-center gap-4">
                      <Badge
                        className={`${
                          question.difficulty === "Easy"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : question.difficulty === "Medium"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }`}
                      >
                        {question.difficulty}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {question.correctRate}% correct rate
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {question.correctRate >= 80 ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : question.correctRate >= 60 ? (
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      question.correctRate >= 80
                        ? "bg-green-500"
                        : question.correctRate >= 60
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${question.correctRate}%` }}
                  ></div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
