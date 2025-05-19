import React, { useEffect, useState, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";

import "reactflow/dist/style.css";
import { nodeTypes as defaultNodeTypes } from "../pathways/PathwayNode";

const isModuleUnlocked = (module, moduleMap) => {
  return (module.prereq || []).every(
    (id) => moduleMap.get(id)?.status === "completed"
  );
};

const InnerGraph = ({ data, viewMode = "student", published = false }) => {
  // console.log("GRAPH DATA:", data)

  const { fitView } = useReactFlow();
  const isTeacher = viewMode === "teacher";
  const [hoveredNodeId, setHoveredNodeId] = React.useState(null);

  const { nodes, edges } = useMemo(() => {
    if (!data || !data.chapter) return { nodes: [], edges: [] };

    const nodes = [];
    const edges = [];
    const moduleMap = new Map();
    const chapter = data.chapter;
    const modules = chapter.modules || [];

    // Step 1: Augment modules with fallback linear dependencies
    const modulesWithFallbackDeps = modules.map((mod, index) => {
      const prevId = index > 0 ? modules[index - 1].id : null;
      const augmentedPrereqs = new Set(mod.prerequisites || []);
      if (prevId) augmentedPrereqs.add(prevId);
      return { ...mod, prereq: Array.from(augmentedPrereqs) };
    });

    // Step 2: Compute compact column layout using topological sort
    const moduleMapLocal = new Map(
      modulesWithFallbackDeps.map((m) => [m.id, m])
    );
    const moduleColumns = new Map();
    const visited = new Set();

    const assignColumn = (mod) => {
      if (visited.has(mod.id)) return moduleColumns.get(mod.id);
      visited.add(mod.id);

      const prereqCols = (mod.prereq || [])
        .map((pid) => moduleMapLocal.get(parseInt(pid)))
        .filter(Boolean)
        .map(assignColumn);

      const col = prereqCols.length > 0 ? Math.max(...prereqCols) + 1 : 0;
      moduleColumns.set(mod.id, col);
      return col;
    };

    modulesWithFallbackDeps.forEach(assignColumn);

    // Step 3: Group by columns
    const columns = {};
    modulesWithFallbackDeps.forEach((m) => {
      const col = moduleColumns.get(m.id) ?? 0;
      if (!columns[col]) columns[col] = [];
      columns[col].push(m);
    });

    // Step 4: Generate nodes in zig-zag layout
    const xSpacing = 260;
    const ySpacing = 140;
    const maxColumnHeight = Math.max(
      ...Object.values(columns).map((c) => c.length)
    );

    Object.entries(columns).forEach(([colStr, mods], colIdx) => {
      const reverse = colIdx % 2 === 1;
      const offsetX = colIdx * xSpacing;
      const startY = ((maxColumnHeight - mods.length) * ySpacing) / 2;

      mods.forEach((mod, i) => {
        const idx = reverse ? mods.length - 1 - i : i;
        const y = startY + idx * ySpacing;
        const x = offsetX;
        const hue = (mod.chapter * 60) % 360;
        const lightness = 85 - colIdx * 8;

        moduleMap.set(mod.id, mod);

        nodes.push({
          id: mod.id.toString(),
          type: "pathwayNode",
          position: { x, y },
          data: {
            label: mod.name,
            status: mod.status ?? "not_started",
            description: mod.learning_goals?.[0] || "",
            id: mod.id,
            unlocked: true,
          },
          style: {
            backgroundColor: `hsl(${hue}, 70%, ${lightness}%)`,
            borderRadius: 8,
            padding: 10,
          },
        });
      });
    });

    // Step 5: Add explicit and fallback edges
    modules.forEach((mod, idx) => {
      const sourceId = mod.id.toString();

      // Explicit edges
      (mod.next_modules || []).forEach((targetId) => {
        const targetStr = targetId.toString();
        if (moduleMap.has(targetId)) {
          edges.push({
            id: `e-${sourceId}-${targetStr}`,
            source: sourceId,
            target: targetStr,
            type: "straight",
            animated: true,
            className: "edge-hover", // add this for hover animation
            style: { stroke: "#999", strokeWidth: 2 },
            markerEnd: {
              type: "arrowclosed",
              width: 12,
              height: 12,
              color: "#555",
            },
          });
        }
      });

      // Fallback linear edge
      if (idx < modules.length - 1) {
        const nextMod = modules[idx + 1];
        const nextId = nextMod.id.toString();

        const alreadyLinked = mod.next_modules?.includes(nextMod.id);
        if (!alreadyLinked && moduleMap.has(nextMod.id)) {
          edges.push({
            id: `e-${sourceId}-${nextId}-fallback`,
            source: sourceId,
            target: nextId,
            type: "straight",
            className: "edge-hover",
            style: { stroke: "#bbb", strokeWidth: 1, strokeDasharray: "5,3" },
            markerEnd: {
              type: "arrowclosed",
              width: 12,
              height: 12,
              color: "#555",
            },
          });
        }
      }
    });

    return { nodes, edges };
  }, [data, viewMode, published]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 50);
    return () => clearTimeout(timeout);
  }, [nodes, edges]);

  return (
    <ReactFlow
      nodes={nodes.map((n) => ({
        ...n,
        className: hoveredNodeId === n.id ? "node-hovered" : "",
      }))}
      edges={edges.map((e) => ({
        ...e,
        className:
          hoveredNodeId &&
          (e.source === hoveredNodeId || e.target === hoveredNodeId)
            ? "edge-connected"
            : "",
      }))}
      onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
      onNodeMouseLeave={() => setHoveredNodeId(null)}
      nodeTypes={defaultNodeTypes}
      fitView
      defaultEdgeOptions={{
        type: "smoothstep",
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
