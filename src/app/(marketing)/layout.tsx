import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function MarketingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen bg-[#0d1117]">
			{/* Navigation */}
			<nav className="border-b border-[#21262d] bg-[#0d1117]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0d1117]/60 sticky top-0 z-50">
				<div className="container mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<Link
								href="/"
								className="flex items-center space-x-3 cursor-pointer"
							>
								<Image
									src="https://storage.danbing.ai/danbing_mascot_small.png"
									alt="Danbing Mascot"
									width={32}
									height={32}
									className="rounded-lg"
								/>
								<div className="flex items-baseline space-x-1">
									<span className="text-2xl font-bold text-white">Danbing</span>
									<span className="text-sm font-medium text-[#f7cc48] bg-[#f7cc48]/10 px-2 py-0.5 rounded-md">
										AI
									</span>
								</div>
							</Link>
						</div>
						<div className="hidden md:flex items-center space-x-8">
							<Link
								href="/how-it-works"
								className="text-[#7d8590] hover:text-white transition-colors cursor-pointer"
							>
								How It Works
							</Link>
							<Link
								href="/science"
								className="text-[#7d8590] hover:text-white transition-colors cursor-pointer"
							>
								The Science
							</Link>
							<Link
								href="/features"
								className="text-[#7d8590] hover:text-white transition-colors cursor-pointer"
							>
								Features
							</Link>
							<Link
								href="/pricing"
								className="text-[#7d8590] hover:text-white transition-colors cursor-pointer"
							>
								Pricing
							</Link>
						</div>
						<div className="flex items-center space-x-4">
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
					</div>
				</div>
			</nav>

			{/* Announcement Bar */}
			<div className="bg-[#21262d] border-b border-[#30363d] py-3">
				<div className="container mx-auto px-6">
					<div className="flex items-center justify-center space-x-2 text-sm">
						<span className="text-[#7d8590]">
							New: Cloud-based learning with cross-device sync - learn anywhere,
							anytime
						</span>
						<ArrowRight className="w-4 h-4 text-[#f7cc48]" />
					</div>
				</div>
			</div>

			{children}

			{/* Footer */}
			<footer className="bg-[#161b22] border-t border-[#21262d] py-12">
				<div className="container mx-auto px-6">
					<div className="grid md:grid-cols-4 gap-8">
						<div>
							<div className="flex items-center space-x-3 mb-4">
								<Image
									src="https://storage.danbing.ai/danbing_mascot_small.png"
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
							<p className="text-[#7d8590]">
								Cloud-based Traditional Chinese learning platform powered by AI
								and cognitive science.
							</p>
						</div>

						<div>
							<h4 className="text-white font-semibold mb-4">Product</h4>
							<div className="space-y-2">
								<Link
									href="/how-it-works"
									className="block text-[#7d8590] hover:text-white transition-colors cursor-pointer"
								>
									How It Works
								</Link>
								<Link
									href="/features"
									className="block text-[#7d8590] hover:text-white transition-colors cursor-pointer"
								>
									Features
								</Link>
								<Link
									href="/pricing"
									className="block text-[#7d8590] hover:text-white transition-colors cursor-pointer"
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
									className="block text-[#7d8590] hover:text-white transition-colors cursor-pointer"
								>
									The Science
								</Link>
								<Link
									href="/methodology"
									className="block text-[#7d8590] hover:text-white transition-colors cursor-pointer"
								>
									Methodology
								</Link>
								<Link
									href="/research"
									className="block text-[#7d8590] hover:text-white transition-colors cursor-pointer"
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
						<p>&copy; 2025 Danbing AI. All rights reserved.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
