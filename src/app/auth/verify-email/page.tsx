"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setMessage(data.error || "Verification failed");
        } else {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
          setTimeout(() => {
            router.push("/auth/signin");
          }, 3000);
        }
      } catch (err) {
        setStatus("error");
        setMessage("An unexpected error occurred");
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 text-center">
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin" />
            <h1 className="text-2xl font-bold text-white">Verifying your email...</h1>
            <p className="text-gray-400">Please wait while we verify your email address</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Email verified!</h1>
            <p className="text-gray-400">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to sign in...</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Verification failed</h1>
            <p className="text-gray-400">{message}</p>
            <Link
              href="/auth/signin"
              className="inline-block mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="w-full max-w-md p-8 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin" />
            <h1 className="text-2xl font-bold text-white">Loading...</h1>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}