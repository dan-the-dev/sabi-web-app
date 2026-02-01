"use client";

const PLACEHOLDER_ITEMS = [
  "Review project brief",
  "Call with team",
  "Block focus time",
  "Evening reflection",
];

const VOICE_BAR_HEIGHT = 160;

export function KickoffContent() {
  return (
    <>
      <main
        className="min-h-0 flex-1 overflow-auto px-4 py-8"
        style={{ paddingBottom: VOICE_BAR_HEIGHT }}
      >
        <div className="mx-auto max-w-2xl">
          <h1 className="text-sm font-medium tracking-wide text-base-content/80">
            Today
          </h1>
          <p className="text-xs text-base-content/50">Monday, April 22</p>
          <h2 className="mt-2 text-lg font-medium text-base-content/90">
            Today&apos;s focus
          </h2>
          <ul className="mt-5 space-y-1">
            {PLACEHOLDER_ITEMS.map((label, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-xl py-3 px-3 text-base-content/60"
              >
                <span
                  className="size-5 shrink-0 rounded-full border-2 border-base-content/20 bg-transparent"
                  aria-hidden
                />
                <span className="text-[15px]">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <div
        className="fixed bottom-0 left-0 right-0 z-10 flex justify-center px-4 pb-6 pt-2"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto w-full max-w-2xl rounded-2xl bg-base-100 px-6 py-5 shadow-lg ring-1 ring-base-300/40">
          <div className="flex flex-col items-center gap-3">
            <p className="text-center text-sm font-medium text-base-content/80">
              Speak your day
            </p>
            <button
              type="button"
              onClick={() => alert("Voice recording coming soon")}
              className="flex size-24 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content shadow-lg transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-base-100"
              aria-label="Speak your day"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-12"
                aria-hidden
              >
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>
            <p className="text-center text-xs text-base-content/50">
              Up to 3 minutes
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
