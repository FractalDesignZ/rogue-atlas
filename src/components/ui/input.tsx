import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-sm bg-inset px-3 text-sm text-fg shadow-[var(--shadow-panel)] outline-none transition-[box-shadow] duration-[var(--motion-quick)] placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
