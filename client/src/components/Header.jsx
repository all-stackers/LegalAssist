"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import axios from "axios";

const Header = () => {
  const pathname = usePathname();
  const [title, setTitle] = useState("Chat with URL");

  useEffect(() => {
    const pathSegments = pathname.split("/").filter(Boolean);

    if (pathname === "/chat-url") {
      setTitle("Chat with URL");
    } else if (pathSegments[0] === "chat-url" && pathSegments[1]) {
      // If it's a URL chat ID, fetch title from API
      const urlId = pathSegments[1];
      axios
        .get(`http://localhost:5000/api/url-chat/${urlId}/title`)
        .then((res) => {
          setTitle(res.data.name || "URL Chat");
        })
        .catch(() => setTitle("URL Chat"));
    }
    // Keep your existing chat routes logic
    else if (pathname === "/chats") {
      setTitle("Previous Chats");
    } else if (pathname === "/chats/upload-pdf") {
      setTitle("New Chat");
    } else if (pathSegments[0] === "chats" && pathSegments[1]) {
      const chatId = pathSegments[1];
      axios
        .get(`http://localhost:5000/api/chats/${chatId}/title`)
        .then((res) => {
          setTitle(res.data.name || "Chat");
        })
        .catch(() => setTitle("Chat"));
    } else if (pathname === "/ask-query") {
      setTitle("Ask Query");
    } else {
      setTitle("Legal Assist");
    }
  }, [pathname]);

  return (
    <header className="h-[64px] border-b border-gray-200 px-6 flex items-center justify-between bg-white shadow-sm">
      <div className="text-xl font-bold text-gray-800">{title}</div>
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-gray-100 transition-all relative">
          <BellIcon />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100 transition-all">
          <SettingsIcon />
        </button>
      </div>
    </header>
  );
};

const BellIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-gray-600"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-gray-600"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export default Header;
