"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SubmissionDetailPage() {
  const router = useRouter();
  const { submissionId, classroomId, assignmentId } = router.query;
  const [submission, setSubmission] = useState(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!router.isReady) return;
    // Simulate API
    const fetchSubmission = async () => {
      const data = {
        id: submissionId,
        studentName: "Alice Johnson",
        submittedAt: "2025-01-28T17:00:00Z",
        files: ["report.pdf"],
        grade: 92,
        feedback: "Excellent analysis!",
      };
      setSubmission(data);
      setGrade(data.grade);
      setFeedback(data.feedback);
    };
    fetchSubmission();
  }, [router.isReady, submissionId]);

  const handleSave = () => {
    // Submit feedback & grade to backend
    console.log("Saving:", { grade, feedback });
    router.push(
      `/assignment-submissions?id=${classroomId}&assignmentId=${assignmentId}`
    );
  };

  if (!submission) return <p className="py-10 text-center">Loading…</p>;

  return (
    <div className="max-w-3xl mx-auto py-6">
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
        <h1 className="text-2xl font-semibold ml-3">Grade Submission</h1>
      </div>

      <Card>
        <CardHeader>
          <div>
            <p className="font-medium text-lg">{submission.studentName}</p>
            <p className="text-sm text-gray-500">
              Submitted {new Date(submission.submittedAt).toLocaleString()}
            </p>
            <p className="text-sm mt-1">Files: {submission.files.join(", ")}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Grade</Label>
            <Input
              type="number"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <div>
            <Label>Feedback</Label>
            <Textarea
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
