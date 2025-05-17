import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function ProfileSection({ title, children }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white shadow-md rounded-lg mb-6 overflow-hidden transition-all duration-300">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex justify-between items-center p-4 text-left text-lg font-semibold text-amber-700 hover:bg-amber-50 transition"
      >
        <span>{title}</span>
        {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          expanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
