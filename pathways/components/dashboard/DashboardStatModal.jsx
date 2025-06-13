import React from "react";
import { X, Info } from "lucide-react";

const StatModal = ({ title, isOpen, onClose, icon: Icon }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title with icon */}
        <div className="flex items-center mb-4">
          {Icon && (
            <div className="p-2 bg-amber-100 rounded-full mr-3">
              <Icon className="w-5 h-5 text-amber-700" />
            </div>
          )}
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto text-gray-800">
          {/* Children go here */}
        </div>
      </div>
    </div>
  );
};

export default StatModal;
