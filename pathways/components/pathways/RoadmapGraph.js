import React from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import { nodeTypes } from "@/components/pathways/RoadmapNode"; // your custom node component
import mockRoadmap from "@/data/mockRoadmap"; // remove if passing roadmap as prop

const RoadmapGraph = ({ roadmap }) => {
  const moduleMap = new Map();
  const nodes = [];
  const edges = [];

  const baseX = 280;
  const baseY = 140;

  // Step 1: Index modules
  roadmap.chapters.forEach((chapter, chapterIndex) => {
    chapter.modules.forEach((module) => {
      moduleMap.set(module.id, {
        ...module,
        chapterIndex,
      });
    });
  });

  // Step 2: Create nodes
  roadmap.chapters.forEach((chapter, chapterIndex) => {
    const x = chapterIndex * baseX;
    const numModules = chapter.modules.length;
    const totalHeight = (numModules - 1) * baseY;
    const yOffset = (600 - totalHeight) / 2;

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
    });
  });

  // Step 3: Create edges
  roadmap.chapters.forEach((chapter) => {
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

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border">
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

export default RoadmapGraph;
