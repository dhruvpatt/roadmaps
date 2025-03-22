import React from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import mockRoadmap from "@/data/mockRoadmap";
import { nodeTypes } from "@/components/RoadMapNode";

const RoadmapPage = () => {
  const roadmap = mockRoadmap;
  const moduleMap = new Map();
  const nodes = [];
  const edges = [];

  const baseX = 300;
  const baseY = 140;

  // Step 1: Index all modules for lookup
  roadmap.chapters.forEach((chapter, chapterIndex) => {
    chapter.modules.forEach((module) => {
      moduleMap.set(module.id, {
        ...module,
        chapterIndex
      });
    });
  });

  // Step 2: Create nodes
  roadmap.chapters.forEach((chapter, chapterIndex) => {
    const numModules = chapter.modules.length;
    const columnHeight = 600; // total vertical space per column
    const x = chapterIndex * baseX;
  
    // calculate vertical offset so they are centered
    const totalHeight = (numModules - 1) * baseY;
    const yOffset = (columnHeight - totalHeight) / 2;
  
    chapter.modules.forEach((module, moduleIndex) => {
      const y = moduleIndex * baseY + yOffset;
  
      // Color logic
      const baseHue = (chapterIndex * 70) % 360;
      const lightness = module.prereq?.length === 0 ? "80%" : "65%";
  
      nodes.push({
        id: module.id,
        type: "roadmapNode",
        position: { x, y },
        data: {
          label: `${chapterIndex}.${moduleIndex} ${module.name}`,
          status: module.status ?? 0,
          description: module.learningGoals?.[0] || ""
        },
        style: {
          backgroundColor: `hsl(${baseHue}, 70%, ${lightness})`,
          borderRadius: 8,
          padding: 10
        }
      });
    });
  });

  // Step 3: Create edges from module.next[]
  roadmap.chapters.forEach((chapter) => {
    chapter.modules.forEach((module) => {
      module.next?.forEach((targetId) => {
        if (moduleMap.has(targetId)) {
          edges.push({
            id: `e-${module.id}-${targetId}`,
            source: module.id,
            target: targetId,
            type: "smoothstep",
            animated: true,
            type: "straight",
            style: { stroke: "#888" }
          });
        }
      });
    });
  });

  return (
    <div className="h-screen w-full">
      <h1 className="text-3xl font-bold text-center pt-6 pb-4 text-amber-800">
        Roadmap: {roadmap.title}
      </h1>

      <div className="h-[calc(100vh-100px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          defaultEdgeOptions={{
            type: "straight",
            animated: true,
            style: { stroke: "#aaa" }
          }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

export default RoadmapPage;
