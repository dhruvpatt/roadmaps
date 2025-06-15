import React from "react";
import PropTypes from "prop-types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaginationControls({
  page,
  totalPages,
  onPageChange,
  className = "",
}) {
  return (
    <div
      className={`mt-6 pb-6 flex justify-center space-x-4 text-gray-800 ${className}`}
    >
      <Button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="w-10 h-10 flex items-center justify-center disabled:opacity-40"
        variant="outline"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="self-center">
        Page {page} of {totalPages}
      </span>
      <Button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="w-10 h-10 flex items-center justify-center disabled:opacity-40"
        variant="outline"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

PaginationControls.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};
