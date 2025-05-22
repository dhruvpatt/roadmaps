import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
import backendUrl from "../../backendUrl";
import PathwayGraph from "../../components/pathways/PathwayGraph";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";


import CreatePathwayModal from "@/components/modals/CreatePathwayModal";
import Back from "@components/Back";

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [user, setUser] = useState(null)
  const [tempName, setTempName] = useState("");
  const [tempDescription, setTempDescription] = useState("");





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
        const usr = JSON.parse(localStorage.getItem("user"))
        setUser(usr);



        const isTeacher = usr?.role === "teacher";
        setViewMode(isTeacher ? "teacher" : "student");

        console.log("data", data);
        setPathway(data);

        if (isTeacher) {
          const flattenedModules = data.chapters.flatMap(
            (chapter, chapterIndex) =>
              chapter.modules.map((mod, modIndex) => ({
                name: mod.name,
                learning_goals: mod.learning_goals || [],
                module_description: mod.contents?.[0]?.text || "No description provided.",
                prerequisite_modules:
                  mod.prerequisites?.map((pid) => {
                    const match = data.chapters.flatMap((c) => c.modules).find((m) => m.id === pid);
                    return match ? match.name : `Module ${pid}`;
                  }) || [],
                next_modules:
                  mod.next_modules?.map((nid) => {
                    const match = data.chapters.flatMap((c) => c.modules).find((m) => m.id === nid);
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
            id: data.id,
            title: data.title,
            owner: `user-${data.owner}`,
            mode: data.mode.toLowerCase(),
            grade: data.grade,
            learningGoals: data.learning_goals,
            details: data.details,
            chapters: data.chapters.map((chapter) => ({
              id: chapter.id,
              name: chapter.name,
              test: false,
              prereq: [],
              next: chapter.next_chapters.map((nextId) => `${nextId}`),
              modules: chapter.modules.map((mod) => ({
                id: `${mod.id}`,
                name: mod.name,
                chapter: `${mod.chapter}`,
                status: mod.status,
                prereq: mod.prerequisites.map((pid) => `${pid}`),
                next: mod.next_modules.map((nid) => `${nid}`),
                owner: data.owner,
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
    setTempName(modulesData[i].name);
    setTempDescription(modulesData[i].module_description || "");
  };


  const handleSave = async (i) => {
    const updated = [...modulesData];
    const modToSave = updated[i];

    modToSave.learning_goals = tempGoals;
    modToSave.name = tempName;
    modToSave.module_description = tempDescription;

    setModulesData(updated);
    setEditingIndex(-1);
    setTempGoals([]);
    setTempName("");
    setTempDescription("");

    try {
      const res = await fetch(`${backendUrl}/api/pathways/${pathway.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userid: user.id,
          modules: [
            {
              id: modToSave.id,
              name: modToSave.name,
              description: modToSave.module_description,
              learning_goals: modToSave.learning_goals,
            },
          ],
        }),
      });

      if (!res.ok) throw new Error("Failed to update module");
      const data = await res.json();
      console.log("✅ Module updated:", data);
    } catch (error) {
      console.error("❌ Error updating module:", error);
    }
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
            user_id: user.id,
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
            user_id: user.id,
          }),
        });

        const ret = await res.json();
        console.log("published", ret);
        setPathway(ret.pathway);
      }
    } catch (error) {
      console.error("Something went wrong", error);
    }
  }; const handleUpdate = async (id, data) => {
    const res = await fetch(`${backendUrl}/api/pathways/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Update failed");
    const updated = await res.json();
    setPathway(updated);
    return updated.id;
  };



  return (
    <div className="min-h-screen bg-white p-6 space-y-6 text-gray-800 w-full">
      <Back></Back>

      <div>
        <div className="flex space-x-2 justify-between items-center">
          <h1 className="text-5xl font-bold text-gray-900">{pathway?.title || "Pathway"}</h1>

          {pathway.owner == user?.id ? (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center text-sm font-medium text-amber-600 hover:underline"
              >
                ✏️ Edit
              </button>
              {(viewMode === "teacher" && !pathway.published) && (
                <button
                  onClick={async () => await handlePublish()}
                  className="px-3 py-1 text-sm font-medium text-white rounded bg-black hover:bg-amber-600"
                >
                  Publish
                </button>
              )}

            </div>) : (<></>)}

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
          <h2 className="text-lg font-semibold mb-2 px-6 text-gray-700 text-center">Module Chapters</h2>

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
                  left: `${(100 / pathway.chapters.length) * currentChapterIndex
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
          {(viewMode === "teacher" || user?.id === pathway.owner)
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
                      {!pathway.published && (
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
                      <h3 className="text-lg font-semibold mb-1">Learning Goals</h3>
                      {!isEditing ? (
                        <ul className="list-disc list-inside space-y-1">
                          {mod.learning_goals.map((goal, idx) => (
                            <li key={idx} className="text-md text-gray-700">
                              {goal}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="space-y-2 mt-2">
                          <label className="text-sm font-medium block">Module Name</label>
                          <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="w-full p-1 border rounded text-md text-gray-700"
                          />

                          <label className="text-sm font-medium block mt-2">Description</label>
                          <textarea
                            value={tempDescription}
                            onChange={(e) => setTempDescription(e.target.value)}
                            rows={3}
                            className="w-full p-1 border rounded text-md text-gray-700"
                          />

                          <label className="text-sm font-medium block mt-2">Learning Goals</label>
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
                              className="w-full p-1 border rounded text-md text-gray-700 mb-1"
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

                    {mod.prerequisite_modules?.length > 0 && (
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Dependent on:</strong> {mod.prerequisite_modules.join(", ")}
                      </p>
                    )}
                  </div>
                );
              })
            : (currentChapter?.modules || []).map((mod) => {
              const unlocked = (mod.prereq || []).every(
                (id) => moduleMap.get(id)?.status === "completed"
              );
              const completed = mod.status === "completed";
              const in_progress = mod.status === "in_progress";

              const prereqLabels = (mod.prereq || [])
                .map((id) => moduleMap.get(id)?.name)
                .filter(Boolean);

              const nextLabels = (mod.next || [])
                .map((id) => moduleMap.get(id)?.name)
                .filter(Boolean);

              return (
                <div
                  key={mod.id}
                  className={`flex flex-col gap-2 p-3 mb-3 rounded-lg shadow-sm border ${unlocked ? "bg-yellow-50" : "bg-gray-100 text-gray-400"
                    }`}
                >
                  <div className="flex justify-between items-center">
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
                        <p className="font-medium text-sm">{mod.name}</p>
                        <p className="text-xs">15:30</p>
                      </div>
                    </div>

                    {unlocked ? (
                      <button
                        onClick={() => router.push(`/modules/${mod.id}`)}
                        className={`text-sm px-4 py-1.5 rounded-md ${completed
                          ? "bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 cursor-pointer"
                          : "bg-black text-white cursor-pointer"
                          }`}
                      >
                        {completed ? "Review" : in_progress ? "Resume" : "Start"}
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

                  <div className="ml-6 text-xs text-gray-700 space-y-1">
                    {prereqLabels.length > 0 && (
                      <p>
                        <span className="font-semibold">Prerequisites:</span>{" "}
                        {prereqLabels.join(", ")}
                      </p>
                    )}
                    {nextLabels.length > 0 && (
                      <p>
                        <span className="font-semibold">Next:</span>{" "}
                        {nextLabels.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

        </div>
      </div>

      <CreatePathwayModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={handleUpdate}
        user={user}
        pathway={pathway}
      />
    </div>
  );
}

export default ViewPathwayPage;
