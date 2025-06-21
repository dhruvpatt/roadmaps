// components/classrooms/ClassroomCard.jsx
"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Users, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ClassroomCard({
  classroomId,
  title,
  subtitle,
  students,
  teacher,
  subject,
  onMoreClick,
  onViewClick,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <Card className="relative overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      {/* Header with gradient background */}
      <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-600 relative">
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((prev) => !prev);
              onMoreClick?.();
            }}
            className="text-white hover:bg-white/20 p-1 rounded-full transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {menuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 top-8 mt-1 w-32 bg-white shadow-sm border border-gray-200 rounded-lg shadow-lg z-10"
            >
              <button
                type="button"
                onClick={() => {
                  // TODO: implement edit
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete?.(classroomId);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Delete
              </button>
            </div>
          )}
        </div>
        <div className="absolute bottom-4 left-6">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
      </div>

      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-medium text-gray-900 line-clamp-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{subject}</p>
            <p className="text-sm text-gray-500">Class code: {subtitle}</p>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{students} students</span>
            </div>
            <span className="text-xs">{teacher}</span>
          </div>

          <Button
            onClick={onViewClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Open
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
