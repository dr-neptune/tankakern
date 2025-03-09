"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserManagement() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const updateUser = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser && storedUser !== "undefined" && storedUser.trim() !== "") {
        try {
          const parsed = JSON.parse(storedUser);
          const res = await fetch(`http://localhost:8000/user-management/${parsed.id}`);
          if (res.ok) {
            const data = await res.json();
            setUsername(data.username);
            setProfilePicture(data.profile_picture);
            localStorage.setItem("user", JSON.stringify(data));
          } else {
            console.error("Failed to fetch user from backend");
          }
        } catch (error) {
          console.error("Error updating user from backend", error);
        }
      }
    };
    updateUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage("No file selected.");
      return;
    }
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined" && storedUser.trim() !== "") {
      try {
        const parsed = JSON.parse(storedUser);
        const formData = new FormData();
        formData.append("user_id", parsed.id.toString());
        formData.append("file", selectedFile);
  
        const res = await fetch("http://localhost:8000/user-management/upload-profile-picture", {
          method: "POST",
          body: formData
        });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error("Failed to update profile picture: " + errorText);
        }
        const data = await res.json();
        // Optionally update user's profilePicture in local storage based on response
        parsed.profilePicture = data.filename;
        localStorage.setItem("user", JSON.stringify(parsed));
        setMessage("Profile picture updated.");
      } catch (error) {
        console.error("Error updating profile picture", error);
        setMessage("Error updating profile picture.");
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
