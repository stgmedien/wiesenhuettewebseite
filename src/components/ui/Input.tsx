import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  trailing?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, trailing, className, id, ...rest }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--color-wh-deep-green)]">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          ref={ref}
          className={cn(
            "w-full h-11 px-4 rounded-[var(--radius-md)] border bg-white text-[var(--color-wh-black)]",
            "border-[var(--color-wh-winter-grey)] focus:border-[var(--color-wh-deep-green)] focus:outline-none",
            "transition-colors duration-150",
            error && "border-[var(--color-wh-sunset)]",
            trailing && "pr-12",
            className
          )}
          {...rest}
        />
        {trailing && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-[var(--color-wh-sunset)]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--color-wh-fg-muted)]">{hint}</p>
      ) : null}
    </div>
  )
);
Input.displayName = "Input";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, id, ...rest }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--color-wh-deep-green)]">
          {label}
        </label>
      )}
      <textarea
        id={id}
        ref={ref}
        className={cn(
          "w-full px-4 py-3 rounded-[var(--radius-md)] border bg-white text-[var(--color-wh-black)] min-h-[100px]",
          "border-[var(--color-wh-winter-grey)] focus:border-[var(--color-wh-deep-green)] focus:outline-none",
          error && "border-[var(--color-wh-sunset)]",
          className
        )}
        {...rest}
      />
      {error ? (
        <p className="text-xs text-[var(--color-wh-sunset)]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--color-wh-fg-muted)]">{hint}</p>
      ) : null}
    </div>
  )
);
Textarea.displayName = "Textarea";
