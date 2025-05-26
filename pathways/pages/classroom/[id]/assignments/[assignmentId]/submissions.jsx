"use client";

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// Mock fetch for submissions
const fetchSubmissions = async (classroomId, assignmentId) => {
  // Replace with real API call
  return [
    {
      id: 1,
      studentName: "Alice Johnson",
      submittedAt: "2025-01-28T17:00:00Z",
      files: ["report.pdf"],
      grade: 92,
      feedback: "Excellent analysis!",
    },
    {
      id: 2,
      studentName: "Bob Smith",
      submittedAt: "2025-01-28T18:30:00Z",
      files: ["report.docx"],
      grade: 85,
      feedback: "Good work, add more detail to conclusions.",
    },
  ];
};

export default function AssignmentSubmissionsPage() {
  const router = useRouter();
  const { id: classroomId, assignmentId } = router.query;
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;
    (async () => {
      const data = await fetchSubmissions(classroomId, assignmentId);
      setSubmissions(data);
      setLoading(false);
    })();
  }, [router.isReady, classroomId, assignmentId]);

  if (loading) {
    return <p className="text-center py-10">Loading submissions…</p>;
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      {/* Back Button & Title */}
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Go back"
          className="text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-semibold ml-3">Submissions</h1>
      </div>

      <div className="space-y-4">
        {submissions.map((sub) => (
          <Card key={sub.id} className="border border-gray-200 rounded-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 ring-2 ring-gray-300">
                    {/* replace with actual avatar URL if available */}
                    <AvatarFallback>{sub.studentName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-gray-900">
                      {sub.studentName}
                    </div>
                    <div className="text-sm text-gray-500">
                      Submitted {new Date(sub.submittedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-700">
                    Grade: {sub.grade}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="mb-2">
                <Label className="text-sm">Files</Label>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {sub.files.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
              <div>
                <Label className="text-sm">Feedback</Label>
                <p className="text-gray-700 mt-1">{sub.feedback}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {submissions.length === 0 && (
          <p className="text-center text-gray-500 py-10">No submissions yet.</p>
        )}
      </div>
    </div>
  );
}

AssignmentSubmissionsPage.propTypes = {
  classroom: PropTypes.object,
  assignmentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
