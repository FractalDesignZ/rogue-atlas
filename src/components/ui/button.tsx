import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-[opacity,transform,background-color,color] duration-[var(--motion-quick)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-fg hover:opacity-90",
        secondary:
          "bg-raised text-fg shadow-[var(--shadow-panel)] hover:bg-raised/80",
        outline:
          "bg-transparent text-fg shadow-[var(--shadow-panel)] hover:bg-raised",
        ghost: "text-muted hover:bg-raised hover:text-fg",
        link: "text-fg underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 rounded-sm px-4",
        sm: "h-9 rounded-sm px-3 text-xs",
        lg: "h-11 rounded-md px-6",
        icon: "size-10 rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}

export { buttonVariants };
