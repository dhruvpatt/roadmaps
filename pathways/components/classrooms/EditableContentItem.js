import React, { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, X, Edit } from "lucide-react";

export function EditableContentItem({
    type,
    idx,
    item,
    icon: Icon,
    color,
    border,
    editingIdx,
    editingValue,
    setEditingValue,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onRemove,
    isTextarea = false,
    canEdit = true,
}) {
    const isEditing = editingIdx?.type === type;
    const inputRef = useRef(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            const el = inputRef.current;
            el.focus();
            el.setSelectionRange?.(el.value.length, el.value.length);
            el.selectionStart = el.selectionEnd = el.value.length;
        }
    }, [isEditing]);

    return (
        <div
            className={`mt-3 flex min-w-0 items-start gap-3 px-4 py-2 rounded-xl border shadow-sm ${color} ${border} transition-all duration-300 max-w-full w-full min-w-0 overflow-hidden`}
        >
            <Icon className="w-5 h-5 mt-1" />
            <div className="flex-1 min-w-0 overflow-hidden">
                {isEditing ? (
                    <>
                        {isTextarea ? (
                            <Textarea
                                ref={inputRef}
                                className="max-w-full whitespace-pre-wrap break-words"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                autoFocus
                            />
                        ) : (
                            <Input
                                ref={inputRef}
                                className="max-w-full whitespace-pre-wrap break-words"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                autoFocus
                            />
                        )}
                    </>
                ) : (
                    <span className="min-w-0 max-w-full whitespace-pre-wrap break-words block overflow-hidden max-h-[10vh]">
                        {item.text || item.link || item.filename}
                    </span>
                )}
            </div>
            {isEditing ? (
                <>
                    <Button variant="ok" size="icon" className="mr-1" onClick={() => onSaveEdit(type, editingIdx?.id)}>
                        <Check className="w-4 h-4" />
                    </Button>
                    <Button variant="cancel" size="icon" onClick={onCancelEdit}>
                        <X className="w-4 h-4" />
                    </Button>
                </>
            ) : (
                <>
                    {canEdit && (
                        <Button
                            variant="edit"
                            size="icon"
                            
                            onClick={() => onStartEdit(type, idx, item)}
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                    )}
                    <Button variant="cancel" size="icon" onClick={() => onRemove(type, item.id)}>
                        <X className="w-4 h-4" />
                    </Button>
                </>
            )}
        </div>
    );
}
