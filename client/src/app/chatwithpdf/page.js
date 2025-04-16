"use client";
import React, { useState, useRef, useEffect } from "react";
import { ScaleLoader } from "react-spinners";
import { uploadPDF, askQuestion } from "../../utils/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// chatwithpdf
const ChatWithPDF = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfId, setPdfId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [askingAI, setAskingAI] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const typeMessage = (text, callback) => {
    let index = 0;
    let currentText = "";
    const interval = setInterval(() => {
      if (index < text.length) {
        currentText += text.charAt(index);
        callback(currentText);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 25); // 2x speed animation
  };

  const handleUpload = async () => {
    if (!pdfFile) {
      toast.error("Please select a PDF file to upload.");
      return;
    }
    toast.info("Uploading PDF...");
    const id = await uploadPDF(pdfFile);
    if (id) {
      setPdfId(id);
      setShowChat(true);
      toast.success("PDF uploaded successfully!");
    } else {
      toast.error("Failed to upload PDF.");
    }
  };

  const handleSendMessage = async () => {
    if (!pdfId || inputMessage.trim() === "") {
      toast.error("Please upload a PDF and enter a question.");
      return;
    }
    setAskingAI(true);
    const userMessage = { message: inputMessage, sender: "user" };
    setChatMessages([...chatMessages, userMessage]);
    setInputMessage("");

    const response = await askQuestion(pdfId, inputMessage);
    setAskingAI(false);
    let botMessage = { message: "", sender: "agent" };
    setChatMessages((prev) => [...prev, botMessage]);
    typeMessage(response, (updatedText) => {
      setChatMessages((prev) => {
        let updatedMessages = [...prev];
        updatedMessages[updatedMessages.length - 1] = {
          message: updatedText,
          sender: "agent",
        };
        return updatedMessages;
      });
    });
  };

  return (
    <div className="h-screen flex flex-col items-center p-4">
      {/* PDF Upload Section */}

      {showChat ? (
        <>
          {/* Chat UI */}
          <div
            ref={chatContainerRef}
            className="flex-1 w-full max-w-lg bg-white shadow-md rounded-lg overflow-y-auto p-4 border"
            style={{ height: "500px" }}
          >
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`p-3 my-2 rounded-lg max-w-[80%] ${
                  msg.sender === "user"
                    ? "bg-blue-500 text-white ml-auto"
                    : "bg-gray-200 text-black"
                }`}
              >
                {msg.message}
              </div>
            ))}
          </div>

          {/* Input Field */}
          <div className="w-full max-w-lg flex items-center mt-4">
            <input
              className="flex-1 px-4 py-2 border rounded-l-md focus:outline-none"
              type="text"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-r-md"
              onClick={handleSendMessage}
              disabled={askingAI}
            >
              {askingAI ? <ScaleLoader color="#fff" height={15} /> : "Send"}
            </button>
          </div>
        </>
      ) : (
        <div className="w-full max-w-lg mb-4">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdfFile(e.target.files[0])}
            className="border p-2 w-full"
          />
          <button
            onClick={handleUpload}
            className="mt-2 w-full bg-blue-600 text-white py-2 rounded"
          >
            Upload PDF
          </button>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default ChatWithPDF;
