// pages/module/[id].js
import { useRouter } from "next/router";
import mockRoadmap from "@/data/mockRoadmap";
import moduleContent from "@/data/mockModuleContent";
import ModuleChat from "@/components/modules/ModuleChat";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";

const findModuleById = (id) => {
    for (const chapter of mockRoadmap.chapters) {
        for (const mod of chapter.modules) {
            if (mod.id === id) return { ...mod, chapter };
        }
    }
    return null;
};

const ModulePage = () => {
    const router = useRouter();
    const { id } = router.query;
    const [showChat, setShowChat] = useState(true);

    const module = useMemo(() => findModuleById(id), [id]);
    const contentBlocks = moduleContent[id] || [];

    if (!module) return <div className="p-8">Module not found</div>;

    return (
        <div className="min-h-screen p-6 bg-white text-gray-800">
            {/* Back link */}
            <div
                className="flex items-center text-sm text-gray-500 cursor-pointer hover:underline mb-4"
                onClick={() => router.push("/roadmap-preview")}
            >
                <ArrowLeft size={16} className="mr-1" />
                Back to pathway
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1">{module.name}</h1>
            <p className="text-gray-600 mb-6">{module.learningGoals?.[0]}</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Video + Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Video */}
                    <div className="aspect-video w-full rounded-lg overflow-hidden shadow">
                        <iframe
                            className="w-full h-full"
                            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                            title="Module video"
                            frameBorder="0"
                            allowFullScreen
                        />
                    </div>

                    {/* Dynamic Content */}
                    <div className="space-y-6">
                        {contentBlocks.map((block, i) => {
                            if (block.type === "text") {
                                return <p key={i} className="text-gray-800 leading-relaxed">{block.content}</p>;
                            } else if (block.type === "md") {
                                return <div key={i} className="prose max-w-none">
                                    <ReactMarkdown>{block.content}</ReactMarkdown>;
                                </div>
                            } else if (block.type === "html") {
                                return (
                                    <div
                                        key={i}
                                        className="prose max-w-none"
                                        dangerouslySetInnerHTML={{ __html: block.content }}
                                    />
                                );
                            }
                            return null;
                        })}
                    </div>

                    <button className="mt-6 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-900">
                        Mark as Complete
                    </button>
                </div>

                {/* Right: AI Chat Assistant */}
                <div className="relative">
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className="absolute -top-5 right-0 flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                        <MessageSquare size={16} /> {showChat ? "Hide" : "Show"} Assistant
                    </button>

                    {showChat && (
                        <div className="border rounded-xl p-4 mt-6 lg:mt-0 h-full">
                            <ModuleChat />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModulePage;
