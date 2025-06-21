"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import fetchWithAuth from "@/lib/fetch_with_auth";

export default function AttendanceGrid({ classroomId }) {
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [updatingCells, setUpdatingCells] = useState(new Set());
  const [cellErrors, setCellErrors] = useState({});

  const STATUS_CLASSES = {
    present: "bg-green-100 text-green-800",
    late: "bg-yellow-100 text-yellow-800",
    absent: "bg-red-100 text-red-800",
  };

  // ISO week-numbering year/week to Date (Monday)
  const parseWeek = (weekStr) => {
    const [yearStr, wStr] = weekStr.split("-W");
    const year = parseInt(yearStr, 10);
    const weekNum = parseInt(wStr, 10);
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const day = jan4.getUTCDay() || 7; // Mon=1…Sun=7
    const monday1 = new Date(jan4);
    monday1.setUTCDate(jan4.getUTCDate() - (day - 1));
    const result = new Date(monday1);
    result.setUTCDate(monday1.getUTCDate() + (weekNum - 1) * 7);
    return result;
  };

  // Date to ISO week string "YYYY-Www"
  const formatWeek = (date) => {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  };

  // get Monday of given date
  const getWeekStart = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // prev/next week
  const navigateWeek = (dir) => {
    const d = new Date(selectedWeek);
    d.setDate(d.getDate() + dir * 7);
    setSelectedWeek(d);
  };

  // fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const startStr = getWeekStart(selectedWeek).toISOString().split("T")[0];
      const [sessRes, attRes] = await Promise.all([
        fetchWithAuth(
          `/api/classrooms/${classroomId}/sessions/?week=${startStr}`
        ),
        fetchWithAuth(`/api/classrooms/${classroomId}/attendance/`),
      ]);
      if (!sessRes.ok || !attRes.ok) {
        throw new Error("Failed to load data");
      }
      setSessions(await sessRes.json());
      setStudents(await attRes.json());
    } catch (e) {
      setError(e.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  // update attendance cell
  const updateAttendance = async (studentId, sessionId, status) => {
    const key = `${studentId}-${sessionId}`;
    // optimistic
    setStudents((prev) =>
      prev.map((st) =>
        st.id === studentId
          ? { ...st, attendance: { ...st.attendance, [sessionId]: status } }
          : st
      )
    );
    setUpdatingCells((prev) => new Set(prev).add(key));
    setCellErrors((prev) => {
      const c = { ...prev };
      delete c[key];
      return c;
    });
    try {
      const res = await fetchWithAuth(
        `/api/classrooms/${classroomId}/attendance/${sessionId}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student: studentId, status }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Update failed");
      }
    } catch (e) {
      // revert
      setStudents((prev) =>
        prev.map((st) =>
          st.id === studentId
            ? {
                ...st,
                attendance: {
                  ...st.attendance,
                  [sessionId]: st.attendance[sessionId] || "absent",
                },
              }
            : st
        )
      );
      setCellErrors((prev) => ({ ...prev, [key]: e.message }));
    } finally {
      setUpdatingCells((prev) => {
        const c = new Set(prev);
        c.delete(key);
        return c;
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [classroomId, selectedWeek]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading attendance…
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error: {error}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="ml-2"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // CSV download helper
  const downloadCSV = (rows, filename) => {
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const weekStart = getWeekStart(selectedWeek);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const exportWeek = () => {
    const header = ["Student", ...sessions.map((s) => s.date)];
    const rows = students.map((st) => [
      st.name,
      ...sessions.map((s) => st.attendance[s.id] || "absent"),
    ]);
    const weekStr = formatWeek(selectedWeek);
    downloadCSV([header, ...rows], `attendance_week_${weekStr}.csv`);
  };

  const exportAll = () => {
    const header = [
      "Student",
      ...sessions.map((s) => `${s.date} (${s.topic})`),
    ];
    const rows = students.map((st) => [
      st.name,
      ...sessions.map((s) => st.attendance[s.id] || "absent"),
    ]);
    downloadCSV([header, ...rows], `attendance_all_${Date.now()}.csv`);
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigateWeek(-1)}
            className="flex items-center gap-2 bg-amber-500 text-white hover:bg-gray-800"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          <input
            type="week"
            value={formatWeek(selectedWeek)}
            onChange={(e) => setSelectedWeek(parseWeek(e.target.value))}
            className="border px-2 py-1 text-black"
          />
          <Button
            onClick={() => navigateWeek(1)}
            className="flex items-center gap-2 bg-amber-500 text-white hover:bg-gray-800"
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportWeek}>
            Export Week
          </Button>
          <Button variant="outline" onClick={exportAll}>
            Export All
          </Button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-x-auto bg-white border rounded-lg shadow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 z-10 border px-4 py-2 bg-amber-500">
                Student
              </th>
              {sessions.map((s) => (
                <th
                  key={s.id}
                  className="border px-3 py-2 text-center whitespace-nowrap bg-amber-500"
                >
                  <div className="text-sm">
                    {new Date(s.date).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-black truncate" title={s.topic}>
                    {s.topic}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((st) => (
              <tr key={st.id} className="hover:bg-gray-50 ">
                <td className="sticky left-0 bg-white z-10 border border-gray-600 px-4 py-2 font-medium text-black">
                  {st.name}
                </td>
                {sessions.map((sess) => {
                  const key = `${st.id}-${sess.id}`;
                  const status = st.attendance[sess.id] || "absent";
                  const isUpdating = updatingCells.has(key);
                  const cellError = cellErrors[key];
                  return (
                    <td
                      key={sess.id}
                      className={`border px-2 py-2 relative text-black${
                        cellError ? "bg-red-50" : ""
                      }`}
                    >
                      <Select
                        value={status}
                        onValueChange={(v) =>
                          updateAttendance(st.id, sess.id, v)
                        }
                        disabled={isUpdating}
                      >
                        <SelectTrigger
                          className={`w-full h-8 text-xs ${
                            STATUS_CLASSES[status]
                          } ${isUpdating ? "opacity-50" : ""}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-black">
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="late">Late</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                        </SelectContent>
                      </Select>

                      {isUpdating && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                          <Loader2 className="w-3 h-3 animate-spin" />
                        </div>
                      )}

                      {cellError && (
                        <div
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full cursor-help"
                          title={cellError}
                        >
                          !
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
