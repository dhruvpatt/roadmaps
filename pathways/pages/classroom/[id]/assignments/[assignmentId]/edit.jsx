"use client";

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, FileText } from "lucide-react";

// In a real app you would fetch this from an API
const fetchAssignment = async (classroomId, assignmentId) => {
  // mock delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: assignmentId,
        title: "Photosynthesis Lab Report",
        description: "Include observations, data analysis, and conclusions.",
        dueDate: "2025-01-28T18:59:00Z",
        points: 100,
      });
    }, 300);
  });
};

export default function AssignmentEditPage() {
  const router = useRouter();
  const { id: classroomId, assignmentId } = router.query;
  const [assignment, setAssignment] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    points: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await fetchAssignment(classroomId, assignmentId);
      setAssignment(data);
      setForm({
        title: data.title,
        description: data.description,
        dueDate: data.dueDate.slice(0, 16),
        points: data.points,
      });
      setLoading(false);
    })();
  }, [classroomId, assignmentId]);

  const handleSave = async () => {
    // send form to API
    console.log("Saving assignment:", form);
    // after success, navigate back to assignments list
    router.push(`/classrooms/${classroomId}/assignments`);
  };

  if (loading) {
    return <p className="text-center py-10">Loading…</p>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card className="bg-white shadow-sm border border-gray-200 rounded-lg shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Edit Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                value={form.points}
                onChange={(e) => setForm({ ...form, points: +e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

AssignmentEditPage.propTypes = {
  params: PropTypes.shape({
    id: PropTypes.string,
    assignmentId: PropTypes.string,
  }),
};
