"use client";

import React, { useState } from "react";
import axios from "axios";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ava";
}

const ChatUI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! I'm AVA. How can I assist you today?", sender: "ava" },
  ]);
  const [input, setInput] = useState<string>("");
  const [threadId, setThreadId] = useState<string | null>(null);

  // 🔹 Start Chat (First Time User)
 const startChat = async () => {
  try {
    // Prompt user for location instead of hardcoding
    const userLocation = prompt("What city, state, or zip code are you looking in?") || "United States";

    const userInfo = {
      role: "family",
      location: userLocation, // ✅ Now user-defined
      careType: "assisted living",
      paymentMethod: "private pay",
      concerns: "cost",
      lifestylePreferences: ["pet-friendly"],
    };

    const response = await axios.post("http://localhost:5000/start-chat", userInfo);
    setThreadId(response.data.threadId);
  } catch (error) {
    console.error("🔥 Error starting chat:", error);
  }
};

  // 🔹 Send Message to AVA
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { id: messages.length + 1, text: input, sender: "user" };
    setMessages([...messages, userMessage]);
    setInput("");

    if (!threadId) {
      await startChat();
    }

    try {
      const response = await axios.post("http://localhost:5000/ask", {
        message: input,
        threadId,
      });

      const avaMessage: Message = { id: messages.length + 2, text: response.data.reply, sender: "ava" };
      setMessages((prev) => [...prev, avaMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: messages.length + 2, text: "Oops! AVA is having trouble responding.", sender: "ava" },
      ]);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col items-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg overflow-hidden flex flex-col">
        <div className="bg-blue-600 text-white p-4 text-center font-bold">AVA - Virtual Assistant</div>
        <div className="flex-1 p-4 overflow-y-auto" style={{ height: "500px" }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`my-2 p-2 rounded-lg max-w-xs ${
                msg.sender === "ava" ? "bg-blue-100 text-left text-black font-semibold" : "bg-gray-300 text-right self-end text-black font-semibold"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>
        <div className="p-4 border-t flex">
          <input
            className="flex-1 p-2 border rounded-l-lg"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
          />
          <button onClick={sendMessage} className="bg-blue-600 text-white p-2 rounded-r-lg">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;
