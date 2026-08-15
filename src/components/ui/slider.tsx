import type { ComponentProps } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export function Slider({ className, ...props }: ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      className={cn("relative flex h-6 w-full touch-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow rounded-full bg-line">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-accent/80" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block size-4 rounded-full bg-accent shadow-[var(--shadow-panel)] outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
    </SliderPrimitive.Root>
  );
}
