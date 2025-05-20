'use client';
// ModuleContentRenderer.jsx - Fixed version
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';       // optional
import remarkGfm    from 'remark-gfm'
import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  PenTool,
} from "lucide-react";

// Enhanced helper to normalize math notation
const normalizeMath = (text) => {
  if (typeof text !== 'string') return text;

  // Replace any backspace (0x08) characters with a real backslash
  text = text.replace(/\x08/g, '\\');

  return text
    // Fix LaTeX environments by wrapping in proper delimiters if not already wrapped
    .replace(
      /(?<!\$\$)\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}(?!\$\$)/g,
      (_, env, body) => `$$\\begin{${env}}${body}\\end{${env}}$$`
    )
    // Convert \( ... \) to inline math $...$
    .replace(/\\\(([^]+?)\\\)/g, '$$$1$$')
    // Convert \[ ... \] to block math $$...$$
    .replace(/\\\[([^]+?)\\\]/g, '$$$$1$$$$')
    // Fix any remaining LaTeX commands that might not be wrapped correctly
    .replace(/(?<!\$)(\\[a-zA-Z]+\{[^}]*\})(?!\$)/g, '$$$1$$');
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
    case "misconception":
      return <Lightbulb className="h-5 w-5 text-red-600" />;
    case "real_world_link":
      return <BookOpen className="h-5 w-5 text-teal-600" />;
    case "summary":
      return <CheckCircle className="h-5 w-5 text-gray-600" />;
    case "reflection":
      return <Lightbulb className="h-5 w-5 text-pink-600" />;
    case "challenge_problem":
      return <PenTool className="h-5 w-5 text-orange-600" />;
    case "video":
      return <BookOpen className="h-5 w-5 text-purple-600" />;
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
    case "concept_explanation":
      return `${common} bg-amber-50 border-amber-600`;
    case "worked_example":
      return `${common} bg-indigo-50 border-indigo-600`;
    case "practice_exercise":
      return `${common} bg-emerald-50 border-emerald-600`;
    case "misconception":
      return `${common} bg-red-50 border-red-600`;
    case "real_world_link":
      return `${common} bg-teal-50 border-teal-600`;
    case "summary":
      return `${common} bg-gray-50 border-gray-600`;
    case "reflection":
      return `${common} bg-pink-50 border-pink-600`;
    case "challenge_problem":
      return `${common} bg-orange-50 border-orange-600`;
    case "video":
      return `${common} bg-purple-50 border-purple-600`;
    default:
      return "rounded-lg p-6 mb-10 bg-white border border-gray-100 shadow-sm";
  }
};

// Special renderer for video blocks
const VideoRenderer = ({ url }) => {
  // Extract video ID from YouTube URL
  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
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

export function ModuleContentRenderer({ contents = [] }) {
  const [expanded, setExpanded] = useState({});
  const toggle = (i) => setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));

  // Set all blocks to be expanded by default
  React.useEffect(() => {
    const initialExpandedState = {};
    contents.forEach((_, i) => {
      initialExpandedState[i] = true;
    });
    setExpanded(initialExpandedState);
    console.log(contents)
  }, [contents]);

  if (!contents || contents.length === 0) {
    return <div className="text-center py-10">Loading content...</div>;
  }
  return (
    <div className="space-y-0 mb-12">
      {contents.map((block, i) => {
        const blockType = block.block_type;
        const contentType = block.type;
        const { content, transition_text } = block;
        const isOpen = expanded[i] !== false;
        console.log(contentType)
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
              <div className="prose max-w-full text-gray-800 mt-5 break-words">
                {transition_text && (
                  <p className="mb-4 italic text-gray-600">{transition_text}</p>
                )}
                {blockType === "video" ? (
                  <VideoRenderer url={content} />
                ) : block.type === "html" ? (
                  // Raw HTML blocks: skip ReactMarkdown entirely
                  <div   data-renderer="raw-html" className="bg-red-100"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[
                    rehypeRaw,        // parse raw HTML
                    rehypeSanitize,   // sanitize it (if needed)
                    rehypeKatex       // then typeset math
                  ]}
                >
                  {normalizeMath(content)}
                </ReactMarkdown>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
