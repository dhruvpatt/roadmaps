import { useState, useRef, useEffect } from "react";
import fetchWithAuth from "@/lib/fetch_with_auth";

const CurriculumBuilder = ({
  classroomId,
  onCurriculumCreated,
  onCancel,
  hasExistingUnits = false,
  initialUnits = [],
}) => {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [units, setUnits] = useState([]);
  const [showUnitsEditor, setShowUnitsEditor] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialUnits.length > 0) {
      setUnits(initialUnits);
      setShowUnitsEditor(true);
      setActiveTab("manual");
    }
  }, [initialUnits]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    const file = files[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a PDF or CSV file.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("classroom_id", classroomId);

      let endpoint = "api/curriculum/upload/";
      if (file.type === "application/pdf") {
        endpoint = "api/curriculum/process-pdf/";
        setProcessing(true);
      }
      const response = await fetchWithAuth(endpoint, {
        method: "POST",
        body: formData,
      });

      console.log("Upload response:", response);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Upload failed");
      }

      const data = await response.json();

      setUnits(data.units || []);
      setShowUnitsEditor(true);
    } catch (error) {
      console.error("Upload error:", error);
      setError(error.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleAddUnit = () => {
    const newUnit = {
      id: Date.now(), // Temporary ID
      name: "",
      description: "",
      weeks: [],
    };
    setUnits([...units, newUnit]);
  };

  const handleUpdateUnit = (index, field, value) => {
    const updatedUnits = [...units];
    updatedUnits[index] = { ...updatedUnits[index], [field]: value };
    setUnits(updatedUnits);
  };

  const handleDeleteUnit = (index) => {
    const updatedUnits = units.filter((_, i) => i !== index);
    setUnits(updatedUnits);
  };

  const handleAddWeek = (unitIndex) => {
    const updatedUnits = [...units];
    if (!updatedUnits[unitIndex].weeks) {
      updatedUnits[unitIndex].weeks = [];
    }
    updatedUnits[unitIndex].weeks.push({
      id: Date.now(), // Temporary ID
      learning_goal: "",
    });
    setUnits(updatedUnits);
  };

  const handleUpdateWeek = (unitIndex, weekIndex, value) => {
    const updatedUnits = [...units];
    updatedUnits[unitIndex].weeks[weekIndex].learning_goal = value;
    setUnits(updatedUnits);
  };

  const handleDeleteWeek = (unitIndex, weekIndex) => {
    const updatedUnits = [...units];
    updatedUnits[unitIndex].weeks = updatedUnits[unitIndex].weeks.filter(
      (_, i) => i !== weekIndex
    );
    setUnits(updatedUnits);
  };

  const handleSaveCurriculum = async () => {
    if (units.length === 0) {
      setError("Please add at least one unit.");
      return;
    }

    const invalidUnits = units.filter((unit) => !unit.name.trim());
    if (invalidUnits.length > 0) {
      setError("All units must have a name.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const response = await fetchWithAuth("/api/curriculum/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classroom_id: classroomId,
          units: units,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create curriculum");
      }

      const data = await response.json();
      onCurriculumCreated(data.units);
    } catch (error) {
      console.error("Save error:", error);
      setError(error.message || "Failed to save curriculum. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleStartFromScratch = () => {
    setUnits([
      {
        id: Date.now(),
        name: "",
        description: "",
        weeks: [],
      },
    ]);
    setShowUnitsEditor(true);
    setActiveTab("manual");
  };

  if (showUnitsEditor) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white">
          {/* Header */}
          <div className="border-b border-gray-200 pb-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {activeTab === "upload"
                    ? "Review Generated Curriculum"
                    : "Build Your Curriculum"}
                </h2>
                <p className="text-gray-600 mt-2">
                  {activeTab === "upload"
                    ? "Review and edit the units generated from your uploaded file."
                    : "Create and organize your teaching units and learning goals."}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCurriculum}
                  disabled={uploading || units.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  {uploading ? "Saving..." : "Save Curriculum"}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Units Editor */}
          <div className="space-y-6">
            {units.map((unit, unitIndex) => (
              <div
                key={unit.id || unitIndex}
                className="shadow-sm border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Name *
                      </label>
                      <input
                        type="text"
                        value={unit.name}
                        onChange={(e) =>
                          handleUpdateUnit(unitIndex, "name", e.target.value)
                        }
                        placeholder="Enter unit name..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={unit.description}
                        onChange={(e) =>
                          handleUpdateUnit(
                            unitIndex,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Describe what students will learn in this unit..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteUnit(unitIndex)}
                    className="ml-4 text-red-600 hover:text-red-800 p-2"
                    title="Delete unit"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                {/* Weeks */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">
                      Weekly Learning Goals
                    </h4>
                    <button
                      onClick={() => handleAddWeek(unitIndex)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Add Week
                    </button>
                  </div>

                  {unit.weeks && unit.weeks.length > 0 ? (
                    <div className="space-y-3">
                      {unit.weeks.map((week, weekIndex) => (
                        <div
                          key={week.id || weekIndex}
                          className="flex items-center gap-3"
                        >
                          <span className="text-sm text-gray-500 min-w-[60px]">
                            Week {weekIndex + 1}:
                          </span>
                          <input
                            type="text"
                            value={week.learning_goal}
                            onChange={(e) =>
                              handleUpdateWeek(
                                unitIndex,
                                weekIndex,
                                e.target.value
                              )
                            }
                            placeholder="What will students learn this week?"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            onClick={() =>
                              handleDeleteWeek(unitIndex, weekIndex)
                            }
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete week"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">
                      No weekly goals yet. Click "Add Week" to get started.
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Add Unit Button */}
            <button
              onClick={handleAddUnit}
              className="w-full border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg p-6 text-center text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              <svg
                className="w-8 h-8 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Another Unit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="bg-white">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {hasExistingUnits
              ? "Update Your Curriculum"
              : "Create Your Curriculum"}
          </h2>
          <p className="text-gray-600">
            Build your classroom curriculum by uploading existing materials or
            creating from scratch.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-6 py-3 font-medium border-b-2 transition-colors duration-200 ${
              activeTab === "upload"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Upload Files
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-6 py-3 font-medium border-b-2 transition-colors duration-200 ${
              activeTab === "manual"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Create from Scratch
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === "upload" && (
          <div className="space-y-6">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                dragActive
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.csv,.xlsx,.xls"
                className="hidden"
              />

              {uploading || processing ? (
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600">
                    {processing
                      ? "Processing PDF and generating curriculum..."
                      : "Uploading file..."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <div>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Upload your curriculum files
                    </p>
                    <p className="text-gray-600 mb-4">
                      Drag and drop your files here, or click to browse
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                    >
                      Choose Files
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* File Type Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                Supported file types:
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium">PDF:</span>
                  <span>
                    We'll analyze your document and suggest a curriculum
                    structure
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">CSV/Excel:</span>
                  <span>Import pre-structured curriculum data</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Tab */}
        {activeTab === "manual" && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-10 h-10 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Build Your Own Curriculum
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto mb-6">
                Create a custom curriculum by defining your own units, topics,
                and learning goals. You'll have full control over the structure
                and content.
              </p>
              <button
                onClick={handleStartFromScratch}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Start Building
              </button>
            </div>
          </div>
        )}

        {/* Cancel Button */}
        <div className="mt-8 text-center">
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800 font-medium px-6 py-2"
            disabled={uploading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CurriculumBuilder;
