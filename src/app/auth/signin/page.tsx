"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, AlertCircle } from "lucide-react";
import Image from "next/image";

export default function SignInPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [showResendVerification, setShowResendVerification] = useState(false);
	const [resendEmail, setResendEmail] = useState("");
	const [resendLoading, setResendLoading] = useState(false);
	const [resendMessage, setResendMessage] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			const result = await signIn("credentials", {
				email,
				password,
				redirect: false,
			});

			if (result?.error) {
				setError(result.error);
				// Check if the error is about email verification
				if (result.error.includes("verify your email")) {
					setShowResendVerification(true);
					setResendEmail(email);
				}
			} else {
				router.push(callbackUrl);
				router.refresh();
			}
		} catch (err) {
			setError("An unexpected error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleSignIn = () => {
		signIn("google", { callbackUrl });
	};

	const handleResendVerification = async () => {
		setResendLoading(true);
		setResendMessage("");
		
		try {
			const response = await fetch("/api/auth/resend-verification", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: resendEmail }),
			});

			const data = await response.json();

			if (response.ok) {
				setResendMessage("Verification email sent! Please check your inbox.");
				setShowResendVerification(false);
			} else {
				setResendMessage(data.error || "Failed to send verification email");
			}
		} catch (err) {
			setResendMessage("An error occurred. Please try again.");
		} finally {
			setResendLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-black">
			<div className="w-full max-w-md p-8">
				<div className="text-center mb-8">
					<Link href="/" className="inline-flex items-center space-x-3 mb-8">
						<Image
							src="https://static.danbing.ai/danbing.png"
							alt="Danbing Mascot"
							width={48}
							height={48}
							className="rounded-lg"
						/>
						<div className="flex items-baseline space-x-1">
							<span className="text-2xl font-bold text-white">Danbing</span>
							<span className="text-sm font-medium text-[#f7cc48] bg-[#f7cc48]/10 px-2 py-0.5 rounded-md">
								AI
							</span>
						</div>
					</Link>
					<h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
					<p className="text-gray-400">
						Sign in to continue your learning journey
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					{error && (
						<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
							<div className="flex items-start gap-3">
								<AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
								<div className="flex-1">
									<p className="text-sm text-red-500">{error}</p>
									{showResendVerification && (
										<button
											type="button"
											onClick={handleResendVerification}
											disabled={resendLoading}
											className="mt-2 text-sm text-blue-500 hover:text-blue-400 underline transition-colors disabled:opacity-50"
										>
											{resendLoading ? "Sending..." : "Resend verification email"}
										</button>
									)}
								</div>
							</div>
						</div>
					)}

					{resendMessage && (
						<div className={`border rounded-lg p-4 ${
							resendMessage.includes("sent") 
								? "bg-green-500/10 border-green-500/20 text-green-500" 
								: "bg-amber-500/10 border-amber-500/20 text-amber-500"
						}`}>
							<p className="text-sm">{resendMessage}</p>
						</div>
					)}

					<div>
						<label
							htmlFor="email"
							className="block text-sm font-medium text-gray-300 mb-2"
						>
							Email
						</label>
						<div className="relative">
							<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
							<input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
								placeholder="you@example.com"
								required
							/>
						</div>
					</div>

					<div>
						<label
							htmlFor="password"
							className="block text-sm font-medium text-gray-300 mb-2"
						>
							Password
						</label>
						<div className="relative">
							<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
							<input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
								placeholder="Enter your password"
								required
							/>
						</div>
					</div>

					<div className="flex items-center justify-between">
						<Link
							href="/auth/forgot-password"
							className="text-sm text-blue-500 hover:text-blue-400 transition-colors"
						>
							Forgot password?
						</Link>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-all transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed"
					>
						{isLoading ? "Signing in..." : "Sign in"}
					</button>
				</form>

				<div className="relative my-8">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-gray-800"></div>
					</div>
					<div className="relative flex justify-center text-sm">
						<span className="px-4 bg-black text-gray-500">
							Or continue with
						</span>
					</div>
				</div>

				<button
					onClick={handleGoogleSignIn}
					className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all transform hover:scale-[1.02] border border-gray-800 flex items-center justify-center gap-3"
				>
					<svg className="w-5 h-5" viewBox="0 0 24 24">
						<path
							fill="#4285F4"
							d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
						/>
						<path
							fill="#34A853"
							d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						/>
						<path
							fill="#FBBC05"
							d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						/>
						<path
							fill="#EA4335"
							d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						/>
					</svg>
					Sign in with Google
				</button>

				<p className="mt-8 text-center text-sm text-gray-500">
					Don&apos;t have an account?{" "}
					<Link
						href="/auth/signup"
						className="text-blue-500 hover:text-blue-400 transition-colors font-medium"
					>
						Sign up
					</Link>
				</p>
			</div>
		</div>
	);
}
