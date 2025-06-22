"use client";

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Plus, Calendar, Clock, FileText, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import SearchAndFilterBar from "./SearchAndFilterBar";
import PaginationControls from "@/components/PaginationControls";
import AssignmentCreationModal from "./AssignmentCreationModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import fetchWithAuth from "@/lib/fetch_with_auth";

const PAGE_SIZE = 10;

export default function ClassroomAssignments({ classroom, isTeacher, user }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!classroom?.id) return;
    setLoading(true);
    const params = new URLSearchParams({
      page,
      ...(filterType !== "all" ? { type: filterType } : {}),
      ...(searchTerm ? { search: searchTerm } : {}),
    });
    fetchWithAuth(`/api/classrooms/${classroom.id}/assignments/?${params}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch assignments");
        const data = await res.json();
        setAssignments(data.results || data);
        setTotalPages(data.total_pages || data.totalPages || 1);
      })
      .catch((err) => {
        setAssignments([]);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, [classroom?.id, filterType, searchTerm, page]);

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
        const res = await fetchWithAuth(`/api/classrooms/${classroom.id}/assignments/create/`, {
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
    const matchesType = filterType === "all" || a.assignment_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <section className="bg-white min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-black">Assignments</h2>
            <p className="text-gray-600">Course assignments and tasks</p>
          </div>
          {isTeacher && (
            <Button
              className="flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600"
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
          filterType={filterType}
          setFilterType={setFilterType}
          filterOptions={[
            { value: "essay", label: "Essays" },
            { value: "quiz", label: "Quizzes" },
            { value: "project", label: "Projects" },
            { value: "homework", label: "Homework" },
          ]}
          placeholder="Search assignments..."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12 text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="mx-auto w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600">No assignments found</h3>
              <p className="text-gray-500 mt-2">
                {filterType === "all" ? "No assignments created yet." : `No ${filterType}s available.`}
              </p>
            </div>
          ) : (
            filtered.map((assignment) => (
              <Card
                key={assignment.id}
                onClick={() => setSelectedAssignment(assignment)}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition cursor-pointer p-6 relative"
              >
                <div className="absolute top-4 right-4 z-10">
                  {isTeacher && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="z-50">
                        <DropdownMenuItem onClick={() => handleEdit(assignment)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(assignment.id)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-800 line-clamp-2">{assignment.title}</h3>
                    {getStatusBadge(assignment)}
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2">{assignment.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Due {formatDate(assignment.due_date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{assignment.points_possible} pts</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 capitalize">{assignment.assignment_type}</span>
                    {isTeacher && (
                      <span className="text-xs text-gray-500">
                        {assignment.submission_count || 0} submissions
                      </span>
                    )}
                  </div>
                </div>
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
              <div className="flex items-center gap-4 text-sm text-gray-600">
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

      {showModal && isTeacher && (
        <AssignmentCreationModal
          open={showModal}
          onClose={() => setShowModal(false)}
          initialData={
            editingAssignment
              ? {
                title: editingAssignment.title,
                description: editingAssignment.description,
                instructions: editingAssignment.instructions,
                due_date: editingAssignment.due_date,
                points_possible: editingAssignment.points_possible,
                assignment_type: editingAssignment.assignment_type,
              }
              : {}
          }
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