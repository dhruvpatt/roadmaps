import React from "react";
import PropTypes from "prop-types";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Link, Megaphone, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { TYPE_META, fileIcon } from "./MaterialTypeMeta";
import backendUrl from "@backendUrl";
import CardDropdownMenu from "@components/CardDropdownMenu";
import { MoreHorizontal } from "lucide-react";

function FadeRowPreview({ children }) {
    return (
        <div className="relative mt-2 overflow-hidden">
            <div
                className="flex gap-3 pr-6"
                style={{
                    maskImage: "linear-gradient(to right, black 80%, transparent)",
                    WebkitMaskImage: "linear-gradient(to right, black 80%, transparent)",
                }}
            >
                {children}
            </div>
        </div>
    );
}

export default function StreamCard({ post, onClick, formatDate, mode = "material", isTeacher, onEdit, onDelete }) {
    const typeKey = post.types?.[0]?.key ?? "general";
    const meta = TYPE_META[typeKey] || TYPE_META.general;

    const contentArr = Array.isArray(post.content) ? post.content : [];
    const files = contentArr.filter((c) => c.type === "file");
    const links = contentArr.filter((c) => c.type === "link");
    const announcements = contentArr.filter((c) => c.type === "announcement");
    const generals = contentArr.filter((c) => c.type === "general");

    return (
        <Card
            className="rounded-md border shadow-sm cursor-pointer transition-colors hover:bg-gray-50"
            onClick={() => {
                if (mode === "material") onClick?.(post);
            }}
        >
            <CardHeader className="relative">
                {isTeacher && (
                    <div className="absolute top-4 right-4 z-10">
                        <CardDropdownMenu
                            trigger={
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-500 hover:text-gray-700"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span className="sr-only">More</span>
                                    <MoreHorizontal className="w-5 h-5" />
                                </Button>
                            }
                            items={[
                                { label: "Edit", onClick: () => onEdit?.(post) },
                                { label: "Delete", onClick: () => onDelete?.(post.id), className: "text-red-600" },
                            ]}
                            align="right"
                        />
                    </div>
                )}


                {/* Title up top */}
                <h2 className="text-xl font-bold text-gray-900 mb-2 whitespace-pre-line">
                    {post.title}
                </h2>

                {/* Avatar + Name + Timestamp */}
                <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-6 w-6 ring-1 ring-gray-300">
                        <AvatarImage />
                        <AvatarFallback>
                            {post.created_by?.first_name?.charAt(0) ?? "?"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-baseline gap-2 text-sm">
                            <span className="text-gray-800 font-medium leading-tight">
                                {post.created_by ? `${post.created_by.first_name} ${post.created_by.last_name ?? ""}` : "Unknown"}
                            </span>
                            <span className="text-gray-500 text-xs">
                                • {formatDate(post.created_at || post.timestamp)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1">
                    {post.types.map((type) => {
                        const m = TYPE_META[type.key] || TYPE_META.general;
                        return (
                            <span
                                key={type.key}
                                className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                                    m.badge
                                )}
                            >
                                {m.badgeIcon}
                                {m.label}
                            </span>
                        );
                    })}
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                {/* Details */}
                <p className="text-gray-700 font-medium text-base mb-4 whitespace-pre-line">
                    {post.details}
                </p>

                {/* Announcements + Generals */}
                <div className="flex flex-col gap-2 mb-4">
                    {[...announcements, ...generals].map((item, index) => {
                        const isAnnouncement = item.type === "announcement";
                        return (
                            <div
                                key={index}
                                className={`flex items-center gap-2 p-3 rounded-lg ${isAnnouncement
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-gray-100 text-gray-800"
                                    } text-sm font-medium w-full`}
                            >
                                {isAnnouncement ? (
                                    <Megaphone className="w-5 h-5 text-amber-600" />
                                ) : (
                                    <MessageCircle className="w-5 h-5 text-gray-600" />
                                )}
                                {item.text}
                            </div>
                        );
                    })}
                </div>

                {/* Link Row */}
                {links.length > 0 && (
                    <FadeRowPreview>
                        {links.map((item, idx) => (
                            <a
                                key={idx}
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 text-green-800 text-sm font-medium hover:bg-green-200 transition shrink-0"
                            >
                                <Link className="w-4 h-4 text-green-600" />
                                <span className="truncate max-w-[200px]">{item.link}</span>
                            </a>
                        ))}
                    </FadeRowPreview>
                )}

                {/* File Row */}
                {files.length > 0 && (
                    <FadeRowPreview>
                        {files.map((item, idx) => (
                            <a
                                key={idx}
                                href={`${backendUrl}${item.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-100 text-blue-800 hover:bg-blue-200 transition border border-blue-200 max-w-[160px] w-full shrink-0"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <FileText className="w-8 h-8 text-blue-600 mb-1" />
                                <span className="text-xs font-medium text-center truncate w-full">
                                    {item.filename || "File"}
                                </span>
                            </a>
                        ))}
                    </FadeRowPreview>
                )}

                {/* Comments count (non-interactive for now) */}
                <div className="flex items-center gap-3 text-gray-500 mt-4">
                    <Button variant="ghost" size="sm" className="pointer-events-none">
                        <MessageCircle className="mr-1" /> {post.comments.length}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

StreamCard.propTypes = {
    post: PropTypes.object.isRequired,
    onClick: PropTypes.func,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    formatDate: PropTypes.func.isRequired,
    mode: PropTypes.oneOf(["material", "deliverable"]),
    isTeacher: PropTypes.bool,
};
