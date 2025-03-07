"use client";
import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

const renderHighlightedContext = (
  context: string,
  offset: { start: number; end: number }
) => {
  const before = context.slice(0, offset.start);
  const highlight = context.slice(offset.start, offset.end);
  const after = context.slice(offset.end);
  const combined = `${before}<mark class="bg-yellow-300 px-1">${highlight}</mark>${after}`;
  return (
    <div className="whitespace-pre-wrap">
      <ReactMarkdown rehypePlugins={[rehypeRaw]}>
        {combined}
      </ReactMarkdown>
    </div>
  );
};

interface ResultCardProps {
  answer: {
    score: number;
    data: string | null;
    document_offset: { start: number; end: number } | null;
    context?: string;
  };
}

export default function ResultCard({ answer }: ResultCardProps) {
  return (
    <div className="card bg-base-200 shadow-xl mb-4">
      <div className="card-body">
        <h2 className="card-title">Answer:</h2>
        <div className="markdown-answer">
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>
            {answer.data || "No answer provided"}
          </ReactMarkdown>
        </div>
        <p>Score: {answer.score}</p>
        {answer.document_offset && (
          <p>
            Document Offset: {answer.document_offset.start} - {answer.document_offset.end}
          </p>
        )}
        {answer.context && answer.document_offset ? (
          <div className="mt-2">
            <strong>Context:</strong>
            {renderHighlightedContext(answer.context, answer.document_offset)}
          </div>
        ) : answer.context ? (
          <p className="mt-2">
            <strong>Context:</strong> {answer.context}
          </p>
        ) : null}
      </div>
    </div>
  );
}
