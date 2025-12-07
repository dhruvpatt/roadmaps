"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { Plus, MoreHorizontal, ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import fetchWithAuth from "@/lib/fetch_with_auth";
import SearchAndFilterBar from "@components/SearchAndFilterBar";
import ConfirmDialog from "@components/ConfirmDialog";
import MaterialCreationModal from "../material/MaterialCreationModal";
import StreamCard from "./StreamCard";
import MaterialViewerModal from "../material/MaterialViewerModal";
import { saveMaterial } from "@/lib/api/materials";
import { fetchAssignments } from "@/lib/api/assignments";
import { fetchTests } from "@/lib/api/tests";
import { fetchMaterials } from "@/lib/api/materials";
import StreamPostCreationDialog from "./StreamPostCreationDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Resizable } from "@components/animations/Resizeable";


const PAGE_SIZE = 10;

function useAccordion(defaultOpen = []) {
  const [openIds, setOpenIds] = useState(defaultOpen);

  const toggle = id =>
    setOpenIds(prev =>
      prev.includes(id)
        ? prev.filter(openId => openId !== id)
        : [...prev, id]
    );

  const isOpen = id => openIds.includes(id);

  return { isOpen, toggle };
}

export default function ClassroomStream({ classroom, isTeacher, user }) {
  console.log(classroom)
  const [posts, setPosts] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilters, setTypeFilters] = useState([]);
  const [editingMaterial, setEditingMaterial] = useState(null);

  const [showPostCreationDialog, setShowPostCreationDialog] = useState(false);
  const [creationType, setCreationType] = useState("")


  const [showMaterialCreationModal, setShowMaterialCreationModal] = useState(false);
  const [showTestCreationModal, setShowTestCreationModal] = useState(false);
  const [showAssignmentCreationModal, setShowAssignmentCreationModal] = useState(false);


  const [confirmDelete, setConfirmDelete] = useState({ open: false, title: "Are you sure?", id: null });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [selectedTest, setSelectedTest] = useState(null)

  const allUnitIds = classroom.units?.map(unit => unit.id) || [];
  const unitAcc = useAccordion(allUnitIds);

  const allWeekIds = classroom.units
    ? classroom.units.flatMap(unit => unit.weeks?.map(week => week.id) || [])
    : [];

  const weekAcc = useAccordion(allWeekIds);

  const [weekPostDisplay, setWeekPostDisplay] = useState({});



  const formatDate = (timestamp) =>
    new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const sortContent = (material) => {
    const contentArr = Array.isArray(material.content) ? material.content : [];
    const announcements = contentArr.filter((c) => c.type === "announcement");
    const generals = contentArr.filter((c) => c.type === "general");
    const links = contentArr.filter((c) => c.type === "link");
    const files = contentArr.filter((c) => c.type === "file");
    return { ...material, content: [...announcements, ...generals, ...links, ...files] };
  };

  const PAGE_SIZE = 10;

  // Unified fetch
  const getAllPosts = useCallback(async ({ reset = false } = {}) => {
    if (!classroom?.id) return;
    setLoading(true);

    const targetPage = reset ? 1 : page;
    try {
      const [
        { materials },
        { assignments },
        { tests }
      ] = await Promise.all([
        fetchMaterials({ classroomId: classroom.id, page: targetPage, search: searchQuery, pageSize: PAGE_SIZE }),
        fetchAssignments({ classroomId: classroom.id, page: targetPage, search: searchQuery, pageSize: PAGE_SIZE }),
        fetchTests({ classroomId: classroom.id, page: targetPage, search: searchQuery, pageSize: PAGE_SIZE })
      ]);

      const materialsWithType = materials.map(m => ({ ...m, postType: "material" }));
      const assignmentsWithType = assignments.map(a => ({ ...a, postType: "assignment" }));
      const testsWithType = tests.map(t => ({ ...t, postType: "test" }));

      const merged = [...materialsWithType, ...assignmentsWithType, ...testsWithType].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setPosts(prev => reset ? merged : [...prev, ...merged]);

      const hasMoreAny = [materials, assignments, tests].some(arr => arr.length === PAGE_SIZE);
      setHasMore(hasMoreAny);
      setPage(reset ? 2 : targetPage + 1);
    } catch (err) {
      console.error("Failed to fetch posts", err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [classroom?.id, page, searchQuery]);

  // // Infinite scroll trigger
  // useEffect(() => {
  //   const observer = new IntersectionObserver((entries) => {
  //     if (entries[0].isIntersecting && hasMore) {
  //       getAllPosts();
  //     }
  //   });

  //   const current = loaderRef.current;
  //   if (current) observer.observe(current);

  //   return () => {
  //     if (current) observer.unobserve(current);
  //   };
  // }, [getAllPosts, hasMore]);



  useEffect(() => {
    setPage(1);
    getAllPosts({ reset: true });
  }, [searchQuery, typeFilters, classroom?.id]);

  useEffect(() => {
    if (creationType != "") {
      switch (creationType) {
        case "material":
          setShowMaterialCreationModal(true);
          break;
        case "assignment":
          setShowAssignmentCreationModal(true);
          break;
        case "test":
          setShowTestCreationModal(true)
          break;

        default:
          break;
      }
    }
  }, [creationType])

  const handleTestEdit = (test) => {
    // open test edit modal etc.
  };
  const handleTestDelete = async (id) => {
    // delete test logic
    await getAllPosts({ reset: true });
  };

  const handleAssignmentEdit = (assignment) => {
    // open assignment edit modal etc.
  };
  const handleAssignmentDelete = async (id) => {
    // delete assignment logic
    await getAllPosts({ reset: true });
  };


  const handleMaterialEdit = (mat) => {
    setEditingMaterial(mat);
    setShowMaterialCreationModal(true);
  };
  const handleMaterialDelete = async (id) => {
    setConfirmDelete({ open: true, id: id });
  };

  const handleConfirmMaterialDelete = async (id) => {
    setConfirmDelete({ open: false, id: null });
    try {
      const res = await fetchWithAuth(`/api/classroom/materials/${id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await getAllPosts({ reset: true });
    } catch (e) {
      console.error("Delete failed", e);
    }
  };


  const handleMaterialSave = async (data) => {
    setLoading(true);
    try {
      const result = await saveMaterial({
        data,
        editingMaterial,
        classroomId: classroom.id, // only used if creating
      });

      setShowMaterialCreationModal(false);
      setEditingMaterial(null);
      await getAllPosts({ reset: true });
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
            { value: "assignment", label: "Assignments" },
            { value: "test", label: "Tests" }
          ]}
          placeholder="Search stream..."
        />

        {/* Accordions */}
        <div className="space-y-6">

          {classroom.units?.length === 0 && (
            <div className="space-y-3 mt-6">
              {posts.map(post => (
                <StreamCard
                  key={post.postType + "-" + post.id}
                  propPost={post}
                  user={user}
                  formatDate={formatDate}
                  onClick={() => setSelectedMaterial(post)}
                  isTeacher={isTeacher}
                />
              ))}
            </div>
          )}
          {classroom.units?.map((unit, unitIdx) => (
            <div key={unit.id} className="">
              {/* Unit Header */}
              <button
                className="flex justify-between items-center w-full px-5 py-4 bg-white rounded-2xl hover:bg-blue-50 transition-colors shadow-none"
                onClick={() => unitAcc.toggle(unit.id)}
                aria-expanded={unitAcc.isOpen(unit.id)}
              >
                <div>
                  <span className="text-blue-700 mr-2 font-semibold">Unit {unitIdx + 1}:</span>
                  <span className="font-bold text-lg">{unit.name}</span>
                  {unit.description && (
                    <span className="text-gray-500 ml-3 text-base">{unit.description}</span>
                  )}
                </div>
                <span className="ml-2 text-blue-400">
                  {unitAcc.isOpen(unit.id)
                    ? <ChevronUp className="w-6 h-6" />
                    : <ChevronDown className="w-6 h-6" />}
                </span>
              </button>

              {/* Weeks */}
              <Resizable fade duration={0.5} show={unitAcc.isOpen(unit.id)}>

                <div className="ml-2 space-y-3">
                  {unit.weeks.length === 0 && (
                    <div className="text-gray-400 italic px-4 py-4">No weeks in this unit yet.</div>
                  )}
                  {unit.weeks.map((week, weekIdx) => (
                    <div key={week.id}>
                      {/* Week Header */}
                      <button
                        className="flex justify-between items-center w-full px-5 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors mt-2"
                        onClick={() => weekAcc.toggle(week.id)}
                        aria-expanded={weekAcc.isOpen(week.id)}
                      >
                        <div className="flex flex-wrap gap-3 items-center">
                          <span className="text-blue-600 font-medium">Week {weekIdx + 1}:</span>
                          {week.learning_goal && (
                            <span className="font-semibold">{week.learning_goal}</span>
                          )}
                          <span className="ml-2 text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
                            {formatDate(week.start_date)} – {formatDate(week.end_date)}
                          </span>
                        </div>
                        <span className="ml-2 text-blue-400">
                          {weekAcc.isOpen(week.id)
                            ? <ChevronUp className="w-5 h-5" />
                            : <ChevronDown className="w-5 h-5" />}
                        </span>
                      </button>

                      {/* Posts in the Week */}
                      <Resizable fade duration={0.2} show={weekAcc.isOpen(week.id)}>

                        <div className="ml-4 py-2 space-y-3">
                          {[...(week.materials || []), ...(week.assignments || []), ...(week.tests || [])].length === 0 && (
                            <div className="text-gray-400 italic">No posts in this week yet.</div>
                          )}
                          {[...(week.materials || []), ...(week.assignments || []), ...(week.tests || [])]
                            .map(postId => posts.find(p => p.id === postId))
                            .filter(Boolean)
                            .map(post => {
                              let onEdit, onDelete, onClick;
                              if (post.postType === "material") {
                                onEdit = isTeacher ? handleMaterialEdit : undefined;
                                onDelete = isTeacher ? handleMaterialDelete : undefined;
                                onClick = () => setSelectedMaterial(post);
                              } else if (post.postType === "assignment") {
                                onEdit = isTeacher ? handleAssignmentEdit : undefined;
                                onDelete = isTeacher ? handleAssignmentDelete : undefined;
                                onClick = () => setSelectedAssignment(post);
                              } else if (post.postType === "test") {
                                onEdit = isTeacher ? handleTestEdit : undefined;
                                onDelete = isTeacher ? handleTestDelete : undefined;
                                onClick = () => setSelectedTest(post);
                              }

                              return (
                                <div className="" key={post.postType + "-" + post.id}>
                                  <StreamCard
                                    propPost={post}
                                    user={user}
                                    formatDate={formatDate}
                                    onClick={onClick}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    isTeacher={isTeacher}
                                  />
                                </div>
                              );
                            })}
                        </div>
                      </Resizable>
                    </div>
                  ))}
                </div>

              </Resizable>
            </div>
          ))}
          {hasMore && (
            <div className="flex justify-center my-4">
              <Button variant="ok" onClick={() => getAllPosts()} disabled={loading}>
                {loading ? "Loading..." : "Show More"}
              </Button>
            </div>
          )}
        </div>
      </div>


      <Button
        onClick={() => setShowPostCreationDialog(true)}
        className="fixed bottom-6 right-6 z-50 bg-amber-600 hover:bg-amber-700 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </Button>


      <StreamPostCreationDialog
        open={showPostCreationDialog}
        onClose={() => setShowPostCreationDialog(false)}
        onSelectType={(type) => {
          setCreationType(type);
          setShowPostCreationDialog(false);
          // show actual creation modal:
          if (type === "material") setShowMaterialCreationModal(true);
          if (type === "assignment") setShowAssignmentCreationModal(true);
          if (type === "test") setShowTestCreationModal(true);
        }}
      />

      {showMaterialCreationModal && isTeacher && (
        <MaterialCreationModal
          open={showMaterialCreationModal}
          onClose={() => {
            setShowMaterialCreationModal(false)
            setShowPostCreationDialog(false)
          }}
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
          onSave={handleMaterialSave}
        />
      )}

      {/* Assignment Modal Placeholder */}
      <Dialog open={showAssignmentCreationModal} onOpenChange={v => {
        setShowAssignmentCreationModal(v);
        if (!v) setCreationType(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Assignment (Coming Soon)</DialogTitle>
          </DialogHeader>
          <div className="text-gray-500">Assignment creation form coming soon.</div>
          <DialogClose asChild>
            <Button variant="cancel" className="mt-4">Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Test Modal Placeholder */}
      <Dialog open={showTestCreationModal} onOpenChange={v => {
        setShowTestCreationModal(v);
        if (!v) setCreationType(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Test (Coming Soon)</DialogTitle>
          </DialogHeader>
          <div className="text-gray-500">Test creation form coming soon.</div>
          <DialogClose asChild>
            <Button variant="cancel" className="mt-4">Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>


      <ConfirmDialog
        open={confirmDelete.open}
        title={confirmDelete.title}
        description="Are you sure you want to delete this item?"
        onOk={() => handleConfirmMaterialDelete(confirmDelete.id)}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
        showOk
        showCancel
      />

      <MaterialViewerModal
        propMaterial={selectedMaterial}
        open={!!selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
        formatDate={formatDate}
        user={user}
      />

      {/* TODO: ADD THE VIEWERS/ROUTING FOR THE ASSIGNMENT/TESTS */}
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
