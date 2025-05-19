import { useState, useEffect } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  MessageSquare,
  PenTool,
} from "lucide-react";
import { Button } from "../../components/modules/buttons";
import backendUrl from "../../backendUrl";
import { Card } from "../../components/modules/card";
import { ModuleContentRenderer } from "../../components/modules/ModuleContentRender";
import "katex/dist/katex.min.css";
import { useRouter } from "next/router";
import ModuleChat from "../../components/modules/ModuleChat";

export default function ModulePage() {
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
          user_id: user.id,
        }),
      });

      const ret = await res.json();
      console.log("Module marked as complete", ret);
      setModuleData(ret["module"]);
    } catch (error) {
      console.error("Failed to mark module as complete");
    }
  };

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

      console.log(latex, script);

      // Step 2: Send to external video generation API
      const formData = new FormData();
      formData.append("module_id", id);
      formData.append("tex_string", latex);
      formData.append("slide_scripts", JSON.stringify(script));

      const videoRes = await fetch(
        "https://lectureassistant-856935426396.us-central1.run.app/generate-video/",
        {
          method: "POST",
          body: formData,
        }
      );

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
      return;
    } finally {
      setVideoLoading(false);
    }
  };

  if (!moduleData) {
    return (
      <div className="flex h-screen items-center justify-center bg-amber-100">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 text-sm">Preparing your module...</p>
        </div>
      </div>
    );
  }
  console.log("MODULE DATA:", moduleData)
  const { name, learning_goals, yt_video, contents = [] } = moduleData;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          showChat ? "lg:pr-[320px]" : ""
        }`}
      >
        <div className="p-6 overflow-y-auto">
          <Card className="bg-white rounded-xl shadow-lg p-8 w-full">
            {/* Header: Back & Toggle Chat */}
            <div className="flex justify-between items-center mb-4">
              <button
                className="flex items-center text-sm text-gray-500 cursor-pointer hover:underline"
                onClick={() => router.back()}
              >
                <ArrowLeft size={16} className="mr-1 text-amber-600" />
                <span className="text-amber-600">Back to pathway</span>
              </button>

              {!showChat && (
                <Button
                  variant="ghost"
                  onClick={() => setShowChat(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Show Assistant
                </Button>
              )}
            </div>

            {/* Module Header with Progress Bar */}
            <div className="mb-12">
              <div className="flex items-center gap-2 text-sm text-amber-600 mb-2">
                <span className="font-medium">
                  Module {moduleData.chapter || 1}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-6">{name}</h1>

              {/* Learning Goals */}
              {learning_goals?.length > 0 && (
                <div className="bg-green-50 rounded-lg p-5 border border-green-100 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-gray-800">
                      Learning Goals
                    </h3>
                  </div>
                  <ul className="list-disc pl-6 space-y-2">
                    {learning_goals.map((goal, index) => (
                      <li key={index} className="text-gray-700">
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-12">
              <Button
                onClick={markModuleComplete}
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Complete
              </Button>
              <Button
                onClick={() => router.push(`/quiz/${id}`)}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <PenTool className="h-4 w-4 mr-2" />
                Practice
              </Button>
              <Button
                onClick={handleLectureCreate}
                className="bg-amber-700 text-white hover:bg-amber-800"
                disabled={videoLoading}
              >
                {videoLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Create Lecture
                  </>
                )}
              </Button>
            </div>

            {/* Video Status */}
            {videoLoading && (
              <div className="w-full bg-gray-100 rounded-lg p-6 text-center text-gray-600 border border-dashed border-gray-400 animate-pulse mb-10">
                Generating video lecture...
              </div>
            )}

            {/* Generated Video */}
            {videoUrl && (
              <div className="w-full max-w-3xl mx-auto mb-12">
                <div className="bg-blue-50 rounded-lg p-5 border border-blue-100 mb-4">
                  <h3 className="font-semibold text-gray-800 mb-1">
                    Generated Lecture Video
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Watch this AI-generated lecture to understand the key
                    concepts.
                  </p>
                </div>
                <video controls className="w-full rounded-xl shadow-md">
                  <source src={videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {/* Embedded YouTube Video */}
            {yt_video && (
              <div className="mb-12">
                <div className="bg-blue-50 rounded-lg p-5 border border-blue-100 mb-4">
                  <h3 className="font-semibold text-gray-800 mb-1">
                    Video Explanation
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Watch this video to better understand the concepts.
                  </p>
                </div>
                <div className="aspect-video w-[90%] max-w-2xl mx-auto rounded-lg overflow-hidden shadow">
                  <iframe
                    className="w-full h-full"
                    src={yt_video.replace("watch?v=", "embed/")}
                    title="Module video"
                    frameBorder="0"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Module Content Blocks */}
            <ModuleContentRenderer contents={contents} />

            {/* Module Navigation */}
            <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pathway
              </Button>

              <Button
                onClick={markModuleComplete}
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete & Continue
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* AI Assistant Panel */}
      {showChat && (
        <div
          className="hidden lg:flex fixed right-6 top-[7rem] w-[320px] bg-white rounded-xl shadow-lg flex-col h-[calc(100vh-8rem)] overflow-hidden transition-all duration-300 ease-in-out animate-fade-in"
          style={{ zIndex: 30 }}
        >
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <h2 className="text-sm font-semibold text-gray-700">
              AI Learning Assistant
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChat(false)}
              className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8 px-2"
            >
              Hide
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <ModuleChat id={id} />
          </div>
        </div>
      )}
    </div>
  );
}
