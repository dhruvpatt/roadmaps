import React from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import { nodeTypes } from "@/components/pathways/RoadmapNodeTeacher";

const RoadmapGraphTeacher = ({ modules = [] }) => {
  // 1) Group modules by their numeric "chapter"
  const chapterMap = new Map();
  modules.forEach((mod) => {
    if (!chapterMap.has(mod.chapter)) {
      chapterMap.set(mod.chapter, []);
    }
    chapterMap.get(mod.chapter).push(mod);
  });

  // 2) Convert map to an array of [chapterNum, moduleList], then sort by chapterNum
  const chaptersArray = Array.from(chapterMap.entries());
  chaptersArray.sort((a, b) => a[0] - b[0]);

  const nodes = [];
  const edges = [];

  // Spacing constants
  const baseX = 280; // horizontal distance between chapters
  const baseY = 140; // vertical distance between modules
  const diagramHeight = 600; // used for vertical centering

  // We'll create a map of (moduleObject) -> (stringNodeId) to use in edges
  const moduleIdMap = new Map();
  let globalModuleCounter = 1;

  // First pass: assign an ID to each module
  chaptersArray.forEach(([chapterNum, mods]) => {
    mods.forEach((mod) => {
      const modId = String(globalModuleCounter++);
      moduleIdMap.set(mod, modId);
    });
  });

  // Second pass: create nodes
  chaptersArray.forEach(([chapterNum, mods], chapterIndex) => {
    // We'll place this chapter at horizontal position = chapterIndex * baseX
    const x = chapterIndex * baseX;

    const numModules = mods.length;
    const totalHeight = (numModules - 1) * baseY;
    const yOffset = (diagramHeight - totalHeight) / 2;

    mods.forEach((mod, moduleIndex) => {
      const modId = moduleIdMap.get(mod);
      const y = moduleIndex * baseY + yOffset;

      // Example color logic: shift hue by chapterIndex
      const hue = (chapterIndex * 60) % 360;
      // If no prerequisites, lighten background
      const lightness = mod.prerequisite_modules?.length === 0 ? "85%" : "65%";

      nodes.push({
        id: modId,
        type: "roadmapNode",
        position: { x, y },
        data: {
          label: mod.name,
          status: 0, // or mod.status if you have that
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

  // Third pass: create edges based on "next_modules" array
  // We assume "next_modules" is an array of strings referencing the module names
  chaptersArray.forEach(([_, mods]) => {
    mods.forEach((mod) => {
      const sourceId = moduleIdMap.get(mod);

      if (mod.next_modules && mod.next_modules.length > 0) {
        mod.next_modules.forEach((nextName) => {
          // Find the module object with this name
          const targetMod = modules.find((m) => m.name === nextName);
          if (targetMod) {
            const targetId = moduleIdMap.get(targetMod);
            if (targetId) {
              edges.push({
                id: `edge-${sourceId}-${targetId}`,
                source: sourceId,
                target: targetId,
                type: "straight",
                animated: true,
                style: { stroke: "#999" },
              });
            }
          }
        });
      }
    });
  });

  return (
    <div className="w-full h-150 rounded-xl overflow-hidden border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
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

export default RoadmapGraphTeacher;
