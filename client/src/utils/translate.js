
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000"; // Ensure backend is running

export const uploadPDF = async (pdfFile, language) => {
  try {
    const formData = new FormData();
    formData.append("pdf", pdfFile);
    formData.append("language", language);

    const response = await axios.post(`${API_BASE_URL}/uploadtranslate`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.status === 200) {
      return {
        message: response.data.message,
        summary: response.data.summary,
        translatedSummary: response.data.translated_summary,
        language: response.data.language,
      };
    } else {
      console.error("Unexpected response status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error uploading PDF:", error.response ? error.response.data : error.message);
    return { error: "Failed to upload PDF" };
  }
};
