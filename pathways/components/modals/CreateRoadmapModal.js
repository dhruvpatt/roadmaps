import { useState } from "react";
import { X, Plus, Minus } from "lucide-react";

// 🔹 Mock user (can be dynamic later)
const mockUser = {
    id: "t001",
    firstName: "Tina",
    lastName: "Trent",
    role: "teacher" // or "student"
};

export default function CreateRoadmapModal({ isOpen, onClose, onCreate, user }) {
    const [form, setForm] = useState({
        title: "",
        topic: "",
        mode: "casual",
        classroom: "",
        grade: "",
        learningGoals: "",
        chapters: [],
    });

    const [showChapters, setShowChapters] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
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

    const handleSubmit = () => {
        const roadmap = {
            ...form,
            chapters: form.chapters.map((c) => ({
                ...c,
                prereq: c.prereq.split(",").map((s) => s.trim()).filter(Boolean),
                next: c.next.split(",").map((s) => s.trim()).filter(Boolean),
            })),
            learning_goals: form.learningGoals
                .split(",")
                .map((g) => g.trim())
                .filter(Boolean),
        };
        roadmap.userid = user.id;
        console.log("Roadmap", roadmap);


        onCreate(roadmap);
        onClose();
        setForm({
            title: "",
            details: "",
            mode: "casual",
            classroom: "",
            grade: "",
            learningGoals: "",
            chapters: [],
        });
        setShowChapters(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl relative overflow-y-auto max-h-[90vh] animate-slide-up text-gray-800">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-bold text-amber-800 mb-4">Create Roadmap</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Title</label>
                        <input
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="e.g. Algebra Pathway"
                            className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">Topic</label>
                        <input
                            name="topic"
                            value={form.topic}
                            onChange={handleChange}
                            placeholder="e.g. Algebra, Geometry, Photosynthesis"
                            className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
                        />
                    </div>

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

                    {mockUser.role === "teacher" && (
                        <div>
                            <label className="text-sm font-medium text-gray-700">Classroom</label>
                            <input
                                name="classroom"
                                value={form.classroom}
                                onChange={handleChange}
                                placeholder="Optional"
                                className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
                            />
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium text-gray-700">Grade</label>
                        <input
                            name="grade"
                            value={form.grade}
                            onChange={handleChange}
                            placeholder="e.g. K-2, 8, 9-12"
                            className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Learning Goals</label>
                        <input
                            name="learningGoals"
                            value={form.learningGoals}
                            onChange={handleChange}
                            placeholder="Comma separated goals"
                            className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Details</label>
                        <textarea
                            name="details"
                            value={form.details}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Roadmap description, notes, learning outcomes..."
                            className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
                        />
                    </div>
                </div>

                {/* Chapter Section */}
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

                    {/* Add Chapter Button */}
                    <button
                        onClick={addChapter}
                        className="flex items-center gap-2 text-sm text-amber-700 hover:text-amber-900"
                    >
                        <Plus className="w-4 h-4" />
                        Add Chapter
                    </button>
                </div>

                {/* Submit */}
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
                    >
                        Create Roadmap
                    </button>
                </div>
            </div>
        </div>
    );
}
