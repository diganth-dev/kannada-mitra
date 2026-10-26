export const Footer = () => {
  return (
    <footer className="mt-auto border-t border-amber-200/70 bg-white/60 py-4 sm:py-5 px-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md shadow-xs overflow-hidden flex flex-col border border-amber-200 shrink-0">
            <div className="h-1/2 bg-[#FFD100]"></div>
            <div className="h-1/2 bg-[#D32F2F]"></div>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 justify-center sm:justify-start">
            <span className="font-extrabold text-stone-900 text-xs sm:text-sm">Kannada Mitra</span>
            <span className="font-kannada text-xs font-bold text-red-700">(ಕನ್ನಡ ಮಿತ್ರ)</span>
            <span className="hidden sm:inline text-stone-300">•</span>
            <span className="text-[11px] sm:text-xs text-stone-500">Learn Kannada. Connect with Karnataka.</span>
          </div>
        </div>

        {/* Hackathon Attribution */}
        <div className="text-[11px] text-stone-500 flex items-center gap-1">
          <span>Built with</span>
          <span className="text-red-600">💛❤️</span>
          <span>for the Kannada Digital Innovation Hackathon 2026.</span>
        </div>
      </div>
    </footer>
  );
};

