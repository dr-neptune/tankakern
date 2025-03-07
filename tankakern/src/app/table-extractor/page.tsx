"use client";
import { useState } from "react";
import PdfUpload from "../../components/PdfUpload";
import TableViewer from "../../components/TableViewer";

export default function TableExtractor() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleExtractTables = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!pdfFile) {
      alert("Please select a PDF file.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("pdf_file", pdfFile);
    try {
      const res = await fetch("http://localhost:8000/extract-tables", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setTables(data.tables || []);
    } catch (err) {
      console.error("Error extracting tables:", err);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Table Extraction</h1>
      <p className="mb-4 text-lg text-blue-600">
        Note: This page extracts all tables from your PDF document. It works best when the PDF contains well-defined tables.
      </p>
      <div className="space-y-6 bg-base-200 p-6 rounded-lg shadow">
        <PdfUpload pdfFile={pdfFile} handleFileChange={handleFileChange} />
        <button onClick={handleExtractTables} className="btn btn-secondary">
          Extract Tables
        </button>
      </div>
      {loading && (
        <div className="mt-6">
          <p>Extracting tables...</p>
        </div>
      )}
      {tables.length > 0 && (
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Extracted Tables</h2>
          {tables.map((table: any, index: number) => (
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
