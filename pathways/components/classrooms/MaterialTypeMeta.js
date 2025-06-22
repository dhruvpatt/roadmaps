import {
  FileText,
  Link as LinkIcon,
  Megaphone,
  MessageCircle,
  ImageIcon,
  Video,
} from "lucide-react";

// Unified config for types used across views
export const TYPE_META = {
  announcement: {
    key: "announcement",
    label: "Announcement",
    icon: Megaphone,
    badgeIcon: <Megaphone className="w-5 h-5 text-amber-500" />,
    badge: "bg-amber-100 text-amber-700",
    color: "bg-amber-50 text-amber-800",
    btn: "bg-amber-500 hover:bg-amber-600 text-white",
    border: "border-amber-200"
  },
  general: {
    key: "general",
    label: "General",
    icon: MessageCircle,
    badgeIcon: <MessageCircle className="w-5 h-5 text-gray-500" />,
    badge: "bg-gray-100 text-gray-700",
    color: "bg-gray-100 text-gray-800",
    btn: "bg-gray-500 hover:bg-gray-700 text-white",
    border: "border-gray-200"
  },
  link: {
    key: "link",
    label: "Link",
    icon: LinkIcon,
    badgeIcon: <LinkIcon className="w-5 h-5 text-green-600" />,
    badge: "bg-green-50 text-green-800",
    color: "bg-green-50 text-green-800",
    btn: "bg-green-500 hover:bg-green-600 text-white",
    border: "border-green-200"
  },
  file: {
    key: "file",
    label: "File",
    icon: FileText,
    badgeIcon: <FileText className="w-5 h-5 text-blue-500" />,
    badge: "bg-blue-50 text-blue-800",
    color: "bg-blue-50 text-blue-800",
    btn: "bg-blue-500 hover:bg-blue-600 text-white",
    border: "border-blue-200"
  },
};

// For determining file type icon by MIME or filename
export function fileIcon(mimetype = "", filename = "") {
  if (mimetype.startsWith("image/"))
    return <ImageIcon className="w-6 h-6 text-blue-400" />;
  if (mimetype.startsWith("video/"))
    return <Video className="w-6 h-6 text-purple-400" />;
  if (mimetype.includes("pdf") || filename.endsWith(".pdf"))
    return <FileText className="w-6 h-6 text-red-500" />;
  if (mimetype.includes("plain") || filename.endsWith(".txt"))
    return <FileText className="w-6 h-6 text-gray-500" />;
  return <FileText className="w-6 h-6 text-gray-400" />;
}
