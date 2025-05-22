import React, { useEffect, useState, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";

import "reactflow/dist/style.css";
import { nodeTypes as defaultNodeTypes } from "@/components/pathways/PathwayNode";
import FloatingEdge from './FloatingEdge';
import backendUrl from "@backendUrl";

const isModuleUnlocked = (module, moduleMap) => {
  return (module.prereq || []).every(
    (id) => moduleMap.get(id)?.status === "completed"
  );
};

const edgeTypes = {
  floating: FloatingEdge,
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
    const positionMap = new Map();
    const chapter = data.chapter;
    const modules = chapter.modules || [];

    const sortedModules = [...modules].sort((a, b) => a.id - b.id);

    const xSpacing = 280;
    const ySpacing = 200;
    const positions = new Map();

    const levels = new Map();

    sortedModules.forEach((mod, index) => {
      const depth = Math.floor(Math.log2(index + 1));
      const posInLevel = index - (2 ** depth - 1);
      const nodesInLevel = 2 ** depth;

      const x = (posInLevel - (nodesInLevel - 1) / 2) * xSpacing;
      const y = depth * ySpacing;

      positions.set(mod.id, { x, y });
      positionMap.set(mod.id.toString(), { x, y });

      if (!levels.has(depth)) levels.set(depth, []);
      levels.get(depth).push(mod);
    });

    sortedModules.forEach((mod) => {
      const pos = positions.get(mod.id);
      if (!pos) return;
      moduleMap.set(mod.id, mod);

      const hue = (mod.chapter * 60) % 360;
      const lightness = 80;
      // const formattedGoals = mod.learning_goals
      // .map((goal, index) => `${index + 1}. ${goal}`)
      // .join("\n");
      //TODO: Update to use description

      console.log(mod)
      nodes.push({
        id: mod.id.toString(),
        type: "pathwayNode",
        position: pos,
        data: {
          label: mod.name,
          status: mod.status ?? "not_started",
          description: mod.learning_goals || mod.learningGoals || "",
          id: mod.id,
          unlocked: true,
        },
        style: {
          backgroundColor: `hsl(${hue}, 70%, ${lightness}%)`,
          borderRadius: 8,
          padding: 4,
        },
      });
    });

    sortedModules.forEach((mod, idx) => {
      const sourceId = mod.id.toString();
      const sourcePos = positionMap.get(sourceId);


      // Explicit next_modules
      (mod.next_modules || []).forEach((targetId) => {
        const targetStr = targetId.toString();
        const targetPos = positionMap.get(targetStr);

        if (moduleMap.has(targetId) && sourcePos && targetPos) {
          const dx = targetPos.x - sourcePos.x;
          const dy = targetPos.y - sourcePos.y;

          const sourcePosition = Math.abs(dx) > Math.abs(dy)
            ? dx > 0 ? 'right' : 'left'
            : dy > 0 ? 'bottom' : 'top';
          const targetPosition = Math.abs(dx) > Math.abs(dy)
            ? dx > 0 ? 'left' : 'right'
            : dy > 0 ? 'top' : 'bottom';

          edges.push({
            id: `e-${sourceId}-${targetStr}`,
            source: sourceId,
            target: targetStr,
            sourceHandle: `source-${sourcePosition}`,  // ← use the computed direction
            targetHandle: `target-${targetPosition}`,  // ← same here
            type: "floating",
            animated: true,
            className: "edge-connected",
            style: { stroke: "#999" },
            markerEnd: {
              type: 'arrowclosed',
              width: 8,
              height: 8,
              color: '#555',
            }
          });
        }
      });

      // Fallback: link to next module in list
      if (idx < sortedModules.length - 1) {
        const nextMod = sortedModules[idx + 1];
        const nextId = nextMod.id.toString();
        const alreadyLinked = mod.next_modules?.includes(nextMod.id);
        const targetPos = positionMap.get(nextId);

        if (!alreadyLinked && moduleMap.has(nextMod.id) && sourcePos && targetPos) {
          const dx = targetPos.x - sourcePos.x;
          const dy = targetPos.y - sourcePos.y;

          const sourcePosition = Math.abs(dx) > Math.abs(dy)
            ? dx > 0 ? 'right' : 'left'
            : dy > 0 ? 'bottom' : 'top';
          const targetPosition = Math.abs(dx) > Math.abs(dy)
            ? dx > 0 ? 'left' : 'right'
            : dy > 0 ? 'top' : 'bottom';

          edges.push({
            id: `e-${sourceId}-${nextId}-fallback`,
            source: sourceId,
            target: nextId,
            sourceHandle: `source-${sourcePosition}`,
            targetHandle: `target-${targetPosition}`,
            type: "floating",
            animated: true,
            className: "edge-connected",
            style: { stroke: "#bbb", strokeDasharray: "5,3" },
            markerEnd: {
              type: 'arrowclosed',
              width: 8,
              height: 8,
              color: '#555',
            }
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
          hoveredNodeId && (e.source === hoveredNodeId || e.target === hoveredNodeId)
            ? "edge-connected"
            : "",
      }))}
      onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
      onNodeMouseLeave={() => setHoveredNodeId(null)}
      nodeTypes={defaultNodeTypes}
      edgeTypes={edgeTypes}
      fitView
      defaultEdgeOptions={{
        type: "floating",
        animated: true,
        style: { stroke: "#555", strokeWidth: 2 },
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
