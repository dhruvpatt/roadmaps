// === 1. PathwayNode.jsx update for locked state ===

import { Handle } from "reactflow";
import { useRouter } from "next/router";

function PathwayNode({ data }) {
  const router = useRouter();

  const handleClick = () => {
    if (data.unlocked) {
      router.push(`/modules/${data.id}`);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "✅ Completed";
      case "in_progress":
        return "🔄 In Progress";
      case "incomplete":
      default:
        return "🕒 Not Started";
    }
  };

  const isLocked = !data.unlocked;

  return (
    <div
      onClick={handleClick}
      className={`rounded-md shadow-md border border-gray-300 w-[200px] h-[120px] p-1 text-xs text-left transition-all relative overflow-hidden ${
        isLocked
          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
          : "bg-white cursor-pointer hover:shadow-lg"
      }`}
    >
      {/* Handles */}
      {["top", "bottom", "left", "right"].map((pos) => (
        <Handle
          key={`source-${pos}`}
          type="source"
          position={pos}
          id={`source-${pos}`}
          className="w-2 h-2 bg-amber-600 absolute"
        />
      ))}
      {["top", "bottom", "left", "right"].map((pos) => (
        <Handle
          key={`target-${pos}`}
          type="target"
          position={pos}
          id={`target-${pos}`}
          className="w-2 h-2 bg-amber-600 absolute"
        />
      ))}

      <div className="font-bold text-amber-800 truncate">{data.label}</div>

      {Array.isArray(data.description) ? (
        <div className="mt-1 space-y-0.5 overflow-hidden max-h-[60px]">
          {data.description.slice(0, 3).map((item, idx) => (
            <div
              key={idx}
              className="text-gray-600 text-[11px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis"
              title={`${idx + 1}. ${item}`}
            >
              {`${idx + 1}. ${item}`}
            </div>
          ))}
          {data.description.length > 3 && (
            <div className="text-gray-600 text-[11px] leading-tight">...</div>
          )}
        </div>
      ) : (
        <p className="text-gray-600 mt-1 text-[11px] leading-tight overflow-hidden text-ellipsis">
          {data.description}
        </p>
      )}

      <div className="mt-2 text-[11px] text-gray-700 font-medium">
        {getStatusText(data.status)}
      </div>
    </div>
  );
}

export default PathwayNode;

export const nodeTypes = {
  pathwayNode: PathwayNode,
};
