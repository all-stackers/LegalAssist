"use client";

import React, { useState, useRef } from "react";
import { ClipLoader } from "react-spinners";
import { useRouter } from "next/navigation";
import { uploadPDF } from "@/utils/api";
import { ToastContainer, toast } from "react-toastify";

const UploadPdf = () => {
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(null);
  const [recentFiles, setRecentFiles] = useState([
    {
      id: 1,
      name: "legal-brief-q2.pdf",
      date: "3 days ago",
      size: "2.1 MB",
    },
    {
      id: 2,
      name: "contract-draft-v2.pdf",
      date: "1 week ago",
      size: "3.4 MB",
    },
  ]);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      validateAndSetFiles(selectedFiles);
    }
  };

  const validateAndSetFiles = (selectedFiles) => {
    setError(null);
    const validFiles = [];
    const errors = [];

    selectedFiles.forEach((file) => {
      // Check file type
      if (file.type !== "application/pdf") {
        errors.push(`${file.name}: Not a PDF file`);
        return;
      }

      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File exceeds 10MB limit`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join(", "));
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      validateAndSetFiles(droppedFiles);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);
    // integrate here
    const uploadingToastId = toast.info("Uploading PDF...");
    const id = await uploadPDF(files[0]);
    toast.dismiss(uploadingToastId);
    if (id) {
      // setPdfId(id);
      router.push(`/chats/${id}`);
      toast.success("PDF uploaded successfully!");
    } else {
      toast.error("Failed to upload PDF.");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setIsUploading(false);
    setUploadProgress({});
    setError(null);
  };

  const handleDropZoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeFile = (fileName) => {
    setFiles((prev) => prev.filter((file) => file.name !== fileName));
  };

  const addRecentFile = (recentFile) => {
    // Check if file already exists in current files
    if (!files.some((file) => file.name === recentFile.name)) {
      setFiles((prev) => [
        ...prev,
        {
          name: recentFile.name,
          size: recentFile.size === "Just now" ? "5.0 MB" : recentFile.size, // Default size for demo
        },
      ]);
    }
  };

  const formatFileSize = (bytes) => {
    if (typeof bytes === "string") return bytes;
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="flex-1 p-6 overflow-auto bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[16px] font-medium text-gray-800">
            Upload Document
          </h2>
          <label className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2 shadow-sm text-[14px] cursor-pointer">
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Upload PDF
            <input
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={handleFileChange}
              ref={fileInputRef}
              multiple
            />
          </label>
        </div>

        <div className="flex justify-center items-center mb-8">
          <div
            className={`w-[600px] max-w-4xl bg-white p-8 rounded-xl border-2 border-dashed ${
              error
                ? "border-red-300"
                : "border-primary-300 hover:border-primary-500"
            } transition-all cursor-pointer shadow-sm hover:shadow-md`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleDropZoneClick}
          >
            <div className="flex flex-col items-center justify-center text-center">
              {isUploading ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-20 w-20 text-primary-400 mb-4 animate-pulse"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <h3 className="text-[16px] font-medium text-gray-800 mb-4">
                    Uploading {files.length} file(s) and creating chat index...
                  </h3>
                  <ClipLoader color="#36d7b7" size={50} />
                </>
              ) : files.length > 0 ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 text-primary-400 mb-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <path d="M12 18v-6"></path>
                    <path d="M9 15h6"></path>
                  </svg>
                  <h3 className="text-[16px] font-medium text-gray-800 mb-2">
                    {files.length} file(s) ready to upload
                  </h3>
                  <div className="w-full max-h-40 overflow-y-auto mb-4">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded mb-1"
                      >
                        <span className="text-[12px] text-gray-700 truncate max-w-xs">
                          {file.name}
                        </span>
                        <div className="flex items-center">
                          <span className="text-[10px] text-gray-500">
                            {formatFileSize(file.size)}
                          </span>
                          <button
                            className="text-gray-500 cursor-pointer p-[5px] hover:text-red-700 text-[10px] font-medium ml-2"
                            onClick={() => removeFile(file.name)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1}
                              stroke="currentColor"
                              className="size-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-sm cursor-pointer"
                      onClick={handleUpload}
                    >
                      Upload Files and Chat
                    </button>
                    <button
                      className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                      onClick={handleReset}
                    >
                      Clear Files
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 text-primary-400 mb-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <path d="M12 18v-6"></path>
                    <path d="M9 15h6"></path>
                  </svg>
                  <h3 className="text-[15px] font-medium text-gray-800 mb-2">
                    Drag & Drop your PDF files here
                  </h3>
                  <p className="text-[12px] text-gray-500 mb-6">
                    or click to browse your files
                  </p>
                  <label className="mt-6 text-[13px] px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-sm cursor-pointer">
                    Browse Files
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      multiple
                    />
                  </label>
                </>
              )}

              {error && (
                <div className="mt-4 text-red-500 text-sm max-w-xs">
                  {error}
                </div>
              )}

              <p className="text-xs text-gray-500 mt-6">
                Supported files: PDF (Max size: 10MB each)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          {/* Recent Files Column */}
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-800 mb-4">Recent Uploads</h3>
            {recentFiles.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentFiles.map((recentFile) => (
                  <div
                    key={recentFile.id}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-red-500 mr-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <line x1="10" y1="9" x2="8" y2="9"></line>
                      </svg>
                      <div>
                        <p className="font-medium text-gray-800 truncate max-w-[180px]">
                          {recentFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Uploaded {recentFile.date} · {recentFile.size}
                        </p>
                      </div>
                    </div>
                    <button
                      className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-sm"
                      onClick={() => addRecentFile(recentFile)}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-300 mb-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <p>No recent uploads</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPdf;
