"use client";
import { useState, useEffect } from "react";
import PdfUpload from "../../components/PdfUpload";
import TableViewer from "../../components/TableViewer";
import * as XLSX from "xlsx";

export default function TableExtractor() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      alert("You must be logged in to use this feature. Please register or log in.");
    }
  }, []);

  const parseMarkdownTable = (markdown: string) => {
    const lines = markdown.split('\n').filter(line => line.trim() !== '');
    // If the second line is a divider, remove it.
    if (lines.length > 1 && lines[1].match(/^\|[-\s:|]+$/)) {
      lines.splice(1, 1);
    }
    const data = lines.map(line => {
      // Remove leading/trailing pipes and split by pipe
      const row = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());
      return row;
    });
    return data;
  };

  const handleDownloadTable = (table: any) => {
    const data = parseMarkdownTable(table.markdown);
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Table${table.table_index + 1}`);
    XLSX.writeFile(wb, `Table_${table.table_index + 1}.xlsx`);
  };

  const handleDownloadAllTables = () => {
    const wb = XLSX.utils.book_new();
    tables.forEach((table, index) => {
      const data = parseMarkdownTable(table.markdown);
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, `Table${index + 1}`);
    });
    XLSX.writeFile(wb, `All_Tables.xlsx`);
  };

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
      const res = await fetch("http://localhost:8000/data-extraction/tables", {
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
      <p className="mb-4 text-lg">
        This page extracts tables from your PDF document, converting them to nicely formatted markdown tables.
        For best results, please ensure the tables in your document are well-structured.
      </p>
      <p className="mb-4 text-lg text-blue-600">
        Note: This page works best when the PDF contains clear, well-defined tables.
      </p>
      <div className="space-y-6 bg-base-200 p-6 rounded-lg shadow">
        <PdfUpload pdfFile={pdfFile} handleFileChange={handleFileChange} />
        <button onClick={handleExtractTables} className="btn btn-secondary">
          Extract Tables
        </button>
      </div>
      {loading && (
        <div className="mt-6">
          <progress className="progress progress-info w-56"></progress>
          <p className="mt-2">Extracting tables...</p>
        </div>
      )}
      {tables.length > 0 && (
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Extracted Tables</h2>
          <button onClick={handleDownloadAllTables} className="btn btn-accent mb-4">
            Download All Tables as Excel
          </button>
          {tables.map((table: any, index: number) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold">Table {table.table_index + 1}:</h3>
                <button onClick={() => handleDownloadTable(table)} className="btn btn-secondary text-sm">
                  Export Table
                </button>
              </div>
              <TableViewer markdown={table.markdown} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
