
"use client"

import { Clock } from "lucide-react";

export function Leaderboard() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="w-full bg-card/30 border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center opacity-50">
        <Clock className="w-12 h-12 mb-4 text-primary" />
        <h3 className="text-sm font-black uppercase tracking-widest">Feed Diagnostic Mode</h3>
        <p className="text-[10px] font-bold mt-2 uppercase opacity-60">Live activity is currently hidden.</p>
      </div>
    </div>
  );
}
