"use client";

import React, { useState } from "react";
import axios from "axios";

// 🔹 Function for AVA to speak responses aloud
const speakText = (text: string) => {
  const speech = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(speech);
};

// 🔹 Message Interface
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
      return response.data.threadId; // ✅ Return threadId for use in sendMessage
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

    let currentThreadId = threadId;

    // ✅ Ensure `threadId` is set before making API call
    if (!currentThreadId) {
      currentThreadId = await startChat(); // Wait for chat to start
      if (!currentThreadId) {
        setMessages((prev) => [
          ...prev,
          { id: messages.length + 2, text: "Error: Could not start chat. Please try again.", sender: "ava" },
        ]);
        return;
      }
      setThreadId(currentThreadId);
    }

    try {
      // ✅ Show AVA typing indicator
      setMessages((prev) => [...prev, { id: messages.length + 2, text: "AVA is typing...", sender: "ava" }]);

      const response = await axios.post("http://localhost:5000/ask", {
        message: input,
        threadId: currentThreadId,
      });

      // ✅ Replace typing indicator with actual response
      const avaMessage: Message = { id: messages.length + 2, text: response.data.reply, sender: "ava" };

      setMessages((prev) =>
        prev.filter((msg) => msg.text !== "AVA is typing...").concat(avaMessage)
      );

      speakText(response.data.reply); // ✅ AVA now reads responses aloud
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
