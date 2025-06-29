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
import { saveMaterial, fetchMaterials, deleteMaterial } from "@/lib/api/materials";


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

  const getMaterials = async (params) => {
    setLoading(true);
    try {
      // Use the params directly!
      const data = await fetchMaterials({
        classroomId: params.classroom,
        page: params.page,
        search: params.search,
        types: params.types,
        pageSize: PAGE_SIZE,
      });
      console.log(data)
      setMaterials(data.materials || data);
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
      const params = {
        classroom: classroom.id,
        page,
        ...(filterTypes.length > 0 ? { types: filterTypes.join(",") } : {}),
        ...(searchTerm ? { search: searchTerm } : null),
      };
      await getMaterials(params);
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
      await deleteMaterial(pendingDeleteId);
      setMaterials((prev) => prev.filter((m) => m.id !== pendingDeleteId));
    } catch (err) {
      // Optionally show an error message here
      console.error("Failed to delete:", err);
    } finally {
      setPendingDeleteId(null);
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    setLoading(true);
    try {
      const result = await saveMaterial({
        data,
        editingMaterial,
        classroomId: classroom?.id,
      });

      if (editingMaterial) {
        setMaterials((prev) =>
          prev.map((m) => (m.id === editingMaterial.id ? result : m))
        );
      } else {
        setMaterials((prev) => [result, ...prev]);
      }

      setShowModal(false);
      setEditingMaterial(null);
    } catch (err) {
      console.error("Save failed:", err);
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
              variant="add"
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
          ) : materials.length === 0 ? (
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
            materials.map((mat) => (
              <MaterialCard
                key={crypto.randomUUID()}
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
        propMaterial={selectedMaterial}
        open={!!selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
        formatDate={formatDate}
        user={user}
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
