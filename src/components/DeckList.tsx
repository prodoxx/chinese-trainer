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
	status: "importing" | "enriching" | "ready";
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
	const [enrichingDeck, setEnrichingDeck] = useState<string | null>(null);
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
		const hasNonReadyDecks = decks.some((d) => d.status !== "ready");

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

	const handleReEnrich = async (e: React.MouseEvent, deckId: string) => {
		e.stopPropagation(); // Prevent deck selection

		const isForce = e.shiftKey;
		const message = isForce
			? "Force re-enrich ALL images in this deck? This will update ALL images (but only add missing audio)."
			: "Re-enrich cards with missing/placeholder images and audio in this deck?";

		const confirmed = await showConfirm(message);
		if (!confirmed) {
			return;
		}

		setEnrichingDeck(deckId);

		try {
			const response = await fetch(`/api/decks/${deckId}/re-enrich`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					force: isForce,
					sessionId: `session-${Date.now()}`,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				console.log(`Re-enrichment job queued: ${data.jobId}`);
				// Refresh decks to show the updated status
				await fetchDecks();
			} else {
				showAlert(`Re-enrichment failed: ${data.error}`, { type: 'error' });
			}
		} catch (error) {
			console.error("Re-enrichment error:", error);
			showAlert("Re-enrichment failed. Please try again.", { type: 'error' });
		} finally {
			setEnrichingDeck(null);
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
			<div className="text-center p-12 bg-[#21262d] rounded-2xl border border-[#30363d] border-dashed">
				<Layers className="w-12 h-12 text-[#f7cc48] mx-auto mb-4" />
				<p className="text-white font-semibold">No decks yet</p>
				<p className="text-sm text-[#7d8590] mt-1">Import a deck to start your learning journey</p>
			</div>
		);
	}

	return (
		<>
			<div className="grid gap-4">
				{decks.map((deck) => (
					<div
						key={deck.id}
						className="group relative bg-[#21262d] rounded-2xl border border-[#30363d] p-4 sm:p-6 transition-all duration-300 hover:border-[#f7cc48]/50 overflow-hidden"
					>
						{/* Gradient overlay */}
						<div className="absolute inset-0 bg-gradient-to-br from-[#f7cc48]/10 via-transparent to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
						<div className="relative flex justify-between items-start">
							<Link href={`/deck/${deck.id}`} className="flex-1 cursor-pointer">
								<div className="flex items-center gap-3 mb-3">
									<div className="w-10 h-10 bg-gradient-to-br from-[#f7cc48]/20 to-orange-500/20 rounded-xl flex items-center justify-center">
										<BookOpen className="w-5 h-5 text-[#f7cc48]" />
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
												<h3 className="font-semibold text-white group-hover:text-[#f7cc48] transition-colors truncate">{deck.name}</h3>
												<button
													onClick={(e) => handleEditStart(e, deck.id, deck.name)}
													className="opacity-0 group-hover/name:opacity-100 md:opacity-0 p-1 text-gray-400 hover:text-[#f7cc48] hover:bg-[#161b22] rounded transition-all cursor-pointer flex-shrink-0"
													title="Edit deck name"
												>
													<Edit2 className="w-3.5 h-3.5" />
												</button>
											</div>
										)}
										<p className="text-xs sm:text-sm text-gray-500 flex items-center gap-2 mt-1">
											<Layers className="w-3 h-3" />
											{deck.cardsCount} cards
											{deck.status !== "ready" && (
												<span
													className={`text-xs px-2 py-0.5 rounded-full ${
														deck.status === "importing"
															? "bg-blue-900/50 text-blue-300"
															: "bg-yellow-900/50 text-yellow-300"
													}`}
												>
													{deck.status}
												</span>
											)}
										</p>
									</div>
								</div>
								{deck.stats && (
									<>
										<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
											{deck.stats.newCards > 0 && (
												<div className="bg-blue-900/20 rounded-lg p-2 border border-blue-900/30">
													<div className="flex items-center gap-1.5">
														<Sparkles className="w-3 h-3 text-blue-400" />
														<span className="text-xs text-blue-300">New</span>
													</div>
													<p className="text-sm font-semibold text-blue-200 mt-0.5">{deck.stats.newCards}</p>
												</div>
											)}
											{deck.stats.overdue > 0 && (
												<div className="bg-red-900/20 rounded-lg p-2 border border-red-900/30">
													<div className="flex items-center gap-1.5">
														<Zap className="w-3 h-3 text-red-400" />
														<span className="text-xs text-red-300">Overdue</span>
													</div>
													<p className="text-sm font-semibold text-red-200 mt-0.5">{deck.stats.overdue}</p>
												</div>
											)}
											{deck.stats.dueToday > 0 && (
												<div className="bg-yellow-900/20 rounded-lg p-2 border border-yellow-900/30">
													<div className="flex items-center gap-1.5">
														<Clock className="w-3 h-3 text-yellow-400" />
														<span className="text-xs text-yellow-300">Due</span>
													</div>
													<p className="text-sm font-semibold text-yellow-200 mt-0.5">{deck.stats.dueToday}</p>
												</div>
											)}
											{deck.stats.totalCards - deck.stats.newCards > 0 && (
												<div className="bg-green-900/20 rounded-lg p-2 border border-green-900/30">
													<div className="flex items-center gap-1.5">
														<TrendingUp className="w-3 h-3 text-green-400" />
														<span className="text-xs text-green-300">Retention</span>
													</div>
													<p className="text-sm font-semibold text-green-200 mt-0.5">
														{Math.round(deck.stats.averageStrength * 100)}%
													</p>
												</div>
											)}
										</div>
										{deck.stats.nextReviewDate &&
											deck.stats.overdue === 0 &&
											deck.stats.dueToday === 0 && (
												<div className="text-xs text-gray-500 mt-3 flex items-center gap-1">
													<Clock className="w-3 h-3" />
													{formatTimeUntilReview(deck.stats.nextReviewDate)}
												</div>
											)}
									</>
								)}
							</Link>
							<div className="flex flex-col gap-2">
								{/* Action buttons */}
								<div className="flex gap-1 sm:gap-2 justify-end">
									<button
										onClick={(e) => handleReEnrich(e, deck.id)}
										disabled={
											enrichingDeck === deck.id || deck.status !== "ready"
										}
										className="p-1.5 sm:p-2 text-[#7d8590] hover:text-[#f7cc48] hover:bg-[#161b22] rounded-lg transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
										title="Re-enrich missing images/audio (Shift+click to force update ALL)"
									>
										{enrichingDeck === deck.id ? (
											<RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
										) : (
											<RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
										)}
									</button>
									<button
										onClick={(e) => handleDelete(e, deck.id, deck.name)}
										disabled={deletingDeck === deck.id || deck.status !== "ready"}
										className="p-1.5 sm:p-2 text-[#7d8590] hover:text-red-400 hover:bg-[#161b22] rounded-lg transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
										title="Delete deck"
									>
										{deletingDeck === deck.id ? (
											<RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
										) : (
											<Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
										)}
									</button>
								</div>
								{/* Study buttons or enrichment progress */}
								{deck.status === "ready" ? (
									<div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-3 pt-3 border-t border-[#30363d]">
										{deck.stats &&
											deck.stats.newCards > 0 && (
												<button
													onClick={() => onSelectDeck(deck.id, "new")}
													className="flex-1 min-w-0 sm:min-w-[120px] px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-[#f7cc48]/20 to-yellow-500/20 hover:from-[#f7cc48]/30 hover:to-yellow-500/30 text-[#f7cc48] rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 border border-[#f7cc48]/30 hover:border-[#f7cc48]/50 group cursor-pointer"
													title={`Study ${deck.stats.newCards} new cards`}
												>
													<Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
													<span className="text-xs sm:text-sm font-medium">
														<span className="hidden sm:inline">Study New</span>
														<span className="sm:hidden">New</span> ({deck.stats.newCards})
													</span>
												</button>
											)}
										{deck.stats &&
											(deck.stats.overdue > 0 || deck.stats.dueToday > 0) && (
												<button
													onClick={() => onSelectDeck(deck.id, "review")}
													className="flex-1 min-w-0 sm:min-w-[120px] px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-orange-600/20 to-red-500/20 hover:from-orange-600/30 hover:to-red-500/30 text-orange-400 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 border border-orange-800/50 hover:border-orange-700/50 group cursor-pointer"
													title={`Review ${deck.stats.overdue + deck.stats.dueToday} due cards`}
												>
													<Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
													<span className="text-xs sm:text-sm font-medium">Review ({deck.stats.overdue + deck.stats.dueToday})</span>
												</button>
											)}
										{deck.stats &&
											deck.stats.totalCards > deck.stats.newCards && (
												<button
													onClick={() => onSelectDeck(deck.id, "practice")}
													className="flex-1 min-w-0 sm:min-w-[120px] px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-green-600/20 to-emerald-500/20 hover:from-green-600/30 hover:to-emerald-500/30 text-green-400 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 border border-green-800/50 hover:border-green-700/50 group cursor-pointer"
													title={`Practice quiz on all ${deck.stats.totalCards - deck.stats.newCards} studied cards`}
												>
													<Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
													<span className="text-xs sm:text-sm font-medium">
														<span className="hidden sm:inline">Practice</span>
														<span className="sm:hidden">Quiz</span> ({deck.stats.totalCards - deck.stats.newCards})
													</span>
												</button>
											)}
									</div>
								) : null}
							</div>
						</div>
						
						{/* Enrichment progress - full width */}
						{deck.status !== "ready" && deck.enrichmentProgress && (
							<div className="mt-4 p-4 bg-[#161b22] rounded-xl border border-[#30363d]">
								<div className="flex justify-between text-xs text-gray-400 mb-2">
									<span className="flex items-center gap-1.5">
										<RefreshCw className="w-3 h-3 animate-spin" />
										{deck.enrichmentProgress.currentOperation ||
											"Processing..."}
									</span>
									<span>
										{deck.enrichmentProgress.processedCards}/
										{deck.enrichmentProgress.totalCards}
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
								{deck.enrichmentProgress.currentCard && (
									<p className="text-xs text-gray-500 mt-2 truncate">
										Current: {deck.enrichmentProgress.currentCard}
									</p>
								)}
							</div>
						)}
						{deck.status !== "ready" && !deck.enrichmentProgress && (
							<div className="mt-4 p-4 bg-[#161b22] rounded-xl border border-[#30363d]">
								<div className="text-sm text-gray-500 text-center">
									{deck.status === "importing" ? "Importing cards..." : "Preparing deck..."}
								</div>
							</div>
						)}

					</div>
				))}
			</div>
			<div className="mt-4 text-xs text-gray-500">
				Tip: Hold Shift while clicking 🔄 to force re-enrich all cards
			</div>
		</>
	);
}
