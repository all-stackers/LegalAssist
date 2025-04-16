import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000"; // Change this if Flask runs on a different port

export const uploadPDF = async (file) => {
  const formData = new FormData();
  formData.append("pdf", file);

  try {
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.chat_id; // Return PDF ID
  } catch (error) {
    console.error("Error uploading PDF:", error);
    return null;
  }
};

export const askQuestion = async (pdfId, question) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/ask`, {
      chat_id: pdfId,
      question,
    });
    return response.data.answer;
  } catch (error) {
    console.error("Error fetching answer:", error);
    return "Error fetching answer";
  }
};

export const getChatDetails = async (chatId) => {
  const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch chat details");
  }
  return response.json();
};
