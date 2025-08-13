"use client";

import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import DeckImport from "@/components/DeckImport";
import DeckList from "@/components/DeckList";
import FlashSession from "@/components/FlashSession";
import ManualDeckForm from "@/components/ManualDeckForm";

export default function DashboardPage() {
	const [view, setView] = useState<"home" | "session">("home");
	const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
	const [sessionMode, setSessionMode] = useState<"new" | "review" | "practice">(
		"new",
	);
	const [refreshDecks, setRefreshDecks] = useState(0);

	const handleSelectDeck = (
		deckId: string,
		mode: "new" | "review" | "practice",
	) => {
		setSelectedDeckId(deckId);
		setSessionMode(mode);
		setView("session");
	};

	const handleExitSession = () => {
		setView("home");
		setSelectedDeckId(null);
	};

	const handleImportComplete = () => {
		setRefreshDecks((prev) => prev + 1);
	};

	if (view === "session" && selectedDeckId) {
		return (
			<FlashSession
				deckId={selectedDeckId}
				mode={sessionMode}
				onExit={handleExitSession}
			/>
		);
	}

	return (
		<>
			<Navigation />
			<div className="min-h-[calc(100vh-4rem)] bg-[#0d1117] font-learning flex flex-col">
				{/* Vibrant gradient background matching marketing pages */}
				<div className="fixed inset-0 z-0 overflow-hidden">
					<div className="absolute inset-0 bg-gradient-to-br from-[#f7cc48]/20 via-[#0d1117] to-[#f7cc48]/10" />
					<div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 via-transparent to-yellow-500/10" />
					<div className="absolute top-0 left-1/4 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-[#f7cc48]/20 rounded-full filter blur-3xl animate-pulse" />
					<div className="absolute bottom-0 right-1/4 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-orange-500/20 rounded-full filter blur-3xl animate-pulse" />
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[400px] md:w-[600px] h-[300px] sm:h-[400px] md:h-[600px] bg-[#f7cc48]/10 rounded-full filter blur-3xl" />
				</div>

				<div className="relative z-10 flex-1 flex flex-col">
					{/* Beta Banner */}
					<div className="bg-[#161b22] border-y border-[#30363d]">
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
							<div className="flex items-center justify-center gap-2 text-sm">
								<span className="inline-flex items-center gap-1.5 text-blue-400">
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<span className="font-medium">Beta Version</span>
								</span>
								<span className="text-[#7d8590]">
									We're actively improving this experience. Some features may not work as expected. Please report any issues you encounter.
								</span>
							</div>
						</div>
					</div>

					{/* Main Content */}
					<main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
						<div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
							{/* Decks Section - Takes up 2 columns */}
							<div className="lg:col-span-2">
								<div className="mb-4 sm:mb-6">
									<h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f7cc48] to-orange-400 mb-1 sm:mb-2">
										Your Learning Decks
									</h2>
									<p className="text-xs sm:text-sm text-[#7d8590]">
										Select a deck to begin your focused study session
									</p>
								</div>
								<DeckList key={refreshDecks} onSelectDeck={handleSelectDeck} />
							</div>

							{/* Import Section - Takes up 1 column */}
							<div>
								<div className="mb-4 sm:mb-6">
									<h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f7cc48] to-yellow-500 mb-1 sm:mb-2">
										Add New Deck
									</h2>
									<p className="text-xs sm:text-sm text-[#7d8590]">
										Create a new deck manually
									</p>
								</div>

								{/* Manual Deck Creation Form */}
								<ManualDeckForm onDeckCreated={handleImportComplete} />

								{/* Horizontal Divider */}
								<div className="flex items-center my-6">
									<div className="flex-1 h-px bg-[#30363d]"></div>
									<span className="px-4 text-sm text-[#7d8590]">or</span>
									<div className="flex-1 h-px bg-[#30363d]"></div>
								</div>

								{/* CSV Import Section */}
								<div>
									<p className="text-xs sm:text-sm text-[#7d8590] mb-4">
										Import CSV files with Chinese characters (one per line)
									</p>
									<div className="bg-[#21262d] rounded-2xl border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 p-4 sm:p-6 shadow-lg shadow-[#f7cc48]/10 relative overflow-hidden group">
										<div className="absolute inset-0 bg-gradient-to-br from-[#f7cc48]/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
										<div className="relative">
											<DeckImport onImportComplete={handleImportComplete} />
										</div>
									</div>
								</div>
							</div>
						</div>
					</main>

					<Footer />
				</div>
			</div>
		</>
	);
}
