// StreamCard.jsx
import React from "react";
import PropTypes from "prop-types";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import CardDropdownMenu from "@components/CardDropdownMenu";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

import MaterialStreamCard from "./MaterialStreamCard";
import AssignmentStreamCard from "./AssignmentStreamCard";

export default function StreamCard(props) {
    const { propPost, user, formatDate, isTeacher, onEdit, onDelete, onClick } = props;

    // Which content renderer to use?
    let ContentComponent;
    if (propPost.postType === "material") ContentComponent = MaterialStreamCard;
    else if (propPost.postType === "assignment") ContentComponent = AssignmentStreamCard;
    // ...add more as needed

    if (!ContentComponent)
        return <div>Unsupported post type: {propPost.postType}</div>;

    // This is the header minus badges (badges handled by each subcard)
    return (
        <Card
            className="rounded-md border shadow-sm cursor-pointer transition-colors hover:bg-gray-50"
            onClick={() => onClick?.(propPost)}
        >
            <CardHeader
                className={cn(
                    "relative p-0 space-y-2 px-3 py-2 mb-4",
                    propPost.postType === "material"
                        ? "bg-amber-50"
                        : "bg-blue-50"
                )}
            >

                <div className="flex items-center justify-between text-sm">
                    {/* Left side: info, avatar, badges, etc */}
                    <div className="flex flex-wrap items-center gap-3 min-w-0">
                        <span className="text-gray-800 text-m font-bold">
                            {String(propPost.postType).charAt(0).toUpperCase() + String(propPost.postType).slice(1)}
                        </span>
                        <span className="text-gray-400">•</span>
                        <Avatar className="h-6 w-6 ring-1 ring-gray-300">
                            <AvatarImage />
                            <AvatarFallback>
                                {propPost.created_by?.first_name?.charAt(0) ?? "?"}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-gray-800 font-medium">
                            {propPost.created_by
                                ? `${propPost.created_by.first_name} ${propPost.created_by.last_name ?? ""}`
                                : "Unknown"}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-800 text-xs">
                            {formatDate(propPost.created_at || propPost.timestamp)}
                        </span>
                        <span className="text-gray-400">•</span>
                        <ContentComponent {...props} headerOnly />
                    </div>
                    {/* Right side: 3 dots menu */}
                    {isTeacher && (
                        <CardDropdownMenu
                            trigger={
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-500 hover:text-gray-700"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <span className="sr-only">More</span>
                                    <MoreHorizontal className="w-5 h-5" />
                                </Button>
                            }
                            items={[
                                { label: "Edit", onClick: () => onEdit?.(propPost) },
                                {
                                    label: "Delete",
                                    onClick: () => onDelete?.(propPost.id),
                                    className: "text-red-600",
                                },
                            ]}
                            align="right"
                        />
                    )}
                </div>

                {/* Each card can inject badges and additional header details here */}
            </CardHeader>
            <CardContent className="pt-0">
                <ContentComponent {...props} />
            </CardContent>
        </Card>
    );
}

StreamCard.propTypes = {
    propPost: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    formatDate: PropTypes.func.isRequired,
    isTeacher: PropTypes.bool,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    onClick: PropTypes.func,
};
