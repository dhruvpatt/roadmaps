import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FileText, Video, ImageIcon, File } from "lucide-react";
import fetchWithAuth from "@/lib/fetch_with_auth";

const fileTypes = [
  {
    value: "document",
    label: "Document",
    icon: FileText,
    color: "text-blue-600",
    accept: ".pdf,.docx,.doc,.txt,.csv,.xlsx",
  },
  {
    value: "video",
    label: "Video",
    icon: Video,
    color: "text-red-600",
    accept: ".mp4,.mov,.avi,.webm",
  },
  {
    value: "image",
    label: "Image",
    icon: ImageIcon,
    color: "text-green-600",
    accept: ".jpg,.jpeg,.png,.gif,.svg",
  },
  {
    value: "ppt",
    label: "Presentation",
    icon: File,
    color: "text-yellow-600",
    accept: ".ppt,.pptx",
  },
];

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
    type: initialData.type || "document",
    content: initialData.content || {},
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

    const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetchWithAuth("/api/materials/upload/", {
        method: "POST",
        body: formData,
        });
        const data = await res.json();
        handleChange("content", {
        url: data.url,
        filename: data.filename,
        });
    } catch (err) {
        console.error("Upload failed", err);
    }
    };


  const handleSubmit = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required.";
    if (!formData.details.trim()) newErrors.details = "Details are required.";
    if (!formData.type) newErrors.type = "Type is required.";
    if (!formData.content?.url) newErrors.content = "File upload is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
    onClose();
  };

  const selectedFileType = fileTypes.find((t) => t.value === formData.type);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "Edit Material" : "Add New Material"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Enter material title"
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <Label>Details</Label>
            <Textarea
              rows={4}
              value={formData.details}
              onChange={(e) => handleChange("details", e.target.value)}
              placeholder="Enter material details"
            />
            {errors.details && (
              <p className="text-sm text-red-500 mt-1">{errors.details}</p>
            )}
          </div>

          <div>
            <Label>Type</Label>
            <Select
              value={formData.type}
              onValueChange={(val) => handleChange("type", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {fileTypes.map(({ value, label, icon: Icon, color }) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500 mt-1">{errors.type}</p>
            )}
          </div>

          <div>
            <Label>Upload File</Label>
            <div className="border border-dashed border-gray-300 bg-gray-50 rounded-lg p-4">
              <Input
                type="file"
                accept={selectedFileType?.accept}
                onChange={handleFileUpload}
              />
              {formData.content?.filename && (
                <p className="text-sm text-gray-600 mt-2">
                  Uploaded: {formData.content.filename}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Accepted types: {selectedFileType?.accept.replaceAll(",", ", ")}
              </p>
            </div>
            {errors.content && (
              <p className="text-sm text-red-500 mt-1">{errors.content}</p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} className="bg-blue-600 text-white">
            {isEditing ? "Update" : "Add"}
          </Button>
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
