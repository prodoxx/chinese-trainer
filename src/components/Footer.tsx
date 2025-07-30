export default function Footer() {
	return (
		<footer className="relative border-t border-[#30363d] bg-[#161b22] overflow-hidden">
			<div className="absolute inset-0 bg-gradient-to-r from-[#f7cc48]/5 via-orange-500/5 to-[#f7cc48]/5" />
			<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
				<p className="text-center text-xs sm:text-sm text-[#7d8590] font-learning">
					<span className="inline-flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
						<span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#f7cc48] animate-pulse" />
						<span className="hidden sm:inline">Focus mode learning environment • Optimized for retention</span>
						<span className="sm:hidden">Focus mode • Optimized learning</span>
						<span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-500 animate-pulse" />
					</span>
				</p>
			</div>
		</footer>
	);
}
