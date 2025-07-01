import { Plus, Megaphone, FileText } from "lucide-react";

export default function QuickActions({ user, onCreateClassroomClick }) {
  if (user.role !== "teacher" || user.role !== "org_admin") return null;

  const actions = [
    {
      label: "Create Assignment",
      icon: FileText,
      onClick: () => alert("Navigate to Create Assignment"),
    },
    {
      label: "Post Announcement",
      icon: Megaphone,
      onClick: () => alert("Navigate to Post Announcement"),
    },
    {
      label: "Add Classroom",
      icon: Plus,
      onClick: onCreateClassroomClick, // 💡 Connect it here
    },
  ];

  return (
    <div className="mt-4 mb-6 px-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Quick Actions</h2>
      <div className="flex space-x-3 overflow-x-auto">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className="flex items-center space-x-2 bg-white border rounded-lg px-4 py-2 shadow hover:bg-gray-50"
          >
            <action.icon className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-gray-700">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

