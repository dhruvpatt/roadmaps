// components/ContentSection.jsx

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Pencil } from "lucide-react";
import SimpleAccordion from "@components/SimpleAccordian";

export function ContentSection({
  sectionKey,
  label,
  icon,
  items,
  collapsed,
  toggleSection,
  typeMeta,
  editingIdx,
  editingValue,
  startEdit,
  saveEdit,
  setEditingIdx,
  setEditingValue,
  removeContent,
}) {
  const renderEditInput = (item) => {
    if (item.type === "link") {
      return (
        <Input
          className="flex-1 border-none bg-transparent focus:ring-0 text-base"
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          autoFocus
        />
      );
    }

    return (
      <Textarea
        className="flex-1 border-none bg-transparent focus:ring-0 resize-y text-base min-h-[45px]"
        value={editingValue}
        onChange={(e) => setEditingValue(e.target.value)}
        autoFocus
      />
    );
  };

  if (!items.length) return null;

  return (
    <SimpleAccordion
      title={label}
      icon={icon}
      isCollapsed={collapsed[sectionKey]}
      onToggle={() => toggleSection(sectionKey)}
      count={items.length}
    >
      <div className="space-y-2">
        {items.map((item, idx) => {
          const isEditing = editingIdx === idx;
          const meta = typeMeta[item.type];

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 px-4 py-2 rounded-xl shadow-sm border ${meta?.color}`}
            >
              {meta?.icon && <meta.icon className="w-5 h-5" />}
              <div className="flex-1 truncate">
                {item.type === "file" ? (
                  <span className="truncate">{item.filename}</span>
                ) : isEditing ? (
                  renderEditInput(item)
                ) : item.type === "link" ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline break-all"
                  >
                    {item.link}
                  </a>
                ) : (
                  <span>{item.text}</span>
                )}
              </div>

              {/* Editable types (non-files) */}
              {item.type !== "file" && (
                isEditing ? (
                  <>
                    <Button variant="ok" size="icon" onClick={() => saveEdit(idx)}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="cancel"
                      size="icon"
                      onClick={() => {
                        setEditingIdx(null);
                        setEditingValue("");
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <Button variant="edit" size="icon" onClick={() => startEdit(idx)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                )
              )}
              <Button variant="cancel" size="icon" onClick={() => removeContent(idx)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </SimpleAccordion>
  );
}
