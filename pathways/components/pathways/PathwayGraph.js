import React, { useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";

import "reactflow/dist/style.css";

// Custom node types
import { nodeTypes as studentNodeTypes } from "@/components/pathways/PathwayNode";
import { nodeTypes as teacherNodeTypes } from "@/components/pathways/PathwayNodeTeacher";

const isModuleUnlocked = (module, moduleMap) => {
  return (module.prereq || []).every(
    (id) => moduleMap.get(id)?.status === "completed"
  );
};

const InnerGraph = ({ data, viewMode = "student", moduleStatusMap }) => {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const timeout = setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 50);
    return () => clearTimeout(timeout);
  }, [data]);

  const isTeacher = viewMode === "teacher";
  const nodes = [];
  const edges = [];
  const moduleMap = new Map();

  const baseX = 280;
  const baseY = isTeacher ? 140 : 400;

  if (!data || (!data.chapters && !Array.isArray(data))) return null;

  if (!isTeacher) {
    data.chapters.forEach((chapter, chapterIndex) => {
      const modules = chapter.modules;
      const moduleMapLocal = new Map(modules.map((m) => [m.id, m]));

      // ✅ Step 1: Assign levels based on prerequisites
      const moduleLevels = new Map();

      const computeLevel = (mod) => {
        if (moduleLevels.has(mod.id)) return moduleLevels.get(mod.id);
        if (!mod.prereq || mod.prereq.length === 0) {
          moduleLevels.set(mod.id, 0);
          return 0;
        }

        const prereqLevels = mod.prereq
          .map((pid) => moduleMapLocal.get(pid))
          .filter(Boolean) // ✅ skip missing
          .map((prereqMod) => computeLevel(prereqMod));

        const level = prereqLevels.length > 0 ? Math.max(...prereqLevels) + 1 : 0;
        moduleLevels.set(mod.id, level);
        return level;
      };

      modules.forEach((mod) => {
        computeLevel(mod);
      });

      // ✅ Step 2: Group by levels
      const levels = {};
      modules.forEach((m) => {
        const lvl = moduleLevels.get(m.id) ?? 0;
        if (!levels[lvl]) levels[lvl] = [];
        levels[lvl].push(m);
      });

      console.log("Levels", levels)

      // ✅ Step 3: Build graph layout
      const xSpacing = 440;
      const ySpacing = 120;
      Object.entries(levels).forEach(([lvlStr, mods], level) => {
        mods.forEach((mod, idx) => {
          console.log(mod.id, level)
          const x = level * xSpacing;
          const y = ySpacing;
          const hue = (mod.id * 60) % 360;
          const lightness = 85 - level * 60;

          moduleMap.set(mod.id, mod);
          const unlocked = isModuleUnlocked(mod, moduleMap);

          nodes.push({
            id: mod.id.toString(),
            type: "pathwayNode",
            position: { x, y },
            data: {
              label: mod.name,
              status: mod.status ?? 0,
              description: mod.learningGoals?.[0] || "",
              id: mod.id,
              unlocked,
            },
            style: {
              backgroundColor: `hsl(${hue}, 70%, ${lightness}%)`,
              borderRadius: 8,
              padding: 10,
            },
          });
        });
      });

      // ✅ Step 4: Add edges
      modules.forEach((mod) => {
        mod.next?.forEach((targetId) => {
          if (moduleMap.has(targetId)) {
            edges.push({
              id: `e-${mod.id}-${targetId}`,
              source: mod.id.toString(),
              target: targetId.toString(),
              type: "straight",
              animated: true,
              style: { stroke: "#999", width: 2 },
              markerEnd: {
                type: "arrowclosed",
                width: 12,
                height: 12,
                color: "#555",
              },
            });
          }
        });
      });
    });
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={isTeacher ? teacherNodeTypes : studentNodeTypes}
      fitView
      defaultEdgeOptions={{
        type: "straight",
        animated: true,
        style: { stroke: "#555", strokeWidth: 2 },
        markerEnd: {
          type: "arrowclosed",
          width: 12,
          height: 12,
          color: "#555",
        },
      }}
    >
      <Background />
      <Controls />
    </ReactFlow>
  );
};

const PathwayGraph = (props) => {
  return (
    <div className="w-full min-h-[400px] h-[400px] rounded-xl overflow-hidden border">
      <ReactFlowProvider>
        <InnerGraph {...props} />
      </ReactFlowProvider>
    </div>
  );
};

export default PathwayGraph;
