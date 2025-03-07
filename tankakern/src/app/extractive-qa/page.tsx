"use client";
import { useState, useEffect } from "react";
import ResultCard from "../../components/ResultCard";
import PdfUpload from "../../components/PdfUpload";

export default function ExtractiveQA() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      alert("You must be logged in to use this feature. Please register or log in.");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pdfFile) {
      alert("Please select a PDF file.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("pdf_file", pdfFile);
    formData.append("query", query);
    try {
      const res = await fetch("http://localhost:8000/data-extraction/process", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Error extracting data:", err);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Extractive QA</h1>
      <p className="mb-4 text-lg">
        This page allows you to extract answers from your PDF document by asking a question.
        Please ensure the answer exists in the document and is concise (e.g., a number, name, or brief statement).
      </p>
      <form onSubmit={handleSubmit} className="space-y-6 bg-base-200 p-6 rounded-lg shadow">
        <PdfUpload pdfFile={pdfFile} handleFileChange={handleFileChange} />
        <div>
          <label htmlFor="query" className="block text-sm font-medium text-gray-700">
            Enter your question:
          </label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., What is the impact on revenue?"
            className="textarea textarea-bordered w-full mt-2"
            rows={4}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Extract Data
        </button>
      </form>
      {loading && (
        <div className="mt-6">
          <progress className="progress progress-info w-56"></progress>
          <p className="mt-2">Processing your query...</p>
        </div>
      )}
      {result && (
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Extracted Results</h2>
          {result.reader && result.reader.answers && Array.isArray(result.reader.answers) ? (
            result.reader.answers.map((answer: any, index: number) => (
              <ResultCard key={index} answer={answer} />
            ))
          ) : (
            <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}
