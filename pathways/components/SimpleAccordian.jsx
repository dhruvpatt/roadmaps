import React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Resizable } from "./animations/Resizeable";

export default function SimpleAccordion({
  icon: Icon,
  title,
  children,
  count,
  fade = true,
  duration = 0.3,
}) {
  const [toggled, setToggled] = React.useState(false);

  return (
    <div>
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

      <Resizable show={!toggled} fade={fade} duration={duration}>
        <div className="mt-2">{children}</div>
      </Resizable>
    </div>
  );
}
