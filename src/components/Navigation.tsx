"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Home, BarChart3, Settings, LogOut, User, Menu, X, Shield } from "lucide-react";
import { useState } from "react";

export default function Navigation() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const pathname = usePathname();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const handleSignOut = async () => {
		await signOut({ redirect: false });
		router.push("/");
		setIsMobileMenuOpen(false);
	};

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	const navLinks = [
		{ href: "/decks", label: "Decks", icon: Home },
		{ href: "/analytics", label: "Analytics", icon: BarChart3 },
	];

	return (
		<nav className="bg-[#0d1117] border-b border-[#21262d] relative z-50 shadow-lg font-learning">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					<div className="flex items-center">
						<Link
							href="/"
							className="flex items-center space-x-2 sm:space-x-3"
							onClick={() => setIsMobileMenuOpen(false)}
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

						{status === "authenticated" && (
							<div className="hidden md:flex ml-10 items-baseline space-x-4">
								{navLinks.map((link) => {
									const Icon = link.icon;
									return (
										<Link
											key={link.href}
											href={link.href}
											className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
												pathname === link.href
													? "text-black bg-[#f7cc48] font-semibold"
													: "text-[#7d8590] hover:text-white hover:bg-[#21262d]"
											}`}
										>
											<Icon className="w-4 h-4" />
											{link.label}
										</Link>
									);
								})}
							</div>
						)}
					</div>

					<div className="flex items-center space-x-4">
						{status === "loading" && (
							<div className="animate-pulse">
								<div className="h-8 w-24 bg-[#21262d] rounded"></div>
							</div>
						)}

						{status === "authenticated" && session?.user && (
							<>
								{/* Desktop user menu */}
								<div className="hidden md:flex items-center space-x-4">
									{session.user.role === "admin" && (
										<Link
											href="/admin"
											className={`p-2 rounded-md transition-all ${
												pathname === "/admin"
													? "text-black bg-[#f7cc48]"
													: "text-[#7d8590] hover:text-white hover:bg-[#21262d]"
											}`}
											title="Admin Panel"
										>
											<Shield className="w-5 h-5" />
										</Link>
									)}
									
									<Link
										href="/settings"
										className={`p-2 rounded-md transition-all ${
											pathname === "/settings"
												? "text-black bg-[#f7cc48]"
												: "text-[#7d8590] hover:text-white hover:bg-[#21262d]"
										}`}
									>
										<Settings className="w-5 h-5" />
									</Link>

									<div className="relative group">
										<button className="flex items-center space-x-3 text-[#7d8590] hover:text-white transition-colors">
											{session.user.image ? (
												<img
													src={session.user.image}
													alt={session.user.name || "User"}
													className="w-8 h-8 rounded-full"
												/>
											) : (
												<div className="w-8 h-8 rounded-full bg-[#21262d] flex items-center justify-center">
													<User className="w-4 h-4" />
												</div>
											)}
											<span className="text-sm font-medium hidden lg:inline">
												{session.user.name || session.user.email}
											</span>
										</button>

										<div className="absolute right-0 mt-2 w-48 bg-[#161b22] rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
											<div className="py-1">
												<Link
													href="/profile"
													className={`block px-4 py-2 text-sm transition-colors ${
														pathname === "/profile"
															? "text-white bg-[#21262d]"
															: "text-[#7d8590] hover:bg-[#21262d] hover:text-white"
													}`}
												>
													Profile
												</Link>
												<button
													onClick={handleSignOut}
													className="block w-full text-left px-4 py-2 text-sm text-[#7d8590] hover:bg-[#21262d] hover:text-white transition-colors"
												>
													<LogOut className="w-4 h-4 inline mr-2" />
													Sign out
												</button>
											</div>
										</div>
									</div>
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
							</>
						)}

						{status === "unauthenticated" && (
							<>
								<div className="hidden md:flex items-center space-x-4">
									<Link
										href="/auth/signin"
										className="text-[#7d8590] hover:text-white hover:bg-[#21262d] px-3 py-2 rounded-md text-sm font-medium transition-colors"
									>
										Sign in
									</Link>
									<Link
										href="/auth/signup"
										className="bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-medium px-4 py-2 rounded-md text-sm transition-colors"
									>
										Get started
									</Link>
								</div>

								{/* Mobile menu button for unauthenticated users */}
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
							</>
						)}
					</div>
				</div>
			</div>

			{/* Mobile menu */}
			{isMobileMenuOpen && (
				<div className="md:hidden border-t border-[#21262d] bg-[#0d1117]">
					<div className="px-4 py-4 space-y-2">
						{status === "authenticated" && (
							<>
								{/* User info */}
								<div className="flex items-center space-x-3 px-3 py-2 mb-4 border-b border-[#21262d]">
									{session?.user?.image ? (
										<img
											src={session.user.image}
											alt={session.user.name || "User"}
											className="w-8 h-8 rounded-full"
										/>
									) : (
										<div className="w-8 h-8 rounded-full bg-[#21262d] flex items-center justify-center">
											<User className="w-4 h-4 text-[#7d8590]" />
										</div>
									)}
									<span className="text-sm font-medium text-white">
										{session?.user?.name || session?.user?.email}
									</span>
								</div>

								{/* Navigation links */}
								{navLinks.map((link) => {
									const Icon = link.icon;
									return (
										<Link
											key={link.href}
											href={link.href}
											onClick={() => setIsMobileMenuOpen(false)}
											className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
												pathname === link.href
													? "text-black bg-[#f7cc48] font-semibold"
													: "text-[#7d8590] hover:text-white hover:bg-[#21262d]"
											}`}
										>
											<Icon className="w-4 h-4" />
											{link.label}
										</Link>
									);
								})}

								<hr className="border-[#21262d] my-2" />

								<Link
									href="/profile"
									onClick={() => setIsMobileMenuOpen(false)}
									className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
										pathname === "/profile"
											? "text-black bg-[#f7cc48] font-semibold"
											: "text-[#7d8590] hover:text-white hover:bg-[#21262d]"
									}`}
								>
									<User className="w-4 h-4" />
									Profile
								</Link>

								<Link
									href="/settings"
									onClick={() => setIsMobileMenuOpen(false)}
									className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
										pathname === "/settings"
											? "text-black bg-[#f7cc48] font-semibold"
											: "text-[#7d8590] hover:text-white hover:bg-[#21262d]"
									}`}
								>
									<Settings className="w-4 h-4" />
									Settings
								</Link>

								{session?.user?.role === "admin" && (
									<Link
										href="/admin"
										onClick={() => setIsMobileMenuOpen(false)}
										className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
											pathname === "/admin"
												? "text-black bg-[#f7cc48] font-semibold"
												: "text-[#7d8590] hover:text-white hover:bg-[#21262d]"
										}`}
									>
										<Shield className="w-4 h-4" />
										Admin Panel
									</Link>
								)}

								<button
									onClick={handleSignOut}
									className="w-full px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 text-[#7d8590] hover:text-white hover:bg-[#21262d] transition-all"
								>
									<LogOut className="w-4 h-4" />
									Sign out
								</button>
							</>
						)}

						{status === "unauthenticated" && (
							<>
								<Link
									href="/auth/signin"
									onClick={() => setIsMobileMenuOpen(false)}
									className="block px-3 py-2 rounded-md text-sm font-medium text-[#7d8590] hover:text-white hover:bg-[#21262d] transition-colors"
								>
									Sign in
								</Link>
								<Link
									href="/auth/signup"
									onClick={() => setIsMobileMenuOpen(false)}
									className="block bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-medium px-4 py-2 rounded-md text-sm transition-colors text-center"
								>
									Get started
								</Link>
							</>
						)}
					</div>
				</div>
			)}
		</nav>
	);
}
