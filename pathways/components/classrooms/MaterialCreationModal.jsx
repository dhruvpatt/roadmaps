import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, X, Megaphone, MessageCircle, Link as LinkIcon, FileText, Pencil, ChevronDown, ChevronRight } from "lucide-react";
import { ContentSection } from "./ContentSection";

const TYPE_META = {
  announcement: {
    label: "Announcement",
    icon: Megaphone,
    color: "bg-amber-50 text-amber-800",
    btn: "bg-amber-500 hover:bg-amber-600 text-white"
  },
  general: {
    label: "General",
    icon: MessageCircle,
    color: "bg-gray-50 text-gray-800",
    btn: "bg-gray-500 hover:bg-gray-700 text-white"
  },
  link: {
    label: "Link",
    icon: LinkIcon,
    color: "bg-green-50 text-green-800",
    btn: "bg-green-500 hover:bg-green-600 text-white"
  },
  file: {
    label: "File",
    icon: FileText,
    color: "bg-blue-50 text-blue-800",
    btn: "bg-blue-500 hover:bg-blue-600 text-white"
  },
};

const MAX_LINKS = 25;
const MAX_FILES = 10;

function sortedContent(content) {
  const announcement = content.filter(c => c.type === "announcement");
  const general = content.filter(c => c.type === "general");
  const links = content.filter(c => c.type === "link");
  const files = content.filter(c => c.type === "file");
  return [...announcement, ...general, ...links, ...files];
}

export default function MaterialCreationModal({
  open,
  onClose,
  onSave,
  initialData = {},
  isEditing = false,
}) {
  const [formData, setFormData] = useState({
    title: initialData.title || "",
    details: initialData.details || "",
    content: sortedContent(Array.isArray(initialData.content) ? initialData.content : []),
  });

  const [pendingInputs, setPendingInputs] = useState([]);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [errors, setErrors] = useState({});
  const [pendingError, setPendingError] = useState("");

  // Collapsible state for each section
  const [collapsed, setCollapsed] = useState({
    links: false,
    files: false,
    announcement: false,
    general: false,
  });

  useEffect(() => {
    if (pendingError) {
      setPendingError("");
    }
  }, [
    formData.title,
    formData.details,
    formData.content,
    pendingInputs,
    editingValue,
    editingIdx
  ]);

  // --- Helpers ---
  const canAdd = (type) => {
    if (type === "announcement")
      return !formData.content.some(c => c.type === "announcement") &&
        !pendingInputs.some(p => p.type === "announcement");
    if (type === "general")
      return !formData.content.some(c => c.type === "general") &&
        !pendingInputs.some(p => p.type === "general");
    if (type === "link")
      return formData.content.filter(c => c.type === "link").length +
        pendingInputs.filter(p => p.type === "link").length < MAX_LINKS;
    if (type === "file")
      return formData.content.filter(c => c.type === "file").length +
        pendingInputs.filter(p => p.type === "file").length < MAX_FILES;
    return true;
  };

  // -- Insert new content sorted by type (links, then files, then others) --
  function addContentSorted(item) {
    setFormData(prev => {
      let newContent;
      if (item.type === "announcement") {
        // Insert announcement at the start
        newContent = [item, ...prev.content.filter(c => c.type !== "announcement")];
      } else {
        newContent = [...prev.content, item];
      }
      return { ...prev, content: sortedContent(newContent) };
    });
  }

  const removeContent = (idx) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content.filter((_, i) => i !== idx)
    }));
    setEditingIdx(null);
    setEditingValue("");
  };

  const removePending = (idx) => {
    setPendingInputs(prev => prev.filter((_, i) => i !== idx));
  };

  const confirmPending = (idx) => {
    const input = pendingInputs[idx];
    if (!input.value) return;
    let newItem = null;
    if (input.type === "announcement" || input.type === "general") {
      newItem = { type: input.type, text: input.value };
    } else if (input.type === "link") {
      newItem = { type: "link", link: input.value };
    } else if (input.type === "file") {
      newItem = { type: "file", ...input.value };
    }
    addContentSorted(newItem);
    removePending(idx);
  };

  // Inline edit
  const startEdit = (idx) => {
    setEditingIdx(idx);
    setEditingValue(formData.content[idx].text || formData.content[idx].link || "");
  };
  const saveEdit = (idx) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content.map((c, i) => i === idx
        ? {
          ...c,
          ...(c.type === "link"
            ? { link: editingValue }
            : { text: editingValue })
        }
        : c
      )
    }));
    setEditingIdx(null);
    setEditingValue("");
  };

  const addPending = (type) => {
    setPendingInputs(prev => [...prev, { type, value: "" }]);
  };

  const handleFileUpload = async (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;

    const newItem = {
      type: "file",
      filename: file.name,
      url: URL.createObjectURL(file),
      mimetype: file.type,
      file,
    };

    addContentSorted(newItem);

    // Remove pending input immediately
    setPendingInputs(prev => prev.filter((_, i) => i !== idx));
  };



  const handleSubmit = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required.";
    if (!formData.details.trim()) newErrors.details = "Details are required.";
    if (formData.content.length === 0) newErrors.content = "Add at least one content item.";
    if (pendingInputs.length > 0) {
      setPendingError("All content fields must be set before submitting.");
      return;
    }
    setErrors(newErrors);
    setPendingError("");
    if (Object.keys(newErrors).length > 0) return;
    onSave(formData);
    onClose();
  };



  // --- Collapse toggles ---
  const toggleSection = (key) =>
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));


  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* [Change] Wider modal */}
      <DialogContent className="max-w-3xl max-h-[calc(100vh-64px)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "Edit Material" : "Add New Material"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Title Input */}
          <div>
            <label className="font-medium mb-1 block">Title</label>
            <Input
              value={formData.title}
              onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
              placeholder="Enter material title"
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title}</p>
            )}
          </div>
          {/* Details Input */}
          <div>
            <label className="font-medium mb-1 block">Details</label>
            <Textarea
              rows={3}
              value={formData.details}
              onChange={e => setFormData(f => ({ ...f, details: e.target.value }))}
              placeholder="Enter details..."
            />
            {errors.details && (
              <p className="text-sm text-red-500 mt-1">{errors.details}</p>
            )}
          </div>

          {/* Add Buttons */}
          <div className="flex gap-2 flex-wrap">
            {["announcement", "general", "link", "file"].map(type => {
              const Icon = TYPE_META[type].icon;
              return (
                <Button
                  key={type}
                  type="button"
                  className={`rounded-xl flex items-center gap-2 px-4 py-2 font-semibold shadow-sm ${TYPE_META[type].btn}`}
                  onClick={() => addPending(type)}
                  disabled={!canAdd(type)}
                >
                  <Icon className="w-5 h-5" />
                  Add {TYPE_META[type].label}
                </Button>
              );
            })}
          </div>

          {/* Pending Content Adders */}
          {pendingInputs.map((p, idx) => (
            <div
              key={idx}
              className={`relative flex items-start gap-3 p-4 rounded-xl border mt-2 min-h-[70px] shadow-sm ${TYPE_META[p.type].color}`}
            >
              {React.createElement(TYPE_META[p.type].icon, { className: `w-6 h-6 mt-1` })}
              {p.type === "announcement" || p.type === "general" ? (
                <Textarea
                  placeholder={`Enter ${p.type === "announcement" ? "announcement" : "general info"}...`}
                  value={p.value}
                  onChange={e => setPendingInputs(inputs => inputs.map((input, i) => i === idx ? { ...input, value: e.target.value } : input))}
                  autoFocus
                />
              ) : p.type === "link" ? (
                <Input
                  placeholder="Paste or type a link"
                  value={p.value}
                  onChange={e => setPendingInputs(inputs => inputs.map((input, i) => i === idx ? { ...input, value: e.target.value } : input))}
                  autoFocus
                />
              ) : p.type === "file" ? (
                <Input
                  type="file"
                  onChange={e => handleFileUpload(e, idx)}
                  autoFocus
                />
              ) : null}
              <div className="flex flex-col items-center justify-center gap-2 ml-2">
                {(p.type !== "file" || (p.value && p.value.filename)) && (
                  <button
                    type="button"
                    className={`rounded-full p-1 ${TYPE_META[p.type].btn} shadow-sm`}
                    style={{ marginBottom: 2 }}
                    onClick={() => confirmPending(idx)}
                  >
                    <Check className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="button"
                  className={`rounded-full p-1 ${TYPE_META[p.type].btn} shadow-sm`}
                  onClick={() => removePending(idx)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          {/* Collapsible, scrollable content sections */}
          <div className="mt-3 space-y-4 max-h-[320px] overflow-y-auto pr-2">
            {/* [Order] Links, then Files, then Announcements, then General */}

            {/* In your JSX: */}

            <ContentSection
              sectionKey="announcement"
              label="Announcement"
              icon={Megaphone}
              items={formData.content.filter(c => c.type === "announcement")}
              collapsed={collapsed}
              toggleSection={toggleSection}
              typeMeta={TYPE_META}
              editingIdx={editingIdx}
              editingValue={editingValue}
              startEdit={startEdit}
              saveEdit={saveEdit}
              setEditingIdx={setEditingIdx}
              setEditingValue={setEditingValue}
              removeContent={removeContent}
            />
            <ContentSection
              sectionKey="general"
              label="General"
              icon={MessageCircle}
              items={formData.content.filter(c => c.type === "general")}
              collapsed={collapsed}
              toggleSection={toggleSection}
              typeMeta={TYPE_META}
              editingIdx={editingIdx}
              editingValue={editingValue}
              startEdit={startEdit}
              saveEdit={saveEdit}
              setEditingIdx={setEditingIdx}
              setEditingValue={setEditingValue}
              removeContent={removeContent}
            />
            <ContentSection
              sectionKey="links"
              label="Links"
              icon={LinkIcon}
              items={formData.content.filter(c => c.type === "link")}
              collapsed={collapsed}
              toggleSection={toggleSection}
              typeMeta={TYPE_META}
              editingIdx={editingIdx}
              editingValue={editingValue}
              startEdit={startEdit}
              saveEdit={saveEdit}
              setEditingIdx={setEditingIdx}
              setEditingValue={setEditingValue}
              removeContent={removeContent}
            />
            <ContentSection
              sectionKey="files"
              label="Files"
              icon={FileText}
              items={formData.content.filter(c => c.type === "file")}
              collapsed={collapsed}
              toggleSection={toggleSection}
              typeMeta={TYPE_META}
              editingIdx={editingIdx}
              editingValue={editingValue}
              startEdit={startEdit}
              saveEdit={saveEdit}
              setEditingIdx={setEditingIdx}
              setEditingValue={setEditingValue}
              removeContent={removeContent}
            />


            {errors.content && (
              <p className="text-sm text-red-500 mt-1">{errors.content}</p>
            )}
          </div>
        </div>

        {/* [Change] Footer always aligns horizontally, never stacks */}
        <DialogFooter className="mt-8 flex-row flex justify-end items-center gap-3">
          <DialogClose asChild>
            <Button variant="cancel">Cancel</Button>
          </DialogClose>
          <Button
            variant="ok"
            onClick={handleSubmit}
            disabled={pendingInputs.length > 0}
          >
            {isEditing ? "Update" : "Add"}
          </Button>
          {pendingError && (
            <p className="text-sm text-red-500 mt-3">{pendingError}</p>
          )}

        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

MaterialCreationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  isEditing: PropTypes.bool,
};

// [Smooth collapsible section CSS]
<style>{`
.collapsible-content {
  transition: max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s;
  overflow: hidden;
  opacity: 1;
  max-height: 1000px;
}
.collapsible-content.collapsed {
  opacity: 0;
  max-height: 0;
  pointer-events: none;
}
`}</style>
