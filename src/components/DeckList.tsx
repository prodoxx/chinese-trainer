"use client";

import { useEffect, useState } from "react";
import { BookOpen, Brain, Clock, RefreshCw, Trash2, Zap, TrendingUp, Sparkles, Layers, Edit2, Check, X } from 'lucide-react';
import Link from 'next/link';
import { useAlert } from '@/hooks/useAlert';

interface DeckStats {
	totalCards: number;
	newCards: number;
	dueToday: number;
	overdue: number;
	learning: number;
	mature: number;
	averageEase: number;
	averageStrength: number;
	nextReviewDate: Date | null;
}

interface Deck {
	id: string;
	name: string;
	cardsCount: number;
	status: "importing" | "enriching" | "ready" | "error";
	enrichmentProgress?: {
		totalCards: number;
		processedCards: number;
		currentCard?: string;
		currentOperation?: string;
	};
	stats?: DeckStats;
	updatedAt: string;
}

interface DeckListProps {
	onSelectDeck: (deckId: string, mode: "new" | "review" | "practice") => void;
}

export default function DeckList({ onSelectDeck }: DeckListProps) {
	const [decks, setDecks] = useState<Deck[]>([]);
	const [loading, setLoading] = useState(true);
	const [deletingDeck, setDeletingDeck] = useState<string | null>(null);
	const [editingDeck, setEditingDeck] = useState<string | null>(null);
	const [editName, setEditName] = useState("");
	const { showAlert, showConfirm } = useAlert();

	const formatTimeUntilReview = (
		nextReviewDate: Date | string | null,
	): string => {
		if (!nextReviewDate) return "";

		const now = new Date();
		const reviewDate = new Date(nextReviewDate);
		const diffMs = reviewDate.getTime() - now.getTime();

		if (diffMs <= 0) return "Review available now";

		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffHours / 24);

		if (diffDays > 0) {
			return `Next review in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
		} else if (diffHours > 0) {
			return `Next review in ${diffHours} hour${diffHours === 1 ? "" : "s"}`;
		} else {
			const diffMinutes = Math.floor(diffMs / (1000 * 60));
			return `Next review in ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"}`;
		}
	};

	useEffect(() => {
		fetchDecks();
	}, []);

	useEffect(() => {
		// Poll for deck updates every 2 seconds if any deck is importing/enriching
		const hasNonReadyDecks = decks.some((d) => d.status === "importing" || d.status === "enriching");

		if (hasNonReadyDecks) {
			const interval = setInterval(fetchDecks, 2000);
			return () => clearInterval(interval);
		}
	}, [decks]);

	const fetchDecks = async () => {
		try {
			const response = await fetch("/api/decks");
			const data = await response.json();
			const decksData = data.decks || [];

			// Fetch stats for ready decks
			const decksWithStats = await Promise.all(
				decksData.map(async (deck: Deck) => {
					if (deck.status === "ready") {
						try {
							const statsResponse = await fetch(`/api/decks/${deck.id}/stats`);
							if (statsResponse.ok) {
								const statsData = await statsResponse.json();
								return { ...deck, stats: statsData.stats };
							}
						} catch (error) {
							console.error(
								`Failed to fetch stats for deck ${deck.id}:`,
								error,
							);
						}
					}
					return deck;
				}),
			);

			setDecks(decksWithStats);
		} catch (error) {
			console.error("Failed to fetch decks:", error);
		} finally {
			setLoading(false);
		}
	};


	const handleDelete = async (
		e: React.MouseEvent,
		deckId: string,
		deckName: string,
	) => {
		e.stopPropagation(); // Prevent deck selection

		const confirmed = await showConfirm(
			`Delete deck "${deckName}"?\n\nNote: Characters will be preserved if they're used in other decks.`,
			{ type: 'warning', confirmText: 'Delete', cancelText: 'Cancel' }
		);
		if (!confirmed) {
			return;
		}

		setDeletingDeck(deckId);

		try {
			const response = await fetch(`/api/decks/${deckId}`, {
				method: "DELETE",
			});

			const data = await response.json();

			if (response.ok) {
				// Remove deck from local state
				setDecks(decks.filter((d) => d.id !== deckId));
				showAlert(`Deck "${deckName}" deleted successfully`, { type: 'success' });
			} else {
				showAlert(`Failed to delete deck: ${data.error}`, { type: 'error' });
			}
		} catch (error) {
			console.error("Delete error:", error);
			showAlert("Failed to delete deck. Please try again.", { type: 'error' });
		} finally {
			setDeletingDeck(null);
		}
	};

	const handleEditStart = (e: React.MouseEvent, deckId: string, currentName: string) => {
		e.stopPropagation();
		e.preventDefault();
		setEditingDeck(deckId);
		setEditName(currentName);
	};

	const handleEditCancel = () => {
		setEditingDeck(null);
		setEditName("");
	};

	const handleEditSave = async (deckId: string) => {
		if (!editName.trim() || editName === decks.find(d => d.id === deckId)?.name) {
			handleEditCancel();
			return;
		}

		try {
			const response = await fetch(`/api/decks/${deckId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: editName.trim() }),
			});

			const data = await response.json();

			if (response.ok) {
				// Update deck in local state
				setDecks(decks.map(d => 
					d.id === deckId ? { ...d, name: editName.trim() } : d
				));
				showAlert("Deck name updated successfully", { type: 'success' });
			} else {
				showAlert(`Failed to update deck name: ${data.error}`, { type: 'error' });
			}
		} catch (error) {
			console.error("Update error:", error);
			showAlert("Failed to update deck name. Please try again.", { type: 'error' });
		} finally {
			handleEditCancel();
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-12">
				<div className="text-gray-500 flex items-center gap-2">
					<RefreshCw className="w-4 h-4 animate-spin" />
					Loading decks...
				</div>
			</div>
		);
	}

	if (decks.length === 0) {
		return (
			<div className="text-center p-12 bg-[#21262d] rounded-2xl border border-[#30363d] border-dashed shadow-lg">
				<Layers className="w-16 h-16 text-[#f7cc48] mx-auto mb-4" />
				<p className="text-xl text-white font-semibold">No decks yet</p>
				<p className="text-sm text-[#7d8590] mt-2">Import a deck to start your learning journey</p>
			</div>
		);
	}

	return (
		<>
			<div className="grid gap-4">
				{decks.map((deck) => (
					<div
						key={deck.id}
						className="group relative bg-gradient-to-br from-[#1e2329] to-[#161b22] rounded-3xl border border-[#30363d] p-6 sm:p-8 transition-all duration-300 hover:border-[#f7cc48]/40 overflow-x-hidden shadow-xl hover:shadow-2xl hover:scale-[1.01] hover:-translate-y-1"
					>
						{/* Animated gradient overlay */}
						<div className="absolute inset-0 bg-gradient-to-br from-[#f7cc48]/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500" />
						<div className="absolute -inset-1 bg-gradient-to-r from-[#f7cc48]/20 to-orange-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 -z-10" />
						<div className="relative">
							<Link href={`/deck/${deck.id}`} className="block">
								<div className="flex items-center gap-3 mb-3">
									<div className="w-12 h-12 bg-gradient-to-br from-[#f7cc48]/20 to-orange-500/20 rounded-xl flex items-center justify-center shadow-md">
										<BookOpen className="w-6 h-6 text-[#f7cc48]" />
									</div>
									<div className="flex-1 min-w-0">
										{editingDeck === deck.id ? (
											<div className="flex items-center gap-2">
												<input
													type="text"
													value={editName}
													onChange={(e) => setEditName(e.target.value)}
													onKeyDown={(e) => {
														if (e.key === 'Enter') {
															handleEditSave(deck.id);
														} else if (e.key === 'Escape') {
															handleEditCancel();
														}
													}}
													onClick={(e) => e.stopPropagation()}
													className="flex-1 min-w-0 px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
													autoFocus
												/>
												<button
													onClick={(e) => {
														e.stopPropagation();
														handleEditSave(deck.id);
													}}
													className="p-1 text-green-400 hover:bg-gray-800 rounded transition-colors cursor-pointer flex-shrink-0"
												>
													<Check className="w-4 h-4" />
												</button>
												<button
													onClick={(e) => {
														e.stopPropagation();
														handleEditCancel();
													}}
													className="p-1 text-gray-400 hover:bg-gray-800 rounded transition-colors cursor-pointer flex-shrink-0"
												>
													<X className="w-4 h-4" />
												</button>
											</div>
										) : (
											<div className="flex items-center gap-2 group/name">
												<h3 className="font-bold text-xl text-white group-hover:text-[#f7cc48] transition-all duration-300 truncate tracking-tight">{deck.name}</h3>
												<button
													onClick={(e) => handleEditStart(e, deck.id, deck.name)}
													className="opacity-0 group-hover/name:opacity-100 md:opacity-0 p-1 text-gray-400 hover:text-[#f7cc48] hover:bg-[#161b22] rounded transition-all cursor-pointer flex-shrink-0"
													title="Edit deck name"
												>
													<Edit2 className="w-3.5 h-3.5" />
												</button>
											</div>
										)}
										<p className="text-sm text-gray-400 flex items-center gap-2 mt-2">
											<Layers className="w-3.5 h-3.5" />
											{deck.cardsCount} cards
											{deck.status !== "ready" && (
												<span
													className={`text-xs px-2 py-0.5 rounded-full ${
														deck.status === "importing"
															? "bg-blue-900/50 text-blue-300"
															: deck.status === "enriching"
															? "bg-yellow-900/50 text-yellow-300"
															: deck.status === "error"
															? "bg-red-900/50 text-red-300"
															: "bg-gray-900/50 text-gray-300"
													}`}
												>
													{deck.status === "error" ? "Enrichment failed" : deck.status}
												</span>
											)}
										</p>
									</div>
								</div>
								{deck.stats && (
									<div className="overflow-x-auto scrollbar-hidden -mx-2 px-2 mt-4">
										<div className="flex items-center gap-6 min-w-max">
											{deck.stats.newCards > 0 && (
												<div className="flex items-center gap-2">
													<div className="flex items-center gap-1.5">
														<div className="w-6 h-6 bg-blue-500/15 rounded-md flex items-center justify-center">
															<Sparkles className="w-3 h-3 text-blue-400" />
														</div>
														<span className="text-xs text-gray-500 uppercase tracking-wide">New</span>
													</div>
													<span className="text-sm font-semibold text-gray-300">{deck.stats.newCards}</span>
												</div>
											)}
											{(deck.stats.dueToday > 0 || deck.stats.overdue > 0) && (
												<div className="flex items-center gap-2">
													<div className="flex items-center gap-1.5">
														<div className="w-6 h-6 bg-orange-500/15 rounded-md flex items-center justify-center">
															<Clock className="w-3 h-3 text-orange-400" />
														</div>
														<span className="text-xs text-gray-500 uppercase tracking-wide">Due</span>
													</div>
													<span className="text-sm font-semibold text-gray-300">{deck.stats.dueToday + deck.stats.overdue}</span>
												</div>
											)}
											{deck.stats.totalCards - deck.stats.newCards > 0 && (
												<div className="flex items-center gap-2">
													<div className="flex items-center gap-1.5">
														<div className="w-6 h-6 bg-green-500/15 rounded-md flex items-center justify-center">
															<TrendingUp className="w-3 h-3 text-green-400" />
														</div>
														<span className="text-xs text-gray-500 uppercase tracking-wide">Retention</span>
													</div>
													<span className="text-sm font-semibold text-gray-300">{Math.round(deck.stats.averageStrength * 100)}%</span>
												</div>
											)}
										</div>
									</div>
								)}
							</Link>
							
							{/* Action Buttons */}
							{deck.status === "ready" && (
								<div className="overflow-x-auto overflow-y-visible scrollbar-hidden -mx-2 px-2 mt-4 pb-1">
									<div className="flex gap-2 min-w-max">
										{deck.stats && deck.stats.newCards > 0 && (
											<button
												onClick={() => onSelectDeck(deck.id, "new")}
												className="min-w-[140px] px-4 py-3 bg-gradient-to-r from-[#f7cc48]/15 to-yellow-500/15 hover:from-[#f7cc48]/25 hover:to-yellow-500/25 text-[#f7cc48] rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 border border-[#f7cc48]/20 hover:border-[#f7cc48]/40 shadow-md hover:shadow-xl group cursor-pointer text-sm font-semibold backdrop-blur-sm"
												title={`Study ${deck.stats.newCards} new cards`}
											>
												<Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform flex-shrink-0" />
												<span className="whitespace-nowrap">Study New ({deck.stats.newCards})</span>
											</button>
										)}
										{deck.stats && (deck.stats.overdue > 0 || deck.stats.dueToday > 0) && (
											<button
												onClick={() => onSelectDeck(deck.id, "review")}
												className="min-w-[140px] px-4 py-3 bg-gradient-to-r from-orange-600/15 to-red-500/15 hover:from-orange-600/25 hover:to-red-500/25 text-orange-400 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 border border-orange-600/20 hover:border-orange-500/40 shadow-md hover:shadow-xl group cursor-pointer text-sm font-semibold backdrop-blur-sm"
												title={`Review ${deck.stats.overdue + deck.stats.dueToday} due cards`}
											>
												<Zap className="w-4 h-4 group-hover:scale-110 transition-transform flex-shrink-0" />
												<span className="whitespace-nowrap">Review ({deck.stats.overdue + deck.stats.dueToday})</span>
											</button>
										)}
										{deck.stats && deck.stats.totalCards > deck.stats.newCards && (
											<button
												onClick={() => onSelectDeck(deck.id, "practice")}
												className="min-w-[140px] px-4 py-3 bg-gradient-to-r from-green-600/15 to-emerald-500/15 hover:from-green-600/25 hover:to-emerald-500/25 text-green-400 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 border border-green-600/20 hover:border-green-500/40 shadow-md hover:shadow-xl group cursor-pointer text-sm font-semibold backdrop-blur-sm"
												title={`Practice quiz on all ${deck.stats.totalCards - deck.stats.newCards} studied cards`}
											>
												<Brain className="w-4 h-4 group-hover:scale-110 transition-transform flex-shrink-0" />
												<span className="whitespace-nowrap">Practice ({deck.stats.totalCards - deck.stats.newCards})</span>
											</button>
										)}
									</div>
								</div>
							)}
							<div className="absolute top-4 right-4">
									<button
										onClick={(e) => handleDelete(e, deck.id, deck.name)}
										disabled={deletingDeck === deck.id || (deck.status !== "ready" && deck.status !== "error")}
										className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed backdrop-blur-sm"
										title="Delete deck"
									>
										{deletingDeck === deck.id ? (
											<RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
										) : (
											<Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
										)}
									</button>
								</div>
							</div>
						
						{/* Enrichment progress - full width */}
						{(deck.status === "importing" || deck.status === "enriching") && deck.enrichmentProgress && (
							<div className="mt-4 p-4 bg-[#161b22] rounded-xl border border-[#30363d]">
								<div className="flex justify-between text-xs text-gray-400 mb-2">
									<span className="flex items-center gap-1.5">
										<RefreshCw className="w-3 h-3 animate-spin" />
										{deck.status === "importing" 
											? "Importing characters..." 
											: "Enriching characters with images and audio..."}
									</span>
									<span className="font-medium text-gray-300">
										{deck.enrichmentProgress.processedCards} of {deck.enrichmentProgress.totalCards}
									</span>
								</div>
								<div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden">
									<div
										className="bg-gradient-to-r from-[#f7cc48] to-orange-500 h-2 rounded-full transition-all duration-300"
										style={{
											width: `${(deck.enrichmentProgress.processedCards / deck.enrichmentProgress.totalCards) * 100}%`,
										}}
									/>
								</div>
								{deck.enrichmentProgress.currentCard && deck.status === "enriching" && (
									<p className="text-xs text-gray-500 mt-2 truncate">
										Currently processing: {deck.enrichmentProgress.currentCard}
									</p>
								)}
							</div>
						)}
						{(deck.status === "importing" || deck.status === "enriching") && !deck.enrichmentProgress && (
							<div className="mt-4 p-4 bg-[#161b22] rounded-xl border border-[#30363d]">
								<div className="text-sm text-gray-500 text-center">
									{deck.status === "importing" ? "Importing cards..." : "Preparing deck..."}
								</div>
							</div>
						)}
						{deck.status === "error" && (
							<div className="mt-4 p-4 bg-red-900/20 rounded-xl border border-red-900/50">
								<div className="text-sm text-red-400 text-center">
									{deck.enrichmentProgress?.currentOperation || "Enrichment failed"}
								</div>
							</div>
						)}
					</div>
				))}
			</div>
		</>
	);
}
