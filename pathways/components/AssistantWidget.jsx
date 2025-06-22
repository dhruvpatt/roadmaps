import { useState, useRef, useEffect } from "react";
import { Bot, Send } from "lucide-react";
import fetchWithAuth from "@/lib/fetch_with_auth";
import { Input } from "./ui/input";
import { motion, AnimatePresence } from "framer-motion";

export default function AssistantWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "system", content: "Hi! How can I help you with this website?" }
    ]);
    const [loading, setLoading] = useState(false);
    const textareaRef = useRef();
    const widgetRef = useRef();
    const messageEndRef = useRef(null);

    useEffect(() => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [open, messages]);

    useEffect(() => {
        const chatBox = widgetRef.current;
        if (!chatBox) return;

        const onWheel = (e) => {
            const target = e.target.closest('[data-scrollable]');
            if (!target) return;

            const isScrollable = target.scrollHeight > target.clientHeight;
            if (!isScrollable) return;

            const atTop = target.scrollTop === 0;
            const atBottom = target.scrollTop + target.clientHeight === target.scrollHeight;

            if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
                e.preventDefault();
            }

            e.stopPropagation();
        };

        chatBox.addEventListener("wheel", onWheel, { passive: false });

        return () => {
            chatBox.removeEventListener("wheel", onWheel);
        };
    }, [open]);

    const toggleChat = () => {
        setOpen((prev) => !prev);
        setTimeout(() => textareaRef.current?.focus(), 100);
    };

    const getCleanHtml = () => {
        const cloned = document.documentElement.cloneNode(true);

        // Remove all non-visible / irrelevant content
        cloned.querySelectorAll("script, style, meta, link, noscript").forEach(n => n.remove());

        // Extract and return plain text content
        return cloned.textContent || "";
    };


    // Send user message + call API
    const sendMessage = async (text) => {
        if (!text.trim()) return;
        const newMessages = [...messages, { role: "user", content: text }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const body = {
                html: getCleanHtml(),
                messages: newMessages
            };

            const res = await fetchWithAuth("/api/assistant/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error("Assistant API failed");

            const { response } = await res.json();
            setMessages(msgs => [...msgs, { role: "assistant", content: response }]);
        } catch (err) {
            console.error(err);
            setMessages(msgs => [...msgs, { role: "error", content: "Sorry, something went wrong." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Assistant Button */}
            <button
                onClick={toggleChat}
                className="fixed bottom-6 left-75 z-50 rounded-full bg-blue-600 text-white p-4 shadow-lg hover:bg-blue-700 transition"
            >
                <Bot size={24} />
            </button>

            {/* Chat Box */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        ref={widgetRef}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        transition={{ duration: 0.25 }}
                        className="fixed bottom-20 left-75 z-50 w-80 max-h-[50vh] bg-white shadow-xl rounded-xl flex flex-col overflow-hidden"
                    >
                        <div className="p-4 border-b font-semibold bg-blue-50">Assistant</div>
                        <div
                            className="flex-1 p-3 overflow-y-auto space-y-2 text-sm"
                            data-scrollable
                        >                            {messages.map((msg, i) => {
                            let baseStyle = "p-2 rounded-lg whitespace-pre-wrap";

                            if (msg.role === "user") {
                                baseStyle += " bg-blue-100 text-blue-900 self-end";
                            } else if (msg.role === "assistant" || msg.role === "system") {
                                baseStyle += " bg-gray-100 text-gray-700";
                            } else if (msg.role === "error") {
                                baseStyle += " bg-red-100 text-red-800 border border-red-300";
                            }

                            return (
                                <div key={i} className={baseStyle}>
                                    {msg.content}
                                </div>
                            );
                        })}

                            {loading && (
                                <div className="p-2 text-gray-500 italic">…thinking…</div>
                            )}
                            <div ref={messageEndRef} />

                        </div>
                        <div className="p-2 border-t flex items-center gap-2">
                            <Input
                                type="text"
                                placeholder="Ask something..."
                                className="flex-1 p-2 text-sm border rounded"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        const value = e.target.value.trim();
                                        if (value) {
                                            sendMessage(value);
                                            e.target.value = "";
                                        }
                                    }
                                }}
                                ref={textareaRef}
                            />
                            <button
                                onClick={() => {
                                    const input = textareaRef.current;
                                    const value = input?.value.trim();
                                    if (value) {
                                        sendMessage(value);
                                        input.value = "";
                                    }
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Send"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
