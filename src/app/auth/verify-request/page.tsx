import { Mail } from "lucide-react";
import Link from "next/link";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 text-center">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-6">
          <Mail className="w-10 h-10 text-blue-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
        <p className="text-gray-400 mb-8">
          A sign in link has been sent to your email address.
        </p>
        
        <Link
          href="/auth/signin"
          className="inline-block px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors border border-gray-700"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}