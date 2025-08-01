"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import AnimatedCursor from "./AnimatedCursor";

interface DemoCard {
	id: string;
	hanzi: string;
	pinyin: string;
	meaning: string;
	imageUrl: string;
	audioUrl: string;
}

interface InteractiveFlashDemoProps {
	onComplete: () => void;
}

// Hard-coded demo characters (easy ones) with real R2 URLs
const DEMO_CARDS: DemoCard[] = [
	{
		id: "1",
		hanzi: "大",
		pinyin: "dà",
		meaning: "big, large",
		imageUrl: "https://static.danbing.ai/demo-deck/demo-大/image.png?v=4",
		audioUrl: "https://static.danbing.ai/demo-deck/demo-大/audio.mp3?v=1",
	},
	{
		id: "2",
		hanzi: "小",
		pinyin: "xiǎo",
		meaning: "small, little",
		imageUrl: "https://static.danbing.ai/demo-deck/demo-小/image.png?v=4",
		audioUrl: "https://static.danbing.ai/demo-deck/demo-小/audio.mp3?v=1",
	},
	{
		id: "3",
		hanzi: "人",
		pinyin: "rén",
		meaning: "person, people",
		imageUrl: "https://static.danbing.ai/demo-deck/demo-人/image.png?v=4",
		audioUrl: "https://static.danbing.ai/demo-deck/demo-人/audio.mp3?v=1",
	},
];

type QuizType = "meaning-to-hanzi" | "audio-to-hanzi" | "image-match";

interface QuizQuestion {
	type: QuizType;
	correctCard: DemoCard;
	options: DemoCard[];
}

// Create visually similar characters for quiz options
const QUIZ_QUESTIONS: QuizQuestion[] = [
	{
		type: "meaning-to-hanzi",
		correctCard: DEMO_CARDS[0], // 大 (big)
		options: [
			{
				id: "opt1-1",
				hanzi: "太",
				pinyin: "tài",
				meaning: "too/extremely",
				imageUrl: "https://static.danbing.ai/demo-deck/demo-太/image.png?v=3",
				audioUrl: "https://static.danbing.ai/demo-deck/demo-太/audio.mp3?v=1",
			},
			{
				id: "opt1-2",
				hanzi: "天",
				pinyin: "tiān",
				meaning: "sky/heaven",
				imageUrl: "https://static.danbing.ai/demo-deck/demo-天/image.png?v=3",
				audioUrl: "https://static.danbing.ai/demo-deck/demo-天/audio.mp3?v=1",
			},
			DEMO_CARDS[1], // 小
			DEMO_CARDS[0], // 大 (correct answer)
		],
	},
	{
		type: "audio-to-hanzi",
		correctCard: DEMO_CARDS[1], // 小 (small)
		options: [
			{
				id: "opt2-1",
				hanzi: "少",
				pinyin: "shǎo",
				meaning: "few/little",
				imageUrl: "https://static.danbing.ai/demo-deck/demo-少/image.png?v=3",
				audioUrl: "https://static.danbing.ai/demo-deck/demo-少/audio.mp3?v=1",
			},
			{
				id: "opt2-2",
				hanzi: "水",
				pinyin: "shuǐ",
				meaning: "water",
				imageUrl: "https://static.danbing.ai/demo-deck/demo-水/image.png?v=3",
				audioUrl: "https://static.danbing.ai/demo-deck/demo-水/audio.mp3?v=1",
			},
			DEMO_CARDS[1], // 小 (correct answer)
			DEMO_CARDS[2], // 人
		],
	},
	{
		type: "image-match",
		correctCard: DEMO_CARDS[2], // 人 (person)
		options: [
			{
				id: "opt3-1",
				hanzi: "入",
				pinyin: "rù",
				meaning: "enter",
				imageUrl: "https://static.danbing.ai/demo-deck/demo-入/image.png?v=4",
				audioUrl: "https://static.danbing.ai/demo-deck/demo-入/audio.mp3?v=1",
			},
			DEMO_CARDS[2], // 人 (correct answer)
			DEMO_CARDS[0], // 大
			{
				id: "opt3-2",
				hanzi: "八",
				pinyin: "bā",
				meaning: "eight",
				imageUrl: "https://static.danbing.ai/demo-deck/demo-八/image.png?v=4",
				audioUrl: "https://static.danbing.ai/demo-deck/demo-八/audio.mp3?v=1",
			},
		],
	},
];

type DemoPhase = "tutorial" | "flash-session" | "quiz" | "complete";
type FlashPhase =
	| "orthographic"
	| "phonological"
	| "semantic"
	| "self-test"
	| "between-cards";
type TutorialStep = "intro" | "phases" | "quiz-preview" | "ready";

export default function InteractiveFlashDemo({
	onComplete,
}: InteractiveFlashDemoProps) {
	const [phase, setPhase] = useState<DemoPhase>("tutorial");
	const [tutorialStep, setTutorialStep] = useState<TutorialStep>("intro");
	const [flashPhase, setFlashPhase] = useState<FlashPhase>("orthographic");
	const [currentCardIndex, setCurrentCardIndex] = useState(0);
	const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
	const [isPaused, setIsPaused] = useState(false);
	const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
	const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
	const [currentBlock, setCurrentBlock] = useState(1); // Track which block (1, 2, or 3) we're in
	const [timeRemaining, setTimeRemaining] = useState(10); // Quiz timer

	// Cursor animation state
	const [cursorVisible, setCursorVisible] = useState(false);
	const [cursorTarget, setCursorTarget] = useState({ x: 0, y: 0 });
	const [cursorClicking, setCursorClicking] = useState(false);

	// Audio playback function
	const playAudio = useCallback((audioUrl: string) => {
		if (audioUrl) {
			const audio = new Audio(audioUrl);
			audio.play().catch((error) => {
				console.log("Audio playback failed (likely missing file):", error);
			});
		}
	}, []);

	// Buzz sound function for wrong answers
	const playBuzzSound = useCallback(() => {
		try {
			const AudioContextClass =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext })
					.webkitAudioContext;
			const audioContext = new AudioContextClass();

			// Create oscillator for buzz sound
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();

			// Connect nodes
			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);

			// Set buzz properties
			oscillator.type = "sawtooth";
			oscillator.frequency.value = 100; // Low frequency for buzz

			// Quick fade in and out
			gainNode.gain.setValueAtTime(0, audioContext.currentTime);
			gainNode.gain.linearRampToValueAtTime(
				0.3,
				audioContext.currentTime + 0.05,
			);
			gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

			// Play the buzz
			oscillator.start(audioContext.currentTime);
			oscillator.stop(audioContext.currentTime + 0.3);
		} catch (error) {
			console.error("Failed to play buzz sound:", error);
		}
	}, []);

	// Tutorial progression - slower for better reading time
	const progressTutorial = useCallback(() => {
		if (tutorialStep === "intro") {
			// Move cursor to "Next" button and click
			const nextButton = document.querySelector(
				'[data-demo="next-button-intro"]',
			) as HTMLElement;
			if (nextButton) {
				const rect = nextButton.getBoundingClientRect();
				setCursorTarget({
					x: rect.left + rect.width / 2,
					y: rect.top + rect.height / 2,
				});
				setCursorVisible(true);

				setTimeout(() => {
					setCursorClicking(true);
					setTimeout(() => {
						setCursorClicking(false);
						setTutorialStep("phases");
					}, 300);
				}, 4000); // Increased from 1500ms to 4000ms
			}
		} else if (tutorialStep === "phases") {
			setTimeout(() => {
				const nextButton = document.querySelector(
					'[data-demo="next-button-phases"]',
				) as HTMLElement;
				if (nextButton) {
					const rect = nextButton.getBoundingClientRect();
					setCursorTarget({
						x: rect.left + rect.width / 2,
						y: rect.top + rect.height / 2,
					});

					setTimeout(() => {
						setCursorClicking(true);
						setTimeout(() => {
							setCursorClicking(false);
							setTutorialStep("quiz-preview");
						}, 300);
					}, 2000); // Increased from 1000ms to 2000ms
				}
			}, 5000); // Increased from 2000ms to 5000ms
		} else if (tutorialStep === "quiz-preview") {
			setTimeout(() => {
				const nextButton = document.querySelector(
					'[data-demo="next-button-quiz"]',
				) as HTMLElement;
				if (nextButton) {
					const rect = nextButton.getBoundingClientRect();
					setCursorTarget({
						x: rect.left + rect.width / 2,
						y: rect.top + rect.height / 2,
					});

					setTimeout(() => {
						setCursorClicking(true);
						setTimeout(() => {
							setCursorClicking(false);
							setTutorialStep("ready");
						}, 300);
					}, 2000); // Increased from 1500ms to 2000ms
				}
			}, 4000); // Increased from 2500ms to 4000ms
		} else if (tutorialStep === "ready") {
			setTimeout(() => {
				const startButton = document.querySelector(
					'[data-demo="start-button"]',
				) as HTMLElement;
				if (startButton) {
					const rect = startButton.getBoundingClientRect();
					setCursorTarget({
						x: rect.left + rect.width / 2,
						y: rect.top + rect.height / 2,
					});

					setTimeout(() => {
						setCursorClicking(true);
						setTimeout(() => {
							setCursorClicking(false);
							setCursorVisible(false);
							setPhase("flash-session");
							startFlashSession();
						}, 300);
					}, 2000); // Increased from 1000ms to 2000ms
				}
			}, 3000); // Increased from 2000ms to 3000ms
		}
	}, [tutorialStep]);

	const startQuiz = useCallback(() => {
		setCursorVisible(true);
		setCurrentQuizIndex(0);
		setTimeRemaining(10); // Reset timer for first question

		// Auto-answer quiz questions - mix of correct and wrong answers for demo
		const answerQuestion = (questionIndex: number) => {
			// For demo purposes: make second question wrong to show buzz sound
			const shouldAnswerWrong = questionIndex === 1;
			const currentQuizQuestion = QUIZ_QUESTIONS[questionIndex];

			let targetCard: DemoCard;
			if (shouldAnswerWrong) {
				// Pick a wrong answer (first option that's not correct)
				targetCard =
					currentQuizQuestion.options.find(
						(card) => card.id !== currentQuizQuestion.correctCard.id,
					) || currentQuizQuestion.correctCard;
			} else {
				targetCard = currentQuizQuestion.correctCard;
			}

			const targetOption = document.querySelector(
				`[data-demo="quiz-option-${targetCard.id}"]`,
			) as HTMLElement;

			if (targetOption) {
				const rect = targetOption.getBoundingClientRect();
				setCursorTarget({
					x: rect.left + rect.width / 2,
					y: rect.top + rect.height / 2,
				});

				setTimeout(() => {
					setCursorClicking(true);
					setTimeout(() => {
						setCursorClicking(false);

						// Show answer feedback (highlight correct in green, others in red)
						setSelectedAnswer(targetCard.id);
						setShowAnswerFeedback(true);

						// Handle audio feedback like the real quiz
						const isCorrect =
							targetCard.id === currentQuizQuestion.correctCard.id;
						if (!isCorrect) {
							// Wrong answer: play buzz, then correct audio after delay
							playBuzzSound();

							// Play correct audio after buzz
							setTimeout(() => {
								if (currentQuizQuestion.correctCard.audioUrl) {
									playAudio(currentQuizQuestion.correctCard.audioUrl);
								}
							}, 400); // Wait for buzz to finish
						} else {
							// Correct answer: play the audio immediately
							if (currentQuizQuestion.correctCard.audioUrl) {
								playAudio(currentQuizQuestion.correctCard.audioUrl);
							}
						}

						// Move to next question or complete
						setTimeout(() => {
							if (questionIndex < QUIZ_QUESTIONS.length - 1) {
								// Reset feedback and move to next question
								setShowAnswerFeedback(false);
								setSelectedAnswer(null);
								setTimeout(() => {
									setCurrentQuizIndex(questionIndex + 1);
									setTimeRemaining(10); // Reset timer for next question
									setTimeout(() => answerQuestion(questionIndex + 1), 1500);
								}, 500);
							} else {
								setTimeout(() => {
									setPhase("complete");
									setCursorVisible(false);
								}, 1500);
							}
						}, 2000);
					}, 300);
				}, 1500);
			}
		};

		setTimeout(() => answerQuestion(0), 2000);
	}, [playAudio, playBuzzSound]);

	const startFlashSession = useCallback(() => {
		setFlashPhase("orthographic");
		setCurrentCardIndex(0);
		setCurrentBlock(1);

		// Use a more reliable state machine approach
		let cardIndex = 0;
		let blockIndex = 1;
		let currentPhase: FlashPhase = "orthographic";

		const nextPhase = () => {
			// Block 1: Full segmented approach (ortho → phono → semantic → self-test)
			if (blockIndex === 1) {
				const phases: FlashPhase[] = [
					"orthographic",
					"phonological",
					"semantic",
					"self-test",
				];
				const currentPhaseIndex = phases.indexOf(currentPhase);

				if (currentPhaseIndex < phases.length - 1) {
					// Move to next phase
					const nextPhaseIndex = currentPhaseIndex + 1;
					currentPhase = phases[nextPhaseIndex];
					setFlashPhase(currentPhase);

					// Play audio in phonological phase
					if (currentPhase === "phonological") {
						const currentCard = DEMO_CARDS[cardIndex];
						if (currentCard?.audioUrl) {
							setTimeout(() => playAudio(currentCard.audioUrl), 500);
						}
					}

					let timing = 1500; // self-test
					if (nextPhaseIndex === 1) timing = 2000; // phonological
					if (nextPhaseIndex === 2) timing = 2000; // semantic
					setTimeout(nextPhase, timing);
				} else {
					// Move to next card or next block
					if (cardIndex < DEMO_CARDS.length - 1) {
						cardIndex++;
						setCurrentCardIndex(cardIndex);
						currentPhase = "orthographic";
						setFlashPhase(currentPhase);
						setTimeout(nextPhase, 800);
					} else {
						// Move to block 2
						blockIndex = 2;
						setCurrentBlock(2);
						cardIndex = 0;
						setCurrentCardIndex(0);
						currentPhase = "orthographic";
						setFlashPhase(currentPhase);
						setTimeout(nextPhase, 1000);
					}
				}
			}

			// Block 2: Combined view (ortho → combined phono view)
			else if (blockIndex === 2) {
				if (currentPhase === "orthographic") {
					// Skip straight to combined phonological view
					currentPhase = "phonological";
					setFlashPhase(currentPhase);
					const currentCard = DEMO_CARDS[cardIndex];
					if (currentCard?.audioUrl) {
						setTimeout(() => playAudio(currentCard.audioUrl), 500);
					}
					setTimeout(nextPhase, 3000); // 3s for combined view
				} else {
					// Move to next card or next block
					if (cardIndex < DEMO_CARDS.length - 1) {
						cardIndex++;
						setCurrentCardIndex(cardIndex);
						currentPhase = "orthographic";
						setFlashPhase(currentPhase);
						setTimeout(nextPhase, 800);
					} else {
						// Move to block 3
						blockIndex = 3;
						setCurrentBlock(3);
						cardIndex = 0;
						setCurrentCardIndex(0);
						currentPhase = "orthographic";
						setFlashPhase(currentPhase);
						setTimeout(nextPhase, 1000);
					}
				}
			}

			// Block 3: Quick recognition (ortho → quick phono, NO AUDIO)
			else if (blockIndex === 3) {
				if (currentPhase === "orthographic") {
					currentPhase = "phonological";
					setFlashPhase(currentPhase);
					// NO AUDIO in block 3 (matching real implementation)
					setTimeout(nextPhase, 1500); // 1.5s for quick review
				} else {
					// Move to next card or complete
					if (cardIndex < DEMO_CARDS.length - 1) {
						cardIndex++;
						setCurrentCardIndex(cardIndex);
						currentPhase = "orthographic";
						setFlashPhase(currentPhase);
						setTimeout(nextPhase, 800);
					} else {
						// All blocks complete, start quiz
						setPhase("quiz");
						startQuiz();
					}
				}
			}
		};

		setTimeout(nextPhase, 800);
	}, [playAudio, startQuiz]);

	// Start tutorial automatically
	useEffect(() => {
		if (phase === "tutorial" && tutorialStep === "intro") {
			setTimeout(progressTutorial, 1000);
		}
	}, [phase, progressTutorial]);

	useEffect(() => {
		progressTutorial();
	}, [tutorialStep, progressTutorial]);

	// Quiz timer countdown effect
	useEffect(() => {
		if (phase === "quiz" && !showAnswerFeedback && timeRemaining > 0) {
			const interval = setInterval(() => {
				setTimeRemaining((prev) => {
					const newTime = prev - 1;
					if (newTime <= 0) {
						return 0;
					}
					return newTime;
				});
			}, 1000);

			return () => clearInterval(interval);
		}
	}, [phase, showAnswerFeedback, timeRemaining]);

	const currentCard = DEMO_CARDS[currentCardIndex];
	const currentQuiz = QUIZ_QUESTIONS[currentQuizIndex];

	// Auto-play audio for audio-to-hanzi questions
	useEffect(() => {
		if (
			phase === "quiz" &&
			currentQuiz?.type === "audio-to-hanzi" &&
			!showAnswerFeedback
		) {
			// Play audio after a short delay when the question appears
			const timer = setTimeout(() => {
				if (currentQuiz.correctCard.audioUrl) {
					playAudio(currentQuiz.correctCard.audioUrl);
				}
			}, 1000);

			return () => clearTimeout(timer);
		}
	}, [currentQuizIndex, phase, showAnswerFeedback, currentQuiz, playAudio]);

	return (
		<div className="fixed inset-0 bg-black text-white">
			<AnimatedCursor
				targetX={cursorTarget.x}
				targetY={cursorTarget.y}
				isVisible={cursorVisible}
				isClicking={cursorClicking}
				speed={600}
			/>

			{/* Tutorial Phase */}
			{phase === "tutorial" && (
				<div className="h-full flex items-center justify-center p-4">
					<div className="max-w-4xl w-full text-center space-y-8">
						{tutorialStep === "intro" && (
							<>
								<div className="space-y-4">
									<div className="text-6xl">📚</div>
									<h1 className="text-4xl font-bold text-[#f7cc48]">
										Flash Cards Structure
									</h1>
									<p className="text-xl text-gray-300">
										Each character goes through 4 phases:
									</p>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-12">
									<div className="bg-[#161b22] p-6 rounded-xl border border-[#30363d]">
										<div className="text-6xl mb-4">大</div>
										<h3 className="font-semibold mb-2">Character</h3>
										<p className="text-sm text-gray-400">(0.8s)</p>
									</div>
									<div className="bg-[#161b22] p-6 rounded-xl border border-[#30363d]">
										<div className="text-4xl mb-4">
											大<br />
											dà
										</div>
										<h3 className="font-semibold mb-2">+ Sound</h3>
										<p className="text-sm text-gray-400">(2s)</p>
									</div>
									<div className="bg-[#161b22] p-6 rounded-xl border border-[#30363d]">
										<div className="text-2xl mb-4">
											[IMG]
											<br />
											big
										</div>
										<h3 className="font-semibold mb-2">+ Meaning</h3>
										<p className="text-sm text-gray-400">(2s)</p>
									</div>
									<div className="bg-[#161b22] p-6 rounded-xl border border-[#30363d]">
										<div className="text-6xl mb-4">
											大<br />?
										</div>
										<h3 className="font-semibold mb-2">Self-test</h3>
										<p className="text-sm text-gray-400">(1.5s)</p>
									</div>
								</div>

								<button
									data-demo="next-button-intro"
									className="px-8 py-3 bg-[#f7cc48] text-black font-semibold rounded-lg hover:bg-[#ffd700] transition-colors"
								>
									Next →
								</button>
							</>
						)}

						{tutorialStep === "phases" && (
							<>
								<div className="space-y-4">
									<div className="text-6xl">🧠</div>
									<h1 className="text-4xl font-bold text-[#f7cc48]">
										3-Block System
									</h1>
									<p className="text-xl text-gray-300">
										Each character appears in 3 different learning blocks
									</p>
								</div>

								<div className="space-y-6">
									<div className="bg-[#161b22] p-6 rounded-xl border border-[#30363d] text-left">
										<h3 className="text-xl font-semibold mb-4 text-[#f7cc48]">
											Block Structure:
										</h3>
										<div className="space-y-4">
											<div className="border-l-4 border-blue-500 pl-4">
												<h4 className="font-semibold text-blue-400">
													Block 1: First Exposure
												</h4>
												<p className="text-sm text-gray-400">
													Character → Pronunciation → Visual → Self-test
												</p>
											</div>
											<div className="border-l-4 border-purple-500 pl-4">
												<h4 className="font-semibold text-purple-400">
													Block 2: Reinforcement
												</h4>
												<p className="text-sm text-gray-400">
													Everything combined with audio: Character + Sound +
													Image + Meaning
												</p>
											</div>
											<div className="border-l-4 border-green-500 pl-4">
												<h4 className="font-semibold text-green-400">
													Block 3: Mental Practice
												</h4>
												<p className="text-sm text-gray-400">
													Quick recognition - everything shown but no sound for
													mental pronunciation
												</p>
											</div>
										</div>
									</div>
								</div>

								<button
									data-demo="next-button-phases"
									className="px-8 py-3 bg-[#f7cc48] text-black font-semibold rounded-lg hover:bg-[#ffd700] transition-colors"
								>
									Next →
								</button>
							</>
						)}

						{tutorialStep === "quiz-preview" && (
							<>
								<div className="space-y-4">
									<div className="text-6xl">❓</div>
									<h1 className="text-4xl font-bold text-[#f7cc48]">
										Quiz Time
									</h1>
									<p className="text-xl text-gray-300">
										Test your knowledge with multiple choice
									</p>
								</div>

								<div className="bg-[#161b22] p-8 rounded-xl border border-[#30363d] max-w-2xl mx-auto">
									<h3 className="text-2xl mb-6">
										Which character means "big"?
									</h3>
									<div className="grid grid-cols-2 gap-4">
										{["大", "小", "人", "好"].map((option, index) => (
											<button
												key={index}
												className={`p-4 text-2xl font-bold rounded-lg border-2 transition-all ${
													option === "大"
														? "border-green-500 bg-green-500/20 text-green-400"
														: "border-[#30363d] hover:border-[#f7cc48]/50"
												}`}
												disabled
											>
												{option}
											</button>
										))}
									</div>
								</div>

								<button
									data-demo="next-button-quiz"
									className="px-8 py-3 bg-[#f7cc48] text-black font-semibold rounded-lg hover:bg-[#ffd700] transition-colors"
								>
									Got it! →
								</button>
							</>
						)}

						{tutorialStep === "ready" && (
							<>
								<div className="space-y-4">
									<div className="text-6xl">🚀</div>
									<h1 className="text-4xl font-bold text-[#f7cc48]">
										Ready to Begin!
									</h1>
									<p className="text-xl text-gray-300">
										3 blocks × 3 characters × 4 phases = complete learning
									</p>
								</div>

								<div className="bg-[#161b22] p-6 rounded-xl border border-[#30363d]">
									<p className="text-lg mb-4">
										Demo characters (appearing 3 times each):
									</p>
									<div className="flex justify-center gap-8 text-4xl mb-4">
										<span title="big">大</span>
										<span title="small">小</span>
										<span title="person">人</span>
									</div>
									<p className="text-sm text-gray-400">
										First Exposure → Reinforcement → Mental Practice → Quiz
									</p>
								</div>

								<button
									data-demo="start-button"
									className="px-8 py-3 bg-gradient-to-r from-[#f7cc48] to-[#ffd700] text-black font-semibold rounded-lg hover:from-[#ffd700] hover:to-[#f7cc48] transition-all"
								>
									<Play className="w-5 h-5 inline mr-2" />
									Start Demo
								</button>
							</>
						)}
					</div>
				</div>
			)}

			{/* Flash Session Phase */}
			{phase === "flash-session" && currentCard && (
				<div
					className="h-full flex items-center justify-center"
					style={{ opacity: 1 }}
				>
					{/* Block indicator */}
					<div className="fixed top-4 right-4 z-10">
						<div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-[#30363d]">
							<div className="text-sm text-gray-400 mb-1">
								Block {currentBlock}/3
							</div>
							<div className="flex gap-1">
								{[1, 2, 3].map((block) => (
									<div
										key={block}
										className={`w-3 h-3 rounded-full ${
											block === currentBlock
												? "bg-[#f7cc48]"
												: block < currentBlock
													? "bg-green-500"
													: "bg-gray-600"
										}`}
									/>
								))}
							</div>
						</div>
					</div>

					<div className="text-center">
						{/* Orthographic phase - character alone */}
						{flashPhase === "orthographic" && (
							<div className="text-8xl font-bold text-white animate-fade-in">
								{currentCard.hanzi}
							</div>
						)}

						{/* Phonological phase - varies by block */}
						{flashPhase === "phonological" && (
							<div className="space-y-4 animate-fade-in">
								{/* Block 1: Character + pinyin + audio */}
								{currentBlock === 1 && (
									<>
										<div className="text-7xl font-bold text-white">
											{currentCard.hanzi}
										</div>
										<div className="text-5xl text-[#f7cc48]">
											{currentCard.pinyin}
										</div>
									</>
								)}

								{/* Block 2 & 3: Combined view - everything together */}
								{(currentBlock === 2 || currentBlock === 3) && (
									<>
										<div className="text-6xl font-bold text-white">
											{currentCard.hanzi}
										</div>
										<div className="text-4xl text-[#f7cc48]">
											{currentCard.pinyin}
										</div>
										{currentCard.imageUrl && (
											<div className="w-48 h-48 mx-auto my-4">
												<img
													src={currentCard.imageUrl}
													alt={`Visual representation of ${currentCard.hanzi} - ${currentCard.meaning}`}
													className="w-full h-full object-cover rounded-lg"
													onError={(e) => {
														// Fallback to character display if image fails to load
														e.currentTarget.style.display = "none";
														const fallback = e.currentTarget
															.nextElementSibling as HTMLElement;
														if (fallback) fallback.style.display = "block";
													}}
												/>
												<div className="text-center hidden">
													<div className="text-6xl mb-4">
														{currentCard.hanzi}
													</div>
													<div className="text-lg text-gray-300">
														Image unavailable
													</div>
												</div>
											</div>
										)}
										<div className="text-2xl text-gray-300">
											{currentCard.meaning}
										</div>
									</>
								)}
							</div>
						)}

						{/* Semantic phase - image + meaning (only in block 1) */}
						{flashPhase === "semantic" && currentBlock === 1 && (
							<div className="space-y-6 animate-fade-in">
								<div className="w-64 h-64 mx-auto bg-[#161b22] rounded-lg flex items-center justify-center border border-[#30363d] overflow-hidden">
									{currentCard.imageUrl ? (
										<img
											src={currentCard.imageUrl}
											alt={`Visual representation of ${currentCard.hanzi} - ${currentCard.meaning}`}
											className="w-full h-full object-cover rounded-lg"
											onError={(e) => {
												// Fallback to character display if image fails to load
												e.currentTarget.style.display = "none";
												const fallback = e.currentTarget
													.nextElementSibling as HTMLElement;
												if (fallback) fallback.style.display = "block";
											}}
										/>
									) : null}
									<div className="text-center hidden">
										<div className="text-6xl mb-4">{currentCard.hanzi}</div>
										<div className="text-lg text-gray-300">
											Image unavailable
										</div>
									</div>
								</div>
								<div className="text-3xl text-[#f7cc48]">
									{currentCard.meaning}
								</div>
							</div>
						)}

						{/* Self-test phase - character alone for retrieval (only in block 1) */}
						{flashPhase === "self-test" && currentBlock === 1 && (
							<div className="text-8xl font-bold text-white animate-fade-in">
								{currentCard.hanzi}
							</div>
						)}
					</div>
				</div>
			)}

			{/* Quiz Phase */}
			{phase === "quiz" && (
				<div className="h-full flex items-center justify-center p-4">
					<div className="max-w-2xl w-full text-center space-y-8">
						{/* Timer and question counter */}
						<div className="flex justify-between items-center mb-4">
							<div className="text-base sm:text-xl">
								Question {currentQuizIndex + 1} of {QUIZ_QUESTIONS.length}
							</div>
							<div
								className={`text-base sm:text-xl font-bold ${timeRemaining < 5 ? "text-red-500" : "text-white"}`}
							>
								{Math.ceil(timeRemaining)}s
							</div>
						</div>

						{/* Question based on type */}
						<div className="text-xl sm:text-2xl md:text-3xl text-center mb-6 sm:mb-8">
							{currentQuiz.type === "meaning-to-hanzi" ? (
								<div>
									Which character means "{currentQuiz.correctCard.meaning}"?
								</div>
							) : currentQuiz.type === "audio-to-hanzi" ? (
								<div className="space-y-4">
									<div>Which character did you hear?</div>
									<button
										onClick={() => {
											if (currentQuiz.correctCard.audioUrl) {
												playAudio(currentQuiz.correctCard.audioUrl);
											}
										}}
										className="mx-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
									>
										<svg
											className="w-5 h-5"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" />
										</svg>
										Play Again
									</button>
								</div>
							) : (
								<div className="space-y-4">
									<div>Which image matches this character?</div>
									<div className="text-5xl sm:text-6xl">
										{currentQuiz.correctCard.hanzi}
									</div>
								</div>
							)}
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
							{currentQuiz.options.map((option, index) => {
								let buttonClass =
									"p-4 sm:p-6 rounded-lg border-2 transition-all cursor-pointer relative overflow-hidden ";

								if (showAnswerFeedback) {
									// Show feedback: green for correct, red for wrong
									if (option.id === currentQuiz.correctCard.id) {
										buttonClass +=
											"border-green-400 bg-green-900 text-green-100";
									} else {
										buttonClass += "border-red-400 bg-red-900 text-red-100";
									}
								} else if (option.id === selectedAnswer && cursorClicking) {
									// Show clicking feedback
									buttonClass +=
										"border-green-500 bg-green-500/20 text-green-400";
								} else {
									// Default state
									buttonClass +=
										"border-gray-700 hover:border-gray-500 hover:bg-gray-900 text-white";
								}

								return (
									<button
										key={option.id}
										data-demo={`quiz-option-${option.id}`}
										className={buttonClass}
									>
										{showAnswerFeedback &&
											option.id === currentQuiz.correctCard.id && (
												<div className="absolute inset-0 bg-green-500 opacity-20 pointer-events-none" />
											)}
										{showAnswerFeedback &&
											option.id !== currentQuiz.correctCard.id && (
												<div className="absolute inset-0 bg-red-500 opacity-20 pointer-events-none" />
											)}

										<div className="flex items-center space-x-2 relative z-10">
											<span
												className={showAnswerFeedback ? "" : "text-gray-500"}
											>
												{index + 1}.
											</span>
											{currentQuiz.type === "meaning-to-hanzi" ||
											currentQuiz.type === "audio-to-hanzi" ? (
												<span className="text-3xl sm:text-4xl">
													{option.hanzi}
												</span>
											) : option.imageUrl ? (
												<img
													src={option.imageUrl}
													alt=""
													className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded"
												/>
											) : (
												<div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-800 rounded flex items-center justify-center">
													{option.hanzi}
												</div>
											)}
										</div>
									</button>
								);
							})}
						</div>
					</div>
				</div>
			)}

			{/* Complete Phase */}
			{phase === "complete" && (
				<div className="h-full flex items-center justify-center p-4">
					<div className="text-center space-y-8">
						<div className="text-8xl">🎉</div>
						<h1 className="text-4xl font-bold text-[#f7cc48]">
							Demo Complete!
						</h1>
						<p className="text-xl text-gray-300">
							You've seen how our flash session works with real Chinese
							characters
						</p>

						<button
							onClick={() => {
								// Reset all state to restart the demo
								setPhase("tutorial");
								setTutorialStep("intro");
								setFlashPhase("orthographic");
								setCurrentCardIndex(0);
								setCurrentQuizIndex(0);
								setCurrentBlock(1);
								setSelectedAnswer(null);
								setShowAnswerFeedback(false);
								setCursorVisible(false);
								setCursorClicking(false);
								setTimeRemaining(10);
							}}
							className="px-8 py-4 bg-gradient-to-r from-[#f7cc48] to-[#ffd700] text-black font-semibold rounded-xl hover:from-[#ffd700] hover:to-[#f7cc48] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
						>
							<Play className="w-5 h-5 inline mr-2" />
							Replay Demo
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
