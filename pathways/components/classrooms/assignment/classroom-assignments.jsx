"use client";

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Plus, Calendar, Clock, FileText, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import SearchAndFilterBar from "@components/SearchAndFilterBar";
import PaginationControls from "@/components/PaginationControls";
import AssignmentCreationModal from "./AssignmentCreationModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import fetchWithAuth from "@/lib/fetch_with_auth";
import AssignmentCard from "./AssignmentCard";

const PAGE_SIZE = 9;

export default function ClassroomAssignments({ classroom, isTeacher, user }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [filterType, setFilterType] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [page, setPage] = useState(1);
  useEffect(() => {
    if (!classroom?.id) return;
    setLoading(true);
    fetchWithAuth(`/api/classroom/${classroom.id}/assignments/`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch assignments");
        const data = await res.json();
        setAssignments(data.results || data);
      })
      .catch(() => {
        setAssignments([]);
      })
      .finally(() => setLoading(false));
  }, [classroom?.id]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterType]);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const isOverdue = (dueDate) => new Date(dueDate) < new Date();
  const isDueSoon = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffHours = (due - now) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 24;
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this assignment?")) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/assignments/${id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    setLoading(true);
    try {
      let result;
      if (editingAssignment) {
        const res = await fetchWithAuth(`/api/assignments/${editingAssignment.id}/`, {
          method: "PUT",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to update");
        result = await res.json();
        setAssignments((prev) =>
          prev.map((a) => (a.id === editingAssignment.id ? result : a))
        );
      } else {
        const res = await fetchWithAuth(`/api/classroom/${classroom.id}/assignments/create/`, {
          method: "POST",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to create");
        result = await res.json();
        setAssignments((prev) => [result, ...prev]);
      }
      setShowModal(false);
      setEditingAssignment(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (assignment) => {
    if (isOverdue(assignment.due_date)) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">Overdue</span>;
    }
    if (isDueSoon(assignment.due_date)) {
      return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-600 rounded-full">Due Soon</span>;
    }
    return <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">Active</span>;
  };

  const filtered = assignments.filter((a) => {
    const text = (a.title + " " + a.description).toLowerCase();
    const matchesSearch = text.includes(searchTerm.toLowerCase());
    const matchesType = filterType.length === 0 || filterType.includes(a.assignment_type);
    return matchesSearch && matchesType;
  }).sort((a, b) => new Date(b.due_date) - new Date(a.due_date));

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedAssignments = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-4xl font-extrabold text-black">Assignments</h2>
            <p className="text-gray-600">Manage and track classroom tasks</p>
          </div>
          {isTeacher && (
            <Button
            variant="add"
            onClick={() => {
                setEditingAssignment(null);
                setShowModal(true);
              }}
              disabled={loading}
            >
              <Plus className="w-5 h-5" /> Add Assignment
            </Button>
          )}
        </div>

        <SearchAndFilterBar
          searchQuery={searchTerm}
          setSearchQuery={setSearchTerm}
          filterTypes={filterType}
          setFilterTypes={setFilterType}
          filterOptions={[
            { value: "essay", label: "Essays" },
            { value: "project", label: "Projects" },
            { value: "homework", label: "Homework" },
          ]}
          placeholder="Search assignments..."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12 text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="mx-auto w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700">No assignments found</h3>
              <p className="text-gray-500 mt-2">
                {filterType.length === 0
                  ? "No assignments have been created yet."
                  : `No ${filterType.join(', ')}s available.`}
              </p>
            </div>
          ) : (
            paginatedAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onClick={() => setSelectedAssignment(assignment)}
                onEdit={isTeacher ? handleEdit : undefined}
                onDelete={isTeacher ? handleDelete : undefined}
                formatDate={formatDate}
                isTeacher={isTeacher}
              />
            ))

          )}
        </div>

        <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Assignment Dialog */}
      {selectedAssignment && (
        <Dialog open={!!selectedAssignment} onOpenChange={() => setSelectedAssignment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedAssignment.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-700">{selectedAssignment.description}</p>
              {selectedAssignment.instructions && (
                <div>
                  <h4 className="font-medium mb-2">Instructions:</h4>
                  <p className="text-gray-700">{selectedAssignment.instructions}</p>
                </div>
              )}
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Due: {formatDate(selectedAssignment.due_date)}</span>
                <span>Points: {selectedAssignment.points_possible}</span>
                <span className="capitalize">{selectedAssignment.assignment_type}</span>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create/Edit Modal */}
      {showModal && isTeacher && (
        <AssignmentCreationModal
          open={showModal}
          onClose={() => setShowModal(false)}
          initialData={editingAssignment || {}}
          isEditing={!!editingAssignment}
          onSave={handleSave}
        />
      )}
    </section>
  );
}

ClassroomAssignments.propTypes = {
  classroom: PropTypes.object,
  isTeacher: PropTypes.bool,
  user: PropTypes.shape({ name: PropTypes.string }),
};
