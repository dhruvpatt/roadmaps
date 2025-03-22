import { Handle } from "reactflow";

function RoadmapNode({ data }) {
  const handleClick = () => {
    console.log("Clicked:", data.label);
  };

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer bg-white rounded-md shadow-md border border-gray-300 px-4 py-2 text-xs text-left max-w-[180px] hover:shadow-lg transition-all relative"
    >
      <Handle type="target" position="top" className="w-2 h-2 bg-amber-600" />
      
      <div className="font-bold text-amber-800">{data.label}</div>
      {data.description && <p className="text-gray-600 mt-1">{data.description}</p>}

      <div className="w-full mt-2 bg-gray-200 rounded-full h-2">
        <div
          className="bg-amber-500 h-2 rounded-full"
          style={{ width: `${data.status ?? 0}%` }}
        />
      </div>

      <div className="mt-1 text-[10px] text-gray-500">
        {data.status ?? 0}% complete
      </div>

      <Handle type="source" position="bottom" className="w-2 h-2 bg-amber-600" />
    </div>
  );
}

export default RoadmapNode;

// ✅ This is the part that React Flow is expecting
export const nodeTypes = {
  roadmapNode: RoadmapNode
};
