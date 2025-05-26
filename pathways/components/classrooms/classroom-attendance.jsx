"use client";

import React, { useState } from "react";
import {
  Calendar,
  Check,
  X,
  Clock,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PropTypes from "prop-types";

const mockAttendanceData = {
  sessions: [
    {
      id: 1,
      date: "2025-01-25",
      topic: "Photosynthesis Introduction",
      duration: 50,
    },
    { id: 2, date: "2025-01-23", topic: "Cell Structure Lab", duration: 90 },
    { id: 3, date: "2025-01-20", topic: "Molecular Biology", duration: 50 },
    { id: 4, date: "2025-01-18", topic: "Genetics Review", duration: 50 },
    { id: 5, date: "2025-01-16", topic: "Ecology Basics", duration: 50 },
  ],
  students: [
    {
      id: 1,
      name: "Alice Johnson",
      attendance: {
        1: "present",
        2: "present",
        3: "present",
        4: "absent",
        5: "present",
      },
    },
    {
      id: 2,
      name: "Bob Smith",
      attendance: {
        1: "present",
        2: "late",
        3: "present",
        4: "present",
        5: "absent",
      },
    },
    {
      id: 3,
      name: "Carol Davis",
      attendance: {
        1: "present",
        2: "present",
        3: "present",
        4: "present",
        5: "present",
      },
    },
    {
      id: 4,
      name: "David Wilson",
      attendance: {
        1: "absent",
        2: "present",
        3: "late",
        4: "present",
        5: "present",
      },
    },
  ],
};

export default function ClassroomAttendance({ classroom, user }) {
  const [attendanceData, setAttendanceData] = useState(mockAttendanceData);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [newSession, setNewSession] = useState({
    date: "",
    topic: "",
    duration: 50,
  });

  const updateAttendance = (studentId, sessionId, status) => {
    setAttendanceData((prev) => ({
      ...prev,
      students: prev.students.map((student) =>
        student.id === studentId
          ? {
              ...student,
              attendance: { ...student.attendance, [sessionId]: status },
            }
          : student
      ),
    }));
  };

  const createNewSession = () => {
    if (!newSession.date || !newSession.topic) return;
    const session = { id: Date.now(), ...newSession };
    setAttendanceData((prev) => ({
      sessions: [session, ...prev.sessions],
      students: prev.students.map((s) => ({
        ...s,
        attendance: { ...s.attendance, [session.id]: "present" },
      })),
    }));
    setSelectedSession(session.id);
    setShowCreateSession(false);
    setNewSession({ date: "", topic: "", duration: 50 });
  };

  const exportAttendance = () => {
    // TODO: CSV export implementation
  };

  const generateReport = () => {
    // TODO: report generation
  };

  const getAttendanceIcon = (status) => {
    const base = "w-5 h-5";
    switch (status) {
      case "present":
        return <Check className={`${base} text-green-500`} />;
      case "absent":
        return <X className={`${base} text-red-500`} />;
      case "late":
        return <Clock className={`${base} text-yellow-500`} />;
      default:
        return <div className="w-5 h-5" />;
    }
  };

  const calculateAttendanceRate = (studentId) => {
    const student = attendanceData.students.find((s) => s.id === studentId);
    if (!student) return 0;
    const total = attendanceData.sessions.length;
    const presentCount = Object.values(student.attendance).filter(
      (status) => status !== "absent"
    ).length;
    return Math.round((presentCount / total) * 100);
  };

  const getSessionStats = (sessionId) => {
    const stats = { present: 0, late: 0, absent: 0 };
    attendanceData.students.forEach((s) => {
      const st = s.attendance[sessionId];
      if (st === "present") stats.present++;
      if (st === "late") stats.late++;
      if (st === "absent") stats.absent++;
    });
    return { ...stats, total: attendanceData.students.length };
  };

  return (
    <section className="bg-gradient-to-b from-white to-gray-100 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Attendance Dashboard
            </h2>
            <p className="mt-1 text-gray-600">
              Monitor sessions and student participation
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700">
              <Calendar /> New Session
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download /> Export
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FileSpreadsheet /> Report
            </Button>
          </div>
        </div>

        {/* Create Session */}
        {showCreateSession && (
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Create Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newSession.date}
                    onChange={(e) =>
                      setNewSession({ ...newSession, date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    value={newSession.topic}
                    onChange={(e) =>
                      setNewSession({ ...newSession, topic: e.target.value })
                    }
                    placeholder="e.g. Photosynthesis Basics"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newSession.duration}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        duration: +e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateSession(false)}
                >
                  Cancel
                </Button>
                <Button onClick={createNewSession}>Create</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Session Selector */}
        <Card className="shadow-md rounded-xl">
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Select Session:</Label>
              <Select
                value={selectedSession?.toString() || ""}
                onValueChange={(val) => setSelectedSession(+val)}
              >
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Choose session" />
                </SelectTrigger>
                <SelectContent>
                  {attendanceData.sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.date} • {s.topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedSession && (
              <div className="text-sm text-gray-700">
                {(() => {
                  const st = getSessionStats(selectedSession);
                  return `${st.present} Present • ${st.late} Late • ${st.absent} Absent`;
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total */}
          <Card className="shadow hover:shadow-lg transition-shadow rounded-xl">
            <CardContent className="space-y-2">
              <div className="text-xl font-semibold text-gray-800">
                {attendanceData.students.length}
              </div>
              <div className="text-sm text-gray-500">Total Students</div>
            </CardContent>
          </Card>
          {/* Avg Attendance */}
          <Card className="shadow hover:shadow-lg transition-shadow rounded-xl">
            <CardContent className="space-y-2">
              <div className="text-xl font-semibold text-green-500">
                {Math.round(
                  attendanceData.students.reduce(
                    (sum, s) => sum + calculateAttendanceRate(s.id),
                    0
                  ) / attendanceData.students.length
                )}
                %
              </div>
              <div className="text-sm text-gray-500">Average Attendance</div>
            </CardContent>
          </Card>
          {/* Sessions */}
          <Card className="shadow hover:shadow-lg transition-shadow rounded-xl">
            <CardContent className="space-y-2">
              <div className="text-xl font-semibold text-blue-500">
                {attendanceData.sessions.length}
              </div>
              <div className="text-sm text-gray-500">Total Sessions</div>
            </CardContent>
          </Card>
          {/* At Risk */}
          <Card className="shadow hover:shadow-lg transition-shadow rounded-xl">
            <CardContent className="space-y-2">
              <div className="text-xl font-semibold text-red-500">
                {
                  attendanceData.students.filter(
                    (s) => calculateAttendanceRate(s.id) < 80
                  ).length
                }
              </div>
              <div className="text-sm text-gray-500">At Risk (&lt;80%)</div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Table */}
        <Card className="shadow-md rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="sticky left-0 z-10 bg-white px-6 py-3 text-left">
                      Student
                    </th>
                    {attendanceData.sessions.map((s) => (
                      <th
                        key={s.id}
                        className="px-6 py-3 text-center text-sm font-medium text-gray-700"
                      >
                        <div>{new Date(s.date).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[100px]">
                          {s.topic}
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-3 bg-gray-50 text-center text-sm font-medium text-gray-700">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {attendanceData.students.map((student) => {
                    const rate = calculateAttendanceRate(student.id);
                    return (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="sticky left-0 z-10 bg-white px-6 py-3 font-medium text-gray-800">
                          {student.name}
                        </td>
                        {attendanceData.sessions.map((s) => {
                          const st = student.attendance[s.id] || "present";
                          return (
                            <td key={s.id} className="px-6 py-3 text-center">
                              <div className="inline-flex items-center space-x-1">
                                {getAttendanceIcon(st)}
                                <Select
                                  value={st}
                                  onValueChange={(val) =>
                                    updateAttendance(student.id, s.id, val)
                                  }
                                >
                                  <SelectTrigger className="h-8 w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="present">
                                      Present
                                    </SelectItem>
                                    <SelectItem value="late">Late</SelectItem>
                                    <SelectItem value="absent">
                                      Absent
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-6 py-3 text-center font-medium ">
                          <span
                            className={
                              rate >= 95
                                ? "text-green-500"
                                : rate >= 90
                                ? "text-blue-500"
                                : rate >= 80
                                ? "text-yellow-500"
                                : "text-red-500"
                            }
                          >
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Session Details */}
        {selectedSession && (
          <Card className="shadow-md rounded-xl">
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const sess = attendanceData.sessions.find(
                  (s) => s.id === selectedSession
                );
                const st = getSessionStats(selectedSession);
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">Date</div>
                        <div className="font-medium text-gray-800">
                          {new Date(sess.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">Topic</div>
                        <div className="font-medium text-gray-800">
                          {sess.topic}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">Duration</div>
                        <div className="font-medium text-gray-800">
                          {sess.duration} min
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">
                          Attendance Rate
                        </div>
                        <div className="font-medium text-gray-800">
                          {Math.round(
                            ((st.present + st.late) / st.total) * 100
                          )}
                          %
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">
                          Present: {st.present}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">
                          Late: {st.late}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">
                          Absent: {st.absent}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}

ClassroomAttendance.propTypes = {
  classroom: PropTypes.object,
  user: PropTypes.object,
};
