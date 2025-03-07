"use client";
import React from "react";

interface PdfUploadProps {
  pdfFile: File | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PdfUpload({ pdfFile, handleFileChange }: PdfUploadProps) {
  return (
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
  );
}
