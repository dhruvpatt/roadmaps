"use client";

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Plus, FileText, Video, ImageIcon, File as FileIcon, MoreVertical,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import SearchAndFilterBar from "@components/SearchAndFilterBar";
import PaginationControls from "@components/PaginationControls";
import MaterialCreationModal from "./MaterialCreationModal";
import fetchWithAuth from "@/lib/fetch_with_auth";
import MaterialViewerModal from "./MaterialViewerModal";
import MaterialCard from "./MaterialCard";
import ConfirmDialog from "@/components/ConfirmDialog";


const PAGE_SIZE = 9;


export default function ClassroomMaterials({ classroom, isTeacher, user }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [filterTypes, setFilterTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);


  // Fetch materials from backend

  const fetchMaterials = async (params) => {
    try {
      const res = await fetchWithAuth(`/api/classroom/materials/?${params}&page_size=${PAGE_SIZE}`);
      if (!res.ok) throw new Error("Failed to fetch materials");

      const data = await res.json();
      console.log("Fetched materials", data);

      setMaterials(data.results || data); // Support paginated and non-paginated
      setTotalPages(Math.ceil((data.count || 1) / PAGE_SIZE));
    } catch (err) {
      setMaterials([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!classroom?.id) return;

    const fetchData = async () => {
      setLoading(true);
      const params = new URLSearchParams({
        classroom: classroom.id,
        page,
        ...(filterTypes.length > 0 ? { types: filterTypes.join(",") } : {}),
        ...(searchTerm ? { search: searchTerm } : {}),
      });

      await fetchMaterials(params);
    };

    fetchData();
  }, [classroom?.id, filterTypes, searchTerm, page, pendingDeleteId]);


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

  const confirmDelete = (id) => setPendingDeleteId(id);

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/classroom/materials/${pendingDeleteId}/`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setMaterials((prev) => prev.filter((m) => m.id !== pendingDeleteId));
    } finally {
      setPendingDeleteId(null);
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    setLoading(true);
    try {
      let result;
      // Always infer type_keys from content (unique types)
      const typeKeys = Array.isArray(data.content)
        ? [...new Set(data.content.map(item => item.type))]
        : [];
      const content = Array.isArray(data.content) ? data.content : [];

      // Remove blob previews (frontend-only)
      const nonBlobContent = content.filter(
        item => !(item.type === "file" && item.url?.startsWith("blob:"))
      );

      // Actual files
      const files = content.filter(
        c => c.type === "file" && c.file instanceof File
      );

      const hasFile = files.length > 0;

      if (editingMaterial) {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("details", data.details);
        // Use type_keys here
        typeKeys.forEach((key) => formData.append("type_keys", key));
        content.forEach((item) => {
          if (item.type === "file" && item.file instanceof File) {
            formData.append("files", item.file);
          }
        });
        const res = await fetchWithAuth(
          `/api/classroom/materials/${editingMaterial.id}/`,
          {
            method: "PUT",
            body: hasFile ? formData : JSON.stringify({ ...data, type_keys: typeKeys, content }),
            headers: hasFile ? undefined : { "Content-Type": "application/json" },
          }
        );
        if (!res.ok) throw new Error("Failed to update");
        result = await res.json();
        setMaterials((prev) =>
          prev.map((m) => (m.id === editingMaterial.id ? result : m))
        );
      } else {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("details", data.details);
        formData.append("classroom", classroom.id);
        typeKeys.forEach((key) => formData.append("type_keys", key));

        const nonFileContent = content.map(({ file, ...rest }) => rest);
        formData.append("content", JSON.stringify(nonBlobContent));

        files.forEach((fileItem) => {
          formData.append("files", fileItem.file); // ✅ actual File
        });

        const res = await fetchWithAuth(
          `/api/classroom/materials/create/`,
          {
            method: "POST",
            body: hasFile
              ? formData
              : JSON.stringify({ ...data, classroom: classroom.id, type_keys: typeKeys, content }),
            headers: hasFile ? undefined : { "Content-Type": "application/json" },
          }
        );
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



  // Filtering
  const byType =
    filterTypes.length === 0
      ? materials
      : materials.filter((m) =>
        Array.isArray(m.types) &&
        m.types.some((t) => filterTypes.includes(t.key))
      );

  const filtered = byType.filter((m) => {
    const text = ((m.title || "") + " " + (m.details || "")).toLowerCase();
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
              <Plus className="w-5 h-5" /> Add Material
            </Button>
          )}
        </div>

        <SearchAndFilterBar
          searchQuery={searchTerm}
          setSearchQuery={setSearchTerm}
          filterTypes={filterTypes}
          setFilterTypes={setFilterTypes}
          filterOptions={[
            { value: "file", label: "Files" },
            { value: "link", label: "Links" },
            { value: "announcement", label: "Announcements" },
            { value: "general", label: "General" },
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
                {filterTypes.includes("all")
                  ? "No resources uploaded yet."
                  : filterTypes.length > 0 ? `No ${filterTypes}s` : ""}
              </p>
            </div>
          ) : (
            filtered.map((mat) => (
              <MaterialCard
                material={mat}
                onClick={() => setSelectedMaterial(mat)}
                onEdit={isTeacher ? handleEdit : undefined}
                onDelete={isTeacher ? confirmDelete : undefined}
                formatDate={formatDate}
                menu={isTeacher}
              />

            ))
          )}
        </div>

        <ConfirmDialog
          open={!!pendingDeleteId}
          title="Delete this material?"
          description="This action is irreversible. Are you sure you want to delete this material?"
          onOk={handleConfirmDelete}
          onCancel={() => setPendingDeleteId(null)}
          okText="Delete"
          cancelText="Cancel"
        />

        <PaginationControls
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      <MaterialViewerModal
        material={selectedMaterial}
        open={!!selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
        formatDate={formatDate}
      />


      {showModal && isTeacher && (
        <MaterialCreationModal
          open={showModal}
          onClose={() => setShowModal(false)}
          initialData={
            editingMaterial
              ? {
                title: editingMaterial.title,
                details: editingMaterial.details,
                type_keys: editingMaterial.types
                  ? editingMaterial.types.map((t) => t.key)
                  : [],

                content: Array.isArray(editingMaterial.content)
                  ? editingMaterial.content
                  : [],
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
