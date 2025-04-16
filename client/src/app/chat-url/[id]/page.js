"use client";
import React, { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { askQuestion, getChatDetails } from "@/utils/urlChat";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ScaleLoader, ClipLoader } from "react-spinners";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const Chat = () => {
  const params = useParams();
  const chatId = params?.id;
  const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
      const loadChatHistory = async () => {
        setLoadingHistory(true);
        try {
          const chatData = await getChatDetails(chatId);
          if (chatData?.questions?.length > 0) {
            const formattedMessages = chatData.questions.flatMap((q) => [
              { type: "user", message: q.question },
              { type: "bot", message: q.answer },
            ]);
            setChatMessages(formattedMessages);
          }
        } catch (error) {
          console.error("Error loading chat history:", error);
        } finally {
          setLoadingHistory(false);
        }
      };

      if (chatId) {
        loadChatHistory();
      } else {
        setLoadingHistory(false);
      }
    }, [chatId]);

  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [askingAI, setAskingAI] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!chatId || inputMessage.trim() === "") {
      toast.error("Please enter a question.");
      return;
    }

    setAskingAI(true);
    const userMessage = { type: "user", message: inputMessage };
    setChatMessages([...chatMessages, userMessage]);
    setInputMessage("");

    try {
      // Add loading message immediately
      setChatMessages((prev) => [
        ...prev,
        { type: "bot", message: "", isLoading: true },
      ]);

      const response = await askQuestion(chatId, inputMessage);

      // Replace loading message with actual response
      setChatMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          type: "bot",
          message: response,
          isLoading: false,
        };
        return updated;
      });
    } catch (error) {
      toast.error("Failed to get response from AI.");
      // Remove loading message on error
      setChatMessages((prev) => prev.filter((msg) => !msg.isLoading));
    } finally {
      setAskingAI(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 bg-gray-50 h-[calc(100vh-64px)] flex flex-col">
      <ToastContainer />
      <div className="flex flex-col justify-between h-full w-full max-w-7xl mx-auto">
        {/* Chat history (scrollable) */}
        <div
          ref={chatContainerRef}
          className="flex-1 h-full overflow-y-auto pt-6 px-[50px] pb-[2px] space-y-6"
        >
          {loadingHistory ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            chatMessages.map((msg, index) => (
              <div key={index}>
                {msg.type === "user" ? (
                  <div className="flex items-start justify-end">
                    <div className="bg-primary-50 p-4 rounded-lg shadow-sm border border-primary-100 text-[13px] max-w-3xl">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.message}
                      </ReactMarkdown>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-200 mt-[5px] flex items-center justify-center ml-4 flex-shrink-0">
                      <span className="text-sm font-medium">JD</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-primary-100 mt-4 flex items-center justify-center mr-4 flex-shrink-0">
                      <BotIcon />
                    </div>
                    <div className="p-4 rounded-lg text-[13px] max-w-3xl">
                      {msg.isLoading ? (
                        <div className="text-gray-500">
                          <ScaleLoader color="#3B82F6" height={15} width={2} />
                        </div>
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.message}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input area - sticky at bottom */}
        <div className="flex justify-center w-full p-6 pt-[8px] bg-gray-50">
          <div className="w-[700px] bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <textarea
                className="w-full border-0 focus:ring-0 focus:outline-none resize-none h-12 py-3 px-2"
                placeholder="Type your legal question here..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={askingAI}
              ></textarea>
              <div className="flex-shrink-0 flex items-center gap-2 pl-3">
                <button
                  className="p-2 rounded-full hover:bg-gray-100 transition-all text-gray-500"
                  disabled={askingAI}
                >
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
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <button
                  className="p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-all"
                  onClick={handleSendMessage}
                  disabled={askingAI}
                >
                  {askingAI ? (
                    <ScaleLoader color="#fff" height={15} width={2} />
                  ) : (
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
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                Ask complex legal questions or upload documents for analysis
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1 text-gray-500 rounded hover:bg-gray-100 transition-all">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                  </svg>
                </button>
                <button className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-all flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Upload PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BotIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-primary-700"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 1v22M1 12h22M4.2 4.2l15.6 15.6M4.2 19.8l15.6-15.6" />
  </svg>
);

export default Chat;
