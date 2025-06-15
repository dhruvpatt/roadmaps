import React from "react";
import PropTypes from "prop-types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

export default function SearchAndFilterBar({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterOptions,
  placeholder = "Search...",
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
      <div className="flex items-center space-x-2 w-full sm:w-auto relative">
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64 ring-1 ring-gray-200 rounded-lg focus:ring-blue-300 pr-10"
        />
        <Search className="absolute right-3 text-gray-400 w-5 h-5 pointer-events-none" />
      </div>
      <div className="flex items-center space-x-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48 ring-1 ring-gray-200 rounded-lg hover:ring-gray-300 focus:ring-blue-300">
            <SelectValue placeholder="No Filter" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <SelectItem
              value="all"
              className="hover:bg-gray-100 cursor-pointer"
            >
              No Filter
            </SelectItem>
            {filterOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="hover:bg-gray-100 cursor-pointer"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

SearchAndFilterBar.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
  filterType: PropTypes.string.isRequired,
  setFilterType: PropTypes.func.isRequired,
  filterOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  placeholder: PropTypes.string,
};
