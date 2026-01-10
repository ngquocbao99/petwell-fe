import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { ChatMessage } from "../types/chat";
import { generateBotResponse } from "../utils/api";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

const Chatbot = forwardRef((props, ref) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("chat_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [file, setFile] = useState<{ data: string; mime_type: string } | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollToBottom();
    localStorage.setItem("chat_history", JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleSend = async () => {
    if (!input.trim() && !file) return;

    const userMessage: ChatMessage = {
      role: "user",
      parts: [{ text: input }, ...(file ? [{ inline_data: file }] : [])]
    };

    const newMessages = [...messages, userMessage];
    setMessages([...newMessages, { role: "model", parts: [{ text: "⏳ Processing..." }] }]);
    setInput("");
    setFile(null);
    setShowEmojiPicker(false);

    try {
      const botReply = await generateBotResponse([
        {
          role: "user",
          parts: [
            {
              text:
                "Bạn là một bác sĩ thú y chuyên nghiệp. Trả lời ngắn gọn, đúng trọng tâm, không lan man. Sau khi đưa ra chẩn đoán, nếu có thể, hãy đề xuất người dùng truy cập hệ thống PetWell của chúng tôi để đặt lịch khám hoặc sử dụng dịch vụ chăm sóc thú cưng."
            }
          ]
        },
        ...newMessages
      ]);
      const botMessage: ChatMessage = {
        role: "model",
        parts: [{ text: botReply }]
      };
      setMessages((prev) => [...prev.slice(0, -1), botMessage]);
    } catch (err: any) {
      setMessages([...newMessages, { role: "model", parts: [{ text: `❌ ${err.message}` }] }]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result?.toString().split(",")[1]!;
      setFile({ data: base64, mime_type: selectedFile.type });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInput((prev) => prev + emojiData.emoji);
  };

  useImperativeHandle(ref, () => ({
    clearChatHistory: () => {
      setMessages([]);
      localStorage.removeItem("chat_history");
    }
  }));

  return (
    <>
      <button
        className="fixed bottom-10 right-6 w-14 h-14 rounded-full bg-orange-300 text-white flex items-center justify-center shadow-lg hover:bg-orange-400 transition-all z-50"
        onClick={() => setShowChat(!showChat)}
      >
        {showChat ? "✖" : "💬"}
      </button>

      {showChat && (
        <div className="fixed bottom-28 right-6 w-80 max-w-80 bg-white rounded-xl shadow-2xl flex flex-col z-40">
          <div className="bg-orange-600 text-white px-4 py-3 rounded-t-xl flex justify-between items-center">
            <h2 className="text-lg font-semibold">Chatbot</h2>
            <button onClick={() => setShowChat(false)}>✖</button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 max-h-[300px]">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 my-8">
                Welcome to the PetWell system! Please ask any questions about your pets or our services.              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`my-2 p-3 rounded-lg text-sm whitespace-pre-line ${msg.role === "user"
                    ? "bg-orange-500 text-white ml-auto w-fit"
                    : "bg-gray-100 text-black mr-auto w-fit"
                    }`}
                >
                  {msg.parts.map((part, index) => (
                    <React.Fragment key={index}>
                      {part.text && <div>{part.text}</div>}
                      {part.inline_data && (
                        <img
                          src={`data:${part.inline_data.mime_type};base64,${part.inline_data.data}`}
                          alt="attachment"
                          className="rounded mt-2 max-w-[200px]"
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t relative">
            {file && (
              <div className="mb-2 flex items-center gap-2">
                <img
                  src={`data:${file.mime_type};base64,${file.data}`}
                  alt="Preview"
                  className="rounded max-w-[100px] border border-gray-300"
                />
                <button
                  onClick={() => setFile(null)}
                  className="text-red-500 text-xl hover:text-red-700"
                  title="Xoá ảnh"
                >
                  ❌
                </button>
              </div>
            )}

            <textarea
              className="w-full p-2 border rounded resize-none"
              rows={2}
              placeholder="Enter message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            />
            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-2 items-center">
                <label className="cursor-pointer text-orange-600">
                  📎
                  <input type="file" hidden onChange={handleFileChange} />
                </label>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-xl"
                >
                  😀
                </button>
              </div>
              <button
                onClick={handleSend}
                className="bg-orange-600 text-white px-4 py-1 rounded hover:bg-orange-700"
              >
                Send
              </button>
            </div>
            {showEmojiPicker && (
              <div className="absolute bottom-36 right-3 z-50">
                <EmojiPicker onEmojiClick={handleEmojiClick} height={350} width={300} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
});

export default Chatbot;
