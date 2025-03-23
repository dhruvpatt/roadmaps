// // pages/module/[id].js

// import { useRouter } from "next/router";
// import { useEffect, useState } from "react";
// import { ArrowLeft, MessageSquare } from "lucide-react";
// import ReactMarkdown from "react-markdown";
// import ModuleChat from "@/components/modules/ModuleChat";
// import backendUrl from "@/backendUrl";

// const ModulePage = () => {
//     const router = useRouter();
//     const { id } = router.query;

//     const [moduleData, setModuleData] = useState(null);
//     const [showChat, setShowChat] = useState(true);

//     useEffect(() => {
//         if (!id) return;

//         const fetchModule = async () => {
//             try {
//                 const user = JSON.parse(localStorage.getItem("user"));
//                 const res = await fetch(`${backendUrl}/api/get-module/`, {
//                     method: "POST",
//                     headers: {
//                         "Content-Type": "application/json",
//                     },
//                     body: JSON.stringify({
//                         module_id: id,
//                         user_id: user.id,
//                     }),
//                 });

//                 const data = await res.json();
//                 console.log("Module", data);
//                 setModuleData(data);
//             } catch (error) {
//                 console.error("Error fetching module:", error);
//             }
//         };

//         fetchModule();
//     }, [id]);

//     if (!moduleData) return <div className="p-8">Loading module...</div>;

//     const {
//         name,
//         learning_goals,
//         yt_video,
//         contents = [],
//     } = moduleData;

//     const renderContentBlock = (block, i) => {
//         const type = block.type?.toLowerCase();
//         const content = block.content;

//         // Markdown/Text/Content
//         if (["text", "content", "md", "markdown"].includes(type)) {
//             return (
//                 <div key={i} className="prose max-w-none">
//                     <ReactMarkdown>{content}</ReactMarkdown>
//                 </div>
//             );
//         }

//         // Raw HTML
//         if (type === "html") {
//             return (
//                 <div
//                     key={i}
//                     className="prose max-w-none"
//                     dangerouslySetInnerHTML={{ __html: content }}
//                 />
//             );
//         }

//         // Video (YouTube or MP4)
//         if (type === "video") {
//             const isYoutube = content.includes("youtube.com") || content.includes("youtu.be");

//             if (isYoutube) {
//                 let embedUrl = content;

//                 if (embedUrl.includes("watch?v=")) {
//                     embedUrl = embedUrl.replace("watch?v=", "embed/");
//                 } else if (embedUrl.includes("youtu.be")) {
//                     const videoId = embedUrl.split("youtu.be/")[1];
//                     embedUrl = `https://www.youtube.com/embed/${videoId}`;
//                 }

//                 return (
//                     <div key={i} className="aspect-video w-full rounded-lg overflow-hidden shadow">
//                         <iframe
//                             className="w-full h-full"
//                             src={embedUrl}
//                             title="YouTube Video"
//                             frameBorder="0"
//                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//                             allowFullScreen
//                         />
//                     </div>
//                 );
//             }

//             // MP4 or fallback
//             return (
//                 <video key={i} controls className="w-full rounded-lg shadow">
//                     <source src={content} type="video/mp4" />
//                     Your browser does not support the video tag.
//                 </video>
//             );
//         }

//         return null;
//     };

//     return (
//         <div className="min-h-screen p-6 bg-white text-gray-800">
//             {/* Back Button */}
//             <div
//                 className="flex items-center text-sm text-gray-500 cursor-pointer hover:underline mb-4"
//                 onClick={() => router.back()}
//             >
//                 <ArrowLeft size={16} className="mr-1" />
//                 Back to pathway
//             </div>

//             {/* Header */}
//             <h1 className="text-2xl font-bold text-gray-900 mb-1">{name}</h1>
//             {learning_goals?.length > 0 && (
//                 <p className="text-gray-600 mb-6">{learning_goals[0]}</p>
//             )}

//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 {/* Left Column: Video & Content */}
//                 <div className="lg:col-span-2 space-y-6">
//                     {/* Main YouTube Video if exists */}
//                     {yt_video && (
//                         <div className="aspect-video w-full rounded-lg overflow-hidden shadow">
//                             <iframe
//                                 className="w-full h-full"
//                                 src={yt_video.replace("watch?v=", "embed/")}
//                                 title="Module video"
//                                 frameBorder="0"
//                                 allowFullScreen
//                             />
//                         </div>
//                     )}

//                     {/* Content Blocks */}
//                     {contents.map((block, i) => renderContentBlock(block, i))}

//                     {/* Completion Button */}
//                     <button className="mt-6 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-900">
//                         Mark as Complete
//                     </button>
//                 </div>

//                 {/* Right Column: Chat Assistant */}
//                 <div className="relative">
//                     <button
//                         onClick={() => setShowChat(!showChat)}
//                         className="absolute -top-5 right-0 flex items-center gap-1 text-sm text-blue-600 hover:underline"
//                     >
//                         <MessageSquare size={16} /> {showChat ? "Hide" : "Show"} Assistant
//                     </button>

//                     {showChat && (
//                         <div className="border rounded-xl p-4 mt-6 lg:mt-0 h-full">
//                             <ModuleChat moduleId={id} />
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ModulePage;
// pages/module/[id].js

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import ModuleChat from "@/components/modules/ModuleChat";
import backendUrl from "@/backendUrl";

const ModulePage = () => {
    const router = useRouter();
    const { id } = router.query;

    const [moduleData, setModuleData] = useState(null);
    const [showChat, setShowChat] = useState(true);

    useEffect(() => {
        if (!id) return;

        const fetchModule = async () => {
            try {
                const user = JSON.parse(localStorage.getItem("user"));
                const res = await fetch(`${backendUrl}/api/get-module/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        module_id: id,
                        user_id: user.id,
                    }),
                });

                const data = await res.json();
                console.log("Module", data);
                setModuleData(data);
            } catch (error) {
                console.error("Error fetching module:", error);
            }
        };

        fetchModule();
    }, [id]);

    if (!moduleData) return <div className="p-8">Loading module...</div>;

    const {
        name,
        learning_goals,
        yt_video,
        contents = [],
    } = moduleData;

    const renderContentBlock = (block, i) => {
        const type = block.type?.toLowerCase();
        const content = block.content;

        // Markdown/Text/Content
        if (["text", "content", "md", "markdown"].includes(type)) {
            return (
                <div key={i} className="prose max-w-none">
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>
            );
        }

        // Raw HTML with JS execution
        if (type === "html") {
            return (
                <div
                    key={i}
                    className="prose max-w-none"
                    ref={(el) => {
                        if (el) {
                            el.innerHTML = content;

                            const scripts = el.getElementsByTagName("script");
                            for (let script of scripts) {
                                const newScript = document.createElement("script");
                                if (script.src) {
                                    newScript.src = script.src;
                                } else {
                                    newScript.textContent = script.textContent;
                                }
                                document.body.appendChild(newScript);
                            }
                        }
                    }}
                />
            );
        }

        // Video (YouTube or MP4)
        if (type === "video") {
            const isYoutube = content.includes("youtube.com") || content.includes("youtu.be");

            if (isYoutube) {
                let embedUrl = content;

                if (embedUrl.includes("watch?v=")) {
                    embedUrl = embedUrl.replace("watch?v=", "embed/");
                } else if (embedUrl.includes("youtu.be")) {
                    const videoId = embedUrl.split("youtu.be/")[1];
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                }

                return (
                    <div key={i} className="aspect-video w-full rounded-lg overflow-hidden shadow">
                        <iframe
                            className="w-full h-full"
                            src={embedUrl}
                            title="YouTube Video"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                );
            }

            // MP4 or fallback
            return (
                <video key={i} controls className="w-full rounded-lg shadow">
                    <source src={content} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            );
        }

        return null;
    };

    return (
        <div className="min-h-screen p-6 bg-white text-gray-800">
            {/* Back Button */}
            <div
                className="flex items-center text-sm text-gray-500 cursor-pointer hover:underline mb-4"
                onClick={() => router.back()}
            >
                <ArrowLeft size={16} className="mr-1" />
                Back to pathway
            </div>

            {/* Header */}
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{name}</h1>
            {learning_goals?.length > 0 && (
                <p className="text-gray-600 mb-6">{learning_goals[0]}</p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Video & Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Main YouTube Video if exists */}
                    {yt_video && (
                        <div className="aspect-video w-full rounded-lg overflow-hidden shadow">
                            <iframe
                                className="w-full h-full"
                                src={yt_video.replace("watch?v=", "embed/")}
                                title="Module video"
                                frameBorder="0"
                                allowFullScreen
                            />
                        </div>
                    )}

                    {/* Content Blocks */}
                    {contents.map((block, i) => renderContentBlock(block, i))}

                    {/* Completion Button */}
                    <button className="mt-6 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-900">
                        Mark as Complete
                    </button>
                </div>

                {/* Right Column: Chat Assistant */}
                <div className="relative">
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className="absolute -top-5 right-0 flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                        <MessageSquare size={16} /> {showChat ? "Hide" : "Show"} Assistant
                    </button>

                    {showChat && (
                        <div className="border rounded-xl p-4 mt-6 lg:mt-0 h-full">
                            <ModuleChat id={id} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModulePage;
