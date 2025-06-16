"use client";

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Plus,
  Heart,
  MessageCircle,
  FileText,
  Link,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import fetchWithAuth from "@/lib/fetch_with_auth";
import CommentThread from "./ClassroomCommentThread";
import SearchAndFilterBar from "./SearchAndFilterBar";



export default function ClassroomStream({ classroom, isTeacher, user }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [commentInput, setCommentInput] = useState({});
  const [showComments, setShowComments] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerStep, setDrawerStep] = useState("select"); // or "form"
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    const streamPosts = classroom.materials.map((item) => ({
      id: item.id,
      created_by: item.created_by, // 👈 use as-is
      content: item.details,
      timestamp: item.last_viewed ?? new Date().toISOString(),
      likes: item.likes || 0,
      liked: false,
      comments: item.comments || [],
      attachments: [],
      type: item.type,
      title: item.title,
    }));

    setPosts(streamPosts);
  }, [classroom]);

  useEffect(() => {
    if (user?.role === "student") {
      setSelectedType("general");
      setDrawerStep("form");
      setShowDrawer(true);
    }
  }, [user]);


  const iconForType = (type) => {
    switch (type) {
      case "announcement":
        return <Megaphone className="w-4 h-4 text-amber-600" />;
      case "file":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "url":
        return <Link className="w-4 h-4 text-green-600" />;
      case "general":
      default:
        return <MessageCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const colorForType = {
    amber: "bg-amber-600 hover:bg-amber-700",
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
    gray: "bg-gray-600 hover:bg-gray-700",
  };



  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.content
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || post.type === typeFilter;
    return matchesSearch && matchesType;
  });

  async function createPost({ classroomId, details, userId, content }) {
    try {
      const res = await fetch(
        `/api/classrooms/${classroomId}/announcements/create/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "Announcement",
            details: details,
            content: content,
            creator_user_id: userId,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create announcement");
      }

      const created = await res.json();
      return {
        id: created.id,
        author: user.first_name ?? "You",
        content,
        details,
        timestamp: new Date().toISOString(),
        likes: 0,
        liked: false,
        comments: [],
        attachments: [],
        type: "announcement",
      };
    } catch (err) {
      console.error("createPost error:", err.message);
      return null;
    }
  }

  const formatDate = (timestamp) =>
    new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });



  const handleToggleComments = (postId) => {
    setShowComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleAddComment = async (postId) => {
    const text = commentInput[postId]?.trim();
    if (!text) return;

    try {
      const res = await fetchWithAuth(`/api/classrooms/materials/${postId}/comments/`, {
        method: "POST",
        body: JSON.stringify({ content: text }),
      });

      if (!res.ok) {
        throw new Error("Failed to post comment");
      }

      const newComment = await res.json();

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, comments: [...post.comments, newComment] }
            : post
        )
      );
      setCommentInput((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };


  return (
    <div className="bg-white">
      <div className="max-w-2xl mx-auto space-y-6">


        <SearchAndFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterType={typeFilter}
          setFilterType={setTypeFilter}
          filterOptions={[
            { value: "announcement", label: "Announcements" },
            { value: "file", label: "Files" },
            { value: "url", label: "Links" },
            { value: "general", label: "General" },
          ]}
          placeholder="Search stream..."
        />


        {/* Posts */}
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <Card
              key={post.id}
              className={cn(
                "rounded-md border border-gray-100 shadow-sm transition-colors hover:bg-opacity-80",
                {
                  "bg-amber-50": post.type === "announcement",
                  "bg-blue-50": post.type === "file",
                  "bg-green-50": post.type === "url",
                  "bg-gray-50": post.type === "general",
                }
              )}
            >

              <CardHeader>
                <div className="mb-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                      {
                        "bg-amber-100 text-amber-700": post.type === "announcement",
                        "bg-blue-100 text-blue-700": post.type === "file",
                        "bg-green-100 text-green-700": post.type === "url",
                        "bg-gray-100 text-gray-700": post.type === "general",
                      }
                    )}
                  >
                    {iconForType(post.type)}
                    {post.type}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Avatar className="ring-2 ring-gray-300">
                    <AvatarImage />
                    <AvatarFallback>{post.created_by?.first_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-gray-900">
                        {post.created_by ? `${post.created_by.first_name} ${post.created_by.last_name ?? ""}` : "Unknown"}
                      </span>
                      <span className="text-sm text-gray-500">
                        • {formatDate(post.timestamp)} {post.edited && <span className="ml-1 text-xs text-gray-500">(edited)</span>}

                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-700 mb-4">{post.content}</p>
                <div className="flex items-center gap-3 text-gray-500">
                  {/* <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post.id)}
                    className={post.liked ? "text-blue-600" : ""}
                  >
                    <Heart className="mr-1" /> {post.likes}
                  </Button> */}
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
                    <div className="space-y-2 max-h-70 overflow-y-auto p-1">
                      <div className="mt-4">
                        {post.comments
                          .filter((c) => !c.replied_to) // top-level only
                          .map((comment) => (
                            <CommentThread
                              key={comment.id || `${comment.posted_by?.id}-${comment.date || Math.random()}`}
                              comment={comment}
                              currentUser={user}
                              materialId={post.id}
                              onUpdate={(id, update) => {
                                setPosts((prev) =>
                                  prev.map((p) =>
                                    p.id === post.id
                                      ? {
                                        ...p,
                                        comments: p.comments.map((c) =>
                                          c.id === id
                                            ? { ...c, ...update }
                                            : update?.replied_to === c.id
                                              ? [...(c.replies || []), update]
                                              : c
                                        ),
                                      }
                                      : p
                                  )
                                );
                              }}
                            />
                          ))}
                      </div>

                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Avatar className="w-8 h-8 ring-1 ring-gray-300">
                        <AvatarFallback>{user.first_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 relative">
                        <Input
                          className="pl-4 pr-12 py-2 rounded-full border-gray-300 focus:ring-amber-600 text-sm shadow-sm"
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
                          size="icon"
                          variant="ghost"
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-amber-600 hover:text-amber-700"
                          onClick={() => handleAddComment(post.id)}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      {!showDrawer && user?.role !== "student" && (
        <Button
          onClick={() => setShowDrawer(true)}
          className="fixed bottom-6 right-6 z-50 bg-amber-600 hover:bg-amber-700 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      {showDrawer && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setShowDrawer(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-xl p-6 max-h-[80vh] overflow-y-auto animate-slide-up"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">What do you want to share?</h3>
              <button
                onClick={() => setShowDrawer(false)}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>

            {drawerStep === "select" && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { type: "announcement", label: "Announcement", color: "amber", icon: <Megaphone className="w-4 h-4" /> },
                  { type: "file", label: "File", color: "blue", icon: <FileText className="w-4 h-4" /> },
                  { type: "url", label: "URL", color: "green", icon: <Link className="w-4 h-4" /> },
                  { type: "general", label: "General", color: "gray", icon: <MessageCircle className="w-4 h-4" /> },
                ].map(({ type, label, color, icon }) => {
                  const colorClasses = {
                    amber: "bg-amber-500 hover:bg-amber-600",
                    blue: "bg-blue-500 hover:bg-blue-600",
                    green: "bg-green-500 hover:bg-green-600",
                    gray: "bg-gray-500 hover:bg-gray-600",
                  }[color];

                  return (
                    <Button
                      key={type}
                      onClick={() => {
                        setSelectedType(type);
                        setDrawerStep("form");
                      }}
                      className={`h-14 text-base font-medium ${colorClasses} text-white rounded-xl shadow-md flex gap-2 items-center justify-center`}
                    >
                      {icon}
                      {label}
                    </Button>
                  );
                })}
              </div>
            )}


            {drawerStep === "form" && (
              <div className="space-y-5">
                <h3 className="text-lg font-semibold capitalize">{selectedType}</h3>

                <div className="space-y-2">
                  <Input placeholder="Title" className="text-base" />
                  <Textarea placeholder="Details" rows={4} className="text-base" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-gray-600">Content Type</label>
                  <select className="w-full border border-gray-300 rounded-md text-sm px-3 py-2">
                    <option value="">None</option>
                    <option value="text">Text</option>
                    <option value="material">Material</option>
                  </select>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    className="rounded-lg px-4"
                    onClick={() => {
                      setDrawerStep("select");
                    }}
                  >
                    Back
                  </Button>
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-6">
                    Post
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}



    </div>
  );
}

ClassroomStream.propTypes = {
  classroom: PropTypes.object.isRequired,
  isTeacher: PropTypes.bool,
  user: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    first_name: PropTypes.string,
  }),
};
