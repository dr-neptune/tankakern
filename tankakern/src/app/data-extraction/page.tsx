export default function DataExtractionPage() {
  return (
    <div className="card w-full bg-base-100 shadow-xl">
      <div className="card-body">
        <h1 className="card-title">Data Extraction</h1>
        <p>This is a placeholder page for Data Extraction.</p>
      </div>
    </div>
  );
}
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
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Data Extraction</h1>
      <p className="mb-6">
        Upload a PDF document and describe what information you wish to extract. The system will process your document and extract the relevant data.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="pdf-upload" className="block text-sm font-medium text-gray-300">
            PDF Document
          </label>
          <input
            type="file"
            id="pdf-upload"
            accept="application/pdf"
            onChange={handleFileChange}
            className="mt-1 block w-full text-gray-900 bg-gray-100 border border-gray-300 rounded-md cursor-pointer focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300">
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
