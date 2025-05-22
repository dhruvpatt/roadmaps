// ModuleContentRendererWithKatex.jsx
// Install dependencies:
// npm install react-markdown remark-math rehype-katex katex lucide-react

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  PenTool,
} from "lucide-react";

// Helper to normalize MathJax-style delimiters to remark-math-friendly $...$ and $$...$$
// Helper to normalize delimiters and auto-wrap environments
const normalizeMath = (text) => {
  if (typeof text !== "string") return text;
  return (
    text
      // 1) wrap any \begin{...}...\end{...} in $$...$$
      .replace(
        /\\\\begin\{([^\}]+)\}([\\s\\S]*?)\\\\end\{\1\}/g,
        (_, envName, body) => `$$\\begin{${envName}}${body}\\end{${envName}}$$`
      )
      // 2) convert \[…\] → $$…$$
      .replace(/\\\\\[([\s\S]+?)\\\\\]/g, "$$$$1$$$$")
      // 3) convert \(...\) → $…$
      .replace(/\\\\\(([\s\S]+?)\\\\\)/g, "$$$1$$")
  );
};

// Map block types to icons
const getBlockIcon = (type) => {
  switch (type) {
    case "introduction":
      return <BookOpen className="h-5 w-5 text-blue-600" />;
    case "learning_objectives":
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case "definition":
      return <BookOpen className="h-5 w-5 text-purple-600" />;
    case "concept_explanation":
      return <Lightbulb className="h-5 w-5 text-amber-600" />;
    case "worked_example":
      return <PenTool className="h-5 w-5 text-indigo-600" />;
    case "practice_exercise":
      return <PenTool className="h-5 w-5 text-emerald-600" />;
    case "misconception" || "challenge_problem":
      return <BookOpen className="h-5 w-5 text-red-600" />;
    default:
      return <BookOpen className="h-5 w-5 text-gray-600" />;
  }
};

// Map block types to titles
const getBlockTitle = (type) => {
  const titles = {
    introduction: "Introduction",
    learning_objectives: "Learning Objectives",
    definition: "Definition",
    concept_explanation: "Concept Explanation",
    worked_example: "Worked Example",
    practice_exercise: "Practice Exercise",
    visual_aid: "Visual Aid",
    real_world_link: "Real-World Link",
    misconception: "Misconception",
    comparison: "Comparison",
    summary: "Summary",
    reflection: "Reflection",
    challenge_problem: "Challenge Problem",
    interactive_element: "Interactive Element",
    video: "Video",
  };
  return titles[type] || "Concept";
};
const VideoRenderer = ({ url }) => {
  // Extract video ID from YouTube URL
  const getYouTubeId = (url) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYouTubeId(url);

  if (!videoId) return <p>Invalid YouTube URL</p>;

  return (
    <div className="aspect-w-16 aspect-h-9">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-64 rounded-md"
      ></iframe>
    </div>
  );
};
// Styling backgrounds by block type to match icon colors
const getBlockStyles = (type) => {
  const common = "rounded-lg p-6 mb-10 transition-all duration-300 border-l-4";
  switch (type) {
    case "introduction":
      return `${common} bg-blue-50 border-blue-600`;
    case "learning_objectives":
      return `${common} bg-green-50 border-green-600`;
    case "definition":
      return `${common} bg-purple-50 border-purple-600`;
    case "worked_example":
      return `${common} bg-indigo-50 border-indigo-600`;
    case "practice_exercise":
      return `${common} bg-emerald-50 border-emerald-600`;
    case "misconception":
      return `${common} bg-red-50 border-red-600`;
    case "visual_aid":
      return `${common} bg-amber-50 border-gray-600`;
    case "summary":
      return `${common} bg-blue-50 border-gray-600`;
    default:
      return "rounded-lg p-6 mb-10 bg-white border border-gray-100 shadow-sm";
  }
};

export function ModuleContentRenderer({ contents }) {
  const [expanded, setExpanded] = useState({});
  const toggle = (i) => setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));
  const visibleContents = contents.filter(
    (block) => block.block_type !== "learning_objectives"
  );
  return (
    <div className="space-y-0 mb-12">
      {visibleContents.map((block, i) => {
        const blockType = block.block_type;
        const contentType = block.type;
        const { content, transition_text } = block;
        const isOpen = expanded[i] !== false;

        return (
          <div key={block.id || i} className={getBlockStyles(blockType)}>
            <div
              className="flex justify-between items-center mb-3 cursor-pointer"
              onClick={() => toggle(i)}
            >
              <div className="flex items-center gap-2">
                {getBlockIcon(blockType)}
                <h3 className="font-semibold text-gray-800">
                  {getBlockTitle(blockType)}
                </h3>
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </div>
            {isOpen && (
              <div className="prose max-w-none text-gray-800 mt-5">
                {transition_text && (
                  <p className="mb-4 italic text-gray-600">{transition_text}</p>
                )}
                {blockType === "video" ? (
                  <VideoRenderer url={content} />
                ) : contentType === "html" ||
                  blockType === "visual_aid" ||
                  blockType === "interactive_element" ? (
                  // Render HTML content directly for html type or visual_aid and interactive_element block types
                  <div
                    tag-renderer="THIS IS A TEST"
                    className="html-content w-full"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    children={normalizeMath(content)}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
