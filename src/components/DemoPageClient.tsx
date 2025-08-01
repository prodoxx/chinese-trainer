"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import InteractiveFlashDemo from "@/components/InteractiveFlashDemo";

export default function DemoPageClient() {
	const [isDemoRunning, setIsDemoRunning] = useState(false);
	const [showIntro, setShowIntro] = useState(true);

	const startDemo = () => {
		setShowIntro(false);
		setIsDemoRunning(true);
	};

	const onDemoComplete = () => {
		setIsDemoRunning(false);
		setShowIntro(true);
	};

	if (isDemoRunning) {
		return <InteractiveFlashDemo onComplete={onDemoComplete} />;
	}

	return (
		<div className="min-h-screen bg-[#0d1117] text-white font-learning flex flex-col">
			{/* Demo Introduction */}
			{showIntro && (
				<div className="flex-1 flex items-center justify-center p-4">
					<div className="max-w-2xl text-center space-y-8">
						<div className="space-y-4">
							<h1 className="text-4xl sm:text-5xl font-bold text-[#f7cc48]">
								Flash Session Demo
							</h1>
							<p className="text-xl text-[#7d8590]">
								Watch how our flash session works with real Chinese characters
							</p>
						</div>

						<div className="bg-[#161b22] rounded-xl p-6 border border-[#30363d] space-y-4">
							<h2 className="text-xl font-semibold mb-4">What you'll see:</h2>
							<div className="grid sm:grid-cols-2 gap-4 text-left">
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 bg-[#f7cc48] rounded-full"></div>
										<span>Interactive tutorial walkthrough</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 bg-[#f7cc48] rounded-full"></div>
										<span>Four-phase learning system</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 bg-[#f7cc48] rounded-full"></div>
										<span>Multiple choice quiz</span>
									</div>
								</div>
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 bg-[#f7cc48] rounded-full"></div>
										<span>Automated mouse interactions</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 bg-[#f7cc48] rounded-full"></div>
										<span>Real character examples</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 bg-[#f7cc48] rounded-full"></div>
										<span>Complete session flow</span>
									</div>
								</div>
							</div>
						</div>

						<button
							onClick={startDemo}
							className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#f7cc48] to-[#ffd700] text-black font-semibold rounded-xl hover:from-[#ffd700] hover:to-[#f7cc48] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
						>
							<Play className="w-6 h-6" />
							Play
						</button>

						<p className="text-sm text-[#7d8590]">
							This demo runs automatically and takes about 2-3 minutes to
							complete
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
