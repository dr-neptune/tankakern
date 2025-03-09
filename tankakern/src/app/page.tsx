"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser || storedUser === "undefined") {
      router.replace("/login");
    } else {
      if (storedUser.trim()[0] !== "{") {
        console.error("Invalid user data in localStorage", storedUser);
        localStorage.removeItem("user");
        router.replace("/login");
      } else {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Error parsing user from localStorage", error);
          localStorage.removeItem("user");
          router.replace("/login");
        }
      }
    }
  }, [router]);

  return (
    <>
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">PE Lab</h1>
            <p className="py-6">
              A Private Equity exploration platform. Under construction!
            </p>
            <div className="flex justify-center gap-4">
              <a className="btn btn-primary" href="#">
                Launch
              </a>
              <a className="btn btn-secondary" href="#">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>
      {user && (
        <div className="fixed bottom-0 left-0 p-4">
          <p className="text-sm">
            Logged in as: <span className="font-bold">{user.username}</span>
          </p>
        </div>
      )}
    </>
  );
}
