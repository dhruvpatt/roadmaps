// components/PostCreationDialog.jsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ClipboardList,
  FlaskConical,
} from "lucide-react";

const CREATION_TYPES = [
  {
    key: "material",
    label: "Material",
    description: "Post files, links, or announcements.",
    icon: <FileText className="w-7 h-7 text-blue-600" />,
    bg: "bg-blue-50",
    hover: "hover:border-blue-400",
  },
  {
    key: "assignment",
    label: "Assignment",
    description: "Create an assignment for your students.",
    icon: <ClipboardList className="w-7 h-7 text-amber-600" />,
    bg: "bg-amber-50",
    hover: "hover:border-amber-300",
  },
  {
    key: "test",
    label: "Test",
    description: "Schedule a test or quiz.",
    icon: <FlaskConical className="w-7 h-7 text-green-600" />,
    bg: "bg-green-50",
    hover: "hover:border-green-300",
  },
];

export default function PostCreationDialog({ open, onClose, onSelectType }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl px-6 pt-3">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-2">Create Something New</DialogTitle>
          <div className="text-gray-500 text-sm mb-4">What would you like to add to your classroom?</div>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mx-2">
          {CREATION_TYPES.map((type) => (
            <button
              key={type.key}
              type="button"
              onClick={() => onSelectType(type.key)}
              className={`
                group flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 transition-all
                shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400/50
                ${type.bg} ${type.hover}
                hover:shadow-md active:scale-95
              `}
              tabIndex={0}
            >
              <div className="mb-2">{type.icon}</div>
              <div className="font-semibold text-base text-gray-900 group-hover:text-orange-700">{type.label}</div>
              <div className="text-xs text-gray-500 text-center mt-1">{type.description}</div>
            </button>
          ))}
        </div>
        <DialogFooter className="flex-row flex justify-end items-center pt-5 gap-3">
          <DialogClose asChild>
            <Button variant="cancel" className="w-full">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
