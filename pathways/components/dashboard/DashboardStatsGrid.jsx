import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { Info } from "lucide-react";

const chunkArray = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

export default function StatGrid({ stats, openModal }) {
  const scrollRef = useRef(null);
  const scrollAmount = 500;

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * scrollAmount, behavior: "smooth" });
    }
  };

  const groups = chunkArray(stats, 4); // 2x2 grid per scroll page

  return (
    <div className="relative mr-3">
      <button
        onClick={() => scroll(-1)}
        className="hidden md:flex items-center justify-center absolute -left-6 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow p-1 hover:bg-gray-100"
      >
        <ChevronLeft className="text-gray-600"/>
      </button>

      <div ref={scrollRef} className="overflow-x-auto scroll-smooth">
        <div className="flex gap-6">
          {groups.map((group, index) => (
            <div
              key={index}
              className="grid grid-cols-2 gap-4 min-w-[460px] py-2"
            >
              {group.map((stat) => (
                <div
                  key={stat.key}
                  onClick={() => openModal(stat.key)}
                  className="bg-white rounded-xl shadow p-4 relative cursor-pointer"
                >
                  <div className={`p-3 rounded-full ${stat.color} inline-block mb-3`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700 font-medium">
                      {stat.label}
                    </p>
                    <Info className="w-4 h-4 text-gray-400 ml-2" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => scroll(1)}
        className="hidden md:flex items-center justify-center absolute -right-6 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow p-1 hover:bg-gray-100"
      >
        <ChevronRight className="text-gray-600"/>
      </button>
    </div>
  );
}
