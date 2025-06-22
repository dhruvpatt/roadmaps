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
import SimpleAccordion from "@components/SimpleAccordian";
import { TYPE_META, fileIcon } from "./MaterialTypeMeta"; // or wherever you stored it


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

  const announcement = content.filter((c) => c.type === "announcement");
  const general = content.filter((c) => c.type === "general");
  const links = content.filter((c) => c.type === "link");
  const files = content.filter((c) => c.type === "file");

  console.log(files)

  const [collapsed, setCollapsed] = useState({
    announcement: false,
    general: false,
    link: false,
    file: false,
  });

  const toggle = (key) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-3xl px-0 pt-0 pb-6 overflow-visible max-h-screen"
        style={{ overflowY: "auto" }}
      >
        <DialogHeader className="bg-gradient-to-r from-blue-50 via-amber-50 to-green-50 rounded-t-xl px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-3xl font-semibold text-gray-900 mb-1">
                {material.title}
              </DialogTitle>
              <div className="flex gap-2 mt-1 flex-wrap">
                {(material.types || []).map((type) => (
                  <span
                    key={type.key}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${TYPE_META[type.key]?.color || "bg-gray-100 text-gray-700"
                      }`}                  >
                    {TYPE_META[type.key]?.icon ? (
                      React.createElement(TYPE_META[type.key].icon, { className: "w-4 h-4" })
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    {TYPE_META[type.key]?.label || type.key}

                  </span>
                ))}
              </div>
              <div className="text-lg text-gray-800 mt-2">{material.details}</div>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pt-4 space-y-3">
          {announcement.length > 0 && (
            <div className={`rounded-xl ${TYPE_META.announcement.color} ${TYPE_META.announcement.border} p-3`}>
              <SimpleAccordion
                icon={TYPE_META.announcement.icon}
                title={TYPE_META.announcement.label}
                isCollapsed={collapsed.announcement}
                onToggle={() => toggle("announcement")}
                count={announcement.length}
              >
                <div className="text-gray-800">{announcement[0].text}</div>
              </SimpleAccordion>
            </div>
          )}

          {general.length > 0 && (
            <div className={`rounded-xl ${TYPE_META.general.color} ${TYPE_META.general.border} p-3`}>
              <SimpleAccordion
                icon={MessageCircle}
                title="General Info"
                isCollapsed={collapsed.general}
                onToggle={() => toggle("general")}
              >
                <div className="text-gray-800">{general[0].text}</div>
              </SimpleAccordion>
            </div>

          )}

          {links.length > 0 && (
            <div className={`rounded-xl ${TYPE_META.link.color} ${TYPE_META.link.border} p-3`}>
              <SimpleAccordion
                icon={LinkIcon}
                title="Links"
                isCollapsed={collapsed.link}
                onToggle={() => toggle("link")}
                count={links.length}
              >
                <ul className="space-y-1">
                  {links.map((l, i) => (
                    <li key={i}>
                      <a
                        href={l.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-green-700 underline block"
                      >
                        {l.link}
                      </a>
                    </li>
                  ))}
                </ul>
              </SimpleAccordion>
            </div>

          )}

          {files.length > 0 && (
            <div className={`rounded-xl ${TYPE_META.file.color} ${TYPE_META.file.border} p-3`}>
              <SimpleAccordion
                icon={FileText}
                title="Files"
                isCollapsed={collapsed.file}
                onToggle={() => toggle("file")}
                count={files.length}
              >
                <div className="flex flex-wrap gap-3">
                  {files.map((file, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-lg p-3 w-[130px] flex flex-col items-center shadow-sm border border-gray-200"
                    >
                      <div className="mb-2">
                        {file.mimetype?.startsWith("image/") ? (
                          <ImageIcon className="w-7 h-7 text-blue-400" />
                        ) : file.mimetype?.includes("pdf") ? (
                          <FileText className="w-7 h-7 text-red-500" />
                        ) : (
                          <FileText className="w-7 h-7 text-gray-400" />
                        )}
                      </div>
                      <span className="text-xs text-gray-700 mb-1 truncate max-w-[100px] text-center">
                        {file.filename}
                      </span>
                      <a
                        href={backendUrl + file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-xs font-medium underline"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </SimpleAccordion>
            </div>

          )}

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
            <span>{formatDate(material.created_at || material.uploadedAt)}</span>
          </div>
        </div>

        <DialogFooter className="mt-4 px-6">
          <DialogClose asChild>
            <Button variant="cancel">Close</Button>
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
