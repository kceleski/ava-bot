"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

const ChatUI = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm AVA. How can I assist you today?", sender: "ava" },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { id: messages.length + 1, text: input, sender: "user" };
    setMessages([...messages, userMessage]);
    setInput("");

    if (input.toLowerCase().includes("assisted living") || input.toLowerCase().includes("facility")) {
      try {
        const response = await axios.get("http://localhost:5000/facilities");
        const facilities = response.data.facilities;

        if (facilities.length === 0) {
          setMessages((prev) => [
            ...prev,
            { id: prev.length + 1, text: "I couldn't find any facilities at the moment.", sender: "ava" },
          ]);
          return;
        }

        const facilityList = facilities
          .map((fac) => `${fac.name} at ${fac.location.address}`)
          .join("\n");

        setMessages((prev) => [
          ...prev,
          { id: prev.length + 1, text: `Here are some options:\n${facilityList}`, sender: "ava" },
        ]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          { id: prev.length + 1, text: "Oops! There was a problem fetching facility data.", sender: "ava" },
        ]);
      }
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
