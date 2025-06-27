import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import fetchWithAuth from "@/lib/fetch_with_auth";
import CommentThread from "./classrooms/CommentThread";
import { Send } from "lucide-react";

export default function CommentSection({ materialId, currentUser }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        fetchWithAuth(`/api/classroom/materials/${materialId}/comments/`)
            .then(res => res.json())
            .then(data => setComments(data))
            .catch(err => console.error("Failed to load comments", err));
    }, [materialId]);

    const handleAdd = async () => {
        if (!newComment.trim()) return;
        try {
            const res = await fetchWithAuth(`/api/classroom/materials/${materialId}/comments/`, {
                method: "POST",
                body: JSON.stringify({ content: newComment }),
            });
            const comment = await res.json();
            setComments(prev => [...prev, comment]);
            setNewComment("");
        } catch (err) {
            console.error("Failed to add comment", err);
        }
    };

    const handleUpdate = (id, updatedData) => {
        if (updatedData?.deleted) {
            setComments(prev => prev.filter(c => c.id !== id));
        } else if (id) {
            setComments(prev => prev.map(c => (c.id === id ? updatedData : c)));
        } else {
            // New reply
            setComments(prev => {
                const last = prev[prev.length - 1];
                return [
                    ...prev.slice(0, -1),
                    {
                        ...last,
                        replies: [...(last.replies || []), updatedData],
                    },
                ];
            });
        }
    };

    return (
        <div className="relative bg-gray-100 rounded-lg p-4 max-h-[400px] overflow-hidden">
            {/* Scrollable comments list */}
            <div className="overflow-y-auto pr-2 pb-20 max-h-[300px] space-y-4 mb-10">
                {comments.map((comment) => (
                    <CommentThread
                        key={comment.id}
                        comment={comment}
                        currentUser={currentUser}
                        onUpdate={handleUpdate}
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
};
