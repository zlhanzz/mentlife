"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";

interface Option {
  value: string;
  label: string;
  group?: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih kategori...",
  className,
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full h-12 px-4 rounded-xl border bg-card/60 backdrop-blur-sm text-sm text-white focus:outline-none focus:border-primary/50 transition-all flex items-center justify-between shadow-sm hover:border-primary/30",
          isOpen && "border-primary ring-2 ring-primary/20 shadow-lg",
          disabled && "opacity-50 cursor-not-allowed bg-muted/30",
          className
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-muted-foreground/80")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180 text-primary"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border border-border/40 rounded-xl shadow-2xl max-h-96 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/10">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Pilih Kategori
            </p>
          </div>

          {/* Search */}
          <div className="p-2 border-b border-border/10">
            <input
              type="text"
              placeholder="Cari kategori..."
              className="w-full h-9 px-3 rounded-lg bg-background border border-border/20 text-sm focus:outline-none focus:border-primary transition-all"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                // Filter logic can be added here
              }}
            />
          </div>

          {/* Options */}
          <div className="overflow-y-auto p-1">
            {options.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Tidak ada kategori tersedia
              </div>
            ) : (
              options.map((option, index) => {
                const isSelected = option.value === value;
                const isLastInGroup =
                  index === options.length - 1 ||
                  options[index + 1]?.group !== option.group;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-left rounded-lg transition-all flex items-center justify-between group",
                      isSelected
                        ? "bg-primary/15 text-primary font-medium shadow-sm"
                        : "text-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate">{option.label}</span>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary/50" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
