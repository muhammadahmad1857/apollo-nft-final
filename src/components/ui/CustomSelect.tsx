// CustomSelect.tsx
"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, PlusIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // shadcn tooltip

interface Option {
  value: string;
  label: string;
  isListed?: boolean; // new
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
}

const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className,
  isLoading = false,
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOptionClick = (option: Option) => {
    if (option.isListed) return; // cannot select listed option
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <button
        type="button"
        className="w-full p-2 border rounded bg-background text-left flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <span>
          {isLoading
            ? "Loading files..."
            : selectedOption
              ? selectedOption.label
              : placeholder}
        </span>

        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg"
          >
            <ul className="max-h-60 overflow-auto">
              {isLoading ? (
                <li className="px-4 py-3 text-center text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading files...</span>
                </li>
              ) : options.length === 0 ? (
                <li className="px-4 py-3 text-center text-muted-foreground">
                  No files found
                </li>
              ) : (
                options.map((option) => {
                  const disabled = option.isListed;
                  const optionContent = (
                    <li
                      key={option.value}
                      className={`px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-between cursor-pointer ${
                        disabled ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      onClick={() => handleOptionClick(option)}
                    >
                      <span className="flex items-center gap-2">
                        {option.label}
                        {disabled && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-1 rounded">
                            Listed
                          </span>
                        )}
                      </span>
                      {option.value === value && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </li>
                  );

                  return disabled ? (
                    <Tooltip key={option.value}>
                      <TooltipTrigger asChild>{optionContent}</TooltipTrigger>
                      <TooltipContent>
                        <p>This file is already listed</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    optionContent
                  );
                })
              )}

              {/* Always show Create New – even while loading */}
              <li className="border-t border-zinc-200 dark:border-zinc-700">
                <Link
                  href="/dashboard/create/upload"
                  className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer flex items-center gap-2 text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  <PlusIcon className="h-4 w-4" />
                  Create New
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
