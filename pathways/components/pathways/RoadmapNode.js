import { Handle } from "reactflow";
import { useRouter } from "next/router";


function RoadmapNode({ data }) {
  const router = useRouter();
  
  
  const handleClick = () => {
    console.log(data)
    console.log("Clicked:", data);

    if (data.unlocked){
      router.push(`/modules/${data.id}`)
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
      className="cursor-pointer bg-white rounded-md shadow-md border border-gray-300 px-4 py-2 text-xs text-left max-w-[180px] hover:shadow-lg transition-all relative"
    >
      <Handle type="target" position="top" className="w-2 h-2 bg-amber-600" />

      <div className="font-bold text-amber-800">{data.label}</div>

      {data.description && (
        <p className="text-gray-600 mt-1">{data.description}</p>
      )}

      <div className="mt-2 text-[11px] text-gray-700 font-medium">
        {getStatusText(data.status)}
      </div>

      <Handle type="source" position="bottom" className="w-2 h-2 bg-amber-600" />
    </div>
  );
}

export default RoadmapNode;

export const nodeTypes = {
  roadmapNode: RoadmapNode,
};
