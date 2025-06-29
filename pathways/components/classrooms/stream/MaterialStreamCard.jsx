import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { MessageCircle, Link, Megaphone, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TYPE_META } from "../material/MaterialTypeMeta";
import backendUrl from "@backendUrl";
import CommentSection from "@components/CommentSection";
import { Resizable } from "@components/animations/Resizeable";
import fetchWithAuth from "@/lib/fetch_with_auth";

// This should remain as a utility component, as before
function FadeRowPreview({ children }) {
    return (
        <div className="relative mt-2 overflow-hidden max-w-full">
            <div className="flex gap-3 pr-6 overflow-x-auto max-w-full">
                {children}
            </div>
        </div>
    );
}

export default function MaterialStreamCard({
    user,
    propPost,
    formatDate,
    headerOnly = false,
}) {
    const typeKey = propPost.types?.[0]?.key ?? "general";
    const meta = TYPE_META[typeKey] || TYPE_META.general;

    const contentArr = Array.isArray(propPost.content) ? propPost.content : [];
    const files = contentArr.filter((c) => c.type === "file");
    const links = contentArr.filter((c) => c.type === "link");
    const announcements = contentArr.filter((c) => c.type === "announcement");
    const generals = contentArr.filter((c) => c.type === "general");

    const announcementText = announcements[0]?.text;
    const [showComments, setShowComments] = useState(false);
    const [onChange, setOnChange] = useState(false)
    const [post, setPost] = useState(propPost);

    useEffect(() => {
        setPost(propPost); // Keep in sync if parent updates post
    }, [propPost]);

    useEffect(() => {
        if (onChange) {
            fetchWithAuth(`/api/classroom/materials/${post.id}/`)
                .then(async res => {
                    if (!res.ok) throw new Error("Failed to fetch material");
                    const data = await res.json();
                    setPost(data);
                })
                .catch(err => {
                    console.error("Failed to update material after comment", err);
                });
            setOnChange(false);
        }
    }, [onChange, post.id]);

    // HEADER ONLY: Only render the badges row (for StreamCard header slot)
    if (headerOnly) {
        return propPost.types?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-1">
                {propPost.types.map(type => {
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
        );
    }

    // MAIN CONTENT: Title, announcement, description, files, links, comments, etc.
    return (
        <div>
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
                            className="text-gray-800 text-m break-words line-clamp-2"
                        >
                            {item.text}
                        </p>
                    ))}
                </div>
            )}

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
                            href={`${backendUrl}${item.link}`}
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
                    variant="cancel"
                    size="iconlg"
                    className="flex items-center justify-center gap-1.5 p-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowComments((prev) => !prev);
                    }}
                >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-base font-semibold">
                        {post.comments?.filter((item) => item.is_deleted == false).length > 99
                            ? "99+"
                            : post.comments?.filter((item) => item.is_deleted == false).length}
                    </span>
                </Button>
            </div>

            {/* Comments */}
            <Resizable show={showComments} fade duration={0.4}>
                <div className="mt-3 bg-gray-100 rounded-lg p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <CommentSection
                        key={post.id + '-' + (post.comments?.length || 0)}
                        materialId={post.id}
                        currentUser={user}
                        comments={post.comments}
                        setOnChange={setOnChange}
                    />
                </div>
            </Resizable>
        </div>
    );
}

MaterialStreamCard.propTypes = {
    user: PropTypes.object.isRequired,
    propPost: PropTypes.object.isRequired,
    formatDate: PropTypes.func.isRequired,
    headerOnly: PropTypes.bool,
};
