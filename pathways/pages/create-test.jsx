import React, { useState, useEffect } from "react";
import {
  FileQuestion,
  Clock,
  Trash2,
  CheckCircle,
  Play,
  X,
  Plus,
  Upload,
  Eye,
  Settings,
  BookOpen,
  Timer,
  Users,
  Calendar,
  Star,
  Save,
  Copy,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  GraduationCap,
  FileText,
  Zap,
  Target,
} from "lucide-react";

// Question types with descriptions
const QUESTION_TYPES = [
  {
    value: "Multiple Choice",
    label: "Multiple Choice",
    icon: "🔘",
    description: "Select one correct answer from options",
  },
  {
    value: "Multiple Select",
    label: "Multiple Select",
    icon: "☑️",
    description: "Select multiple correct answers",
  },
  {
    value: "True/False",
    label: "True/False",
    icon: "✓",
    description: "Simple true or false question",
  },
  {
    value: "Short Answer",
    label: "Short Answer",
    icon: "📝",
    description: "Brief text response",
  },
  {
    value: "Essay",
    label: "Essay",
    icon: "📄",
    description: "Long-form written response",
  },
  {
    value: "Fill in the Blank",
    label: "Fill in the Blank",
    icon: "📋",
    description: "Complete the missing words",
  },
  {
    value: "Matching",
    label: "Matching",
    icon: "🔗",
    description: "Match items from two lists",
  },
];

const DIFFICULTY_LEVELS = [
  { value: "Easy", color: "bg-green-100 text-green-800", icon: "🟢" },
  { value: "Medium", color: "bg-yellow-100 text-yellow-800", icon: "🟡" },
  { value: "Hard", color: "bg-red-100 text-red-800", icon: "🔴" },
];

const CATEGORIES = [
  "Mathematics",
  "Science",
  "English",
  "History",
  "Geography",
  "Computer Science",
  "Art",
  "Music",
  "Physical Education",
  "Other",
];

export default function ComprehensiveTestCreator() {
  // Form state
  const [activeTab, setActiveTab] = useState("details");
  const [PDFfile, setPDFfile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [testMeta, setTestMeta] = useState({
    title: "",
    description: "",
    category: "Other",
    timeLimit: 60,
    totalPoints: 100,
    dueDate: "",
    instructions: "",
    passingScore: 70,
    allowRetakes: true,
    maxAttempts: 3,
    shuffleQuestions: false,
    showCorrectAnswers: true,
    showScoreImmediately: true,
    requireProctoring: false,
  });
  const [previewMode, setPreviewMode] = useState(false);

  // Statistics
  const getTestStats = () => {
    const totalQuestions = questions.length;
    const pointsDistribution = questions.reduce((acc, q) => {
      acc[q.difficulty || "Medium"] =
        (acc[q.difficulty || "Medium"] || 0) + (q.points || 0);
      return acc;
    }, {});
    const avgPointsPerQuestion =
      totalQuestions > 0
        ? questions.reduce((sum, q) => sum + (q.points || 0), 0) /
          totalQuestions
        : 0;

    return {
      totalQuestions,
      pointsDistribution,
      avgPointsPerQuestion: avgPointsPerQuestion.toFixed(1),
      estimatedTime: Math.ceil(totalQuestions * 1.5), // 1.5 min per question estimate
    };
  };

  const stats = getTestStats();

  // Handle PDF upload
  const handlePDFUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPDFfile(file);
    } else {
      alert("Please select a valid PDF file.");
    }
  };

  // AI-powered question extraction simulation
  const handleExtractQuestions = () => {
    if (!PDFfile) {
      alert("Please upload a PDF first.");
      return;
    }

    // Simulate AI extraction with sample questions
    const sampleQuestions = [
      {
        id: Date.now() + 1,
        type: "Multiple Choice",
        prompt: "What is the capital of France?",
        options: ["London", "Paris", "Berlin", "Madrid"],
        correct: "Paris",
        difficulty: "Easy",
        points: 5,
        category: "Geography",
      },
      {
        id: Date.now() + 2,
        type: "True/False",
        prompt: "The mitochondria is known as the powerhouse of the cell.",
        correct: "True",
        difficulty: "Medium",
        points: 3,
        category: "Science",
      },
    ];

    setQuestions((prev) => [...prev, ...sampleQuestions]);
    alert(`Extracted ${sampleQuestions.length} questions from PDF!`);
  };

  // Add new question
  const addQuestion = (type = "Multiple Choice") => {
    const newQuestion = {
      id: Date.now(),
      type,
      prompt: "",
      options:
        type === "Multiple Choice" || type === "Multiple Select"
          ? ["", ""]
          : [],
      correct: type === "Multiple Select" ? [] : "",
      difficulty: "Medium",
      points: Math.floor(
        testMeta.totalPoints / Math.max(questions.length + 1, 10)
      ),
      category: testMeta.category,
      explanation: "",
      tags: [],
    };

    if (type === "Matching") {
      newQuestion.leftItems = [""];
      newQuestion.rightItems = [""];
      newQuestion.matches = {};
    }

    setQuestions((prev) => [...prev, newQuestion]);
  };

  // Remove question
  const removeQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  // Update question field
  const updateQuestionField = (id, field, value) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              [field]: value,
              ...(field === "type" && value === "Multiple Choice"
                ? { options: ["", ""], correct: "" }
                : field === "type" && value === "Multiple Select"
                ? { options: ["", ""], correct: [] }
                : field === "type" && value === "True/False"
                ? { options: [], correct: "" }
                : field === "type" && value === "Matching"
                ? { leftItems: [""], rightItems: [""], matches: {} }
                : {}),
            }
          : q
      )
    );
  };

  // Update option
  const updateOption = (qid, idx, value) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid
          ? {
              ...q,
              options: q.options.map((opt, i) => (i === idx ? value : opt)),
            }
          : q
      )
    );
  };

  // Add/remove options
  const addOption = (qid) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid ? { ...q, options: [...q.options, ""] } : q
      )
    );
  };

  const removeOption = (qid, idx) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid
          ? { ...q, options: q.options.filter((_, i) => i !== idx) }
          : q
      )
    );
  };

  // Handle multiple select answers
  const toggleMultipleSelectAnswer = (qid, option) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qid) {
          const currentAnswers = Array.isArray(q.correct) ? q.correct : [];
          const isSelected = currentAnswers.includes(option);
          return {
            ...q,
            correct: isSelected
              ? currentAnswers.filter((ans) => ans !== option)
              : [...currentAnswers, option],
          };
        }
        return q;
      })
    );
  };

  // Auto-distribute points
  const autoDistributePoints = () => {
    const pointsPerQuestion = Math.floor(
      testMeta.totalPoints / questions.length
    );
    const remainder = testMeta.totalPoints % questions.length;

    setQuestions((prev) =>
      prev.map((q, idx) => ({
        ...q,
        points: pointsPerQuestion + (idx < remainder ? 1 : 0),
      }))
    );
  };

  // Duplicate question
  const duplicateQuestion = (id) => {
    const question = questions.find((q) => q.id === id);
    if (question) {
      const duplicated = {
        ...question,
        id: Date.now(),
        prompt: question.prompt + " (Copy)",
      };
      setQuestions((prev) => [...prev, duplicated]);
    }
  };

  // Save test
  const handleSaveTest = () => {
    if (!testMeta.title.trim()) {
      alert("Please enter a test title.");
      return;
    }
    if (questions.length === 0) {
      alert("Please add at least one question.");
      return;
    }

    const testData = {
      ...testMeta,
      questions,
      totalQuestions: questions.length,
      createdAt: new Date().toISOString(),
      stats,
    };

    console.log("Saving comprehensive test:", testData);
    alert("Test saved successfully!");
  };

  const TabButton = ({ id, label, icon: Icon, isActive, count }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
        isActive
          ? "bg-amber-600 text-white shadow-md"
          : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {count !== undefined && (
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            isActive ? "bg-amber-500" : "bg-gray-200 text-gray-600"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );

  const QuestionCard = ({ question, index }) => {
    const difficultyStyle =
      DIFFICULTY_LEVELS.find((d) => d.value === question.difficulty)?.color ||
      "bg-gray-100 text-gray-800";

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="p-6">
          {/* Question Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-600 rounded-full font-semibold text-sm">
                {index + 1}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {question.type}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyStyle}`}
                  >
                    {
                      DIFFICULTY_LEVELS.find(
                        (d) => d.value === question.difficulty
                      )?.icon
                    }{" "}
                    {question.difficulty}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {question.points} points • {question.category}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => duplicateQuestion(question.id)}
                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                title="Duplicate question"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => removeQuestion(question.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete question"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Question Configuration */}
          <div className="space-y-4">
            {/* Type and Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={question.type}
                  onChange={(e) =>
                    updateQuestionField(question.id, "type", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
                >
                  {QUESTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={question.difficulty}
                  onChange={(e) =>
                    updateQuestionField(
                      question.id,
                      "difficulty",
                      e.target.value
                    )
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
                >
                  {DIFFICULTY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.icon} {level.value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points
                </label>
                <input
                  type="number"
                  min="1"
                  value={question.points || 0}
                  onChange={(e) =>
                    updateQuestionField(
                      question.id,
                      "points",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Question Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question
              </label>
              <textarea
                value={question.prompt}
                onChange={(e) =>
                  updateQuestionField(question.id, "prompt", e.target.value)
                }
                placeholder="Enter your question here..."
                className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none"
                rows={3}
              />
            </div>

            {/* Question-specific fields */}
            {(question.type === "Multiple Choice" ||
              question.type === "Multiple Select") && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Options
                  </label>
                  <button
                    onClick={() => addOption(question.id)}
                    className="text-xs text-amber-600 hover:text-amber-800 font-medium"
                  >
                    + Add Option
                  </button>
                </div>
                <div className="space-y-2">
                  {question.options.map((option, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {question.type === "Multiple Choice" ? (
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={question.correct === option}
                          onChange={() =>
                            updateQuestionField(question.id, "correct", option)
                          }
                          className="text-amber-600"
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={
                            Array.isArray(question.correct) &&
                            question.correct.includes(option)
                          }
                          onChange={() =>
                            toggleMultipleSelectAnswer(question.id, option)
                          }
                          className="text-amber-600"
                        />
                      )}
                      <input
                        type="text"
                        value={option}
                        onChange={(e) =>
                          updateOption(question.id, i, e.target.value)
                        }
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                      />
                      {question.options.length > 2 && (
                        <button
                          onClick={() => removeOption(question.id, i)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {question.type === "True/False" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correct Answer
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`tf-${question.id}`}
                      value="True"
                      checked={question.correct === "True"}
                      onChange={(e) =>
                        updateQuestionField(
                          question.id,
                          "correct",
                          e.target.value
                        )
                      }
                      className="text-amber-600"
                    />
                    <span className="text-sm">True</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`tf-${question.id}`}
                      value="False"
                      checked={question.correct === "False"}
                      onChange={(e) =>
                        updateQuestionField(
                          question.id,
                          "correct",
                          e.target.value
                        )
                      }
                      className="text-amber-600"
                    />
                    <span className="text-sm">False</span>
                  </label>
                </div>
              </div>
            )}

            {(question.type === "Short Answer" ||
              question.type === "Essay") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Answer{" "}
                  {question.type === "Essay" ? "(Sample/Rubric)" : "(Optional)"}
                </label>
                <textarea
                  value={question.correct}
                  onChange={(e) =>
                    updateQuestionField(question.id, "correct", e.target.value)
                  }
                  placeholder={
                    question.type === "Essay"
                      ? "Provide sample answer or grading rubric..."
                      : "Expected answer or keywords..."
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  rows={question.type === "Essay" ? 4 : 2}
                />
              </div>
            )}

            {/* Explanation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Explanation <span className="text-gray-400">(Optional)</span>
              </label>
              <textarea
                value={question.explanation || ""}
                onChange={(e) =>
                  updateQuestionField(
                    question.id,
                    "explanation",
                    e.target.value
                  )
                }
                placeholder="Explain why this is the correct answer..."
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                rows={2}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-amber-600 rounded-xl">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-amber-600 bg-clip-text text-transparent">
              Test Creator Studio
            </h1>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <TabButton
            id="details"
            label="Test Details"
            icon={Settings}
            isActive={activeTab === "details"}
          />
          <TabButton
            id="import"
            label="AI Import"
            icon={Zap}
            isActive={activeTab === "import"}
          />
          <TabButton
            id="questions"
            label="Questions"
            icon={FileQuestion}
            isActive={activeTab === "questions"}
            count={questions.length}
          />
          <TabButton
            id="analytics"
            label="Analytics"
            icon={Target}
            isActive={activeTab === "analytics"}
          />
          <TabButton
            id="preview"
            label="Preview"
            icon={Eye}
            isActive={activeTab === "preview"}
          />
        </div>

        {/* Test Details Tab */}
        {activeTab === "details" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-6 h-6 text-amber-600" />
                <h2 className="text-2xl font-bold text-gray-800">
                  Test Configuration
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Title *
                    </label>
                    <input
                      type="text"
                      value={testMeta.title}
                      onChange={(e) =>
                        setTestMeta({ ...testMeta, title: e.target.value })
                      }
                      placeholder="Enter test title..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={testMeta.description}
                      onChange={(e) =>
                        setTestMeta({
                          ...testMeta,
                          description: e.target.value,
                        })
                      }
                      placeholder="Brief description of the test..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={testMeta.category}
                        onChange={(e) =>
                          setTestMeta({ ...testMeta, category: e.target.value })
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Points
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={testMeta.totalPoints}
                        onChange={(e) =>
                          setTestMeta({
                            ...testMeta,
                            totalPoints: parseInt(e.target.value) || 100,
                          })
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Limit (min)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={testMeta.timeLimit}
                        onChange={(e) =>
                          setTestMeta({
                            ...testMeta,
                            timeLimit: parseInt(e.target.value) || 60,
                          })
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Passing Score (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={testMeta.passingScore}
                        onChange={(e) =>
                          setTestMeta({
                            ...testMeta,
                            passingScore: parseInt(e.target.value) || 70,
                          })
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={testMeta.dueDate}
                      onChange={(e) =>
                        setTestMeta({ ...testMeta, dueDate: e.target.value })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructions
                    </label>
                    <textarea
                      value={testMeta.instructions}
                      onChange={(e) =>
                        setTestMeta({
                          ...testMeta,
                          instructions: e.target.value,
                        })
                      }
                      placeholder="Special instructions for students..."
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">
                  Advanced Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={testMeta.allowRetakes}
                      onChange={(e) =>
                        setTestMeta({
                          ...testMeta,
                          allowRetakes: e.target.checked,
                        })
                      }
                      className="text-amber-600"
                    />
                    <span className="text-sm">Allow Retakes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={testMeta.shuffleQuestions}
                      onChange={(e) =>
                        setTestMeta({
                          ...testMeta,
                          shuffleQuestions: e.target.checked,
                        })
                      }
                      className="text-amber-600"
                    />
                    <span className="text-sm">Shuffle Questions</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={testMeta.showCorrectAnswers}
                      onChange={(e) =>
                        setTestMeta({
                          ...testMeta,
                          showCorrectAnswers: e.target.checked,
                        })
                      }
                      className="text-amber-600"
                    />
                    <span className="text-sm">Show Correct Answers</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Import Tab */}
        {activeTab === "import" && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-amber-600" />
              <h2 className="text-2xl font-bold text-gray-800">
                AI-Powered Question Import
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-amber-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Upload PDF Document
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Upload a PDF containing questions, and our AI will extract
                    them automatically
                  </p>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePDFUpload}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Choose PDF File
                  </label>
                  {PDFfile && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800 font-medium">
                        📄 {PDFfile.name}
                      </p>
                      <p className="text-xs text-amber-600">
                        Ready for extraction
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleExtractQuestions}
                  disabled={!PDFfile}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-600 text-white rounded-lg hover:from-amber-700 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  <Zap className="w-5 h-5" />
                  Extract Questions with AI
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-amber-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    🤖 AI Features
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-amber-500" />
                      Automatically detect question types
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-amber-500" />
                      Extract multiple choice, T/F, and short answer questions
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-amber-500" />
                      Identify correct answers and distractors
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-amber-500" />
                      Suggest difficulty levels and point values
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-amber-500" />
                      Generate explanations for answers
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800">
                        Tips for Best Results
                      </h4>
                      <ul className="text-sm text-amber-700 mt-2 space-y-1">
                        <li>• Use clear, well-formatted PDFs</li>
                        <li>• Ensure questions are numbered or bulleted</li>
                        <li>• Include answer keys when possible</li>
                        <li>• Review and edit extracted questions</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === "questions" && (
          <div className="space-y-6">
            {/* Question Controls */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <FileQuestion className="w-6 h-6 text-amber-600" />
                  <h2 className="text-2xl font-bold text-gray-800">
                    Questions ({questions.length})
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={autoDistributePoints}
                    disabled={questions.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm"
                  >
                    <Target className="w-4 h-4 text-amber-600" />
                    Auto-distribute Points
                  </button>
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
                      <Plus className="w-4 h-4" />
                      Add Question
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <div className="p-2">
                        {QUESTION_TYPES.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => addQuestion(type.value)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-sm"
                          >
                            <div className="font-medium">
                              {type.icon} {type.label}
                            </div>
                            <div className="text-xs text-gray-500">
                              {type.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {questions.length === 0 && (
                <div className="text-center py-12">
                  <FileQuestion className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">
                    No questions added yet
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Start building your test by adding questions or importing
                    from PDF
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => addQuestion()}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Question
                    </button>
                    <button
                      onClick={() => setActiveTab("import")}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      <Zap className="w-4 h-4" />
                      Import from PDF
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Questions List */}
            {questions.length > 0 && (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-amber-600" />
                <h2 className="text-2xl font-bold text-gray-800">
                  Test Analytics
                </h2>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm">Total Questions</p>
                      <p className="text-3xl font-bold">
                        {stats.totalQuestions}
                      </p>
                    </div>
                    <FileQuestion className="w-8 h-8 text-amber-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm">Total Points</p>
                      <p className="text-3xl font-bold">
                        {questions.reduce((sum, q) => sum + (q.points || 0), 0)}
                      </p>
                    </div>
                    <Star className="w-8 h-8 text-amber-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm">Est. Time</p>
                      <p className="text-3xl font-bold">
                        {stats.estimatedTime}m
                      </p>
                    </div>
                    <Timer className="w-8 h-8 text-amber-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm">Avg Points/Q</p>
                      <p className="text-3xl font-bold">
                        {stats.avgPointsPerQuestion}
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-amber-200" />
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Question Types Distribution */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    Question Types
                  </h3>
                  <div className="space-y-3">
                    {QUESTION_TYPES.map((type) => {
                      const count = questions.filter(
                        (q) => q.type === type.value
                      ).length;
                      const percentage =
                        stats.totalQuestions > 0
                          ? ((count / stats.totalQuestions) * 100).toFixed(1)
                          : 0;
                      return (
                        count > 0 && (
                          <div key={type.value}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>
                                {type.icon} {type.label}
                              </span>
                              <span>
                                {count} ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-amber-600 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      );
                    })}
                  </div>
                </div>

                {/* Difficulty Distribution */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    Difficulty Levels
                  </h3>
                  <div className="space-y-3">
                    {DIFFICULTY_LEVELS.map((level) => {
                      const count = questions.filter(
                        (q) => q.difficulty === level.value
                      ).length;
                      const percentage =
                        stats.totalQuestions > 0
                          ? ((count / stats.totalQuestions) * 100).toFixed(1)
                          : 0;
                      const colorClass =
                        level.value === "Easy"
                          ? "bg-green-500"
                          : level.value === "Medium"
                          ? "bg-yellow-500"
                          : "bg-red-500";
                      return (
                        count > 0 && (
                          <div key={level.value}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>
                                {level.icon} {level.value}
                              </span>
                              <span>
                                {count} ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`${colorClass} h-2 rounded-full`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {questions.length > 0 && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-900 mb-2">
                        Recommendations
                      </h4>
                      <ul className="text-sm text-amber-800 space-y-1">
                        {stats.totalQuestions < 5 && (
                          <li>
                            • Consider adding more questions for better
                            assessment coverage
                          </li>
                        )}
                        {stats.estimatedTime > testMeta.timeLimit && (
                          <li>
                            • Estimated completion time exceeds set time limit
                          </li>
                        )}
                        {questions.every((q) => q.difficulty === "Easy") && (
                          <li>
                            • Mix in medium and hard questions for better
                            differentiation
                          </li>
                        )}
                        {questions.filter((q) => q.type === "Multiple Choice")
                          .length === questions.length && (
                          <li>
                            • Consider varying question types for comprehensive
                            assessment
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === "preview" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Eye className="w-6 h-6 text-amber-600" />
                  <h2 className="text-2xl font-bold text-gray-800">
                    Test Preview
                  </h2>
                </div>
                <div className="text-sm text-gray-500">
                  Student view • {questions.length} questions •{" "}
                  {testMeta.timeLimit} minutes
                </div>
              </div>

              {/* Test Header Preview */}
              <div className="border-2 border-gray-200 rounded-xl p-6 mb-6">
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {testMeta.title || "Untitled Test"}
                  </h1>
                  {testMeta.description && (
                    <p className="text-gray-600 mb-4">{testMeta.description}</p>
                  )}
                  <div className="flex justify-center items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {testMeta.timeLimit} minutes
                    </div>
                    <div className="flex items-center gap-1">
                      <FileQuestion className="w-4 h-4 text-amber-600" />
                      {questions.length} questions
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-600" />
                      {questions.reduce(
                        (sum, q) => sum + (q.points || 0),
                        0
                      )}{" "}
                      points
                    </div>
                  </div>
                </div>

                {testMeta.instructions && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="font-medium text-amber-900 mb-2">
                      Instructions
                    </h3>
                    <p className="text-amber-800 text-sm">
                      {testMeta.instructions}
                    </p>
                  </div>
                )}
              </div>

              {/* Questions Preview */}
              <div className="space-y-6">
                {questions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileQuestion className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No questions to preview</p>
                  </div>
                ) : (
                  questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="border border-gray-200 rounded-lg p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-600 rounded-full font-semibold text-sm">
                            {index + 1}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900">
                              {question.prompt || "Question not configured"}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {question.type} • {question.points || 0} points
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Question Options Preview */}
                      {question.type === "Multiple Choice" &&
                        question.options && (
                          <div className="space-y-2 ml-11">
                            {question.options
                              .filter((opt) => opt.trim())
                              .map((option, i) => (
                                <label
                                  key={i}
                                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name={`preview-${question.id}`}
                                    className="text-amber-600"
                                  />
                                  <span className="text-sm">{option}</span>
                                </label>
                              ))}
                          </div>
                        )}

                      {question.type === "Multiple Select" &&
                        question.options && (
                          <div className="space-y-2 ml-11">
                            {question.options
                              .filter((opt) => opt.trim())
                              .map((option, i) => (
                                <label
                                  key={i}
                                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    className="text-amber-600"
                                  />
                                  <span className="text-sm">{option}</span>
                                </label>
                              ))}
                          </div>
                        )}

                      {question.type === "True/False" && (
                        <div className="space-y-2 ml-11">
                          <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="radio"
                              name={`preview-${question.id}`}
                              className="text-amber-600"
                            />
                            <span className="text-sm">True</span>
                          </label>
                          <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="radio"
                              name={`preview-${question.id}`}
                              className="text-amber-600"
                            />
                            <span className="text-sm">False</span>
                          </label>
                        </div>
                      )}

                      {(question.type === "Short Answer" ||
                        question.type === "Essay") && (
                        <div className="ml-11">
                          <textarea
                            placeholder={
                              question.type === "Essay"
                                ? "Enter your essay response here..."
                                : "Enter your answer here..."
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                            rows={question.type === "Essay" ? 6 : 2}
                            disabled
                          />
                        </div>
                      )}

                      {question.type === "Fill in the Blank" && (
                        <div className="ml-11">
                          <div className="text-sm text-gray-600 mb-2">
                            Students will see blanks to fill in
                          </div>
                          <input
                            type="text"
                            placeholder="______"
                            className="p-2 border border-gray-300 rounded"
                            disabled
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-between items-center gap-4 pt-6">
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
            <RotateCcw className="w-4 h-4" />
            Reset Form
          </button>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSaveTest}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-600 text-white rounded-lg hover:from-amber-700 hover:to-amber-700 transition-all font-medium shadow-lg"
            >
              <Save className="w-4 h-4" />
              Save Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
