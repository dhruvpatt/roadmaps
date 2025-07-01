// src/pages/classrooms/[id]/attendance.jsx
"use client";

import React, { useState } from "react";
import AttendanceGrid from "@/components/classrooms/attendance-grid";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import fetchWithAuth from "@/lib/fetch_with_auth";
import { format } from "date-fns";

export default function AttendancePage({ classroom, user }) {
  const classroomId = parseInt(classroom.id, 10);
  const [reloadFlag, setReloadFlag] = useState(0);

  // modal state + form
  const [isOpen, setIsOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    topic: "",
  });

  const createSession = async () => {
    if (!newSession.topic) return;
    const res = await fetchWithAuth(
      `/api/classroom/${classroomId}/sessions/`,
      {
        method: "POST",
        body: JSON.stringify(newSession),
      }
    );
    if (res.ok) {
      setIsOpen(false);
      // clear form
      setNewSession({ date: format(new Date(), "yyyy-MM-dd"), topic: "" });
      // bump reloadFlag to tell grid to refetch
      setReloadFlag((f) => f + 1);
    }
  };

  return (
    <div className="min-h-screen bg-white-50">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Attendance Grid */}
        <AttendanceGrid
          key={reloadFlag} // force remount/refetch when reloadFlag changes
          classroomId={classroomId}
        />
      </div>
    </div>
  );
}
