"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Link from "next/link";
import {
  Plus,
  FileQuestion,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import fetchWithAuth from "@/lib/fetch_with_auth";

export default function ClassroomTests({ classroom, isTeacher, user }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (classroom?.id) {
      fetchTests();
    }
  }, [classroom?.id]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`/api/classrooms/${classroom.id}/tests/`);
      if (response.ok) {
        const data = await response.json();
        setTests(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete a test
  const handleDeleteTest = async (id) => {
    if (confirm("Delete this test?")) {
      try {
        const response = await fetchWithAuth(`/api/tests/${id}/`, { method: 'DELETE' });
        if (response.ok) {
          setTests((prev) => prev.filter((x) => x.id !== id));
        }
      } catch (error) {
        console.error('Error deleting test:', error);
      }
    }
  };

  // Teacher publishes a draft
  const handlePublishTest = async (id) => {
    try {
      const response = await fetchWithAuth(`/api/tests/${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: true })
      });
      if (response.ok) {
        setTests((prev) =>
          prev.map((x) => (x.id === id ? { ...x, is_published: true } : x))
        );
      }
    } catch (error) {
      console.error('Error publishing test:', error);
    }
  };

  // Student starts a test
  const handleStartTest = (id) => {
    console.log("Start test", id);
  };

  // Teacher views results
  const handleViewResults = (id) => {
    router.push(`/test-results/${id}`);
  };

  // Badge logic with amber theme
  const getBadge = (t) => {
    if (isTeacher) {
      if (!t.is_published)
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            Draft
          </Badge>
        );
      return (
        <Badge className="bg-cream-100 text-amber-900 border-amber-200">
          Published
        </Badge>
      );
    }
    if (t.is_published) {
      return <Badge className="bg-amber-500 text-white">Available</Badge>;
    }
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200">
        Not Available
      </Badge>
    );
  };

  // Format ISO date → "Mon DD, YYYY HH:MM"
  const formatDate = (dt) =>
    new Date(dt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const isOverdue = (d) => new Date(d) < new Date();

  return (
    <section className="bg-gradient-to-br bg-white py-8">
      <div className="max-w-4xl mx-auto px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">
              Tests & Quizzes
            </h2>
          </div>
          {isTeacher && (
            <Link href={`/create-test?classroom_id=${classroom.id}`} className="cursor-pointer">
              <Button className="flex items-center gap-2 bg-amber-600 text-white hover:bg-amber-700 focus:ring-2 focus:ring-offset-1 focus:ring-amber-400 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer">
                <Plus className="w-5 h-5" /> Create Test
              </Button>
            </Link>
          )}
        </div>

        {/* List of Tests */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
              <p className="text-amber-600">Loading tests...</p>
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-12">
              <FileQuestion className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">No tests found</h3>
              <p className="text-gray-400">Create your first test to get started.</p>
            </div>
          ) : (
            tests.map((test) => (
            <Card
              key={test.id}
              className="
                shadow-sm border border-gray-200 
                rounded-2xl shadow-lg 
                p-6 bg-white
                hover:shadow-xl hover:-translate-y-1
                transition-all duration-300
                backdrop-blur-sm
              "
            >
              {/* Header Row: Title + Badge + (Edit/Delete if teacher) */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div className="flex items-center gap-3 w-full sm:w-2/3">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <FileQuestion className="w-6 h-6 text-amber-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-black line-clamp-1 mb-1">
                      {test.title}
                    </h3>
                    <p className="text-gray-500 line-clamp-2 leading-relaxed">
                      {test.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3 sm:mt-0">
                  {getBadge(test)}
                  {isTeacher && (
                    <div className="flex items-center gap-1">
                      <Link href={`/create-test?classroom_id=${classroom.id}&edit=${test.id}`} className="cursor-pointer">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-700 hover:bg-amber-100 rounded-lg cursor-pointer"
                          aria-label="Edit Test"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTest(test.id)}
                        className="text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        aria-label="Delete Test"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex items-center gap-2 bg-amber-100 px-3 py-2 rounded-full text-sm font-medium text-amber-800">
                  <FileQuestion className="w-4 h-4" />
                  <span>{test.number_of_questions || 0} Questions</span>
                </div>
                {test.time_limit && (
                  <div className="flex items-center gap-2 bg-amber-100 px-3 py-2 rounded-full text-sm font-medium text-amber-800">
                    <Clock className="w-4 h-4" />
                    <span>{test.time_limit.split(':')[1]} minutes</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-amber-100 px-3 py-2 rounded-full text-sm font-medium text-amber-800">
                  <span>{test.points_possible} points</span>
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                    isOverdue(test.due_date)
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {isOverdue(test.due_date) && (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span>Due {formatDate(test.due_date)}</span>
                </div>
              </div>

              {/* Action Row */}
              {isTeacher ? (
                <div className="border-t border-amber-200 pt-4 flex flex-wrap gap-3">
                  {!test.is_published ? (
                    <Button
                      size="sm"
                      onClick={() => handlePublishTest(test.id)}
                      className="bg-green-600 text-white hover:bg-green-700 focus:ring-green-400 rounded-lg cursor-pointer"
                    >
                      Publish
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewResults(test.id)}
                      className="hover:bg-amber-50 border-amber-300 text-amber-700 rounded-lg cursor-pointer"
                    >
                      Results ({test.submission_count || 0})
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border-t border-amber-200 pt-4">
                  {test.is_published ? (
                    <Button
                      onClick={() => handleStartTest(test.id)}
                      className="flex items-center gap-2 bg-amber-600 text-white hover:bg-amber-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
                    >
                      <Play className="w-4 h-4" /> Start Test
                    </Button>
                  ) : (
                    <div className="text-amber-600 font-medium p-3 bg-amber-50 rounded-lg border border-amber-200">
                      Not Available
                    </div>
                  )}
                </div>
              )}
            </Card>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

ClassroomTests.propTypes = {
  classroom: PropTypes.object,
  isTeacher: PropTypes.bool,
  user: PropTypes.shape({ name: PropTypes.string }),
};
