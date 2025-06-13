import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import { useState } from "react";

export default function DeadlineCalendar({ deadlines }) {
  const [value, setValue] = useState(new Date());

  const tileContent = ({ date }) => {
    const found = deadlines.find((d) =>
      format(d.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
    return found ? (
      <div className="mt-1 text-xs text-red-500 font-medium">•</div>
    ) : null;
  };

  return (
    <Calendar
      value={value}
      onChange={setValue}
      tileContent={tileContent}
      className="w-full border-none"
    />
  );
}
