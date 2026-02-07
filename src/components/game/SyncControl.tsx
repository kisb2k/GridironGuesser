"use client"

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Radio } from "lucide-react";

export function SyncControl() {
  const [delay, setDelay] = useState([5]);

  return (
    <div className="bg-card/30 border border-white/5 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary" />
          <h3 className="text-[10px] font-black uppercase tracking-widest">Broadcast Sync</h3>
        </div>
        <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-primary">
          {delay}S DELAY
        </span>
      </div>
      
      <Slider
        defaultValue={[5]}
        max={40}
        step={1}
        onValueChange={setDelay}
        className="mb-2"
      />
      
      <p className="text-[10px] text-muted-foreground leading-tight">
        Adjust this if you see plays on Gridiron Guesser before your TV.
      </p>
    </div>
  );
}