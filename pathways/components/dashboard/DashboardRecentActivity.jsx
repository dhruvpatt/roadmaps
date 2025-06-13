import { Clock } from "lucide-react";

export default function RecentActivity() {
  const activities = [
    {
      time: "2h ago",
      message: "Zoe submitted 'Photosynthesis Essay'",
    },
    {
      time: "4h ago",
      message: "Liam joined 'Biology 101'",
    },
    {
      time: "Yesterday",
      message: "New announcement posted to 'Math B'",
    },
  ];

  return (
    <div className="px-4 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Recent Activity</h2>
      <div className="bg-white border rounded-lg shadow-sm divide-y">
        {activities.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700 text-sm">{item.message}</span>
            </div>
            <span className="text-xs text-gray-400">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
