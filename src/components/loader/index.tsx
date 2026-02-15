"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import "./Loader.css";

interface LoaderProps {
  text?: string;
  fullScreen?: boolean;
  facts?: string[];
}

const Loader: React.FC<LoaderProps> = ({
  text = "Loading...",
  fullScreen = false,
  facts = [],
}) => {
  const { theme } = useTheme();
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  // Cycle through facts every 4 seconds
  useEffect(() => {
    if (facts.length === 0) return;

    const interval = setInterval(() => {
      setFadeOut(true);
      setTimeout(() => {
        setCurrentFactIndex((prev) => (prev + 1) % facts.length);
        setFadeOut(false);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, [facts.length]);

  const currentFact = facts.length > 0 ? facts[currentFactIndex] : null;

  return (
    <div
      className={`flex flex-col items-center my-20 justify-center ${
        fullScreen ? "fixed inset-0 z-50 bg-black/30 dark:bg-white/20" : ""
      }`}
    >
      <div
        className={`relative w-[175px] h-[175px] rounded-lg flex items-center justify-center 
          ${theme === "dark" ? "bg-gray-800 shadow-gray-900/50" : "bg-gray-100 shadow-gray-600/50"}`}
      >
        {/* Plate */}
        <div className="flex items-center justify-center">
          <div
            className={`flex items-center justify-center rounded-full w-[150px] h-[150px] animate-spin 
            ${theme === "dark" ? "bg-gray-600" : "bg-gray-400"}`}
          >
            {/* Border */}
            <div
              className={`flex items-center justify-center rounded-full w-[111px] h-[111px] 
              border-t-[3px] border-b-[3px] ${
                theme === "dark"
                  ? "border-t-white border-b-white border-l-gray-600 border-r-gray-600"
                  : "border-t-white border-b-white border-l-gray-400 border-r-gray-400"
              }`}
            >
              {/* White Inner Circle */}
              <div
                className={`flex items-center justify-center rounded-full w-[70px] h-[70px] 
                ${theme === "dark" ? "bg-gray-900" : "bg-white"}`}
              >
                {/* Center Dot */}
                <div
                  className={`rounded-full w-[20px] h-[20px] ${
                    theme === "dark" ? "bg-gray-600" : "bg-gray-400"
                  }`}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Player Stick */}
        <div className="absolute bottom-2 right-2 flex flex-col items-center justify-center rotate-[-45deg] w-fit">
          <div
            className={`w-[10px] h-[55px] mb-1 ${
              theme === "dark" ? "bg-white" : "bg-gray-900"
            }`}
          ></div>
          <div
            className={`w-[25px] h-[25px] rounded-full z-10 ${
              theme === "dark" ? "bg-white" : "bg-gray-900"
            }`}
          ></div>
        </div>
      </div>

      {/* Loader Text or Fun Facts */}
      <div className="mt-6 flex flex-col items-center gap-2 max-w-md">
        {/* Main text */}
        {text && (
          <div className="text-lg font-bold text-white drop-shadow-lg">
            {text}
          </div>
        )}

        {/* Fun Facts */}
        {currentFact && (
          <div
            className={`text-center text-sm md:text-base font-medium transition-opacity duration-500 min-h-[60px] flex items-center justify-center ${
              fadeOut ? "opacity-0" : "opacity-100"
            }`}
          >
            <p className="text-orange-500 font-bold drop-shadow-md px-4 leading-relaxed">
              💡 {currentFact}
            </p>
          </div>
        )}

        {/* Fact counter */}
        {facts.length > 1 && (
          <div className="text-xs  text-orange-500/70 mt-2">
            {currentFactIndex + 1} / {facts.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default Loader;
