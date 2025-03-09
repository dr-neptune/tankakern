"use client";
import { useState } from "react";
import ResultCard from "../../components/ResultCard";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import TableViewer from "../../components/TableViewer";

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
  const [extractedTables, setExtractedTables] = useState<any[]>([]);

  const handleExtractTables = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!pdfFile) {
      alert("Please select a PDF file.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("pdf_file", pdfFile);
    fetch("http://localhost:8000/data-extraction/tables", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((result) => {
        setExtractedTables(result.tables || []);
      })
      .catch((error) => {
        console.error("Error extracting tables:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

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
    fetch("http://localhost:8000/data-extraction/process", {
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
          <div className="flex items-center gap-1">
            <label htmlFor="pdf-upload" className="block text-sm font-medium text-gray-700">
              PDF Document
            </label>
            <div className="tooltip tooltip-top" data-tip="Select the PDF file to process">
              <span className="cursor-pointer text-secondary">?</span>
            </div>
          </div>
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
          <div className="flex items-center gap-1">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Enter your question:
            </label>
            <div className="tooltip tooltip-top" data-tip="Specify the question for data extraction">
              <span className="cursor-pointer text-secondary">?</span>
            </div>
          </div>
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
      <button onClick={handleExtractTables} className="btn btn-secondary mt-4">
        Extract Tables
      </button>
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
      {extractedTables.length > 0 && (
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Extracted Tables</h2>
          {extractedTables.map((table, index) => (
            <div key={index} className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Table {table.table_index + 1}:</h3>
              <TableViewer markdown={table.markdown} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
