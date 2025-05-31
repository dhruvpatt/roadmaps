"use client";

import React, { useState } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/navigation";
import { Plus, FileText, Calendar, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock assignments data
const mockAssignments = [
  {
    id: 1,
    title: "Photosynthesis Lab Report",
    dueDate: "2025-01-28T18:59:00Z",
    points: 100,
    submissions: 15,
    totalStudents: 25,
    status: "assigned",
  },
  {
    id: 2,
    title: "Cell Structure Diagram",
    dueDate: "2025-01-25T18:59:00Z",
    points: 50,
    submissions: 22,
    totalStudents: 25,
    status: "submitted",
  },
  {
    id: 3,
    title: "Chapter 2 Quiz",
    dueDate: "2025-01-22T18:59:00Z",
    points: 25,
    submissions: 25,
    totalStudents: 25,
    status: "graded",
  },
];

export default function ClassroomAssignments({ classroom, isTeacher }) {
  const [assignments] = useState(mockAssignments);
  const router = useRouter();

  const formatDate = (dt) =>
    new Date(dt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const statusColor = (status) => {
    switch (status) {
      case "assigned":
        return "text-gray-600";
      case "submitted":
        return "text-green-600";
      case "graded":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="bg-white min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Assignments
            </h1>
            <p className="text-gray-600">Manage and review assignments</p>
          </div>
          {isTeacher && (
            <Button
              size="sm"
              onClick={() =>
                router.push(`/classroom/${classroom.id}/assignments/new`)
              }
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" /> New Assignment
            </Button>
          )}
        </div>

        {/* List */}
        <div className="space-y-4">
          {assignments.map((a) => (
            <Card
              key={a.id}
              className="border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <CardHeader>
                {/* First row: title & details */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <FileText className={`w-6 h-6 ${statusColor(a.status)}`} />
                    <span className="text-lg font-medium text-gray-900">
                      {a.title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(a.dueDate)}</span>
                    </div>
                    <div>{a.points} pts</div>
                    {isTeacher && (
                      <Badge className="bg-gray-100 text-gray-800 rounded-full text-xs">
                        {a.submissions}/{a.totalStudents}
                      </Badge>
                    )}
                  </div>
                </div>
                {/* Second row: actions under title */}
                {isTeacher && (
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        router.push(
                          `/classroom/${classroom.id}/assignments/${a.id}/edit`
                        )
                      }
                      className="text-gray-500 hover:text-blue-600"
                    >
                      <Edit className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        router.push(
                          `/classroom/${classroom.id}/assignments/${a.id}/submissions`
                        )
                      }
                      aria-label="View submissions"
                      className="text-gray-500 hover:text-gray-800"
                    >
                      <Eye className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

ClassroomAssignments.propTypes = {
  classroom: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  isTeacher: PropTypes.bool,
};
