"use client";
import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

interface TableViewerProps {
  markdown: string;
}

export default function TableViewer({ markdown }: TableViewerProps) {
  return (
    <div className="markdown-table overflow-auto p-4">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({node, ...props}) => (
            <table className="table-auto w-full border-collapse border border-gray-300" {...props} />
          ),
          th: ({node, children, ...props}) => (
            <th className="border border-gray-300 px-4 py-2 bg-gray-100" {...props}>
              {!children || (Array.isArray(children) && children.join("").trim() === "") ? "\u00A0" : children}
            </th>
          ),
          td: ({node, children, ...props}) => (
            <td className="border border-gray-300 px-4 py-2" {...props}>
              {!children || (Array.isArray(children) && children.join("").trim() === "") ? "\u00A0" : children}
            </td>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
