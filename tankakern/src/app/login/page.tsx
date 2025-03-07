"use client";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await fetch("http://localhost:8000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setMessage("Login successful!");
    } else {
      const error = await res.json();
      setMessage("Error: " + error.detail);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-4">Login</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label className="block">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>
        <button type="submit" className="btn btn-primary">Login</button>
      </form>
      {message && <p className="mt-4">{message}</p>}
      {user && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">User Info</h2>
          <p>ID: {user.id}</p>
          <p>Username: {user.username}</p>
          <p>Email: {user.email}</p>
        </div>
      )}
    </div>
  );
}
