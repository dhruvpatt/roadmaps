"use client";

import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Plus,
  FileText,
  Video,
  ImageIcon,
  File,
  Edit,
  Trash2,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Sample data including a PowerPoint example
const mockMaterials = [
  {
    id: 1,
    title: "Course Syllabus",
    description:
      "Complete course syllabus for Biology 101. This document outlines all topics, grading policies, and schedule for the semester.",
    type: "document",
    url: "https://example.com/syllabus.pdf",
    uploadedAt: "2025-01-15T10:00:00Z",
    uploadedBy: "Ms. Johnson",
  },
  {
    id: 2,
    title: "Photosynthesis Process Video",
    description:
      "Educational video explaining the photosynthesis process in detail.",
    type: "video",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    uploadedAt: "2025-01-18T14:30:00Z",
    uploadedBy: "Ms. Johnson",
  },
  {
    id: 3,
    title: "Cell Structure Diagram",
    description:
      "High-resolution diagram showing plant and animal cell structures.",
    type: "image",
    url: "https://example.com/cell_structure.png",
    uploadedAt: "2025-01-20T09:15:00Z",
    uploadedBy: "Ms. Johnson",
  },
  {
    id: 4,
    title: "Lab Safety Guidelines",
    description:
      "Important safety guidelines for laboratory work, including proper handling of reagents and emergency protocols.",
    type: "document",
    url: "https://example.com/lab_safety.pdf",
    uploadedAt: "2025-01-16T11:45:00Z",
    uploadedBy: "Ms. Johnson",
  },
  {
    id: 5,
    title: "Lecture Slides - Chapter 1",
    description:
      "PowerPoint slides covering Chapter 1: Introduction to Biology, with diagrams and key concepts.",
    type: "ppt",
    url: "https://example.com/chapter1_slides.pptx",
    uploadedAt: "2025-01-22T08:30:00Z",
    uploadedBy: "Ms. Johnson",
  },
];

export default function ClassroomMaterials({ classroom, isTeacher, user }) {
  const [materials, setMaterials] = useState(mockMaterials);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    description: "",
    type: "document",
    url: "",
  });
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Reset form and close modal
  const resetForm = () => {
    setNewMaterial({ title: "", description: "", type: "document", url: "" });
    setEditingId(null);
    setShowModal(false);
  };

  // Add new material
  const handleUpload = () => {
    const timestamp = Date.now();
    const material = {
      id: timestamp,
      ...newMaterial,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.name || "Current User",
    };
    setMaterials((prev) => [material, ...prev]);
    resetForm();
  };

  // Prefill form for editing
  const handleEdit = (id) => {
    const mat = materials.find((m) => m.id === id);
    if (!mat) return;
    setNewMaterial({
      title: mat.title,
      description: mat.description,
      type: mat.type,
      url: mat.url,
    });
    setEditingId(id);
    setShowModal(true);
  };

  // Update existing material
  const handleUpdate = () => {
    setMaterials((prev) =>
      prev.map((m) =>
        m.id === editingId
          ? {
              ...m,
              title: newMaterial.title,
              description: newMaterial.description,
              type: newMaterial.type,
              url: newMaterial.url,
            }
          : m
      )
    );
    resetForm();
  };

  // Delete a material
  const handleDelete = (id) => {
    if (confirm("Delete this resource?")) {
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    }
  };

  // Format ISO date → "Mon DD, YYYY"
  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  // Render an icon in a fixed 12×12 circle
  const iconByType = (type) => {
    const base = "w-6 h-6";
    if (type === "video")
      return (
        <div className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-full">
          <Video className={`${base} text-red-600`} />
        </div>
      );
    if (type === "image")
      return (
        <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full">
          <ImageIcon className={`${base} text-green-600`} />
        </div>
      );
    if (type === "ppt")
      return (
        <div className="w-12 h-12 flex items-center justify-center bg-yellow-100 rounded-full">
          <File className={`${base} text-yellow-600`} />
        </div>
      );
    // document
    return (
      <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full">
        <FileText className={`${base} text-blue-600`} />
      </div>
    );
  };

  // Filter by type, then by search term
  const byType =
    filterType === "all"
      ? materials
      : materials.filter((m) => m.type === filterType);

  const filtered = byType.filter((m) => {
    const text = (m.title + " " + m.description).toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  // Render a smaller preview on the card:
  // - Image: cropped thumbnail (h-32)
  // - Video: embed frame (h-32)
  // - Document/PPT: show generic icon + filename (h-32)
  const renderCardPreview = (mat) => {
    if (!mat.url) return null;
    if (mat.type === "image") {
      return (
        <div className="w-full h-32 overflow-hidden mb-4 rounded-lg border border-gray-200">
          <img
            src={mat.url}
            alt={mat.title}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
    if (mat.type === "video") {
      return (
        <div className="w-full h-32 mb-4 rounded-lg overflow-hidden border border-gray-200">
          <iframe
            src={mat.url}
            title={mat.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    if (mat.type === "document" || mat.type === "ppt") {
      const filename = mat.url.split("/").pop();
      return (
        <div className="w-full h-32 flex flex-col items-center justify-center mb-4 rounded-lg border border-gray-200 bg-gray-50 p-2">
          <FileText className="w-10 h-10 text-gray-400 mb-1" />
          <p className="text-xs text-gray-600 mb-1 line-clamp-1">{filename}</p>
          <a
            href={mat.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline text-xs"
          >
            Preview
          </a>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="bg-white min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        {/* ===== HEADER ===== */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-black">Materials</h2>
            <p className="text-gray-600">Course resources and files</p>
          </div>
          {isTeacher && (
            <Button
              className="flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 rounded-lg"
              onClick={() => {
                setEditingId(null);
                setNewMaterial({
                  title: "",
                  description: "",
                  type: "document",
                  url: "",
                });
                setShowModal(true);
              }}
            >
              <Plus className="w-5 h-5" /> Add Resource
            </Button>
          )}
        </div>

        {/* ===== FILTER + SEARCH ===== */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <Label htmlFor="filter" className="text-gray-700">
              Filter:
            </Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48 ring-1 ring-gray-200 rounded-lg hover:ring-gray-300 focus:ring-blue-300">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="ppt">PowerPoints</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center w-full sm:w-auto space-x-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 ring-1 ring-gray-200 rounded-lg focus:ring-blue-300"
            />
          </div>
        </div>

        {/* ===== GRID OF CARDS ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((mat) => (
            <Card
              key={mat.id}
              className="
                flex flex-col justify-between 
                border border-gray-200 
                rounded-2xl 
                shadow-sm 
                p-6 bg-white
                hover:shadow-md 
                hover:-translate-y-1 
                transition-transform transition-shadow
              "
            >
              {/* ICON + TITLE / DESCRIPTION */}
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {iconByType(mat.type)}
                    <div>
                      <h3 className="font-semibold text-gray-800 line-clamp-2">
                        {mat.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {mat.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* AUTHOR & DATE */}
                <div className="text-xs text-gray-500 mb-3">
                  <div>By {mat.uploadedBy}</div>
                  <div>{formatDate(mat.uploadedAt)}</div>
                </div>

                {/* CARD PREVIEW */}
                {renderCardPreview(mat)}
              </div>

              {/* ROW: VIEW, EDIT, DELETE */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(mat.url, "_blank")}
                  className="
                    flex-1 
                    text-gray-700 border-gray-300 
                    hover:bg-gray-100 
                    focus:ring-1 focus:ring-gray-300 
                    rounded-lg
                  "
                >
                  View
                </Button>
                {isTeacher && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(mat.id)}
                      className="text-blue-500 hover:bg-blue-50 rounded-md"
                    >
                      <Edit className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(mat.id)}
                      className="text-red-500 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* ===== NO MATERIALS FOUND ===== */}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">
              No materials found
            </h3>
            <p className="text-gray-500 mt-2">
              {filterType === "all"
                ? "No resources uploaded yet."
                : `No ${filterType}s available.`}
            </p>
          </div>
        )}
      </div>

      {showModal && isTeacher && (
        <div
          className="
      fixed inset-0 
      bg-transparent 
      flex items-center justify-center 
      z-50
    "
          onClick={resetForm}
        >
          <div
            className="
        rounded-2xl shadow-xl 
        w-full max-w-3xl 
        overflow-auto max-h-[90vh] 
        p-8 
        bg-white 
        border border-gray-200
      "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-medium text-gray-800">
                {editingId ? "Edit Resource" : "Add New Material"}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="space-y-8">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="modal-title" className="text-gray-700">
                  Title
                </Label>
                <Input
                  id="modal-title"
                  placeholder="Enter resource title"
                  value={newMaterial.title}
                  onChange={(e) =>
                    setNewMaterial({ ...newMaterial, title: e.target.value })
                  }
                  className="ring-1 ring-gray-200 rounded-lg focus:ring-blue-300 bg-white py-3 px-4 text-lg"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="modal-description" className="text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="modal-description"
                  placeholder="Enter a detailed description"
                  value={newMaterial.description}
                  onChange={(e) =>
                    setNewMaterial({
                      ...newMaterial,
                      description: e.target.value,
                    })
                  }
                  className="ring-1 ring-gray-200 rounded-lg focus:ring-blue-300 bg-white py-3 px-4 text-lg"
                  rows={5}
                />
              </div>

              {/* URL Link */}
              <div className="space-y-2">
                <Label htmlFor="modal-url" className="text-gray-700">
                  Resource Link
                </Label>
                <Input
                  id="modal-url"
                  placeholder="Paste link (e.g., YouTube embed, PDF, PPT)"
                  value={newMaterial.url}
                  onChange={(e) =>
                    setNewMaterial({ ...newMaterial, url: e.target.value })
                  }
                  className="ring-1 ring-gray-200 rounded-lg focus:ring-blue-300 bg-white py-3 px-4 text-lg"
                />
                <p className="text-xs text-gray-500">
                  For video, use an embeddable link (e.g., YouTube “embed” URL).
                  For documents or PowerPoints, paste a direct PDF/PPT or cloud
                  preview link.
                </p>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="modal-type" className="text-gray-700">
                  Type
                </Label>
                <Select
                  value={newMaterial.type}
                  onValueChange={(v) =>
                    setNewMaterial({ ...newMaterial, type: v })
                  }
                >
                  <SelectTrigger className="ring-1 ring-gray-200 rounded-lg hover:ring-gray-300 focus:ring-blue-300 bg-white py-3 px-4 text-lg">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="ppt">PowerPoint</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-6">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="text-gray-700 border-gray-300 hover:bg-gray-100 focus:ring-1 focus:ring-gray-300 rounded-lg px-6 py-3"
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingId ? handleUpdate : handleUpload}
                  className="bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 rounded-lg px-6 py-3 text-lg"
                >
                  {editingId ? "Update" : "Add"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

ClassroomMaterials.propTypes = {
  classroom: PropTypes.object,
  isTeacher: PropTypes.bool,
  user: PropTypes.shape({ name: PropTypes.string }),
};
