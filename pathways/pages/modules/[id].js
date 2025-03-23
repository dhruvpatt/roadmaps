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

  if (!moduleData) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 text-sm">Preparing your module...</p>
        </div>
      </div>
    );
  }

  const { name, learning_goals, yt_video, contents = [] } = moduleData;

  const renderContentBlock = (block, i) => {
    const type = block.type?.toLowerCase();
    const content = block.content;

    if (["text", "content", "md", "markdown"].includes(type)) {
      return (
        <div key={i} className="prose max-w-none text-gray-800">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      );
    }

    if (type === "html") {
      return (
        <div
          key={i}
          className="prose max-w-none text-gray-800"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }

    if (type === "video") {
      return (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
        >
          {content.includes("youtube.com") || content.includes("youtu.be") ? (
            <div className="aspect-video w-[90%] max-w-2xl mx-auto rounded-lg overflow-hidden shadow">
              <iframe
                className="w-full h-full"
                src={
                  content.includes("watch?v=")
                    ? content.replace("watch?v=", "embed/")
                    : `https://www.youtube.com/embed/${
                        content.split("youtu.be/")[1]
                      }`
                }
                title="YouTube Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <video controls className="w-full rounded-lg shadow">
              <source src={content} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Main Content */}
      <div className="flex-grow w-full lg:w-10/12 p-6 overflow-y-auto">
        {/* Back Button */}
        <div
          className="flex items-center text-sm text-gray-500 cursor-pointer hover:underline mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to pathway
        </div>

        {/* Title + Button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-3">
          <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all">
            Mark as Complete
          </button>
        </div>

        {/* Subtitle */}
        {learning_goals?.length > 0 && (
          <p className="text-gray-600 text-base mb-6">{learning_goals[0]}</p>
        )}

        {/* Main YouTube Video */}
        {yt_video && (
          <div className="aspect-video w-[90%] max-w-2xl mx-auto rounded-lg overflow-hidden shadow mb-6">
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
        <div className="space-y-8">
          {contents.map((block, i) => renderContentBlock(block, i))}
        </div>
      </div>

      {/* Assistant Sidebar */}
      <div className="hidden lg:block w-full max-w-md min-w-[320px] p-6 border-l bg-white shadow-inner overflow-y-auto">
        <button
          onClick={() => setShowChat(!showChat)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:underline mb-4"
        >
          <MessageSquare size={16} /> {showChat ? "Hide" : "Show"} Assistant
        </button>

        {showChat && (
          <div className="border rounded-xl p-4 h-full">
            <ModuleChat id={id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ModulePage;
