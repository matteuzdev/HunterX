import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "destructive";
  size?: "sm" | "md" | "icon";
};

export function Button({ className, variant = "primary", size = "md", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-9 px-3 text-xs",
        size === "md" && "h-11 px-4 text-sm",
        size === "icon" && "size-9",
        variant === "primary" && "bg-blue-600 text-white shadow-[0_8px_24px_rgba(37,99,235,.22)] hover:bg-blue-700",
        variant === "secondary" && "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
        variant === "outline" && "border border-slate-200 bg-transparent text-slate-700 hover:border-slate-300 hover:bg-slate-50",
        variant === "ghost" && "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
        variant === "danger" && "bg-red-50 text-red-700 hover:bg-red-100",
        variant === "destructive" && "bg-red-600 text-white hover:bg-red-700",
        className,
      )}
      {...props}
    />
  );
}
