"use client";

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Plus, FileText, Video, ImageIcon, File, MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@components/ui/dialog";
import SearchAndFilterBar from "./SearchAndFilterBar";
import PaginationControls from "@components/PaginationControls";
import MaterialCreationModal from "./MaterialCreationModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import fetchWithAuth from "@/lib/fetch_with_auth";

const PAGE_SIZE = 10;

export default function ClassroomMaterials({ classroom, isTeacher, user }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch materials
  useEffect(() => {
    if (!classroom?.id) return;
    setLoading(true);
    const params = new URLSearchParams({
      page,
      ...(filterType !== "all" ? { type: filterType } : {}),
      ...(searchTerm ? { search: searchTerm } : {}),
    });
    fetchWithAuth(`/api/classrooms/${classroom.id}/materials/?${params}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch materials");
        const data = await res.json();
        setMaterials(data.results || data); // Support both paginated and unpaginated
        setTotalPages(data.total_pages || data.totalPages || 1);
      })
      .catch((err) => {
        setMaterials([]);
        setTotalPages(1);
        // Optionally: set error state
      })
      .finally(() => setLoading(false));
  }, [classroom?.id, filterType, searchTerm, page]);

  const formatDate = (dateStr, showTime = false) =>
    new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      ...(showTime && { hour: "2-digit", minute: "2-digit" }),
    });

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this resource?")) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/materials/${id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    setLoading(true);
    try {
      // For file upload, use FormData
      let result;
      if (editingMaterial) {
        // Edit
        const isFile = data.content?.file instanceof File;
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("details", data.details);
        formData.append("type", data.type);
        if (isFile) formData.append("file", data.content.file);
        // Append other fields as needed
        const res = await fetchWithAuth(`/api/materials/${editingMaterial.id}/`, {
          method: "PUT",
          body: isFile ? formData : JSON.stringify(data),
          headers: isFile ? undefined : { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to update");
        result = await res.json();
        setMaterials((prev) =>
          prev.map((m) => (m.id === editingMaterial.id ? result : m))
        );
      } else {
        // Add
        const isFile = data.content?.file instanceof File;
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("details", data.details);
        formData.append("type", data.type);
        if (isFile) formData.append("file", data.content.file);
        formData.append("classroom", classroom.id); // If required
        // Append other fields as needed
        const res = await fetchWithAuth(`/api/classrooms/${classroom.id}/materials/`, {
          method: "POST",
          body: isFile ? formData : JSON.stringify(data),
          headers: isFile ? undefined : { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to create");
        result = await res.json();
        setMaterials((prev) => [result, ...prev]);
      }
      setShowModal(false);
      setEditingMaterial(null);
    } finally {
      setLoading(false);
    }
  };

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
              disabled={loading}
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
          {loading ? (
            <div className="col-span-full text-center py-12 text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="mx-auto w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600">No materials found</h3>
              <p className="text-gray-500 mt-2">
                {filterType === "all" ? "No resources uploaded yet." : `No ${filterType}s available.`}
              </p>
            </div>
          ) : (
            filtered.map((mat) => (
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

                <div className="flex items-start gap-3 mb-3">
                  <span className="mt-[2px]">{iconByType(mat.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800 line-clamp-1">{mat.title}</h3>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 gap-1 mb-1">
                      <span>By {mat.uploadedBy || mat.created_by?.name || "Unknown"}</span>
                      <span className="mx-1 text-gray-400">•</span>
                      <span>
                        {formatDate(mat.uploadedAt || mat.created_at, true)}
                      </span>
                    </div>
                    <p className="text-sm mt-2 text-gray-800 line-clamp-2">{mat.description || mat.details}</p>
                  </div>
                </div>
                {renderCardPreview(mat)}
              </Card>
            ))
          )}
        </div>

        <PaginationControls
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {selectedMaterial && (
        <Dialog open={!!selectedMaterial} onOpenChange={() => setSelectedMaterial(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedMaterial.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-700">{selectedMaterial.description || selectedMaterial.details}</p>
              {renderCardPreview(selectedMaterial)}
              <p className="text-sm text-gray-500">
                Uploaded by {selectedMaterial.uploadedBy || selectedMaterial.created_by?.name || "Unknown"} on {formatDate(selectedMaterial.uploadedAt || selectedMaterial.created_at)}
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
                details: editingMaterial.description || editingMaterial.details,
                type: editingMaterial.type,
                content: { url: editingMaterial.url, filename: "" }, // Adjust if your API returns array for files!
              }
              : {}
          }
          isEditing={!!editingMaterial}
          onSave={handleSave}
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
