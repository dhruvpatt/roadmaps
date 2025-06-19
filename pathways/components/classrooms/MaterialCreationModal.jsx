import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, X, Megaphone, MessageCircle, Link as LinkIcon, FileText } from "lucide-react";


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

export default function MaterialCreationModal({
  open,
  onClose,
  onSave,
  initialData = {},
  isEditing = false,
}) {
  // Core form data
  const [formData, setFormData] = useState({
    title: initialData.title || "",
    details: initialData.details || "",
    content: Array.isArray(initialData.content) ? initialData.content : [],
  });
  // Temporary add state
  const [newContentType, setNewContentType] = useState(null);
  const [tempInput, setTempInput] = useState("");
  const [errors, setErrors] = useState({});

  // Helpers to check caps
  const canAdd = (type) => {
    if (type === "announcement")
      return !formData.content.some(c => c.type === "announcement");
    if (type === "general")
      return !formData.content.some(c => c.type === "general");
    if (type === "link")
      return formData.content.filter(c => c.type === "link").length < MAX_LINKS;
    if (type === "file")
      return formData.content.filter(c => c.type === "file").length < MAX_FILES;
    return true;
  };

  // Remove by index
  const removeContent = (idx) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content.filter((_, i) => i !== idx)
    }));
  };

  // Add content of a certain type
  const addAnnouncement = (text) => {
    setFormData(prev => ({
      ...prev,
      content: [
        ...prev.content.filter(c => c.type !== "announcement"),
        { type: "announcement", text }
      ]
    }));
    setNewContentType(null);
    setTempInput("");
  };
  const addGeneral = (text) => {
    setFormData(prev => ({
      ...prev,
      content: [
        ...prev.content.filter(c => c.type !== "general"),
        { type: "general", text }
      ]
    }));
    setNewContentType(null);
    setTempInput("");
  };
  const addLink = (url) => {
    setFormData(prev => ({
      ...prev,
      content: [
        ...prev.content,
        { type: "link", link: url }
      ]
    }));
    setNewContentType(null);
    setTempInput("");
  };
  const addFile = (fileObj) => {
    setFormData(prev => ({
      ...prev,
      content: [
        ...prev.content,
        { type: "file", ...fileObj }
      ]
    }));
    setNewContentType(null);
    setTempInput("");
  };

  // Handle file upload (simulate here: just show filename)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Fake upload; normally POST file and get a URL
    addFile({
      filename: file.name,
      url: URL.createObjectURL(file),
      mimetype: file.type,
    });
  };

  // Form submit
  const handleSubmit = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required.";
    if (!formData.details.trim()) newErrors.details = "Details are required.";
    if (formData.content.length === 0) newErrors.content = "Add at least one content item.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    onSave(formData);
    onClose();
  };

  // Group content for rendering
  const announcement = formData.content.find(c => c.type === "announcement");
  const general = formData.content.find(c => c.type === "general");
  const links = formData.content.filter(c => c.type === "link");
  const files = formData.content.filter(c => c.type === "file");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "Edit Material" : "Add New Material"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
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
                  onClick={() => setNewContentType(type)}
                  disabled={!canAdd(type) || newContentType}
                >
                  <Icon className="w-5 h-5" />
                  Add {TYPE_META[type].label}
                </Button>
              );
            })}
          </div>

          {/* Content Adders */}
          {newContentType === "announcement" && (
            <div className="relative flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 shadow-sm mt-2 min-h-[70px]">
              <Megaphone className="w-6 h-6 text-amber-500 mt-1" />
              <Textarea
                className="flex-1 border-none bg-transparent focus:ring-0 resize-none text-base placeholder:text-gray-500 min-h-[45px]"
                placeholder="Enter announcement..."
                value={tempInput}
                onChange={e => setTempInput(e.target.value)}
                autoFocus
              />
              <div className="flex flex-col items-center justify-center gap-2 ml-2">
                <button
                  type="button"
                  className="rounded-full p-1 bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                  style={{ marginBottom: 2 }}
                  onClick={() => tempInput && addAnnouncement(tempInput)}
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="rounded-full p-1 bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                  onClick={() => setNewContentType(null)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {newContentType === "general" && (
            <div className="relative flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50 shadow-sm mt-2 min-h-[70px]">
              <MessageCircle className="w-6 h-6 text-gray-500 mt-1" />
              <Textarea
                className="flex-1 border-none bg-transparent focus:ring-0 resize-none text-base placeholder:text-gray-500 min-h-[45px]"
                placeholder="Enter general info..."
                value={tempInput}
                onChange={e => setTempInput(e.target.value)}
                autoFocus
              />
              <div className="flex flex-col items-center justify-center gap-2 ml-2">
                <button
                  type="button"
                  className="rounded-full p-1 bg-gray-500 hover:bg-gray-700 text-white shadow-sm"
                  style={{ marginBottom: 2 }}
                  onClick={() => tempInput && addGeneral(tempInput)}
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="rounded-full p-1 bg-gray-500 hover:bg-gray-700 text-white shadow-sm"
                  onClick={() => setNewContentType(null)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {newContentType === "link" && (
            <div className="relative flex items-start gap-3 p-4 rounded-xl border border-green-200 bg-green-50 shadow-sm mt-2 min-h-[70px]">
              <LinkIcon className="w-6 h-6 text-green-600 mt-1" />
              <Input
                className="flex-1 border-none bg-transparent focus:ring-0 text-base placeholder:text-gray-500"
                placeholder="Paste or type a link"
                value={tempInput}
                onChange={e => setTempInput(e.target.value)}
                autoFocus
              />
              <div className="flex flex-col items-center justify-center gap-2 ml-2">
                <button
                  type="button"
                  className="rounded-full p-1 bg-green-500 hover:bg-green-600 text-white shadow-sm"
                  style={{ marginBottom: 2 }}
                  onClick={() => tempInput && addLink(tempInput)}
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="rounded-full p-1 bg-green-500 hover:bg-green-600 text-white shadow-sm"
                  onClick={() => setNewContentType(null)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {newContentType === "file" && (
            <div className="relative flex items-start gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50 shadow-sm mt-2 min-h-[70px]">
              <FileText className="w-6 h-6 text-blue-600 mt-1" />
              <Input
                type="file"
                className="flex-1 border-none bg-transparent focus:ring-0 text-base placeholder:text-gray-500"
                onChange={handleFileUpload}
                autoFocus
              />
              <div className="flex flex-col items-center justify-center gap-2 ml-2">
                <button
                  type="button"
                  className="rounded-full p-1 bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                  onClick={() => setNewContentType(null)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* List of added content */}
          <div className="mt-3 space-y-2">
            {formData.content.map((c, idx) => {
              const Icon = TYPE_META[c.type].icon;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl shadow-sm border ${TYPE_META[c.type].color}`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex-1 truncate">
                    {c.type === "announcement" && <span className="font-semibold mr-1">Announcement:</span>}
                    {c.type === "general" && <span className="font-semibold mr-1">General:</span>}
                    {c.type === "announcement" || c.type === "general" ? (
                      <span>{c.text}</span>
                    ) : c.type === "link" ? (
                      <a href={c.link} target="_blank" rel="noopener noreferrer" className="underline break-all">
                        {c.link}
                      </a>
                    ) : c.type === "file" ? (
                      <span className="truncate">{c.filename}</span>
                    ) : null}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeContent(idx)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
            {errors.content && (
              <p className="text-sm text-red-500 mt-1">{errors.content}</p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>{isEditing ? "Update" : "Add"}</Button>
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
