"use client";
import React from "react";

const renderHighlightedContext = (
  context: string,
  offset: { start: number; end: number }
) => {
  const before = context.slice(0, offset.start);
  const highlight = context.slice(offset.start, offset.end);
  const after = context.slice(offset.end);
  return (
    <p className="whitespace-pre-wrap">
      {before}
      <mark className="bg-yellow-300 px-1">{highlight}</mark>
      {after}
    </p>
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
        <h2 className="card-title">Answer: {answer.data || "No answer provided"}</h2>
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
