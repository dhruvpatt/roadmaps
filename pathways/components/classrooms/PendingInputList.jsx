// components/PendingInputList.js
import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { TYPE_META } from "./MaterialTypeMeta";

export function PendingInputList({
    type,
    entries,
    isTextarea = false,
    isFile = false,
    confirm,
    remove,
    handleChange,
    handleFileUpload,
    isEditing = false,
    editingValue,
    onEditChange,
    onEditConfirm,
    onEditCancel,
}) {
    const { icon: Icon, color, border } = TYPE_META[type];

    return (
        <div className="space-y-3 transition-all duration-300">
            {entries.map((entry, i) => (
                <div
                    key={entry.id || `edit-${i}`}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border shadow-sm ${color} ${border} transition-all duration-300 ease-in-out`}
                >
                    <Icon className="w-5 h-5 mt-1" />
                    {isFile ? (
                        <Input
                            type="file"
                            className="flex-1"
                            onChange={(e) => handleFileUpload?.(e, type, i)}
                            autoFocus
                        />
                    ) : isTextarea ? (
                        <Textarea
                            className="flex-1"
                            placeholder={`Enter ${type}...`}
                            value={isEditing ? editingValue : entry.value}
                            onChange={(e) =>
                                isEditing
                                    ? onEditChange?.(e.target.value)
                                    : handleChange(type, i, e.target.value)
                            }
                            autoFocus
                        />
                    ) : (
                        <Input
                            className="flex-1"
                            placeholder={`Enter ${type}...`}
                            value={isEditing ? editingValue : entry.value}
                            onChange={(e) =>
                                isEditing
                                    ? onEditChange?.(e.target.value)
                                    : handleChange(type, i, e.target.value)
                            }
                            autoFocus
                        />
                    )}
                    <div className={isTextarea ? ("flex flex-col gap-2 mt-1") : ""}>
                        {isEditing ? (
                            <>
                                <Button type="button" size="icon" variant="ok" onClick={onEditConfirm}>
                                    <Check className="w-4 h-4" />
                                </Button>
                                <Button type="button" size="icon" variant="cancel" onClick={onEditCancel}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </>
                        ) : (
                            <>
                                {confirm && !isFile && (
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ok"
                                        className="mr-2"
                                        onClick={() => confirm(type, i)}
                                    >
                                        <Check className="w-4 h-4" />
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="cancel"
                                    onClick={() => remove(entry.id || type, i)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
