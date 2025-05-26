"use client";

import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Plus,
  FileText,
  Video,
  ImageIcon,
  Download,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const mockMaterials = [
  {
    id: 1,
    title: "Course Syllabus",
    description: "Complete course syllabus for Biology 101",
    type: "document",
    fileUrl: "/syllabus.pdf",
    uploadedAt: "2025-01-15T10:00:00Z",
    uploadedBy: "Ms. Johnson",
    downloads: 25,
    views: 45,
  },
  {
    id: 2,
    title: "Photosynthesis Process Video",
    description:
      "Educational video explaining the photosynthesis process in detail",
    type: "video",
    fileUrl: "/photosynthesis.mp4",
    uploadedAt: "2025-01-18T14:30:00Z",
    uploadedBy: "Ms. Johnson",
    downloads: 0,
    views: 32,
  },
  {
    id: 3,
    title: "Cell Structure Diagram",
    description:
      "High-resolution diagram showing plant and animal cell structures",
    type: "image",
    fileUrl: "/cell_structure.png",
    uploadedAt: "2025-01-20T09:15:00Z",
    uploadedBy: "Ms. Johnson",
    downloads: 18,
    views: 28,
  },
  {
    id: 4,
    title: "Lab Safety Guidelines",
    description: "Important safety guidelines for laboratory work",
    type: "document",
    fileUrl: "/lab_safety.pdf",
    uploadedAt: "2025-01-16T11:45:00Z",
    uploadedBy: "Ms. Johnson",
    downloads: 23,
    views: 35,
  },
];

export default function ClassroomMaterials({ classroom, isTeacher, user }) {
  const [materials, setMaterials] = useState(mockMaterials);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    description: "",
    type: "document",
  });
  const [filterType, setFilterType] = useState("all");

  const resetForm = () => {
    setNewMaterial({ title: "", description: "", type: "document" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleUpload = () => {
    const timestamp = Date.now();
    const material = {
      id: timestamp,
      ...newMaterial,
      fileUrl: `/uploaded_${timestamp}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.name || "Current User",
      downloads: 0,
      views: 0,
    };
    setMaterials([material, ...materials]);
    resetForm();
  };

  const handleEdit = (id) => {
    const mat = materials.find((m) => m.id === id);
    if (!mat) return;
    setNewMaterial({
      title: mat.title,
      description: mat.description,
      type: mat.type,
    });
    setEditingId(id);
    setShowForm(true);
  };

  const handleUpdate = () => {
    setMaterials(
      materials.map((m) => (m.id === editingId ? { ...m, ...newMaterial } : m))
    );
    resetForm();
  };

  const handleDelete = (id) => {
    if (confirm("Delete this material?")) {
      setMaterials(materials.filter((m) => m.id !== id));
    }
  };

  const handleView = (id) => {
    setMaterials(
      materials.map((m) => (m.id === id ? { ...m, views: m.views + 1 } : m))
    );
  };
  const handleDownload = (id) => {
    setMaterials(
      materials.map((m) =>
        m.id === id ? { ...m, downloads: m.downloads + 1 } : m
      )
    );
  };

  const iconByType = (type) => {
    const base = "w-6 h-6";
    if (type === "video") return <Video className={`${base} text-red-600`} />;
    if (type === "image")
      return <ImageIcon className={`${base} text-green-600`} />;
    return <FileText className={`${base} text-blue-600`} />;
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const filtered =
    filterType === "all"
      ? materials
      : materials.filter((m) => m.type === filterType);

  return (
    <section className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold">Materials</h2>
            <p className="text-gray-600">Course resources and files</p>
          </div>
          {isTeacher && (
            <Button
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => setShowForm(true)}
            >
              <Plus /> {editingId ? "Edit Material" : "Upload Material"}
            </Button>
          )}
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-4">
          <Label htmlFor="filter">Filter:</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="image">Images</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Form */}
        {showForm && isTeacher && (
          <Card className="shadow rounded-xl">
            <CardHeader>
              <CardTitle>
                {editingId ? "Edit Material" : "Upload New Material"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newMaterial.title}
                  onChange={(e) =>
                    setNewMaterial({ ...newMaterial, title: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newMaterial.description}
                  onChange={(e) =>
                    setNewMaterial({
                      ...newMaterial,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={newMaterial.type}
                  onValueChange={(v) =>
                    setNewMaterial({ ...newMaterial, type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!editingId && (
                <div>
                  <Label htmlFor="file">File</Label>
                  <Input id="file" type="file" />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={editingId ? handleUpdate : handleUpload}>
                  {editingId ? "Update" : "Upload"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((mat) => (
            <Card
              key={mat.id}
              className="shadow rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {iconByType(mat.type)}
                  <div>
                    <h3 className="font-medium text-gray-900 line-clamp-2">
                      {mat.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {mat.description}
                    </p>
                  </div>
                </div>
                {isTeacher && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(mat.id)}
                    >
                      <Edit />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(mat.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mb-4">
                <div>By {mat.uploadedBy}</div>
                <div>{formatDate(mat.uploadedAt)}</div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>
                  <Eye className="inline w-4 h-4 mr-1" />
                  {mat.views}
                </span>
                <span>
                  <Download className="inline w-4 h-4 mr-1" />
                  {mat.downloads}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(mat.id)}
                  className="flex-1"
                >
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(mat.id)}
                  className="flex-1"
                >
                  Download
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No materials found</h3>
            <p className="text-gray-600 mt-2">
              {filterType === "all"
                ? "No materials uploaded yet."
                : `No ${filterType}s available.`}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

ClassroomMaterials.propTypes = {
  classroom: PropTypes.object,
  isTeacher: PropTypes.bool,
  user: PropTypes.shape({ name: PropTypes.string }),
};
