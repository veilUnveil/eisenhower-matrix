import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:brightness-105",
        secondary:
          "bg-white text-[var(--color-foreground)] border border-[var(--color-border)] shadow-sm hover:bg-[var(--color-muted)]",
        ghost: "hover:bg-[var(--color-muted)] text-[var(--color-foreground)]",
        danger:
          "bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/25 hover:brightness-105",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
