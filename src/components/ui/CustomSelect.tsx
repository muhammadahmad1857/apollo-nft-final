// CustomSelect.tsx
"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, PlusIcon, Loader2 } from "lucide-react";
import Link from "next/link";

interface Option {
  value: string;
  label: string;
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

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <button
        type="button"
        className="w-full p-2 border rounded bg-transparent text-left flex justify-between items-center"
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
            className={`h-4 w-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
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
                options.map((option) => (
                  <li
                    key={option.value}
                    className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer flex items-center justify-between"
                    onClick={() => handleOptionClick(option.value)}
                  >
                    <span>{option.label}</span>
                    {option.value === value && <Check className="h-4 w-4" />}
                  </li>
                ))
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
