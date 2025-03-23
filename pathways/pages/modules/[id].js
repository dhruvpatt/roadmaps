import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import ModuleChat from "@/components/modules/ModuleChat";
import backendUrl from "@/backendUrl";
import Sidebar from "../../components/sidebar";
import Navbar from "../../components/navbar";

const ModulePage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [moduleData, setModuleData] = useState(null);
  const [showChat, setShowChat] = useState(true);
  const [user, setUser] = useState({});
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchModule = async () => {
      try {
        const usr = JSON.parse(localStorage.getItem("user"));
        const res = await fetch(`${backendUrl}/api/get-module/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            module_id: id,
            user_id: usr.id,
          }),
        });

        const data = await res.json();
        setUser(usr);
        console.log("Module", data);
        setModuleData(data);
      } catch (error) {
        console.error("Error fetching module:", error);
      }
    };

    fetchModule();
  }, [id]);

  const markModuleComplete = async () => {
    try {
      const res = await fetch(`${backendUrl}/mark-module-completed/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          module_id: id,
          user_id: user.id
        }),
      });

      const ret = await res.json();
      console.log("Module marked as complete", ret);
      setModuleData(ret["module"]);


    } catch (error) {
      console.error("Failed to mark module as complete");
    }

  }

  const handleLectureCreate = async () => {
    setVideoLoading(true);
    try {
      // Step 1: Call backend to get LaTeX + script
      const res = await fetch(`${backendUrl}/api/create-lecture-materials/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ module_id: id }),
      });

      if (!res.ok) throw new Error("Failed to get lecture materials");

      const data = await res.json();
      const { latex, script } = data;

      // Step 2: Send to external video generation API
      const formData = new FormData();
      formData.append("module_id", id);
      formData.append("tex_string", latex);
      formData.append("slide_scripts", JSON.stringify(script));

      const videoRes = await fetch("https://lectureassistant-856935426396.us-central1.run.app/generate-video/", {
        method: "POST",
        body: formData,
      });

      if (!videoRes.ok) throw new Error("Failed to generate video");

      const videoData = await videoRes.json();
      setVideoUrl(videoData.video_url);

      await fetch(`${backendUrl}/api/update-module-video/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          module_id: id,
          video_url: videoData.video_url,
        }),
      });
    } catch (err) {
      console.error("Error creating lecture video:", err);
      alert("Failed to generate lecture video.");
    } finally {
      setVideoLoading(false);
    }
  };

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
                    : `https://www.youtube.com/embed/${content.split("youtu.be/")[1]
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
    <div className="flex flex-col bg-gray-100 min-h-screen w-full min-h-screen">
      <Navbar />
      <div className="flex flex-1 flex-col md:flex-row">
          <Sidebar className="hidden md:block w-64" />
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Main Content Area */}
      <div className="flex-grow w-full lg:w-10/12 p-6 overflow-y-auto bg-gray-100">
        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-l">

          {/* Back Button */}
          <div
            className="flex items-center text-sm text-gray-500 cursor-pointer hover:underline mb-4 cursor-pointer"
            onClick={() => router.push("/pathways")}
          >
            <ArrowLeft size={16} className="mr-1 text-amber-600" />
            <span className="text-amber-600 ">Back to pathway</span>
          </div>

          {/* Title and Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  className="bg-amber-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-700 transition-all cursor-pointer duration-200"
                  onClick={markModuleComplete}
                >
                  Mark as Complete
                </button>
                <button
                  onClick={() => router.push(`/quiz/${id}`)}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-all duration-200"
                >
                  Go to Quiz
                </button>
                <button
                  onClick={handleLectureCreate}
                  className="bg-amber-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-rose-700 transition-all duration-200"
                >
                  Create Lecture
                </button>
              </div>
            </div>
          </div>

          {/* Media Box - Put here outside the flex container */}
          {videoLoading && (
            <div className="w-full bg-gray-100 rounded-lg p-6 text-center text-gray-600 border border-dashed border-gray-400 animate-pulse mb-6">
              Generating video lecture...
            </div>
          )}

          {videoUrl && (
            <div className="w-full max-w-3xl mx-auto mb-6">
              <video controls className="w-full rounded-xl shadow-md">
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Learning Goal */}
          {learning_goals?.length > 0 && (
            <p className="text-gray-600 text-base mb-6">{learning_goals[0]}</p>
          )}

          {/* YouTube Video */}
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

          {/* Module Content */}
          <div className="space-y-8 mb-8">
            {contents.map((block, i) => renderContentBlock(block, i))}
          </div>
        </div>
      </div>

      {/* Assistant Sidebar */}
      <div className="hidden lg:block w-full max-w-md min-w-[320px] p-6 border-l bg-white shadow-inner overflow-y-auto">
        <button
          onClick={() => setShowChat(!showChat)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:underline mb-4 cursor-pointer"
        >
          <MessageSquare size={16} />
          {showChat ? "Hide" : "Show"} Assistant
        </button>

        {showChat && (
          <div className="border rounded-xl p-4 h-full">
            <ModuleChat id={id} />
          </div>
        )}
      </div>
    </div>
  </div>
</div>
  );
};

export default ModulePage;
