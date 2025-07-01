import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import fetchWithAuth from "@/lib/fetch_with_auth";
import CommentThread from "./classrooms/CommentThread";
import { Send } from "lucide-react";

export default function CommentSection({ materialId, comments, currentUser, setOnChange }) {
    //TODO: load comments with pagination
    const [newComment, setNewComment] = useState("");

    const handleAdd = async () => {
        if (!newComment.trim()) return;
        try {
            const res = await fetchWithAuth(`/api/classroom/materials/${materialId}/comments/`, {
                method: "POST",
                body: JSON.stringify({ content: newComment }),
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) throw new Error("Failed to add comment");
            const comment = await res.json();
            if (setOnChange) setOnChange(true);
            setNewComment("");
        } catch (err) {
            console.error("Failed to add comment", err);
        }
    };

    const handleEdit = async (id, content) => {
        try {
            const res = await fetchWithAuth(`/api/classroom/materials/${materialId}/comments/${id}/`, {
                method: "PATCH",
                body: JSON.stringify({ content }),
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) throw new Error("Failed to update comment");
            if (setOnChange) setOnChange(true);
        } catch (err) {
            console.error("Failed to update comment", err);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetchWithAuth(`/api/classroom/materials/${materialId}/comments/${id}/`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete comment");
            if (setOnChange) setOnChange(true);
        } catch (err) {
            console.error("Failed to delete comment", err);
        }
    };

    const handleReply = async (parentId, content) => {
        try {
            const res = await fetchWithAuth(`/api/classroom/materials/${materialId}/comments/`, {
                method: "POST",
                body: JSON.stringify({ content, replied_to: parentId }),
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) throw new Error("Failed to reply");
            if (setOnChange) setOnChange(true);
        } catch (err) {
            console.error("Failed to reply to comment", err);
        }
    };



    return (
        <div className="relative bg-gray-100 rounded-lg p-4 max-h-[400px] max-w-full overflow-hidden overflow-x-hidden">
            {/* Scrollable comments list */}
            <div className="overflow-y-auto pr-2 pb-20 max-h-[300px] space-y-4 mb-10">
                {comments.map((comment) => (
                    <CommentThread
                        key={comment.id}
                        comment={comment}
                        currentUser={currentUser}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onReply={handleReply}
                        materialId={materialId}
                    />
                ))}
            </div>

            {/* Fixed input bar */}
            <div className="absolute -bottom-2 left-0 w-full px-4 pb-4 bg-gray-100">
                <div className="flex items-center gap-2">
                    <Input
                        className="text-sm flex-1"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button
                        size="icon"
                        onClick={handleAdd}
                        disabled={!newComment.trim()}
                    >
                        <Send size={16} />
                    </Button>
                </div>
            </div>
        </div>
    );

}

CommentSection.propTypes = {
    materialId: PropTypes.number.isRequired,
    currentUser: PropTypes.object.isRequired,
    comments: PropTypes.array,
    setOnChange: PropTypes.func,
};
