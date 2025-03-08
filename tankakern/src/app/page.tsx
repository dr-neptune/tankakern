"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("user")) {
      router.replace("/login");
    }
  }, [router]);

  return (
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
  );
}
