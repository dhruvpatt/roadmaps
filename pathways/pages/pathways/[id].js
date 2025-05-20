import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
import backendUrl from "../../backendUrl";
import PathwayGraph from "../../components/pathways/PathwayGraph";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

const ViewPathwayPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [pathway, setPathway] = useState({});
  const [modulesData, setModulesData] = useState([]);
  const [moduleMap, setModuleMap] = useState(new Map());
  const [completedModules, setCompletedModules] = useState(0);
  const [totalModules, setTotalModules] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [viewMode, setViewMode] = useState("student");
  const [editingIndex, setEditingIndex] = useState(-1);
  const [tempGoals, setTempGoals] = useState([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [chapterOnlyPathway, setChapterOnlyPathway] = useState(null);

  useEffect(() => {
    if (pathway?.chapters?.length > 0) {
      const currentChapter = pathway.chapters[currentChapterIndex];
      if (currentChapter) {
        const { chapters, ...rest } = pathway;
        setChapterOnlyPathway({
          ...rest,
          chapter: currentChapter,
        });
      }
    }
  }, [pathway, currentChapterIndex]);

  const scrollRef = useRef(null);

  const scrollAmount = 900;
  const scrollLeft = () =>
    scrollRef.current?.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  const scrollRight = () =>
    scrollRef.current?.scrollBy({ left: scrollAmount, behavior: "smooth" });

  const isModuleUnlocked = (module, moduleMap) => {
    return (module.prereq || []).every(
      (id) => moduleMap.get(id)?.status === "completed"
    );
  };

  const getOrderedModules = (pathway) => {
    const list = [];
    const moduleMap = new Map();

    pathway.chapters.forEach((chapter, chapterIndex) => {
      chapter.modules.forEach((mod, modIndex) => {
        const key = `${chapterIndex}.${modIndex}`;
        moduleMap.set(mod.id, mod);
        list.push({ ...mod, chapterIndex, modIndex, index: key });
      });
    });

    return { list, moduleMap };
  };

  const currentChapter = pathway?.chapters?.[currentChapterIndex];

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/pathways/${id}/`);
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();

        const user = await fetch(`${backendUrl}/api/users/${data.owner}/`);
        const userData = await user.json();

        const isTeacher = userData?.role === "teacher";
        setViewMode(isTeacher ? "teacher" : "student");

        console.log("data", data);
        setPathway(data);

        if (isTeacher) {
          const flattenedModules = data.chapters.flatMap(
            (chapter, chapterIndex) =>
              chapter.modules.map((mod, modIndex) => ({
                name: mod.name,
                learning_goals: mod.learning_goals || [],
                module_description:
                  mod.contents?.[0]?.text || "No description provided.",
                prerequisite_modules:
                  mod.prerequisites?.map((pid) => {
                    const match = data.chapters
                      .flatMap((c) => c.modules)
                      .find((m) => m.id === pid);
                    return match ? match.name : `Module ${pid}`;
                  }) || [],
                next_modules:
                  mod.next_modules?.map((nid) => {
                    const match = data.chapters
                      .flatMap((c) => c.modules)
                      .find((m) => m.id === nid);
                    return match ? match.name : `Module ${nid}`;
                  }) || [],
                chapter: chapterIndex,
                id: mod.id,
                status: mod.status,
                index: `${chapterIndex}.${modIndex}`,
              }))
          );
          setModulesData(flattenedModules);
        } else {
          const transformed = {
            id: `pathway-${data.id}`,
            title: data.title,
            owner: `user-${data.owner}`,
            mode: data.mode.toLowerCase(),
            grade: data.grade,
            learningGoals: data.learning_goals,
            details: data.details,
            chapters: data.chapters.map((chapter) => ({
              id: `chapter-${chapter.id}`,
              name: chapter.name,
              test: false,
              prereq: [],
              next: chapter.next_chapters.map((nextId) => `chapter-${nextId}`),
              modules: chapter.modules.map((mod) => ({
                id: `${mod.id}`,
                name: mod.name,
                chapter: `chapter-${mod.chapter}`,
                status: mod.status,
                prereq: mod.prerequisites.map((pid) => `${pid}`),
                next: mod.next_modules.map((nid) => `${nid}`),
                owner: "student-a",
                content: mod.contents || [],
                learningGoals: mod.learning_goals,
              })),
            })),
          };
          setPathway(transformed);
          console.log("transformed", transformed);
          const { list, moduleMap } = getOrderedModules(transformed);
          const completed = list.filter((m) => m.status === "completed").length;
          const total = list.length;
          const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

          setModuleMap(moduleMap);
          setCompletedModules(completed);
          setTotalModules(total);
          setProgressPercent(percent);
        }
      } catch (err) {
        console.error(err.message || "Something went wrong");
      }
    };

    fetchData();
  }, [id]);

  const handleEdit = (i) => {
    setEditingIndex(i);
    setTempGoals([...modulesData[i].learning_goals]);
  };

  const handleSave = async (i) => {
    const updated = [...modulesData];
    updated[i] = {
      ...updated[i],
      learning_goals: tempGoals,
    };
    setModulesData(updated);
    setEditingIndex(-1);
    setTempGoals([]);
  };

  const handlePublish = async () => {
    try {
      console.log("pathway", pathway);
      if (pathway.classroom !== null) {
        const res = await fetch(`${backendUrl}/publish-pathway-to-classroom/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pathway_id: pathway.id,
            user_id: pathway.owner,
            classroom_id: pathway.classroom,
          }),
        });

        const ret = await res.json();
        console.log("published", ret);
        setPathway(ret.pathway);
      } else {
        const res = await fetch(`${backendUrl}/publish-pathway/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pathway_id: pathway.id,
            user_id: pathway.owner,
          }),
        });

        const ret = await res.json();
        console.log("published", ret);
        setPathway(ret.pathway);
      }
    } catch (error) {
      console.error("Something went wrong", error);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 space-y-6 text-gray-800 w-full">
      <div
        className="flex items-center text-sm text-gray-500 cursor-pointer hover:underline"
        onClick={() => router.push("/pathways")}
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to pathways
      </div>

      <div>
        <div className="flex space-x-2 justify-between">
          <h1 className="text-5xl font-bold text-gray-900">
            {pathway?.title || "Pathway"}
          </h1>

          {viewMode === "teacher" && !pathway.published && (
            <div>
              <button
                onClick={async () => await handlePublish()}
                className="w-full mt-4 px-3 py-1 text-sm font-medium text-white rounded bg-black hover:bg-amber-600 cursor-pointer"
              >
                Publish
              </button>
            </div>
          )}
        </div>

        <p className="text-gray-600 mt-1">{pathway?.details}</p>

        {viewMode !== "teacher" && (
          <div className="mt-3">
            <p className="text-2xl text-gray-600 mb-1">Pathway Progress</p>
            <div className="relative w-full h-2 bg-gray-200 rounded-full">
              <div
                className="h-full bg-black rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xl text-gray-700 mt-1">
              <span>{`${completedModules} of ${totalModules} modules completed`}</span>
              <span className="font-semibold">{`${progressPercent}%`}</span>
            </div>
          </div>
        )}
      </div>

      {pathway?.chapters?.length > 0 && (
        <div className="sticky w-full top-[60px] z-20 bg-white pt-3 pb-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold mb-2 px-6 text-gray-700">
            Module Chapters
          </h2>

          {/* Position Indicator Bar */}
          <div className="w-full flex justify-center items-center text-sm font-medium text-gray-600 mb-1">
            You are looking at chapter: {currentChapterIndex + 1} out of{" "}
            {pathway?.chapters?.length || 1}
          </div>
          <div className="w-full flex justify-center items-center mb-2">
            <div className="relative w-[80%] h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-black rounded-full transition-all"
                style={{
                  width: `${100 / pathway.chapters.length}%`,
                  left: `${
                    (100 / pathway.chapters.length) * currentChapterIndex
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="relative w-full">
            <button
              onClick={scrollLeft}
              className="absolute -left-5 top-1/2 transform -translate-y-1/2 z-10 bg-white border p-1.5 rounded-full shadow hover:bg-gray-100"
            >
              <ChevronLeft size={20} />
            </button>
            {/* Left Arrow */}

            {/* Scrollable Row */}
            <div
              ref={scrollRef}
              className="overflow-x-auto scroll-smooth scrollbar-hide mx-6"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>

              <div className="flex space-x-3">
                {pathway.chapters.map((chapter, idx) => {
                  const total = pathway.chapters.length;
                  const hue = 45; // yellow-orange
                  const lightness = 95 - (idx / (total - 1)) * 25; // from 95% to 70%
                  const bg = `hsl(${hue}, 100%, ${lightness}%)`;

                  return (
                    <button
                      id={`chapter-btn-${idx}`}
                      key={idx}
                      onClick={() => {
                        setCurrentChapterIndex(idx);
                        const scrollContainer = scrollRef.current;
                        const chapterButton = document.getElementById(
                          `chapter-btn-${idx}`
                        );
                        if (scrollContainer && chapterButton) {
                          const containerRect =
                            scrollContainer.getBoundingClientRect();
                          const buttonRect =
                            chapterButton.getBoundingClientRect();
                          const offset = buttonRect.left - containerRect.left;
                          const scrollTo =
                            offset -
                            scrollContainer.clientWidth / 2 +
                            buttonRect.width / 2;
                          scrollContainer.scrollBy({
                            left: scrollTo,
                            behavior: "smooth",
                          });
                        }
                      }}
                      className={`w-[250px] h-[60px] flex-shrink-0 px-2 py-1 text-sm rounded-md border text-center font-semibold transition-colors duration-300
        ${idx === currentChapterIndex ? "bg-black text-white" : "text-gray-800"}
      `}
                      style={{
                        backgroundColor:
                          idx === currentChapterIndex ? undefined : bg,
                      }}
                    >
                      {chapter.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Arrow */}
            <button
              onClick={scrollRight}
              className="absolute -right-5 top-1/2 transform -translate-y-1/2 z-10 bg-white border p-1.5 rounded-full shadow hover:bg-gray-100"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="gap-6">
        <div className="border rounded-xl p-4 flex flex-col h-full">
          <h2 className="text-lg font-semibold mb-1 text-gray-600">
            Pathway Map
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Visual representation of your learning journey
          </p>
          <div className="relative flex-1">
            {chapterOnlyPathway && (
              <PathwayGraph
                data={chapterOnlyPathway}
                viewMode={viewMode}
                published={pathway.published}
              />
            )}
          </div>
        </div>

        <div className="border rounded-xl p-4 mt-6">
          <h2 className="text-lg font-semibold mb-2">Modules</h2>
          <p className="text-sm text-gray-600 mb-4">
            {viewMode === "teacher"
              ? "Click on a module to edit the learning goals."
              : "Click on a module to begin"}
          </p>

          {viewMode === "teacher"
            ? modulesData
                .filter((mod) => mod.chapter === currentChapterIndex)
                .map((mod, i) => {
                  const isEditing = editingIndex === i;
                  return (
                    <div
                      key={i}
                      className="p-3 mb-3 rounded-lg shadow-sm border bg-yellow-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-orange-500">▶</span>
                          <p className="text-lg font-bold">{mod.name}</p>
                        </div>
                        {viewMode === "teacher" && !pathway.published && (
                          <div className="w-1/8">
                            {!isEditing ? (
                              <button
                                onClick={() => handleEdit(i)}
                                className="w-full mt-4 px-3 py-1 text-sm font-medium text-white rounded bg-black"
                              >
                                Edit
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSave(i)}
                                className="w-full mt-4 px-3 py-1 text-sm font-medium text-white rounded bg-amber-600"
                              >
                                Save
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="text-md text-gray-700 mt-2 italic">
                        {mod.module_description}
                      </p>

                      <div className="mt-2">
                        <h3 className="text-lg font-semibold mb-1">
                          Learning Goals
                        </h3>
                        {!isEditing ? (
                          <ul className="list-disc list-inside space-y-1">
                            {mod.learning_goals.map((goal, idx) => (
                              <li key={idx} className="text-md text-gray-700">
                                {goal}
                              </li>
                            ))}
                          </ul>
                        ) : (
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
                                className="w-full p-1 border rounded text-md text-gray-700"
                              />
                            ))}
                            <button
                              onClick={() => setTempGoals([...tempGoals, ""])}
                              className="px-3 py-1 text-md font-medium bg-gray-200 hover:bg-gray-300 rounded"
                            >
                              + Add Goal
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 flex space-x-4">
                        <div>
                          <h4 className="text-lg font-semibold">
                            Prerequisites:
                          </h4>
                          <ul className="list-disc list-inside text-md text-gray-700">
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
                          <h4 className="text-lg font-semibold">
                            Next Modules:
                          </h4>
                          <ul className="list-disc list-inside text-md text-gray-700">
                            {mod.next_modules.length > 0 ? (
                              mod.next_modules.map((nm, idx) => (
                                <li key={idx}>{nm}</li>
                              ))
                            ) : (
                              <li>None</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })
            : (currentChapter?.modules || []).map((mod) => {
                const unlocked = isModuleUnlocked(mod, moduleMap);
                const completed = mod.status === "completed";
                const in_progress = mod.status === "in_progress";
                return (
                  <div
                    key={mod.id}
                    className={`flex items-center justify-between p-3 mb-3 rounded-lg shadow-sm border ${
                      unlocked ? "bg-yellow-50" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div>
                        {completed ? (
                          <span className="text-green-500">✓</span>
                        ) : unlocked ? (
                          <span className="text-orange-500">▶</span>
                        ) : (
                          <span className="text-gray-400">🔒</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {mod.index} {mod.name}
                        </p>
                        <p className="text-xs">15:30</p>
                      </div>
                    </div>

                    {unlocked ? (
                      <button
                        onClick={() => router.push(`/modules/${mod.id}`)}
                        className={`text-sm px-4 py-1.5 rounded-md ${
                          completed
                            ? "bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 cursor-pointer"
                            : "bg-black text-white cursor-pointer"
                        }`}
                      >
                        {completed
                          ? "Review"
                          : in_progress
                          ? "Resume"
                          : "Start"}{" "}
                      </button>
                    ) : (
                      <button
                        className="text-sm px-4 py-1.5 rounded-md bg-gray-300 text-white cursor-not-allowed"
                        disabled
                      >
                        Locked
                      </button>
                    )}
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
};

export default ViewPathwayPage;
