import React from "react";
import PropTypes from "prop-types";
import { Calendar, Clock } from "lucide-react";

export default function AssignmentStreamCard({
  propPost,    // this is the assignment object
  formatDate,
  isTeacher,
  headerOnly = false
}) {
  const assignment = propPost;

  // Status logic
  const isOverdue = new Date(assignment.due_date) < new Date();
  const isDueSoon = (() => {
    const due = new Date(assignment.due_date);
    const now = new Date();
    const diffHours = (due - now) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 24;
  })();

  // HEADER: Only show badge if headerOnly
  if (headerOnly) {
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
  }

  // BODY: assignment details (title, description, due, points, etc)
  return (
    <div>
      {/* Title */}
      <h2 className="font-bold break-words flex items-center gap-2 text-xl text-gray-900 line-clamp-2">
        {assignment.title}
      </h2>
      {/* Description */}
      {assignment.description && (
        <div className="mb-1">
          <p className="text-gray-800 text-m break-words line-clamp-2">
            {assignment.description}
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-2">
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
  );
}

AssignmentStreamCard.propTypes = {
  propPost: PropTypes.object.isRequired,
  formatDate: PropTypes.func.isRequired,
  isTeacher: PropTypes.bool,
  headerOnly: PropTypes.bool,
};
