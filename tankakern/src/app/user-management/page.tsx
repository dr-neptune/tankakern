"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserManagement() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined" && storedUser.trim() !== "") {
      try {
        const parsed = JSON.parse(storedUser);
        setUsername(parsed.username ?? "");
        if (parsed.profilePicture) {
          setProfilePicture(parsed.profilePicture);
        }
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
        parsed.profilePicture = profilePicture;
        localStorage.setItem("user", JSON.stringify(parsed));
        
        const res = await fetch("/api/user_management", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: parsed.id,
            username,
            profilePicture
          })
        });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error("Failed to update database: " + errorText);
        }
        
        setMessage("Display name and profile picture updated.");
      } catch (error) {
        console.error("Error updating user", error);
        setMessage("Error updating user.");
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
        <div>
          <label className="block">Profile Picture</label>
          <div className="flex items-center gap-4">
            <div className="avatar">
              <div className="w-24 rounded">
                <img src={profilePicture || "https://placeimg.com/192/192/people"} alt="Profile Picture" />
              </div>
            </div>
            <input type="file" accept="image/*" onChange={handleProfilePictureChange} className="file-input file-input-bordered w-full max-w-xs" />
          </div>
        </div>
        <button type="submit" className="btn btn-primary">Update Display Name</button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
