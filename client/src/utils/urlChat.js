import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000"; // Ensure Flask is running on this port

// Function to process a URL and store embeddings
export const processURL = async (url) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/process_url`, { url });
    return response.data.url_id; // Return generated URL ID
  } catch (error) {
    console.error("Error processing URL:", error);
    return null;
  }
};

// Function to ask a question based on the stored URL ID
export const askQuestion = async (url_id, question) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/ask_question`, {
      url_id,
      question,
    });
    return response.data.answer;
  } catch (error) {
    console.error("Error fetching answer:", error);
    return "Error fetching answer";
  }
};

export const getChatDetails = async (chatId) => {
  const response = await fetch(`${API_BASE_URL}/api/url-chat/${chatId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch chat details");
  }
  return response.json();
};
