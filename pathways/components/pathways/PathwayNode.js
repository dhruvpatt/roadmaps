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

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer bg-white rounded-md shadow-md border border-gray-300 w-[200px] h-[120px] p-1 text-xs text-left hover:shadow-lg transition-all relative overflow-hidden"
    >
      {/* Source handles */}
      <Handle type="source" position="top" id="source-top" className="w-2 h-2 bg-amber-600 absolute left-1/2 -translate-x-1/2 -top-1" />
      <Handle type="source" position="bottom" id="source-bottom" className="w-2 h-2 bg-amber-600 absolute left-1/2 -translate-x-1/2 -bottom-1" />
      <Handle type="source" position="left" id="source-left" className="w-2 h-2 bg-amber-600 absolute top-1/2 -translate-y-1/2 -left-1" />
      <Handle type="source" position="right" id="source-right" className="w-2 h-2 bg-amber-600 absolute top-1/2 -translate-y-1/2 -right-1" />

      {/* Target handles */}
      <Handle type="target" position="top" id="target-top" className="w-2 h-2 bg-amber-600 absolute left-1/2 -translate-x-1/2 -top-1" />
      <Handle type="target" position="bottom" id="target-bottom" className="w-2 h-2 bg-amber-600 absolute left-1/2 -translate-x-1/2 -bottom-1" />
      <Handle type="target" position="left" id="target-left" className="w-2 h-2 bg-amber-600 absolute top-1/2 -translate-y-1/2 -left-1" />
      <Handle type="target" position="right" id="target-right" className="w-2 h-2 bg-amber-600 absolute top-1/2 -translate-y-1/2 -right-1" />


      {/* Content */}
      <div className="font-bold text-amber-800 truncate">{data.label}</div>

      {data.description && (
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
