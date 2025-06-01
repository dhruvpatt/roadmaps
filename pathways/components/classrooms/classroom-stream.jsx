"use client";

import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Plus,
  FileText,
  Calendar,
  Heart,
  MessageCircle,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
// Mock data for analytics
const mockStreamData = [
  {
    id: 1,
    author: "Ms. Johnson",
    content: "Welcome everyone! I'm excited to start this semester with you.",
    timestamp: "2025-01-20T10:00:00Z",
    likes: 12,
    liked: false,
    comments: [
      {
        id: 1,
        author: "Alex Chen",
        text: "Looking forward to it!",
        timestamp: "2025-01-20T11:00:00Z",
      },
    ],
    attachments: [],
  },
  {
    id: 2,
    author: "Alex Chen",
    content: "Does anyone have notes from yesterday's lecture?",
    timestamp: "2025-01-18T16:45:00Z",
    likes: 3,
    liked: false,
    comments: [],
    attachments: [],
  },
];

export default function ClassroomStream({ classroom, isTeacher, user }) {
  const [posts, setPosts] = useState(mockStreamData);
  const [newPost, setNewPost] = useState("");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [commentInput, setCommentInput] = useState({});
  const [showComments, setShowComments] = useState({});

  const formatDate = (timestamp) =>
    new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleLike = (postId) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              likes: post.liked ? post.likes - 1 : post.likes + 1,
              liked: !post.liked,
            }
          : post
      )
    );
  };

  const handleToggleComments = (postId) => {
    setShowComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleAddComment = (postId) => {
    const text = commentInput[postId]?.trim();
    if (!text) return;
    const newComment = {
      id: Date.now(),
      author: user.name,
      text,
      timestamp: new Date().toISOString(),
    };
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, comments: [...post.comments, newComment] }
          : post
      )
    );
    setCommentInput((prev) => ({ ...prev, [postId]: "" }));
  };

  return (
    <div className="bg-white min-h-screen py-2">
      <div className="max-w-2xl mx-auto space-y-6 ">
        {/* Create Post */}
        <Card className=" border-gray-200 hover:bg-gray-50 transition-colors">
          <CardContent className="pt-6">
            {" "}
            {/* added top padding */}
            {!showCreatePost ? (
              <Button
                variant="outline"
                className="w-full justify-start bg-white text-gray-600 cursor-pointer hover:bg-amber-600 hover:text-white"
                onClick={() => setShowCreatePost(true)}
              >
                <Plus className="mr-2" /> Share something...
              </Button>
            ) : (
              <div className="space-y-4">
                <Textarea
                  placeholder="Write your post..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                />
                {/* attachments omitted for brevity */}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    className="cursor-pointer hover:bg-amber-600 hover:text-white w-24"
                    onClick={() => setShowCreatePost(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    className="cursor-pointer hover:bg-amber-600 hover:text-white w-24"
                    onClick={() => {
                      const post = {
                        id: Date.now(),
                        author: user.name,
                        content: newPost,
                        timestamp: new Date().toISOString(),
                        likes: 0,
                        liked: false,
                        comments: [],
                        attachments: [],
                      };
                      setPosts([post, ...posts]);
                      setNewPost("");
                      setShowCreatePost(false);
                    }}
                  >
                    Post
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Posts */}
        <div className="space-y-6">
          {posts.map((post) => (
            <Card
              key={post.id}
              className={cn(
                "rounded-lg border p-2 shadow-sm transition-colors hover:bg-gray-50",
                post.type === "announcement"
                  ? "bg-indigo-50 border-indigo-200"
                  : post.type === "assignment"
                  ? "bg-green-50 border-green-200"
                  : "bg-white border-gray-200"
              )}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="ring-2 ring-gray-300">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-gray-900">
                        {post.author}
                      </span>
                      <span className="text-sm text-gray-500">
                        • {formatDate(post.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-700 mb-4">{post.content}</p>
                <div className="flex items-center gap-6 text-gray-500">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post.id)}
                    className={post.liked ? "text-blue-600" : ""}
                  >
                    <Heart className="mr-1" /> {post.likes}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleComments(post.id)}
                  >
                    <MessageCircle className="mr-1" /> {post.comments.length}
                  </Button>
                </div>

                {showComments[post.id] && (
                  <div className="mt-4 space-y-3">
                    {/* existing comments */}
                    <div className="space-y-2 max-h-40 overflow-y-auto p-1">
                      {post.comments.map((c) => (
                        <div key={c.id} className="flex items-start gap-3">
                          <Avatar className="w-6 h-6 ring-1 ring-gray-300">
                            <AvatarFallback>
                              {c.author.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-gray-100 p-3 rounded-lg flex-1">
                            <div className="text-sm font-semibold text-gray-800">
                              {c.author}
                            </div>
                            <div className="text-sm text-gray-700">
                              {c.text}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(c.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* comment input */}
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Write a comment..."
                        value={commentInput[post.id] || ""}
                        onChange={(e) =>
                          setCommentInput((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => handleAddComment(post.id)}
                      >
                        Comment
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

ClassroomStream.propTypes = {
  classroom: PropTypes.object,
  isTeacher: PropTypes.bool,
  user: PropTypes.shape({ name: PropTypes.string }),
};
