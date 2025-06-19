// components/CommentThread.js

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, CornerDownRight, Send, ChevronDown, ChevronRight } from "lucide-react";
import fetchWithAuth from "@/lib/fetch_with_auth";

export default function CommentThread({
    comment,
    currentUser,
    onUpdate,
    materialId,
}) {
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [input, setInput] = useState(comment.content);
    const [replyText, setReplyText] = useState("");

    const isOwnComment = comment.posted_by?.id === currentUser?.id;

    const handleEdit = async () => {
        try {
            const res = await fetchWithAuth(`/api/classroom/comments/${comment.id}/`, {
                method: "PATCH",
                body: JSON.stringify({ content: input }),
            });
            const updated = await res.json();
            setIsEditing(false);
            onUpdate(comment.id, updated);
        } catch (e) {
            console.error("Edit failed", e);
        }
    };

    const handleDelete = async () => {
        try {
            await fetchWithAuth(`/api/classroom/comments/${comment.id}/`, {
                method: "DELETE",
            });
            onUpdate(comment.id, { deleted: true });
        } catch (e) {
            console.error("Delete failed", e);
        }
    };

    const handleReply = async () => {
        try {
            const res = await fetchWithAuth(
                `/api/classroom/materials/${materialId}/comments/`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        content: replyText,
                        replied_to: comment.id,
                    }),
                }
            );
            const newReply = await res.json();
            setReplyText("");
            setIsReplying(false);
            onUpdate(null, newReply); // Let parent append reply
        } catch (e) {
            console.error("Reply failed", e);
        }
    };

    const renderContent = () => {
        if (comment.deleted) {
            return <i className="text-gray-400 text-sm">[deleted]</i>;
        }

        return (
            <>
                <div className="text-sm font-semibold text-gray-800 flex justify-between">
                    <span>
                        {comment.posted_by?.first_name} {comment.posted_by?.last_name ?? ""}
                    </span>
                    {isOwnComment && (
                        <div className="flex gap-1">
                            <Pencil
                                size={14}
                                className="cursor-pointer text-gray-500 hover:text-gray-700"
                                onClick={() => setIsEditing(true)}
                            />
                            <Trash2
                                size={14}
                                className="cursor-pointer text-red-500 hover:text-red-700"
                                onClick={handleDelete}
                            />
                        </div>
                    )}
                </div>

                {isEditing ? (
                    <div className="space-y-2 mt-1">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <Button size="sm" className="text-xs" onClick={handleEdit}>
                            Save
                        </Button>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-gray-700">
                            {comment.content}
                            {comment.edited && (
                                <span className="text-xs text-gray-500 ml-1">(edited)</span>
                            )}
                        </p>
                        <div className="text-xs text-gray-500 mt-1">
                            {new Date(comment.date).toLocaleString("en-US")}
                        </div>
                    </>
                )}
            </>
        );
    };

    return (
        <div className="ml-6 mt-3">
            <div className="flex items-start gap-3">
                <Avatar className="w-6 h-6 ring-1 ring-gray-300">
                    <AvatarFallback>
                        {comment.posted_by?.first_name?.[0] ?? "?"}
                    </AvatarFallback>
                </Avatar>
                <div className={cn("bg-gray-200 p-3 rounded-lg flex-1", comment.deleted && "bg-gray-50")}>
                    {renderContent()}
                </div>
            </div>

            {comment.replies?.length > 0 && (
                <div className="ml-8 mt-2">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="text-xs text-gray-500 flex items-center hover:underline"
                    >
                        {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                        {collapsed ? "Show replies" : "Hide replies"}
                    </button>
                    {!collapsed && (
                        <div className="mt-2 space-y-2">
                            {comment.replies.map((reply) => (
                                <CommentThread
                                    key={reply.id || `${reply.posted_by?.id}-${reply.date || Math.random()}`}
                                    comment={reply}
                                    currentUser={currentUser}
                                    onUpdate={onUpdate}
                                    materialId={materialId}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {!comment.deleted && (
                <>
                    {isReplying ? (
                        <div className="flex items-center gap-2 mt-2 ml-6">
                            <Input
                                className="text-sm"
                                placeholder="Write a reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            />
                            <Button
                                variant="ghost"
                                className="text-amber-600"
                                size="icon"
                                onClick={handleReply}
                            >
                                <Send size={16} />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="link"
                            size="sm"
                            className="text-xs text-gray-500 ml-8"
                            onClick={() => setIsReplying(true)}
                        >
                            <CornerDownRight size={12} className="mr-1" />
                            Reply
                        </Button>
                    )}
                </>
            )}
        </div>
    );
}
