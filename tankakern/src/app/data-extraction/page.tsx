"use client";
import { useState } from "react";
import ResultCard from "../../components/ResultCard";

export default function DataExtractionPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const [extractedResult, setExtractedResult] = useState<any>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pdfFile) {
      alert("Please select a PDF file.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("pdf_file", pdfFile);
    formData.append("query", description);
    fetch("http://localhost:8000/extractive-qa/process", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((result) => {
          setExtractedResult(result);
      })
      .catch((error) => {
        console.error("Error extracting data:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Extractive QA</h1>
      <p className="mb-8 text-lg">
        Welcome to the Data Extraction tool. Here, you can upload a PDF file and specify what information you need extracted from it.
        This tool is designed to help you quickly extract the relevant data from your documents.
      </p>
      <p className="mb-8 text-lg text-blue-600">
        Note: The app will return the most likely answers to your question with the key context highlighted.
        For best results, please ensure that the answer exists and is short (e.g. a number or a name).
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
            className="file-input file-input-bordered w-full"
          />
          {pdfFile && (
            <p className="mt-2 text-sm text-gray-600">
              Selected file: {pdfFile.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Enter your question:
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={handleDescriptionChange}
            placeholder="e.g., What is the impact on revenue?"
            className="textarea textarea-bordered w-full"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Extract Data
        </button>
      </form>
      {loading && (
        <div className="mt-6">
          <progress className="progress progress-info w-56"></progress>
          <p className="mt-2">Processing query: {description}</p>
        </div>
      )}
      {extractedResult && (
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Extracted Results</h2>
          {extractedResult.reader &&
          extractedResult.reader.answers &&
          Array.isArray(extractedResult.reader.answers) ? (
            extractedResult.reader.answers.map((answer: any, index: number) => (
              <ResultCard key={index} answer={answer} />
            ))
          ) : (
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(extractedResult, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
