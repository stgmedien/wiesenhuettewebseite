import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "warm";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  block?: boolean;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] hover:bg-[var(--color-wh-deep-green-hover)] shadow-[var(--shadow-rest)] hover:shadow-[var(--shadow-float)]",
  secondary:
    "bg-transparent border border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-deep-green)] hover:text-[var(--color-wh-snow)]",
  ghost:
    "bg-transparent text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)]",
  danger:
    "bg-[var(--color-wh-sunset)] text-[var(--color-wh-snow)] hover:bg-[var(--color-wh-sunset-hover)]",
  warm:
    "bg-[var(--color-wh-wood)] text-[var(--color-wh-snow)] hover:bg-[var(--color-wh-wood-hover)]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm gap-1.5 rounded-[10px]",
  md: "h-11 px-5 text-base gap-2 rounded-[var(--radius-btn)]",
  lg: "h-14 px-7 text-lg gap-2.5 rounded-[var(--radius-btn)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      iconLeft,
      iconRight,
      block,
      className,
      children,
      ...rest
    },
    ref
  ) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center font-semibold leading-none transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        "active:translate-y-[1px]",
        variantClasses[variant],
        sizeClasses[size],
        block && "w-full",
        className
      )}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  )
);
Button.displayName = "Button";
