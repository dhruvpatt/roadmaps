// components/ui/SimpleAccordion.jsx

import React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

export default function SimpleAccordion({
  icon: Icon,
  title,
  children,
  count,
}) {
  const [toggled, setToggled] = React.useState(false);

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setToggled(prev => !prev)}
        className="flex items-center gap-2 font-semibold text-base text-gray-800 hover:underline"
      >
        {toggled ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        {Icon && <Icon className="w-5 h-5" />}
        {title}
        {typeof count === "number" && (
          <span className="ml-1 text-xs font-normal text-gray-400">({count})</span>
        )}
      </button>

      {(toggled === false) && (
        <div
          className="transition-all duration-300 ease-in-out overflow-hidden max-h-[1000px] opacity-100"
        >
          <div className="mt-2">{children}</div>
        </div>
      )}

    </div>
  );
}
