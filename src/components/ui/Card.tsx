import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "warm" | "deep";
  padding?: "sm" | "md" | "lg";
};

export const Card = ({
  variant = "default",
  padding = "md",
  className,
  children,
  ...rest
}: CardProps) => {
  const variantClasses = {
    default: "bg-white border border-[var(--color-wh-winter-grey)]",
    warm: "bg-[var(--color-wh-beige)]",
    deep: "bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)]",
  };
  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] shadow-[var(--shadow-rest)]",
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export const Eyebrow = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("eyebrow", className)}>{children}</div>
);

export const Pill = ({
  children,
  bg = "var(--color-wh-green-soft)",
  fg = "var(--color-wh-deep-green)",
}: {
  children: ReactNode;
  bg?: string;
  fg?: string;
}) => (
  <span
    className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-[var(--radius-pill)]"
    style={{ background: bg, color: fg }}
  >
    {children}
  </span>
);
