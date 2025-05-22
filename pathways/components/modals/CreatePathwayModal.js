import { useState, useEffect } from "react";
import { X, Plus, Minus } from "lucide-react";
import { useRouter } from "next/router";
import backendUrl from "../../backendUrl";

export default function CreatePathwayModal({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  user,
  classroom = null,
  pathway = null,
}) {
  const router = useRouter();
  const isEdit = Boolean(pathway);


  const [form, setForm] = useState({
    title: "",
    topic: "",
    mode: "CASUAL",
    classroom: classroom ? classroom : null,
    grade: "",
    learningGoals: "",
    details: "",
    chapters: [],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [classrooms, setClassrooms] = useState([]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {

    if (isEdit && pathway) {
      const classroomObj =
        typeof classroom === "object" && classroom !== null
          ? classroom
          : typeof pathway?.classroom === "object" && pathway.classroom?.id
            ? pathway.classroom
            : typeof pathway.classroom === "number"
              ? { id: pathway.classroom }
              : null;

      setForm({
        title: pathway.title || "",
        topic: pathway.topic || "",
        mode: pathway.mode || "CASUAL",
        classroom: classroomObj,
        grade: pathway.grade || "",
        learningGoals: (pathway.learning_goals || []).join(", "),
        details: pathway.details || "",
        chapters: pathway.chapters || [],
      });
    }
  }, [isEdit, isOpen, user, pathway, classroom]);

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const res = await fetch(`${backendUrl}/get-user-classrooms/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id }),
        });
        const data = await res.json();
        setClassrooms(data.results || []);
      } catch (err) {
        console.error("Failed to load classrooms", err);
      }
    };

    if (isOpen && user?.id && user?.role == "teacher") {
      fetchClassrooms();
    }
  }, [isOpen, user]);


  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "classroom") {
      const selected = classrooms.find((cls) => cls.id.toString() === value);
      setForm((prev) => ({ ...prev, classroom: selected || null }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };


  const handleChapterChange = (index, field, value) => {
    const updated = [...form.chapters];
    updated[index][field] = value;
    setForm((prev) => ({ ...prev, chapters: updated }));
  };

  const addChapter = () => {
    setForm((prev) => ({
      ...prev,
      chapters: [...prev.chapters, { name: "", test: false, prereq: "", next: "" }],
    }));
  };

  const removeChapter = (index) => {
    const updated = form.chapters.filter((_, i) => i !== index);
    setForm((prev) => ({ ...prev, chapters: updated }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.grade.trim() || !form.learningGoals.trim()) {
      setError("Title, Grade and Learning Goals are required.");
      return;
    }

    console.log("Form data class")
    console.log(form.classroom);
    const payload = {
      ...form,
      chapters: JSON.stringify(form.chapters),
      learning_goals: form.learningGoals
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean),
      userid: user.id,
      classroom: form.classroom && form.classroom.id ? { id: form.classroom.id } : null,
    };
    console.log(payload)
    console.log(isEdit ? "Updating pathway:" : "Creating pathway:", payload);
    setLoading(true);

    try {
      let pathway;

      if (isEdit && onUpdate) {
        pathway = await onUpdate(pathway.id, payload);
      } else {
        pathway = await onCreate(payload);
      }

      onClose();
      setForm({
        title: "",
        topic: "",
        mode: "CASUAL",
        classroom: null,
        grade: "",
        learningGoals: "",
        details: "",
        chapters: [],
      });
      setError("");

      // ✅ Updated navigation logic
      if (typeof pathway === "number") {
        router.push(`/pathways/${pathway}`);
      } else if (typeof pathway === "object" && pathway?.id) {
        router.push(`/pathways/${pathway.id}`);
      } else {
        router.push(`/pathways`);
      }
    } catch (error) {
      console.error("Failed to save pathway", error);
      setError("Failed to save pathway. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="p-6 w-full max-w-full min-h-screen text-gray-800">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-amber-800 mb-4">
          {isEdit ? "Edit Pathway" : "Create Pathway"}
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 text-sm px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Algebra Pathway"
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>

          {!isEdit && (
            <div>
              <label className="text-sm font-medium text-gray-700">Topic *</label>
              <input
                name="topic"
                value={form.topic}
                onChange={handleChange}
                placeholder="e.g. Algebra, Geometry, Photosynthesis"
                className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Mode</label>
            <select
              name="mode"
              value={form.mode}
              onChange={handleChange}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
            >
              <option value="STRICT">Strict</option>
              <option value="CASUAL">Casual</option>
            </select>
          </div>

          {user.role === "teacher" && (
            <div>
              <label className="text-sm font-medium text-gray-700">Classroom</label>
              <select
                name="classroom"
                value={form.classroom?.id || ""}
                onChange={handleChange}
                className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
              >
                <option value="">None (Personal)</option>
                {classrooms.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}, with {cls.students.length} student(s)
                  </option>
                ))}
              </select>

            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Grade *</label>
            <input
              name="grade"
              value={form.grade}
              onChange={handleChange}
              placeholder="e.g. K-2, 8, 9-12"
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Learning Goals *</label>
            <input
              name="learningGoals"
              value={form.learningGoals}
              onChange={handleChange}
              placeholder="Comma separated goals"
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
            />
          </div>

        </div>

        <div className="border-t pt-6 mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-amber-800">Chapters</h3>

          {form.chapters.map((chapter, index) => (
            <div
              key={index}
              className="p-4 border border-gray-300 rounded shadow-sm space-y-2 bg-amber-50"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-amber-900">Chapter {index + 1}</h4>
                <button
                  onClick={() => removeChapter(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>

              <input
                placeholder="Chapter Name"
                value={chapter.name}
                onChange={(e) =>
                  handleChapterChange(index, "name", e.target.value)
                }
                className="w-full border border-gray-300 rounded px-3 py-2"
              />

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={chapter.test}
                  onChange={(e) =>
                    handleChapterChange(index, "test", e.target.checked)
                  }
                />
                Has Test
              </label>

              <input
                placeholder="Prerequisite Chapters (comma separated)"
                value={chapter.prereq}
                onChange={(e) =>
                  handleChapterChange(index, "prereq", e.target.value)
                }
                className="w-full border border-gray-300 rounded px-3 py-2"
              />

              <input
                placeholder="Next Chapters (comma separated)"
                value={chapter.next}
                onChange={(e) =>
                  handleChapterChange(index, "next", e.target.value)
                }
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          ))}

          <button
            onClick={addChapter}
            className="flex items-center gap-2 text-sm text-amber-700 hover:text-amber-900"
          >
            <Plus className="w-4 h-4" />
            Add Chapter
          </button>
        </div>

        <div className="flex justify-end gap-2 pt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            disabled={loading}
          >
            {isEdit ? "Update Pathway" : "Create Pathway"}
          </button>
        </div>
      </div>
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white p-6 rounded shadow-lg text-center">
            <div className="loader mb-2 mx-auto border-4 border-gray-300 border-t-4 border-t-amber-600 rounded-full w-8 h-8 animate-spin"></div>
            <p className="text-gray-700 font-medium">
              {isEdit ? "Updating Pathway..." : "Creating Pathway..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
