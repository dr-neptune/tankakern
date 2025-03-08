"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserManagement() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined" && storedUser.trim() !== "") {
      try {
        const parsed = JSON.parse(storedUser);
        setUsername(parsed.username ?? "");
      } catch (error) {
        console.error("Error parsing user", error);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined" && storedUser.trim() !== "") {
      try {
        const parsed = JSON.parse(storedUser);
        parsed.username = username;
        localStorage.setItem("user", JSON.stringify(parsed));
        setMessage("Display name updated.");
      } catch (error) {
        console.error("Error updating user", error);
        setMessage("Error updating username.");
      }
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-4">User Management</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Display Name</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>
        <button type="submit" className="btn btn-primary">Update Display Name</button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
