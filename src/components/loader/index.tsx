"use client";

import React from "react";
import { useTheme } from "next-themes";

interface LoaderProps {
  text?: string;
  fullScreen?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ text = "Loading...", fullScreen = false }) => {
  const { theme } = useTheme();

  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullScreen ? "fixed inset-0 z-50 bg-black/30 dark:bg-white/20" : ""
      }`}
    >
      <div
        className={`relative w-[175px] h-[175px] rounded-lg flex items-center justify-center 
          ${theme === "dark" ? "bg-gray-800 shadow-cyan-900/50" : "bg-cyan-100 shadow-cyan-600/50"}`}
      >
        {/* Plate */}
        <div className="flex items-center justify-center">
          <div
            className={`flex items-center justify-center rounded-full w-[150px] h-[150px] animate-spin 
            ${theme === "dark" ? "bg-cyan-600" : "bg-cyan-500"}`}
          >
            {/* Border */}
            <div
              className={`flex items-center justify-center rounded-full w-[111px] h-[111px] 
              border-t-[3px] border-b-[3px] ${
                theme === "dark" ? "border-t-white border-b-white border-l-cyan-600 border-r-cyan-600" : "border-t-white border-b-white border-l-cyan-500 border-r-cyan-500"
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
                    theme === "dark" ? "bg-cyan-600" : "bg-cyan-500"
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

      {/* Loader Text */}
      {text && (
        <div className={`mt-4 text-lg font-medium ${theme === "dark" ? "text-cyan-400" : "text-cyan-600"}`}>
          {text}
        </div>
      )}
    </div>
  );
};

export default Loader;
