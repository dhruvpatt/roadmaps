import { useRouter } from "next/navigation";
import { Megaphone, FileText } from "lucide-react";
import React from "react";

const postTypeStyles = {
    announcement: {
        icon: Megaphone,
        color: "bg-yellow-100 text-yellow-800",
        label: "Announcement",
    },
    material: {
        icon: FileText,
        color: "bg-blue-100 text-blue-800",
        label: "Material",
    },
};

const mockPosts = [
    {
        id: 1,
        type: "announcement",
        title: "Welcome to the new term!",
        content: "We're excited to start a new journey together. Be prepared!",
        date: "May 20, 2025",
    },
    {
        id: 2,
        type: "material",
        title: "Photosynthesis Notes (PDF)",
        content: "Detailed notes on the photosynthesis process for chapter 2.",
        date: "May 19, 2025",
    },
];

export default function ClassroomBoard({ posts = mockPosts }) {
    const router = useRouter();

    return (
        <div className="flex-1 p-6">

            <h1 className="text-black text-3xl md:text-4xl font-bold mb-2">
                Class Board
            </h1>
            <p className="text-gray-600 text-lg md:text-2xl mb-8">
                See what your teacher and classmates are saying!
            </p>
            {posts.map((post) => {
                const { icon: Icon, color, label } = postTypeStyles[post.type] || {};

                return (


                    <div
                        key={post.id}
                        className="p-4 rounded-lg border hover:shadow-md transition bg-white cursor-pointer mb-4"
                        onClick={() => router.push(`/board-detail/${post.id}`)}
                    >


                        <div className="flex items-start gap-4 ">
                            <div className={`p-2 rounded-full ${color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-md font-semibold text-gray-800">
                                        {post.title}
                                    </h3>
                                    <span className="text-xs text-gray-500">{post.date}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {post.content}
                                </p>
                                <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                                    {label}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
