import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Link as LinkIcon,
  Megaphone,
  MessageCircle,
  ImageIcon,
  User,
} from "lucide-react";

import backendUrl from "@backendUrl";

const TYPE_ICONS = {
  announcement: <Megaphone className="w-4 h-4 text-amber-600" />,
  file: <FileText className="w-4 h-4 text-blue-600" />,
  link: <LinkIcon className="w-4 h-4 text-green-700" />,
  general: <MessageCircle className="w-4 h-4 text-gray-500" />,
};


function FilePreview({ content = [] }) {
  if (!Array.isArray(content) || content.length === 0) return null;
  const fileItems = content.filter(
    (c) => c.mimetype && c.mimetype.startsWith("image/") ||
            c.mimetype === "application/pdf" ||
            c.mimetype === "text/plain"
  );
  if (fileItems.length === 0) return null;

  return (
    <div className="bg-blue-50 rounded-xl px-4 py-3 mt-2">
      <div className="font-semibold flex items-center gap-2 mb-2">
        <FileText className="w-5 h-5 text-blue-600" />
        Files
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {fileItems.map((file, idx) => (
          <div
            key={idx}
            className="bg-gray-100 rounded-lg p-3 min-w-[130px] flex flex-col items-center shadow-sm"
            style={{ border: "1px solid #e5e7eb" }}
          >
            {/* Just icon based on type */}
            <div className="mb-2">
              {file.mimetype?.startsWith("image/") ? (
                <ImageIcon className="w-7 h-7 text-gray-400" />
              ) : file.mimetype?.includes("pdf") ? (
                <FileText className="w-7 h-7 text-red-500" />
              ) : (
                <FileText className="w-7 h-7 text-gray-400" />
              )}
            </div>
            <span className="text-xs text-gray-700 mb-1 truncate max-w-[100px]">
              {file.filename}
            </span>
            <a
              href={backendUrl + file.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 text-xs font-medium underline"
            >
              Download
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinksPreview({ content = [] }) {
  const links = content.filter((c) => c.mimetype === "text/html" && c.link);
  if (links.length === 0) return null;

  return (
    <div className="bg-green-50 rounded-xl px-4 py-3 mt-2">
      <div className="font-semibold flex items-center gap-2 mb-2">
        <LinkIcon className="w-5 h-5 text-green-700" />
        Links
      </div>
      <ul className="space-y-1">
        {links.map((link, idx) => (
          <li key={idx}>
            <a
              href={link.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block truncate text-green-700 underline max-w-xs"
              title={link.link}
            >
              {link.link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnnouncementPreview({ content = [] }) {
  const announcement = content.find((c) => c.text && c.text.toLowerCase().includes("announcement"));
  if (!announcement) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-2">
      <div className="font-semibold flex items-center gap-2 text-amber-800 mb-1">
        <Megaphone className="w-5 h-5" />
        Announcement
      </div>
      <div className="text-gray-800">{announcement.text}</div>
    </div>
  );
}

function GeneralPreview({ content = [] }) {
  const general = content.find((c) => c.text && !c.text.toLowerCase().includes("announcement"));
  if (!general) return null;
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mt-2">
      <div className="font-semibold flex items-center gap-2 text-gray-700 mb-1">
        <MessageCircle className="w-5 h-5" />
        General
      </div>
      <div className="text-gray-800">{general.text}</div>
    </div>
  );
}

export default function MaterialViewerModal({
  material,
  open,
  onClose,
  formatDate = (d) =>
    new Date(d).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
}) {
  if (!material) return null;
  const content = Array.isArray(material.content) ? material.content : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl px-0 pt-0 pb-6 overflow-visible">
        <DialogHeader className="bg-gradient-to-r from-blue-50 via-amber-50 to-green-50 rounded-t-xl px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-semibold text-gray-900 mb-1">
                {material.title}
              </DialogTitle>
              <div className="flex gap-2 mt-1 flex-wrap">
                {(material.types || []).map((type) => (
                  <span
                    key={type.key}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize bg-gray-100 text-gray-700"
                  >
                    {TYPE_ICONS[type.key] || <User className="w-4 h-4" />}
                    {type.label || type.key}
                  </span>
                ))}
              </div>
              {/* Details directly under badges, NO card */}
              <div className="text-base text-gray-900 mt-2 mb-2">
                {material.details}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pt-2">
          <AnnouncementPreview content={content} />
          <GeneralPreview content={content} />
          <LinksPreview content={content} />
          <FilePreview content={content} />
          <div className="flex items-center gap-2 mt-6 text-sm text-gray-500">
            <User className="w-4 h-4" />
            <span>
              Uploaded by{" "}
              <span className="font-medium text-gray-700">
                {material.created_by?.first_name
                  ? `${material.created_by.first_name} ${material.created_by.last_name ?? ""}`
                  : material.uploadedBy || "Unknown"}
              </span>
            </span>
            <span className="mx-1">•</span>
            <span>
              {formatDate(material.created_at || material.uploadedAt)}
            </span>
          </div>
        </div>
        <DialogFooter className="mt-4 px-6">
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

MaterialViewerModal.propTypes = {
  material: PropTypes.object,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  formatDate: PropTypes.func,
};

MaterialViewerModal.propTypes = {
  material: PropTypes.object,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  formatDate: PropTypes.func,
};
