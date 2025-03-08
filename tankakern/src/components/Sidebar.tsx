"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Sidebar() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        setUser(null);
      }
    }
  }, []);
  return (
    <aside className="menu w-64 p-4 bg-base-100 text-base-content">
      <div className="mb-4">
        <Link href="/">
          <button className="btn btn-ghost text-pink-500 hover:text-pink-600 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 9.75L12 3l9 6.75V21a1.5 1.5 0 01-1.5 1.5H4.5A1.5 1.5 0 013 21V9.75z"
              />
            </svg>
            Home
          </button>
        </Link>
      </div>
      <div className="mt-4">
        <span className="block text-sm font-bold text-gray-700 mb-2">Data Extraction</span>
        <ul className="menu bg-base-100 p-2 rounded-box">
          <li>
            <Link href="/extractive-qa" className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
              </svg>
              Extractive QA
            </Link>
          </li>
          <li>
            <Link href="/table-extractor" className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18" />
              </svg>
              Table Extractor
            </Link>
          </li>
        </ul>
      </div>
      <ul className="menu bg-base-100 p-2 rounded-box mt-4">
        <li>
          <Link href="/performance" className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 10h4v10H3zM9 6h4v14H9zM15 14h4v6h-4z"
              />
            </svg>
            Performance
          </Link>
        </li>
        <li>
          <Link href="/track-record" className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3a9 9 0 110 18 9 9 0 010-18z"
              />
            </svg>
            Track Record
          </Link>
        </li>
        <li>
          <Link href="/relationships" className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 110-8 4 4 0 010 8z"
              />
            </svg>
            Relationships
          </Link>
        </li>
      </ul>
      {user && (
        <div className="mt-4 text-center">
          <p className="text-sm">
            Logged in as: <span className="font-bold">{user.username}</span>
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("user");
              window.location.href = "/login";
            }}
            className="btn btn-sm btn-secondary mt-2"
          >
            Logout
          </button>
        </div>
      )}
    </aside>
  );
}
