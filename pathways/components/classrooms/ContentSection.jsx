import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Pencil, Undo } from "lucide-react";
import SimpleAccordion from "@components/SimpleAccordian";

export function ContentSection({
  sectionKey,
  label,
  icon,
  items,
  typeMeta,
  editingIdx,
  editingValue,
  startEdit,
  saveEdit,
  setEditingIdx,
  setEditingValue,
  removeContent,
}) {
  if (!items.length) return null;

  const renderEditInput = (item) =>
    item.type === "link" ? (
      <Input
        className="flex-1 min-w-0 border-none bg-transparent text-base "
        value={editingValue}
        onChange={(e) => setEditingValue(e.target.value)}
      />
    ) : (
      <Textarea
        className="flex-1 min-w-0 border-none bg-transparent resize-y text-base min-h-[45px]"
        value={editingValue}
        onChange={(e) => setEditingValue(e.target.value)}
      />
    );

  return (
    <SimpleAccordion title={label} icon={icon} count={items.length}>
      <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
        {items.map((item) => {
          const isEditing =
            editingIdx?.type === item.type && editingIdx?.id === item.id;

          const meta = typeMeta[item.type];

          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-4 py-2 rounded-xl shadow-sm border ${meta?.color} min-h-[50px]`}
            >
              {meta?.icon && <meta.icon className="w-5 h-5" />}
              <div className="flex-1 min-w-0">
                {item.type === "file" ? (
                  <span className="max-w-full whitespace-pre-wrap break-words">{item.filename}</span>
                ) : isEditing ? (
                  renderEditInput(item)
                ) : item.type === "link" ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline break-all max-w-full whitespace-pre-wrap break-words"
                  >
                    {item.link}
                  </a>
                ) : (
                  <span>{item.text}</span>
                )}
              </div>

              {item.type !== "file" && isEditing ? (
                <>
                  <Button
                    variant="ok"
                    size="icon"
                    onClick={() => saveEdit(item.type, item.id)}
                  >
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
                    <Undo className="w-4 h-4" />
                  </Button>
                </>
              ) : item.type !== "file" ? (
                <>
                  <Button
                    variant="edit"
                    size="icon"
                    onClick={() => startEdit(item.type, item.id, item)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="cancel"
                    size="icon"
                    onClick={() => removeContent(item.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="cancel"
                  size="icon"
                  onClick={() => removeContent(item.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </SimpleAccordion>
  );
}
