import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";
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

type SelectOption = { value: string; label: string };
type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, options, placeholder, className, id, value, ...rest }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--color-wh-deep-green)]">
          {label}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        value={value ?? ""}
        className={cn(
          "w-full h-11 px-4 rounded-[var(--radius-md)] border bg-white text-[var(--color-wh-black)]",
          "border-[var(--color-wh-winter-grey)] focus:border-[var(--color-wh-deep-green)] focus:outline-none",
          "transition-colors duration-150 appearance-none",
          // Custom chevron via inline SVG background
          "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%232F4A35%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1rem_center] pr-10",
          error && "border-[var(--color-wh-sunset)]",
          !value && "text-[var(--color-wh-fg-muted)]",
          className
        )}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-[var(--color-wh-black)]">
            {o.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-xs text-[var(--color-wh-sunset)]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--color-wh-fg-muted)]">{hint}</p>
      ) : null}
    </div>
  )
);
Select.displayName = "Select";
