"use client";

import { VoiceBar } from "./VoiceBar";

const PLACEHOLDER_ITEMS = [
  "Review project brief",
  "Call with team",
  "Block focus time",
  "Evening reflection",
];

const VOICE_BAR_HEIGHT = 180;

export function KickoffContent() {
  return (
    <>
      <main
        className="min-h-0 flex-1 overflow-auto px-4 py-8"
        style={{ paddingBottom: VOICE_BAR_HEIGHT }}
      >
        <div className="mx-auto max-w-2xl">
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

      <VoiceBar />
    </>
  );
}
