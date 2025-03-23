import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
import RoadmapGraphTeacher from "@/components/pathways/RoadmapGraphTeacher";

// 1) This is your example API response (array of modules).
//    In a real app, you’d fetch this data using useEffect or
//    getServerSideProps instead of hardcoding it.
const fetchedModules = [
  {
    name: "Module 1: Introduction to Python and Setting Up",
    learning_goals: [
      "Understand what programming is and why Python is a good choice for beginners.",
      "Install Python on their computers or use an online Python environment.",
      "Understand the basic structure of a Python program (e.g., file extension, how to run it).",
      "Familiarize with a simple text editor or IDE for writing code.",
    ],
    module_description:
      "Gentle intro to programming concepts and sets up the environment for Python code. (truncated)",
    prerequisite_modules: [],
    next_modules: ["Module 2: Python Syntax and Data Types"],
    chapter: 0,
  },
  {
    name: "Module 2: Python Syntax and Data Types",
    learning_goals: [
      "Recognize and understand basic Python syntax ...",
      "Identify and differentiate between fundamental data types...",
      "Understand how to declare and assign values to variables...",
      "Use the `print()` function to display output to the console.",
    ],
    module_description:
      "Covers core syntax, indentation, comments, data types, etc. (truncated)",
    prerequisite_modules: [
      "Module 1: Introduction to Python and Setting Up",
    ],
    next_modules: ["Module 3: Operators and User Input"],
    chapter: 1,
  },
  {
    name: "Module 3: Operators and User Input",
    learning_goals: [
      "Use arithmetic operators for calculations.",
      "Understand comparison operators for evaluating conditions.",
      "Use logical operators (and, or, not).",
      "Use `input()` to receive user input.",
      "Convert between data types (e.g., string to int).",
    ],
    module_description:
      "Introduces arithmetic, comparison, logical operators, plus user input and data type conversion. (truncated)",
    prerequisite_modules: ["Module 2: Python Syntax and Data Types"],
    next_modules: ["Module 4: ASXASDSADA"],
    chapter: 1,
  },
  {
    name: "Module 4: ASXASDSADA",
    learning_goals: [
      "Use arithmetic operators for calculations.",
      "Understand comparison operators for evaluating conditions.",
      "Use logical operators (and, or, not).",
      "Use `input()` to receive user input.",
      "Convert between data types (e.g., string to int).",
    ],
    module_description:
      "Introduces arithmetic, comparison, logical operators, plus user input and data type conversion. (truncated)",
    prerequisite_modules: ["Module 3: Operators and User Input"],
    next_modules: ["Module 5: ASXASDSADA"],
    chapter: 2,
  },
  {
    name: "Module 5: ASXASDSADA",
    learning_goals: [
      "Use arithmetic operators for calculations.",
      "Understand comparison operators for evaluating conditions.",
      "Use logical operators (and, or, not).",
      "Use `input()` to receive user input.",
      "Convert between data types (e.g., string to int).",
    ],
    module_description:
      "Introduces arithmetic, comparison, logical operators, plus user input and data type conversion. (truncated)",
    prerequisite_modules: ["Module 4: ASXASDSADA"],
    next_modules: ["Module 6: ASXASDSADA"],
    chapter: 2,
  },
  {
    name: "Module 6: ASXASDSADA",
    learning_goals: [
      "Use arithmetic operators for calculations.",
      "Understand comparison operators for evaluating conditions.",
      "Use logical operators (and, or, not).",
      "Use `input()` to receive user input.",
      "Convert between data types (e.g., string to int).",
    ],
    module_description:
      "Introduces arithmetic, comparison, logical operators, plus user input and data type conversion. (truncated)",
    prerequisite_modules: ["Module 5: ASXASDSADA"],
    next_modules: ["Module 7: ASXASDSADA"],
    chapter: 2,
  },
  {
    name: "Module 7: ASXASDSADA",
    learning_goals: [
      "Use arithmetic operators for calculations.",
      "Understand comparison operators for evaluating conditions.",
      "Use logical operators (and, or, not).",
      "Use `input()` to receive user input.",
      "Convert between data types (e.g., string to int).",
    ],
    module_description:
      "Introduces arithmetic, comparison, logical operators, plus user input and data type conversion. (truncated)",
    prerequisite_modules: ["Module 6: ASXASDSADA"],
    next_modules: [],
    chapter: 3,
  },
  // ... etc. for all 9 modules from your API
];

// 2) We'll define a single-chapter "roadmap" object for the graph
//    The "modules" array here references each module by an ID + name.
//    We'll fill them once we have fetchedModules in state.
const initialRoadmap = {
  title: "Intro to Python Pathway",
  details: "Learn fundamental Python programming concepts from scratch.",
  chapters: [
    {
      name: "All Python Modules",
      modules: [],
    },
  ],
};

const ViewPathwayPageTeacher = () => {
  const router = useRouter();

  // 3) Local state for the full "fetched" modules data
  //    This keeps all the fields: learning_goals, description, prerequisites, etc.
  const [modulesData, setModulesData] = useState([]);

  // 4) Local state for the roadmap object (which we pass to RoadmapGraph)
  const [roadmap, setRoadmap] = useState(initialRoadmap);

  // 5) Track which module index is currently being edited (for learning goals)
  const [editingIndex, setEditingIndex] = useState(-1);

  // 6) Temporary storage for the "learning_goals" of the module being edited
  const [tempGoals, setTempGoals] = useState([]);

  // Simulate fetching modules from your API
  useEffect(() => {
    // In a real app, you'd do something like:
    // fetch("/api/pathways/123/modules").then(res => res.json()).then(data => setModulesData(data))
    // For now, we'll just set the data from the "fetchedModules" array above:
    setModulesData(fetchedModules);
  }, []);

  // Whenever modulesData is set, also update the "roadmap" so that RoadmapGraph
  // can have an array of modules with "id" and "name" for the single chapter.
  useEffect(() => {
    const mappedModules = modulesData.map((mod, index) => ({
      id: index + 1,
      name: mod.name,
    }));
    // Create a new roadmap object with the updated modules
    setRoadmap((prev) => ({
      ...prev,
      chapters: [
        {
          ...prev.chapters[0],
          modules: mappedModules,
        },
      ],
    }));
  }, [modulesData]);

  // Handler: Enter "edit" mode for the learning goals of a module at index i
  const handleEdit = (i) => {
    setEditingIndex(i);
    setTempGoals([...modulesData[i].learning_goals]);
  };

  // Handler: Save updated learning goals for module i
  const handleSave = (i) => {
    const updated = [...modulesData];
    updated[i] = {
      ...updated[i],
      learning_goals: tempGoals, // commit the edits
    };
    setModulesData(updated);
    setEditingIndex(-1);
    setTempGoals([]);

    // Add call to update api with new data
  };

  return (
    <div className="min-h-screen bg-white p-6 space-y-6 text-gray-800">
      {/* Back Navigation */}
      <div
        className="flex items-center text-sm text-gray-500 cursor-pointer hover:underline"
        onClick={() => router.push("/pathways")}
      >
        <ArrowLeft size={16} className="mr-1" />
        <span>Back to pathway</span>
      </div>

      {/* Title and Subtitle (no progress bar in teacher view) */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{roadmap.title}</h1>
        <p className="text-gray-600 mt-1">{roadmap.details}</p>
      </div>

      
      {/* Main Content Grid: */}
      <div className="mx-auto w-full"> 
        {/* Roadmap Graph */}
        <div className="border rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-1 text-gray-800">Pathway Map</h2>
          <p className="text-sm text-gray-600 mb-3">
            Visual representation of your learning journey
          </p>

          {/* We pass the `roadmap` object into your custom component.
              This example only organizes modules in a single 'chapter', but
              you can adapt if you need multiple chapters. */}
          <div className="w-full">
            <RoadmapGraphTeacher modules={fetchedModules} />
          </div>
        </div>
      </div>

      <div>
        {/* Modules List */}
        <div className="border rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-2">Modules</h2>
          <p className="text-sm text-gray-600 mb-4">
            Click on a module to edit the learning goals.
          </p>

          {modulesData.map((mod, i) => {
            const isEditing = editingIndex === i;

            return (
              <div
                key={i}
                className="p-3 mb-3 rounded-lg shadow-sm border bg-yellow-50"
              >
                {/* Module name + Edit/Save button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-orange-500">▶</span>
                    <p className="font-medium text-sm">{mod.name}</p>
                  </div>

                  <div className="w-1/16">
                    {!isEditing ? (
                        <button
                        onClick={() => handleEdit(i)}
                        className="w-full mt-4 px-3 py-2 text-lg font-bold text-white bg-black rounded-lg"
                        >
                        Edit
                        </button>
                    ) : (
                        <button
                        onClick={() => handleSave(i)}
                        className="w-full mt-4 px-3 py-2 text-lg font-bold text-white bg-amber-600 rounded-lg"
                        >
                        Save
                        </button>
                    )}
                    </div>
                </div>

                {/* Module Description */}
                <p className="text-md text-gray-700 mt-2 italic">
                  {mod.module_description}
                </p>

                {/* Learning Goals */}
                <div className="mt-2">
                  <h3 className="text-lg font-semibold mb-1">Learning Goals</h3>

                  {!isEditing ? (
                    // READ-ONLY MODE
                    <ul className="list-disc list-inside space-y-1">
                      {mod.learning_goals.map((goal, idx) => (
                        <li key={idx} className="text-md text-gray-700">
                          {goal}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    // EDIT MODE
                    <div className="space-y-2">
                      {tempGoals.map((goal, idx) => (
                        <input
                          key={idx}
                          type="text"
                          value={goal}
                          onChange={(e) => {
                            const updatedGoals = [...tempGoals];
                            updatedGoals[idx] = e.target.value;
                            setTempGoals(updatedGoals);
                          }}
                          className="w-full p-1 border rounded text-sm text-gray-700"
                        />
                      ))}

                      {/* Add a new goal */}
                      <button
                        onClick={() => setTempGoals([...tempGoals, ""])}
                        className="px-3 py-1 text-sm font-medium bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        + Add Goal
                      </button>
                    </div>
                  )}
                </div>

                {/* Prerequisites & Next Modules */}
                <div className="mt-2 flex space-x-4">
                  <div>
                    <h4 className="text-sm font-semibold">Prerequisites:</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {mod.prerequisite_modules.length > 0 ? (
                        mod.prerequisite_modules.map((pm, idx) => (
                          <li key={idx}>{pm}</li>
                        ))
                      ) : (
                        <li>None</li>
                      )}
                    </ul>
                  </div>
                </div>
                <div className="mt-2 flex space-x-4">
                  <div>
                    <h4 className="text-sm font-semibold">Next Modules:</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {mod.next_modules.length > 0 ? (
                        mod.next_modules.map((nm, idx) => <li key={idx}>{nm}</li>)
                      ) : (
                        <li>None</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ViewPathwayPageTeacher;
