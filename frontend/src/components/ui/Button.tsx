"use client";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[#FF4D1C] hover:bg-[#FF6B3D] text-white shadow-[0_0_15px_rgba(255,77,28,0.25)] hover:shadow-[0_0_20px_rgba(255,77,28,0.4)] disabled:opacity-50 disabled:shadow-none disabled:hover:bg-[#FF4D1C]",
  secondary:
    "bg-[#0A0A0A] border border-[#232323] text-[#A1A1A1] hover:bg-[#232323] hover:text-white disabled:opacity-40",
  danger:
    "bg-transparent text-red-500 hover:bg-red-950/30 border border-transparent disabled:opacity-40",
  ghost:
    "bg-transparent text-[#A1A1A1] hover:bg-[#232323] hover:text-white disabled:opacity-40",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-xl font-bold transition-all ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
