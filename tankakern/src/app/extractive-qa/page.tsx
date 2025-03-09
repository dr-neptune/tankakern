"use client";
import { useState, useEffect } from "react";
import ResultCard from "../../components/ResultCard";
import PdfUpload from "../../components/PdfUpload";

export default function ExtractiveQA() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser || storedUser === "undefined" || storedUser.trim()[0] !== "{") {
      setUser(null);
    } else {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing user from localStorage", error);
        setUser(null);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await fetch("http://localhost:8000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    } else {
      const error = await res.json();
      setLoginMessage("Error: " + error.detail);
    }
  };

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

  if (!user) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-4">Login Required</h1>
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <div className="flex items-center gap-1">
              <label className="block">Email</label>
              <div className="tooltip tooltip-top" data-tip="Your registered email">
                <span className="cursor-pointer text-secondary">?</span>
              </div>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <label className="block">Password</label>
              <div className="tooltip tooltip-top" data-tip="Your account password">
                <span className="cursor-pointer text-secondary">?</span>
              </div>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>
          <button type="submit" className="btn btn-primary">Login</button>
        </form>
        {loginMessage && <p className="mt-4">{loginMessage}</p>}
      </div>
    );
  }
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
          <div className="flex items-center gap-1">
            <label htmlFor="query" className="block text-sm font-medium text-gray-700">
              Enter your question:
            </label>
            <div className="tooltip tooltip-top" data-tip="The question you want to ask about the document">
              <span className="cursor-pointer text-secondary">?</span>
            </div>
          </div>
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
