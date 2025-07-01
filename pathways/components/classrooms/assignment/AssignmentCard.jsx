// components/AssignmentCard.jsx

import React from "react";
import PropTypes from "prop-types";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AssignmentCard({
  assignment,
  onClick,
  onEdit,
  onDelete,
  formatDate,
  isTeacher,
}) {
  // Status logic (you might want to move this to a util if used elsewhere)
  const isOverdue = new Date(assignment.due_date) < new Date();
  const isDueSoon = (() => {
    const due = new Date(assignment.due_date);
    const now = new Date();
    const diffHours = (due - now) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 24;
  })();

  const getStatusBadge = () => {
    if (isOverdue)
      return (
        <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
          Overdue
        </span>
      );
    if (isDueSoon)
      return (
        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-600 rounded-full">
          Due Soon
        </span>
      );
    return (
      <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">
        Active
      </span>
    );
  };

  return (
    <Card
      onClick={onClick}
      className="bg-white rounded-2xl shadow hover:shadow-lg transform hover:-translate-y-1 transition p-6 cursor-pointer group"
      tabIndex={0}
      role="button"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 pr-2 group-hover:text-blue-700">
            {assignment.title}
          </h3>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {isTeacher && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={e => e.stopPropagation()}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      onEdit && onEdit(assignment);
                    }}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      onDelete && onDelete(assignment.id);
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 line-clamp-3">{assignment.description}</p>
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Due {formatDate(assignment.due_date, true)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{assignment.points_possible} pts</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-3">
          <span className="capitalize">{assignment.assignment_type}</span>
          {isTeacher && <span>{assignment.submission_count || 0} submissions</span>}
        </div>
      </div>
    </Card>
  );
}

AssignmentCard.propTypes = {
  assignment: PropTypes.object.isRequired,
  onClick: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  formatDate: PropTypes.func,
  isTeacher: PropTypes.bool,
};
