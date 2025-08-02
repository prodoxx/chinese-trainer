"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function MarketingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const pathname = usePathname();

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	const closeMobileMenu = () => {
		setIsMobileMenuOpen(false);
	};

	return (
		<div className="min-h-screen bg-[#0d1117]">
			{/* Navigation */}
			<nav className="border-b border-[#21262d] bg-[#0d1117]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0d1117]/60 sticky top-0 z-50">
				<div className="container mx-auto px-4 sm:px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<Link
								href="/"
								className="flex items-center space-x-2 sm:space-x-3 cursor-pointer hover:opacity-90 transition-opacity"
								onClick={closeMobileMenu}
							>
								<Image
									src="https://static.danbing.ai/danbing.png"
									alt="Danbing Mascot"
									width={32}
									height={32}
									className="rounded-lg w-8 h-8 sm:w-[32px] sm:h-[32px]"
								/>
								<div className="flex items-baseline space-x-1">
									<span className="text-xl sm:text-2xl font-bold text-white">
										Danbing
									</span>
									<span className="text-xs sm:text-sm font-medium text-[#f7cc48] bg-[#f7cc48]/10 px-1.5 sm:px-2 py-0.5 rounded-md">
										AI
									</span>
								</div>
							</Link>
						</div>
						<div className="hidden md:flex items-center space-x-8">
							<Link
								href="/how-it-works"
								className={`${
									pathname === "/how-it-works"
										? "text-[#f7cc48] font-medium"
										: "text-[#7d8590] hover:text-white"
								} transition-colors cursor-pointer`}
							>
								How It Works
							</Link>
							<Link
								href="/science"
								className={`${
									pathname === "/science"
										? "text-[#f7cc48] font-medium"
										: "text-[#7d8590] hover:text-white"
								} transition-colors cursor-pointer`}
							>
								The Science
							</Link>
							<Link
								href="/features"
								className={`${
									pathname === "/features"
										? "text-[#f7cc48] font-medium"
										: "text-[#7d8590] hover:text-white"
								} transition-colors cursor-pointer`}
							>
								Features
							</Link>
							<Link
								href="/pricing"
								className={`${
									pathname === "/pricing"
										? "text-[#f7cc48] font-medium"
										: "text-[#7d8590] hover:text-white"
								} transition-colors cursor-pointer`}
							>
								Pricing
							</Link>
						</div>

						{/* Desktop CTA buttons */}
						<div className="hidden md:flex items-center space-x-4">
							<Link
								href="/auth/signin"
								className="text-[#7d8590] hover:text-white hover:bg-[#21262d] px-4 py-2 rounded-md transition-colors cursor-pointer"
							>
								Login
							</Link>
							<Link
								href="/auth/signup"
								className="bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-medium px-4 py-2 rounded-md transition-colors cursor-pointer"
							>
								Start Learning Free
							</Link>
						</div>

						{/* Mobile menu button */}
						<button
							onClick={toggleMobileMenu}
							className="md:hidden p-2 text-[#7d8590] hover:text-white transition-colors"
							aria-label="Toggle menu"
						>
							{isMobileMenuOpen ? (
								<X className="w-6 h-6" />
							) : (
								<Menu className="w-6 h-6" />
							)}
						</button>
					</div>
				</div>

				{/* Mobile menu */}
				{isMobileMenuOpen && (
					<div className="md:hidden border-t border-[#21262d] bg-[#0d1117]/95 backdrop-blur">
						<div className="container mx-auto px-4 py-4 space-y-4">
							<Link
								href="/how-it-works"
								className={`block ${
									pathname === "/how-it-works"
										? "text-[#f7cc48] font-medium"
										: "text-[#7d8590] hover:text-white"
								} transition-colors py-2`}
								onClick={closeMobileMenu}
							>
								How It Works
							</Link>
							<Link
								href="/science"
								className={`block ${
									pathname === "/science"
										? "text-[#f7cc48] font-medium"
										: "text-[#7d8590] hover:text-white"
								} transition-colors py-2`}
								onClick={closeMobileMenu}
							>
								The Science
							</Link>
							<Link
								href="/features"
								className={`block ${
									pathname === "/features"
										? "text-[#f7cc48] font-medium"
										: "text-[#7d8590] hover:text-white"
								} transition-colors py-2`}
								onClick={closeMobileMenu}
							>
								Features
							</Link>
							<Link
								href="/pricing"
								className={`block ${
									pathname === "/pricing"
										? "text-[#f7cc48] font-medium"
										: "text-[#7d8590] hover:text-white"
								} transition-colors py-2`}
								onClick={closeMobileMenu}
							>
								Pricing
							</Link>
							<hr className="border-[#21262d]" />
							<Link
								href="/auth/signin"
								className="block text-[#7d8590] hover:text-white transition-colors py-2"
								onClick={closeMobileMenu}
							>
								Login
							</Link>
							<Link
								href="/auth/signup"
								className="block bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-medium px-4 py-2 rounded-md transition-colors text-center"
								onClick={closeMobileMenu}
							>
								Start Learning Free
							</Link>
						</div>
					</div>
				)}
			</nav>


			{children}

			{/* Footer */}
			<footer className="bg-[#161b22] border-t border-[#21262d] py-8 sm:py-12">
				<div className="container mx-auto px-4 sm:px-6">
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
						<div className="sm:col-span-2 md:col-span-1">
							<div className="flex items-center space-x-3 mb-4">
								<Image
									src="https://static.danbing.ai/danbing.png"
									alt="Danbing Mascot"
									width={24}
									height={24}
									className="rounded-lg"
								/>
								<div className="flex items-baseline space-x-1">
									<span className="text-lg font-bold text-white">Danbing</span>
									<span className="text-xs font-medium text-[#f7cc48] bg-[#f7cc48]/10 px-1.5 py-0.5 rounded">
										AI
									</span>
								</div>
							</div>
							<p className="text-[#7d8590] text-sm">
								Cloud-based Traditional Chinese learning platform powered by AI
								and cognitive science.
							</p>
						</div>

						<div>
							<h4 className="text-white font-semibold mb-4">Product</h4>
							<div className="space-y-2">
								<Link
									href="/how-it-works"
									className={`block ${
										pathname === "/how-it-works"
											? "text-[#f7cc48]"
											: "text-[#7d8590] hover:text-white"
									} transition-colors cursor-pointer`}
								>
									How It Works
								</Link>
								<Link
									href="/features"
									className={`block ${
										pathname === "/features"
											? "text-[#f7cc48]"
											: "text-[#7d8590] hover:text-white"
									} transition-colors cursor-pointer`}
								>
									Features
								</Link>
								<Link
									href="/pricing"
									className={`block ${
										pathname === "/pricing"
											? "text-[#f7cc48]"
											: "text-[#7d8590] hover:text-white"
									} transition-colors cursor-pointer`}
								>
									Pricing
								</Link>
							</div>
						</div>

						<div>
							<h4 className="text-white font-semibold mb-4">Learn</h4>
							<div className="space-y-2">
								<Link
									href="/science"
									className={`block ${
										pathname === "/science"
											? "text-[#f7cc48]"
											: "text-[#7d8590] hover:text-white"
									} transition-colors cursor-pointer`}
								>
									The Science
								</Link>
								<Link
									href="/methodology"
									className={`block ${
										pathname === "/methodology"
											? "text-[#f7cc48]"
											: "text-[#7d8590] hover:text-white"
									} transition-colors cursor-pointer`}
								>
									Methodology
								</Link>
								<Link
									href="/research"
									className={`block ${
										pathname === "/research"
											? "text-[#f7cc48]"
											: "text-[#7d8590] hover:text-white"
									} transition-colors cursor-pointer`}
								>
									Research
								</Link>
							</div>
						</div>

						<div>
							<h4 className="text-white font-semibold mb-4">Company</h4>
							<div className="space-y-2">
								<Link
									href="/about"
									className="block text-[#7d8590] hover:text-white transition-colors cursor-pointer"
								>
									About
								</Link>
								<Link
									href="/contact"
									className="block text-[#7d8590] hover:text-white transition-colors cursor-pointer"
								>
									Contact
								</Link>
								<Link
									href="/privacy"
									className="block text-[#7d8590] hover:text-white transition-colors cursor-pointer"
								>
									Privacy
								</Link>
								<Link
									href="/terms"
									className="block text-[#7d8590] hover:text-white transition-colors cursor-pointer"
								>
									Terms
								</Link>
							</div>
						</div>
					</div>

					<div className="border-t border-[#21262d] mt-8 pt-8 text-center text-[#7d8590]">
						<p className="text-sm">
							&copy; 2025 Danbing AI. All rights reserved.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
