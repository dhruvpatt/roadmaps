import React, { useState, useRef, useEffect } from "react";
import backendUrl from "@/backendUrl";
import ReactMarkdown from "react-markdown";

const ModuleChat = ({ id }) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome to the AI Assistant! I’m here to help you with this module. What questions do you have?",
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);

    console.log("sending message", input, id);
    const res = await fetch(`${backendUrl}/module-assistant/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module_id: id, message: input }),
    });

    const ret = await res.json();
    setMessages((prev) => [...prev, { role: "assistant", content: ret.reply }]);

    // Mock assistant reply
    // setTimeout(() => {
    //   setMessages((prev) => [
    //     ...prev,
    //     {
    //       role: "assistant",
    //       content: "Thanks for your question! (AI response placeholder)",
    //     },
    //   ]);
    // }, 500);

    setInput("");
  };

  // Scroll to bottom on message update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-white border rounded-lg p-4 shadow-sm">
      {/* Chat area */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-1">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`px-4 py-2 rounded-md text-sm max-w-[85%] whitespace-pre-wrap ${
              msg.role === "assistant"
                ? "bg-yellow-50 text-gray-800 self-start"
                : "bg-black text-white self-end"
            }`}
          >
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex items-center gap-2 mt-auto">
        <input
          type="text"
          placeholder="Ask a question about this module..."
          className="flex-1 border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 placeholder-gray-400"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === "Enter") {
              await sendMessage();
            }
          }}
        />
        <button
          onClick={sendMessage}
          className="bg-black text-white px-3 py-2 rounded-md hover:bg-amber-600 transition"
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default ModuleChat;
