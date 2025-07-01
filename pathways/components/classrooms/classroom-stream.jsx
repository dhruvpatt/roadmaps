"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { Plus, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import fetchWithAuth from "@/lib/fetch_with_auth";
import SearchAndFilterBar from "@components/SearchAndFilterBar";
import ConfirmDialog from "@components/ConfirmDialog";
import MaterialCreationModal from "./MaterialCreationModal";
import StreamCard from "./StreamCard";
import MaterialViewerModal from "./MaterialViewerModal";
import { saveMaterial } from "@/lib/api/materials";

const PAGE_SIZE = 10;

export default function ClassroomStream({ classroom, isTeacher, user }) {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilters, setTypeFilters] = useState([]);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, materialId: null });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);


  const formatDate = (timestamp) =>
    new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const sortContent = (material) => {
    const contentArr = Array.isArray(material.content) ? material.content : [];
    const announcements = contentArr.filter((c) => c.type === "announcement");
    const generals = contentArr.filter((c) => c.type === "general");
    const links = contentArr.filter((c) => c.type === "link");
    const files = contentArr.filter((c) => c.type === "file");
    return { ...material, content: [...announcements, ...generals, ...links, ...files] };
  };

  const fetchMaterials = useCallback(
    async ({ reset = false } = {}) => {
      if (!classroom?.id) return;

      const targetPage = reset ? 1 : page;
      try {
        const res = await fetchWithAuth(
          `/api/classroom/materials/?classroom=${classroom.id}&page=${targetPage}&page_size=${PAGE_SIZE}`
        );
        if (!res.ok) throw new Error("Failed to fetch materials");

        const data = await res.json();
        console.log("Fetched materials (stream):", data);
        const newMaterials = (data.results || data).map(sortContent);

        setPosts((prev) => (reset ? newMaterials : [...prev, ...newMaterials]));
        setHasMore(newMaterials.length === PAGE_SIZE);
        setPage(reset ? 2 : targetPage + 1); // reset to page 2 after initial fetch
      } catch (err) {
        console.error("Failed to fetch materials", err);
        setHasMore(false);
      }
    },
    [classroom?.id, page, hasMore]
  );


  // Infinite scroll trigger
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMaterials();
      }
    });

    const current = loaderRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [fetchMaterials, hasMore]);

  const filteredPosts = posts.filter((post) => {
    const text = ((post.title || "") + " " + (post.details || "")).toLowerCase();
    const matchesSearch = text.includes(searchQuery.toLowerCase());
    const matchesType =
      typeFilters.length === 0 || post.types?.some((t) => typeFilters.includes(t.key));
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id) => {
    setConfirmDelete({ open: false, materialId: null });
    try {
      const res = await fetchWithAuth(`/api/classroom/materials/${id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchMaterials({ reset: true }); // full refetch
    } catch (e) {
      console.error("Delete failed", e);
    }
  };


  const handleSave = async (data) => {
    setLoading(true);
    try {
      const result = await saveMaterial({
        data,
        editingMaterial,
        classroomId: classroom.id, // only used if creating
      });

      setShowModal(false);
      setEditingMaterial(null);
      await fetchMaterials({ reset: true });
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto space-y-6 px-4">
        <SearchAndFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterTypes={typeFilters}
          setFilterTypes={setTypeFilters}
          filterOptions={[
            { value: "announcement", label: "Announcements" },
            { value: "file", label: "Files" },
            { value: "link", label: "Links" },
            { value: "general", label: "General" },
          ]}
          placeholder="Search stream..."
        />

        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <StreamCard
              user={user}
              key={post.id}
              post={post}
              formatDate={formatDate}
              onClick={() => setSelectedMaterial(post)}
              onEdit={isTeacher ? (mat) => {
                setEditingMaterial(mat);
                setShowModal(true);
              } : undefined} onDelete={isTeacher ? (id) => setConfirmDelete({ open: true, materialId: id }) : undefined}
              isTeacher={isTeacher}
            />
          ))}
          <div ref={loaderRef} className="h-12" />
        </div>
      </div>

      <Button
        onClick={() => {
          setEditingMaterial(null);
          setShowModal(true);
          setPage(1);
        }}
        className="fixed bottom-6 right-6 z-50 bg-amber-600 hover:bg-amber-700 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </Button>

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

      <ConfirmDialog
        open={confirmDelete.open}
        title="Delete Material"
        description="Are you sure you want to delete this material?"
        onOk={() => handleDelete(confirmDelete.materialId)}
        onCancel={() => setConfirmDelete({ open: false, materialId: null })}
        showOk
        showCancel
      />

      <MaterialViewerModal
        material={selectedMaterial}
        open={!!selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
        formatDate={formatDate}
      />
    </div>
  );
}

ClassroomStream.propTypes = {
  classroom: PropTypes.object.isRequired,
  isTeacher: PropTypes.bool,
  user: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    first_name: PropTypes.string,
  }),
};
