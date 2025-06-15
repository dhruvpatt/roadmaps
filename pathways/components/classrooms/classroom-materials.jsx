"use client";

import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Plus,
  FileText,
  Video,
  ImageIcon,
  File,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@components/ui/dialog";
import SearchAndFilterBar from "./SearchAndFilterBar";
import PaginationControls from "@components/PaginationControls";
import MaterialCreationModal from "./MaterialCreationModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
];

export default function ClassroomMaterials({ classroom, isTeacher, user }) {
  const [materials, setMaterials] = useState(mockMaterials);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState(null);


  const handleEdit = (material) => {
    setEditingMaterial(material);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (confirm("Delete this resource?")) {
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const iconByType = (type) => {
    const base = "w-6 h-6";
    if (type === "video")
      return (
        <div className="w-10 h-10 flex items-center justify-center bg-red-100 rounded-full">
          <Video className={`${base} text-red-600`} />
        </div>
      );
    if (type === "image")
      return (
        <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-full">
          <ImageIcon className={`${base} text-green-600`} />
        </div>
      );
    if (type === "ppt")
      return (
        <div className="w-10 h-10 flex items-center justify-center bg-yellow-100 rounded-full">
          <File className={`${base} text-yellow-600`} />
        </div>
      );
    return (
      <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full">
        <FileText className={`${base} text-blue-600`} />
      </div>
    );
  };

  const renderCardPreview = (mat) => {
    if (!mat.url) return null;
    if (mat.type === "image") {
      return (
        <div className="w-full h-32 overflow-hidden mb-4 rounded-lg shadow-sm shadow-md border-none">
          <img src={mat.url} alt={mat.title} className="w-full h-full object-cover" />
        </div>
      );
    }
    if (mat.type === "video") {
      return (
        <div className="w-full h-32 mb-4 rounded-lg overflow-hidden shadow-sm shadow-md border-none">
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
        <div className="w-full h-32 flex flex-col items-center justify-center mb-4 rounded-lg shadow-sm shadow-md border-none bg-gray-50 p-2">
          <FileText className="w-10 h-10 text-gray-400 mb-1" />
          <p className="text-xs text-gray-600 mb-1 line-clamp-1">{filename}</p>
          <a href={mat.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs">
            Preview
          </a>
        </div>
      );
    }
    return null;
  };

  const byType = filterType === "all" ? materials : materials.filter((m) => m.type === filterType);
  const filtered = byType.filter((m) => {
    const text = (m.title + " " + m.description).toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <section className="bg-white min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-black">Materials</h2>
            <p className="text-gray-600">Course resources and files</p>
          </div>
          {isTeacher && (
            <Button
              className="flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 rounded-lg"
              onClick={() => {
                setEditingMaterial(null);
                setShowModal(true);
              }}
            >
              <Plus className="w-5 h-5" /> Add Resource
            </Button>
          )}
        </div>

        <SearchAndFilterBar
          searchQuery={searchTerm}
          setSearchQuery={setSearchTerm}
          filterType={filterType}
          setFilterType={setFilterType}
          filterOptions={[
            { value: "document", label: "Documents" },
            { value: "video", label: "Videos" },
            { value: "image", label: "Images" },
            { value: "ppt", label: "Presentations" },
          ]}
          placeholder="Search..."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((mat) => (
            <Card
              key={mat.id}
              onClick={() => setSelectedMaterial(mat)}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition cursor-pointer p-6 relative"
            >
              <div className="absolute top-4 right-4 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-50">
                    <DropdownMenuItem onClick={() => handleEdit(mat)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(mat.id)}>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-3 mb-4">
                {iconByType(mat.type)}
                <div>
                  <h3 className="font-semibold text-gray-800 line-clamp-2">{mat.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{mat.description}</p>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-3">
                <div>By {mat.uploadedBy}</div>
                <div>{formatDate(mat.uploadedAt)}</div>
              </div>

              {renderCardPreview(mat)}
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No materials found</h3>
            <p className="text-gray-500 mt-2">
              {filterType === "all" ? "No resources uploaded yet." : `No ${filterType}s available.`}
            </p>
          </div>
        )}

        <PaginationControls
          page={1}
          totalPages={1}
          onPageChange={() => { }}
        />
      </div>

      {selectedMaterial && (
        <Dialog open={!!selectedMaterial} onOpenChange={() => setSelectedMaterial(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedMaterial.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-700">{selectedMaterial.description}</p>
              {renderCardPreview(selectedMaterial)}
              <p className="text-sm text-gray-500">
                Uploaded by {selectedMaterial.uploadedBy} on {formatDate(selectedMaterial.uploadedAt)}
              </p>
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}


      {showModal && isTeacher && (
        <MaterialCreationModal
          open={showModal}
          onClose={() => setShowModal(false)}
          initialData={
            editingMaterial
              ? {
                title: editingMaterial.title,
                details: editingMaterial.description,
                type: editingMaterial.type,
                content: { url: editingMaterial.url, filename: "" }, // If known
              }
              : {}
          }
          isEditing={!!editingMaterial}
          onSave={(data) => {
            const newMaterial = {
              id: editingMaterial ? editingMaterial.id : Date.now(),
              title: data.title,
              description: data.details,
              type: data.type === "file" || data.type === "url" ? (data.content.url?.includes("youtube") ? "video" : "document") : "general",
              url: data.content.url || "",
              uploadedAt: new Date().toISOString(),
              uploadedBy: user?.name || "Unknown",
            };

            setMaterials((prev) => {
              if (editingMaterial) {
                return prev.map((m) => (m.id === newMaterial.id ? newMaterial : m));
              }
              return [newMaterial, ...prev];
            });

            setShowModal(false);
          }}
        />
      )}
    </section>
  );
}

ClassroomMaterials.propTypes = {
  classroom: PropTypes.object,
  isTeacher: PropTypes.bool,
  user: PropTypes.shape({ name: PropTypes.string }),
};
