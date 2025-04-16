"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const AllChats = () => {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChats = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/chats", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Transform dates and ensure consistent data structure
      console.log(response.data);
      const formattedChats = response.data.map((chat) => ({
        ...chat,
        date: formatRelativeTime(chat.last_activity),
        tags: Array.isArray(chat.keywords) ? chat.keywords : [],
      }));

      setChats(formattedChats);
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Failed to fetch chats"
      );
      console.error("API Error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  // Improved date formatting
  const formatRelativeTime = (dateString) => {
    if (!dateString) return "Unknown time";

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);

      if (diffInSeconds < 60) return "just now";
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800)
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
      return date.toLocaleDateString();
    } catch {
      return "Unknown time";
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    useEffect(() => fetchChats(), []);
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 overflow-auto bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 overflow-auto bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-800 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }
  return (
    <div className="flex-1 p-6 overflow-auto bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-800">
            All Conversations
          </h2>
          <button
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-800 cursor-pointer transition-all flex items-center gap-2 shadow-sm"
            onClick={() => router.push("/chats/upload-pdf")}
          >
            <PlusIcon />
            New Chat
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {chats.map((chat, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition cursor-pointer"
              onClick={() => router.push(`/chats/${chat.chat_id}`)}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-primary-700">{chat.name}</h3>
                <span className="text-xs text-gray-500">{chat.date}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {chat.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {chat.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default AllChats;
