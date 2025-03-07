"use client";
import { useState } from "react";

export default function DataExtractionPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Handle file upload and data extraction logic here
    console.log("PDF File:", pdfFile);
    console.log("Description:", description);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Data Extraction</h1>
      <p className="mb-8 text-lg">
        Welcome to the Data Extraction tool. Here, you can upload a PDF file and specify what information you need extracted from it.
        This tool is designed to help you quickly extract the relevant data from your documents.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6 bg-base-200 p-6 rounded-lg shadow">
        <div>
          <label htmlFor="pdf-upload" className="block text-sm font-medium text-gray-700">
            PDF Document
          </label>
          <input
            type="file"
            id="pdf-upload"
            accept="application/pdf"
            onChange={handleFileChange}
            className="mt-1 block w-full text-gray-900 bg-gray-100 border border-gray-300 rounded-md cursor-pointer focus:outline-none"
          />
          {pdfFile && (
            <p className="mt-2 text-sm text-gray-600">
              Selected file: {pdfFile.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            What data are you looking for?
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={handleDescriptionChange}
            placeholder="e.g., extract tables related to financial performance"
            className="mt-1 block w-full p-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Extract Data
        </button>
      </form>
    </div>
  );
}
