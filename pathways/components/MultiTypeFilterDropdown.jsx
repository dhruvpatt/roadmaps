import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function MultiTypeFilterDropdown({ filterTypes, setFilterTypes, filterOptions }) {
  const toggleType = (type) => {
    setFilterTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-48 ring-1 shadow-sm border border-gray-200 ring-gray-200 rounded-lg hover:ring-gray-300 focus:ring-blue-300 px-4 py-2 text-left">
          {filterTypes.length === 0
            ? "Filter by Type"
            : filterOptions
                .filter((opt) => filterTypes.includes(opt.value))
                .map((opt) => opt.label)
                .join(", ")}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-white shadow-sm border border-gray-200 rounded-lg p-1">
        {filterOptions.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={filterTypes.includes(option.value)}
            onCheckedChange={() => toggleType(option.value)}
            className="hover:bg-gray-100 cursor-pointer"
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
