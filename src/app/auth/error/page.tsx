"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification link has expired or has already been used.",
  OAuthSignin: "Error occurred while trying to sign in with OAuth provider.",
  OAuthCallback: "Error occurred during OAuth callback.",
  OAuthCreateAccount: "Could not create OAuth provider user in the database.",
  EmailCreateAccount: "Could not create email provider user in the database.",
  Callback: "Error occurred during callback.",
  OAuthAccountNotLinked: "This account is already linked with another provider.",
  EmailSignin: "The email could not be sent.",
  CredentialsSignin: "The credentials provided are incorrect.",
  SessionRequired: "Please sign in to access this page.",
  Default: "An unexpected error occurred.",
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  
  const errorMessage = error && errorMessages[error] 
    ? errorMessages[error] 
    : errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 text-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Authentication Error</h1>
        <p className="text-gray-400 mb-8">{errorMessage}</p>
        
        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Try signing in again
          </Link>
          
          <Link
            href="/"
            className="block w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors border border-gray-800"
          >
            Go to homepage
          </Link>
        </div>
        
        <p className="mt-8 text-sm text-gray-500">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}