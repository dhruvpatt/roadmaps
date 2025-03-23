// pages/roadmap-preview.js
import React from "react";
import { useRouter } from "next/router";
import RoadmapGraph from "@/components/pathways/RoadmapGraph";
import mockRoadmap from "@/data/mockRoadmap";
import { ArrowLeft } from "lucide-react";

const isModuleUnlocked = (module, moduleMap) => {
  return (module.prereq || []).every(
    (id) => moduleMap.get(id)?.status >= 100
  );
};

const getOrderedModules = (roadmap) => {
  const list = [];
  const moduleMap = new Map();

  roadmap.chapters.forEach((chapter, chapterIndex) => {
    chapter.modules.forEach((mod, modIndex) => {
      const key = `${chapterIndex}.${modIndex}`;
      moduleMap.set(mod.id, mod);
      list.push({ ...mod, chapterIndex, modIndex, index: key });
    });
  });

  return { list, moduleMap };
};

const ViewPathwayPage = () => {
  const router = useRouter();
  const { list: moduleList, moduleMap } = getOrderedModules(mockRoadmap);
  const completedModules = moduleList.filter((m) => m.status >= 100).length;
  const totalModules = moduleList.length;
  const progressPercent = Math.round((completedModules / totalModules) * 100);

  return (
    <div className="min-h-screen bg-white p-6 space-y-6 text-gray-800">
      {/* Back Navigation */}
      <div className="flex items-center text-sm text-gray-500 cursor-pointer hover:underline">
        <ArrowLeft size={16} className="mr-1" />
        Back to pathway
      </div>

      {/* Title & Progress */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {mockRoadmap.title}
        </h1>
        <p className="text-gray-600 mt-1">{mockRoadmap.details}</p>
        <div className="mt-3">
          <p className="text-sm text-gray-600 mb-1">Pathway Progress</p>
          <div className="relative w-full h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-black rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-700 mt-1">
            <span>{`${completedModules} of ${totalModules} modules completed`}</span>
            <span className="font-semibold">{`${progressPercent}%`}</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Modules List */}
        <div className="border rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-2">Modules</h2>
          <p className="text-sm text-gray-600 mb-4">
            Click on a module to begin
          </p>

          {moduleList.map((mod) => {
            const unlocked = isModuleUnlocked(mod, moduleMap);
            const completed = mod.status >= 100;

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
                        ? "bg-white border border-gray-300 hover:bg-gray-100 text-gray-700"
                        : "bg-black text-white"
                    }`}
                  >
                    {completed ? "Review" : "Start"}
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

        {/* Pathway Map */}
        <div className="border rounded-xl p-4 flex flex-col h-full">
          <h2 className="text-lg font-semibold mb-1 text-gray-800">
            Pathway Map
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Visual representation of your learning journey
          </p>
          <div className="relative flex-1">
            <RoadmapGraph roadmap={mockRoadmap} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPathwayPage;
