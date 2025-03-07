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
    <div className="markdown-table overflow-auto">
      <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
