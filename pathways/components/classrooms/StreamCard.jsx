import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Link, Megaphone, FileText, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { TYPE_META } from "./MaterialTypeMeta";
import backendUrl from "@backendUrl";
import CardDropdownMenu from "@components/CardDropdownMenu";
import { MoreHorizontal } from "lucide-react";
import CommentSection from "@components/CommentSection";
import { Resizable } from "@components/animations/Resizeable";



function FadeRowPreview({ children }) {
    return (
        <div className="relative mt-2 overflow-hidden max-w-full">
            <div className="flex gap-3 pr-6 overflow-x-auto max-w-full">
                {children}
            </div>
        </div>
    );
}

export default function StreamCard({
    user,
    post,
    onClick,
    formatDate,
    mode = "material",
    isTeacher,
    onEdit,
    onDelete,
}) {
    const typeKey = post.types?.[0]?.key ?? "general";
    const meta = TYPE_META[typeKey] || TYPE_META.general;

    const contentArr = Array.isArray(post.content) ? post.content : [];
    const files = contentArr.filter((c) => c.type === "file");
    const links = contentArr.filter((c) => c.type === "link");
    const announcements = contentArr.filter((c) => c.type === "announcement");
    const generals = contentArr.filter((c) => c.type === "general");

    const announcementText = announcements[0]?.text;
    const [showComments, setShowComments] = useState(false);


    return (
        <Card
            className="rounded-md border shadow-sm cursor-pointer transition-colors hover:bg-gray-50"
            onClick={() => {
                if (mode === "material") onClick?.(post);
            }}
        >
            <CardHeader className="relative p-0 space-y-2 px-6 pt-4 pb-2">
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
                                {
                                    label: "Delete",
                                    onClick: () => onDelete?.(post.id),
                                    className: "text-red-600",
                                },
                            ]}
                            align="right"
                        />
                    </div>
                )}

                {/* Top Row: Avatar + Name + Date + Types */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                    <Avatar className="h-6 w-6 ring-1 ring-gray-300">
                        <AvatarImage />
                        <AvatarFallback>
                            {post.created_by?.first_name?.charAt(0) ?? "?"}
                        </AvatarFallback>
                    </Avatar>

                    <span className="text-gray-800 font-medium">
                        {post.created_by
                            ? `${post.created_by.first_name} ${post.created_by.last_name ?? ""}`
                            : "Unknown"}
                    </span>

                    <span className="text-gray-400">•</span>

                    <span className="text-gray-500 text-xs">
                        {formatDate(post.created_at || post.timestamp)}
                    </span>

                    {post.types.length > 0 && (
                        <>
                            <span className="text-gray-400">•</span>
                            <div className="flex flex-wrap items-center gap-1">
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
                        </>
                    )}
                </div>

                {/* Announcement or Title */}
                {announcementText ? (
                    <div className="flex items-start gap-2 text-lg text-amber-800 bg-amber-100 p-2 rounded font-bold break-words">
                        <Megaphone className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{announcementText}</span>
                    </div>
                ) : (
                    <h2 className="font-bold break-words flex items-center gap-2 text-xl text-gray-900 line-clamp-2">
                        {post.title}
                    </h2>
                )}

                {/* General (text under title) */}
                {generals.length > 0 && (
                    <div className="mb-1">
                        {generals.map((item, index) => (
                            <p
                                key={index}
                                className="text-gray-800 text-sm break-words line-clamp-2"
                            >
                                {item.text}
                            </p>
                        ))}
                    </div>
                )}
            </CardHeader>

            <CardContent
                className="pt-0"
                onClick={(e) => {
                }}
            >
                {/* Link Row */}
                {links.length > 0 && (
                    <FadeRowPreview>
                        {links.map((item, idx) => (
                            <a
                                key={idx}
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 text-green-800 text-sm font-medium hover:bg-green-200 transition shrink-0 max-w-[200px]"
                            >
                                <Link className="w-4 h-4 text-green-600" />
                                <span className="truncate">{item.link}</span>
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

                {/* Comment Toggle */}
                <div className="mt-4">
                    <Button
                        variant="default"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowComments((prev) => !prev);
                        }}
                    >
                        <MessageCircle className="mr-1" />
                        {post.comments.length}
                    </Button>
                </div>

                {/* Comments */}
                <Resizable show={showComments} fade duration={0.3}>
                    <div className="mt-3 bg-gray-100 rounded-lg p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <CommentSection materialId={post.id} currentUser={user} />
                    </div>
                </Resizable>
            </CardContent>
        </Card>

    );
}

StreamCard.propTypes = {
    user: PropTypes.object.isRequired,
    post: PropTypes.object.isRequired,
    onClick: PropTypes.func,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    formatDate: PropTypes.func.isRequired,
    mode: PropTypes.oneOf(["material", "deliverable"]),
    isTeacher: PropTypes.bool,
};
