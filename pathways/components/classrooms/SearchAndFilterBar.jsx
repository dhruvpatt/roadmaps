import React from "react";
import PropTypes from "prop-types";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Search } from "lucide-react";

export default function SearchAndFilterBar({
  searchQuery,
  setSearchQuery,
  filterTypes = [],
  setFilterTypes,
  filterOptions,
  placeholder = "Search...",
}) {
  // Helper to toggle a filter type
  const toggleType = (type) => {
    setFilterTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // For button label: list selected labels, or "Filter by Type"
  const selectedLabel =
    filterTypes?.length === 0
      ? "Filter by Type"
      : filterOptions
        .filter((opt) => filterTypes.includes(opt.value))
        .map((opt) => opt.label)
        .join(", ");

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
      <div className="flex items-center space-x-2 w-full sm:w-auto relative">
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-100 ring-1 shadow-sm border border-gray-200 ring-gray-200 rounded-lg focus:ring-blue-300 pr-10"
        />
        <Search className="absolute right-3 text-gray-400 w-5 h-5 pointer-events-none" />
      </div>
      <div className="flex items-center space-x-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-50 ring-1 shadow-sm border border-gray-200 ring-gray-200 rounded-lg hover:ring-gray-300 hover:bg-gray-50 focus:ring-blue-300 px-4 py-2 text-left"
              type="button"
            >
              {selectedLabel}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-white shadow-sm border border-gray-200 rounded-lg p-1">
            {filterOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={filterTypes.includes(option.value)}
                onSelect={e => e.preventDefault()}
                onCheckedChange={() => toggleType(option.value)}
                className="hover:bg-gray-100 cursor-pointer"
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

SearchAndFilterBar.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
  filterTypes: PropTypes.arrayOf(PropTypes.string).isRequired,      // <-- array
  setFilterTypes: PropTypes.func.isRequired,                        // <-- array mutator
  filterOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  placeholder: PropTypes.string,
};
