"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { processURL } from "@/utils/urlChat";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ScaleLoader } from "react-spinners";
import axios from "axios";

const ChatUrl = () => {
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/urls", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const formattedChats = response.data.map((chat) => ({
        ...chat,
        date: formatRelativeTime(chat.last_activity),
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

  const handleDeleteUrlChat = async (url_id) => {
    if (!confirm("Are you sure you want to delete this URL chat?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/url-chat/${url_id}`);
      setChats((prev) => prev.filter((chat) => chat.url_id !== url_id));
      toast.success("Chat deleted successfully");
    } catch (err) {
      console.error("Delete error:", err.response?.data || err.message);
      toast.error("Failed to delete chat");
    }
  };

  const handleProcessURL = async () => {
    if (!url.trim()) {
      toast.error("Please enter a valid URL.");
      return;
    }

    try {
      setIsProcessing(true);
      toast.info("Processing URL...");
      const urlId = await processURL(url);

      if (urlId) {
        toast.success("URL processed successfully!");
        router.push(`/chat-url/${urlId}`);
      } else {
        toast.error("Failed to process URL.");
      }
    } catch (error) {
      toast.error("An error occurred while processing the URL.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex justify-center p-8 px-[40px] w-full overflow-auto">
      <div className="max-w-4xl w-full">
        <div className="space-y-6">
          <div className="relative group">
            <label
              htmlFor="url"
              className="block text-[14px] font-medium text-gray-700 mb-2"
            >
              Case URL
            </label>
            <div className="flex">
              <div className="flex-grow relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400">
                    link
                  </span>
                </span>
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/case/12345"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 rounded-lg shadow-sm transition-all duration-200 outline-none"
                />
                <div className="absolute inset-y-0 right-0 hidden md:flex items-center pr-3 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-200">
                  <span className="material-symbols-outlined text-primary-500">
                    {url ? "check_circle" : "link"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleProcessURL}
                disabled={isProcessing}
                className="ml-3 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow transition-all duration-200 hover:translate-y-[-2px] flex items-center disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isProcessing ? (
                  <ScaleLoader color="#fff" height={20} width={2} />
                ) : (
                  <>
                    <span className="material-symbols-outlined mr-2">
                      rocket_launch
                    </span>
                    Process
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Enter a valid case URL from the online system
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-[20px] text-gray-700 ">
              <div className="text-md text-gray-600 hover:text-primary-600 transition-colors duration-200 flex items-center group">
                <span className="material-symbols-outlined mr-1 group-hover:translate-x-[-2px] transition-transform duration-200">
                  history
                </span>
                All History
              </div>
            </h3>
            <div className="">
              {loading ? (
                <div className="p-6 flex justify-center items-center h-60">
                  <ScaleLoader color="#3b82f6" />
                </div>
              ) : error ? (
                <div className="p-6 text-center text-red-500">{error}</div>
              ) : chats.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {chats.map((chat) => (
                    <div
                      key={chat.url_id}
                      onClick={() => router.push(`/chat-url/${chat.url_id}`)}
                      className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-primary-700">
                            {chat.name}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(chat.last_activity)}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // prevent navigation on delete
                            handleDeleteUrlChat(chat.url_id);
                          }}
                          className="text-red-500 hover:text-red-700"
                          title="Delete chat"
                        >
                          <DeleteIcon />
                        </button>
                      </div>

                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {chat.description}
                      </p>
                      <div className="mt-2 flex items-center">
                        <span className="material-symbols-outlined text-gray-400 text-sm mr-1">
                          link
                        </span>
                        <p className="text-xs text-blue-500 truncate">
                          {chat.url}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 flex flex-col items-center justify-center h-60 bg-white">
                  <span className="material-symbols-outlined text-gray-300 text-5xl mb-4">
                    format_list_bulleted
                  </span>
                  <p className="text-gray-500 text-center">
                    No URLs processed yet. Enter a URL and click the Process
                    button to begin.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
    />
  </svg>
);

export default ChatUrl;
