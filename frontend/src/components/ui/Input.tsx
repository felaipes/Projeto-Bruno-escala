"use client";
import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-[#A1A1A1] uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`p-2.5 bg-[#141414] border border-[#232323] rounded-lg text-white placeholder:text-[#555] focus:ring-2 focus:ring-[#FF6B3D] outline-none transition ${className}`}
        {...props}
      />
    </div>
  );
}
