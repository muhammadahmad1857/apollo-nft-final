"use client";

import { useState, useEffect } from "react";

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function computeCountdown(endTime: Date | string): CountdownTime {
  const diff = Math.max(0, new Date(endTime).getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

/**
 * Returns a live countdown broken down into days/hours/minutes/seconds.
 * Updates every second. Returns null until the first tick.
 */
export function useCountdown(endTime: Date | string): CountdownTime | null {
  const [timeLeft, setTimeLeft] = useState<CountdownTime | null>(null);

  useEffect(() => {
    setTimeLeft(computeCountdown(endTime));
    const interval = setInterval(() => setTimeLeft(computeCountdown(endTime)), 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return timeLeft;
}
