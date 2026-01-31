"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X, Check, PlusIcon, Loader2 } from "lucide-react";
import Link from "next/link";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];                    // ← now array
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
  maxSelections?: number;
}

const MultiSelect = ({
  options,
  value = [],
  onChange,
  placeholder = "Select files...",
  className,
  isLoading = false,
  maxSelections = 10,
  
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    let newValue: string[];

    if (value.includes(optionValue)) {
      newValue = value.filter((v) => v !== optionValue);
    } else {
      if (value.length >= maxSelections) return;
      newValue = [...value, optionValue];
    }

    onChange(newValue);
    // keep dropdown open after selection (better UX for multi-select)
    // setIsOpen(true); ← uncomment if you prefer it stays open
  };

  const removeItem = (val: string) => {
    onChange(value.filter((v) => v !== val));
  };

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* Trigger / Selected items display */}
      <div
        className={`
          min-h-[42px] w-full p-2 border rounded bg-transparent flex flex-wrap gap-2 items-center cursor-pointer
          ${isLoading ? "opacity-70 cursor-wait" : ""}
        `}
        onClick={() => !isLoading && setIsOpen(!isOpen)}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-muted-foreground">Loading files...</span>
          </>
        ) : selectedOptions.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          selectedOptions.map((opt) => (
            <div
              key={opt.value}
              className="bg-primary/10 text-primary px-2 py-1 rounded text-sm flex items-center gap-1"
            >
              {opt.label}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(opt.value);
                }}
                className="ml-1 hover:text-red-500 rounded-full p-0.5"
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}

        <div className="ml-auto flex items-center gap-1">
          {value.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {value.length}/{maxSelections}
            </span>
          )}
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-xl max-h-72 overflow-hidden"
          >
            <div className="max-h-60 overflow-auto">
              {isLoading ? (
                <div className="px-4 py-6 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading files...</span>
                </div>
              ) : options.length === 0 ? (
                <div className="px-4 py-6 text-center text-muted-foreground">
                  No files found
                </div>
              ) : (
                options.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <div
                      key={option.value}
                      className={`
                        px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer flex items-center justify-between
                        ${isSelected ? "bg-primary/5" : ""}
                      `}
                      onClick={() => toggleOption(option.value)}
                    >
                      <span>{option.label}</span>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-700">
              <Link
                href="/dashboard/create/upload"
                className="px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-primary text-sm"
                onClick={() => setIsOpen(false)}
              >
                <PlusIcon className="h-4 w-4" />
                Create New File
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiSelect;