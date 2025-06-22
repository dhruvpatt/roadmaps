import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AssignmentCreationModal({
  open,
  onClose,
  initialData = {},
  isEditing = false,
  onSave,
}) {
  const [formData, setFormData] = useState({
    title: initialData.title || "",
    description: initialData.description || "",
    instructions: initialData.instructions || "",
    due_date: initialData.due_date || "",
    points_possible: initialData.points_possible || "",
    assignment_type: initialData.assignment_type || "homework",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData({
      title: initialData.title || "",
      description: initialData.description || "",
      instructions: initialData.instructions || "",
      due_date: initialData.due_date || "",
      points_possible: initialData.points_possible || "",
      assignment_type: initialData.assignment_type || "homework",
    });
  }, [initialData]);

  const handleSubmit = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required.";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required.";
    }
    if (!formData.due_date) {
      newErrors.due_date = "Due date is required.";
    }
    if (!formData.points_possible || formData.points_possible <= 0) {
      newErrors.points_possible = "Points must be greater than 0.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    onSave(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[calc(100vh-64px)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "Edit Assignment" : "Create New Assignment"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Title */}
          <div>
            <label className="font-medium mb-1 block">Title</label>
            <Input
              value={formData.title}
              onChange={e => handleInputChange("title", e.target.value)}
              placeholder="Enter assignment title"
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="font-medium mb-1 block">Description</label>
            <Textarea
              rows={3}
              value={formData.description}
              onChange={e => handleInputChange("description", e.target.value)}
              placeholder="Enter assignment description"
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description}</p>
            )}
          </div>

          {/* Instructions */}
          <div>
            <label className="font-medium mb-1 block">Instructions (Optional)</label>
            <Textarea
              rows={4}
              value={formData.instructions}
              onChange={e => handleInputChange("instructions", e.target.value)}
              placeholder="Enter detailed instructions for the assignment"
            />
          </div>

          {/* Due Date and Points Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-medium mb-1 block">Due Date</label>
              <Input
                type="datetime-local"
                value={formData.due_date}
                onChange={e => handleInputChange("due_date", e.target.value)}
              />
              {errors.due_date && (
                <p className="text-sm text-red-500 mt-1">{errors.due_date}</p>
              )}
            </div>

            <div>
              <label className="font-medium mb-1 block">Points Possible</label>
              <Input
                type="number"
                min="1"
                value={formData.points_possible}
                onChange={e => handleInputChange("points_possible", parseInt(e.target.value) || "")}
                placeholder="100"
              />
              {errors.points_possible && (
                <p className="text-sm text-red-500 mt-1">{errors.points_possible}</p>
              )}
            </div>
          </div>

          {/* Assignment Type */}
          <div>
            <label className="font-medium mb-1 block">Assignment Type</label>
            <Select
              value={formData.assignment_type}
              onValueChange={value => handleInputChange("assignment_type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assignment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="homework">Homework</SelectItem>
                <SelectItem value="essay">Essay</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="project">Project</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-6 flex-row flex justify-end items-center gap-3">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>
            {isEditing ? "Update Assignment" : "Create Assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

AssignmentCreationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  isEditing: PropTypes.bool,
};