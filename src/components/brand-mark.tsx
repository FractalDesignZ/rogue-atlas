import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 28 28" className="size-6" aria-hidden="true">
        <circle cx="14" cy="14" r="10" fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.55" />
        <path
          d="M14 3.6c4.2 4.4 4.2 16.4 0 20.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-display text-[1.15rem] tracking-tight">Atlas</span>
    </span>
  );
}
