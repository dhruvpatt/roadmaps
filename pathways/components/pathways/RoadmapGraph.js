import React from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";

// Custom node types
import { nodeTypes as studentNodeTypes } from "@/components/pathways/RoadmapNode";
import { nodeTypes as teacherNodeTypes } from "@/components/pathways/RoadmapNodeTeacher";

const RoadmapGraph = ({ data, viewMode = "student" }) => {
  const isTeacher = viewMode === "teacher";

  console.log(isTeacher)

  const nodes = [];
  const edges = [];
  const moduleMap = new Map();

  // Constants
  const baseX = 280;
  const baseY = isTeacher ? 140 : 400;
  const diagramHeight = 600;

  if (!data || (!data.chapters && !Array.isArray(data))) return null;

  if (!isTeacher) {
    // === STUDENT MODE ===
    data.chapters.forEach((chapter, chapterIndex) => {
      const x = chapterIndex > 0 ? chapterIndex * baseX : baseX - 200;

      const numModules = chapter.modules.length;
      const totalHeight = (numModules - 1) * baseY;
      const yOffset = (diagramHeight - totalHeight) / 2;

      chapter.modules.forEach((module, moduleIndex) => {
        const y = moduleIndex * baseY + yOffset;
        const hue = (chapterIndex * 60) % 360;
        const lightness = module.prereq?.length === 0 ? "85%" : "65%";

        nodes.push({
          id: module.id,
          type: "roadmapNode",
          position: { x, y },
          data: {
            label: module.name,
            status: module.status ?? 0,
            description: module.learningGoals?.[0] || "",
          },
          style: {
            backgroundColor: `hsl(${hue}, 70%, ${lightness})`,
            borderRadius: 8,
            padding: 10,
          },
        });

        moduleMap.set(module.id, module);
      });
    });

    data.chapters.forEach((chapter) => {
      chapter.modules.forEach((module) => {
        module.next?.forEach((targetId) => {
          if (moduleMap.has(targetId)) {
            edges.push({
              id: `e-${module.id}-${targetId}`,
              source: module.id,
              target: targetId,
              type: "straight",
              animated: true,
              style: { stroke: "#999" },
            });
          }
        });
      });
    });
  } else {
    // === TEACHER MODE ===

    // Group by chapter number
    const chapterMap = new Map();
    data.forEach((mod) => {
      if (!chapterMap.has(mod.chapter)) {
        chapterMap.set(mod.chapter, []);
      }
      chapterMap.get(mod.chapter).push(mod);
    });

    const chaptersArray = Array.from(chapterMap.entries()).sort((a, b) => a[0] - b[0]);

    let globalModuleCounter = 1;

    // First pass: assign IDs
    chaptersArray.forEach(([_, mods]) => {
      mods.forEach((mod) => {
        moduleMap.set(mod.name, String(globalModuleCounter++));
      });
    });

    // Second pass: nodes
    chaptersArray.forEach(([chapterNum, mods], chapterIndex) => {
      const x = chapterIndex * baseX;
      const numModules = mods.length;
      const totalHeight = (numModules - 1) * baseY;
      const yOffset = (diagramHeight - totalHeight) / 2;

      mods.forEach((mod, modIndex) => {
        const modId = moduleMap.get(mod.name);
        const y = modIndex * baseY + yOffset;
        const hue = (chapterIndex * 60) % 360;
        const lightness = mod.prerequisite_modules?.length === 0 ? "85%" : "65%";

        nodes.push({
          id: modId,
          type: "roadmapNode",
          position: { x, y },
          data: {
            label: mod.name,
            status: 0,
            description: mod.learning_goals?.[0] || "",
          },
          style: {
            backgroundColor: `hsl(${hue}, 70%, ${lightness})`,
            borderRadius: 8,
            padding: 10,
          },
        });
      });
    });

    // Third pass: edges
    data.forEach((mod) => {
      const sourceId = moduleMap.get(mod.name);

      if (mod.next_modules) {
        mod.next_modules.forEach((targetName) => {
          const targetId = moduleMap.get(targetName);
          if (targetId) {
            edges.push({
              id: `e-${sourceId}-${targetId}`,
              source: sourceId,
              target: targetId,
              type: "straight",
              animated: true,
              style: { stroke: "#999" },
            });
          }
        });
      }
    });
  }

  return (
    <div className="w-full min-h-[600px] h-[600px] rounded-xl overflow-hidden border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={isTeacher ? teacherNodeTypes : studentNodeTypes}
        fitView
        defaultEdgeOptions={{
          type: "straight",
          animated: true,
          style: { stroke: "#aaa" },
        }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default RoadmapGraph;
