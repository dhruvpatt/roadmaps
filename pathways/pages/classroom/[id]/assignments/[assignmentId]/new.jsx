"use client";

import React, { useState } from "react";
import PropTypes from "prop-types";
import { useRouter, useParams } from "next/navigation";
import {
  Plus,
  FileText,
  Calendar as CalendarIcon,
  Attachment,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function NewAssignmentPage() {
  const router = useRouter();
  const { id: classroomId } = useParams();

  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [points, setPoints] = useState(100);
  const [attachments, setAttachments] = useState([]);
  const [rubric, setRubric] = useState([]);
  const [section, setSection] = useState("All students");
  const [publishImmediately, setPublishImmediately] = useState(true);

  const addAttachment = (files) => {
    setAttachments((prev) => [...prev, ...Array.from(files)]);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const addRubricRow = () => {
    setRubric((prev) => [...prev, { criterion: "", value: 0 }]);
  };

  const updateRubric = (idx, field, value) => {
    setRubric((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const handleSave = () => {
    const payload = {
      title,
      instructions,
      dueDate,
      points,
      attachments,
      rubric,
      section,
      publishImmediately,
    };
    console.log("Create assignment with:", payload);
    // TODO: send to API
    router.push(`/classrooms/${classroomId}/assignments`);
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card className="shadow-sm border border-gray-200 rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">New Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter assignment title"
            />
          </div>

          {/* Instructions */}
          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Detailed instructions for students"
            />
          </div>

          {/* Due date & points */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate">Due Date & Time</Label>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-gray-500" />
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                value={points}
                onChange={(e) => setPoints(+e.target.value)}
              />
            </div>
          </div>

          {/* Section selection */}
          <div>
            <Label>Assign to</Label>
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All students">All students</SelectItem>
                <SelectItem value="Group A">Group A</SelectItem>
                <SelectItem value="Group B">Group B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Attachments */}
          <div>
            <Label>Attachments</Label>
            <input
              id="files"
              type="file"
              multiple
              onChange={(e) => addAttachment(e.target.files)}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("files").click()}
            >
              <Attachment className="w-4 h-4 mr-1" /> Add files
            </Button>
            {attachments.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {attachments.map((f, i) => (
                  <li key={i} className="flex justify-between">
                    {f.name}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttachment(i)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Rubric builder */}
          <div>
            <Label>Grading Rubric</Label>
            {rubric.map((row, idx) => (
              <div key={idx} className="flex gap-2 items-center mt-2">
                <Input
                  placeholder="Criterion"
                  value={row.criterion}
                  onChange={(e) =>
                    updateRubric(idx, "criterion", e.target.value)
                  }
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Pts"
                  value={row.value}
                  onChange={(e) => updateRubric(idx, "value", +e.target.value)}
                  className="w-20"
                />
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={addRubricRow}
            >
              <Plus className="w-4 h-4 mr-1" /> Add criterion
            </Button>
          </div>

          {/* Publishing options */}
          <div className="flex items-center justify-between">
            <Label>Publish immediately</Label>
            <Switch
              checked={publishImmediately}
              onCheckedChange={setPublishImmediately}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Create</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

NewAssignmentPage.propTypes = {
  classroom: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
};
