import React from "react";
import PropTypes from "prop-types";
import { FileText, ImageIcon, Video, Link2, Megaphone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import backendUrl from "@backendUrl";

// Set your backend URL here

// For file preview badge color & icon
const TYPE_STYLES = {
    file: { badge: "bg-blue-50 text-blue-800", icon: <FileText className="w-5 h-5 text-blue-500" /> },
    link: { badge: "bg-green-50 text-green-800", icon: <Link2 className="w-5 h-5 text-green-600" /> },
    announcement: { badge: "bg-amber-100 text-amber-700", icon: <Megaphone className="w-5 h-5 text-amber-500" /> },
    general: { badge: "bg-gray-100 text-gray-700", icon: <MessageCircle className="w-5 h-5 text-gray-500" /> },
};

function fileIcon(mimetype = "", filename = "") {
    if (mimetype.startsWith("image/")) return <ImageIcon className="w-6 h-6 text-blue-400" />;
    if (mimetype.startsWith("video/")) return <Video className="w-6 h-6 text-purple-400" />;
    if (mimetype.includes("pdf") || filename.endsWith(".pdf")) return <FileText className="w-6 h-6 text-red-500" />;
    if (mimetype.includes("plain") || filename.endsWith(".txt")) return <FileText className="w-6 h-6 text-gray-500" />;
    return <FileText className="w-6 h-6 text-gray-400" />;
}

// File badges in a horizontal scroller
function FileBadges({ files = [] }) {
    if (!files.length) return null;
    return (
        <div className="flex gap-3 overflow-x-auto pb-2 mt-2">
            {files.map((f, i) => (
                <a
                    href={`${backendUrl}/${(f.link)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={i}
                    className={cn(
                        "min-w-[90px] max-w-[120px] rounded-xl px-2 py-1 flex flex-col items-center gap-1 cursor-pointer transition border border-blue-100",
                        TYPE_STYLES.file.badge,
                    )}
                >
                    {fileIcon(f.mimetype, f.filename)}
                    <span className="block text-xs text-blue-900 font-medium max-w-[88px] truncate text-center">
                        {f.filename || "File"}
                    </span>
                </a>
            ))}
        </div>
    );
}

// Link badges in a horizontal row
function LinkBadges({ links = [] }) {
    if (!links.length) return null;
    return (
        <div className="flex gap-2 flex-wrap mt-2">
            {links.map((l, i) => (
                <a
                    href={`${l.link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={i}
                    className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full border border-green-200 text-green-800 text-xs font-semibold max-w-[180px] truncate hover:bg-green-100 transition",
                        TYPE_STYLES.link.badge
                    )}
                    title={l.link}
                >
                    {TYPE_STYLES.link.icon}
                    <span className="truncate">{l.link}</span>
                </a>
            ))}
        </div>
    );
}

// Text/Announcement/General badges (vertical list)
function TextBadges({ contents = [] }) {
    if (!contents.length) return null;
    return (
        <div className="flex flex-col gap-2 mt-2">
            {contents.map((c, i) => {
                // Choose color (amber if includes "announcement", gray if general, else gray as fallback)
                let typeKey = c.type || (c.text?.toLowerCase().includes("announcement") ? "announcement" : "general");
                let style = TYPE_STYLES[typeKey] || TYPE_STYLES.general;
                return (
                    <div
                        key={i}
                        className={cn(
                            "inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold w-fit max-w-full",
                            style.badge
                        )}
                        style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "95%",
                        }}
                        title={c.text}
                    >
                        {style.icon}
                        <span className="truncate">{c.text}</span>
                    </div>
                );
            })}
        </div>
    );
}

export default function MaterialCard({
    material,
    onEdit,
    onDelete,
    onClick,
    formatDate,
    menu = true,
}) {
    const contentArr = Array.isArray(material.content) ? material.content : [];
    const files = contentArr.filter(
        (c) => !!c.filename && !!c.link && !!c.mimetype && c.mimetype !== "text/html"
    );
    const links = contentArr.filter((c) => c.mimetype === "text/html" && !!c.link);
    const texts = contentArr.filter((c) => !!c.text);

    // Types as badges (top)
    const typeBadges = (material.types || []).map((t) => (
        <span
            key={t.key}
            className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize mr-1",
                TYPE_STYLES[t.key]?.badge || "bg-gray-100 text-gray-700"
            )}
        >
            {t.label || t.key}
        </span>
    ));

    return (
        <div
            className={cn(
                "bg-white rounded-2xl shadow-md p-6 transition cursor-pointer border border-gray-100 hover:shadow-lg relative flex flex-col",
                "material-card"
            )}
            onClick={onClick}
        >
            {/* Menu */}
            {menu && (
                <div className="absolute top-4 right-4 z-10">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                                <span className="sr-only">More</span>
                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit?.(material); }}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); onDelete?.(material.id); }}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}

            {/* Badges */}
            <div className="mb-2 flex flex-wrap gap-1">{typeBadges}</div>

            {/* Title */}
            <h3 className="font-semibold text-gray-900 text-lg">{material.title}</h3>

            {/* Details */}
            <div className="font-semibold text-base text-gray-900 mb-2">{material.details}</div>

            {/* Text/Announcement/General as badges */}
            <TextBadges contents={texts} />

            {/* Files row (scrollable) */}
            <FileBadges files={files} />

            {/* Link badges row */}
            <LinkBadges links={links} />

            <div className="flex items-center text-xs text-gray-500 gap-1 mt-2 ">
                <span>
                    By {material.created_by?.first_name || "Unknown"}
                    {material.created_by?.last_name ? ` ${material.created_by.last_name}` : ""}
                </span>
                <span className="mx-1">•</span>
                <span>{formatDate(material.created_at || material.uploadedAt, true)}</span>
            </div>
        </div>
    );
}

MaterialCard.propTypes = {
    material: PropTypes.object.isRequired,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    onClick: PropTypes.func,
    formatDate: PropTypes.func,
    menu: PropTypes.bool,
};
