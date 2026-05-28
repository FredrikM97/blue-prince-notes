import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "default" | "ghost" | "outline" | "destructive" | "secondary";
type Size = "default" | "sm" | "lg" | "icon";

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

const VARIANT: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
  destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
  outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
};

const SIZE: Record<Size, string> = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-md px-3 text-xs",
  lg: "h-10 rounded-md px-8",
  icon: "h-9 w-9",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/** General-purpose button. Prefer the pre-styled variants below for common use cases. */
export function Button({ variant = "default", size = "default", className, ...props }: ButtonProps) {
  return <button {...props} className={cn(BASE, VARIANT[variant], SIZE[size], className)} />;
}

/** Ghost icon button — used for toolbars and row actions. Always square, non-shrinking.
 *  type="button" is set by default so it never accidentally submits a form. */
export function IconButton({ className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} {...props} className={cn(BASE, VARIANT.ghost, SIZE.icon, "shrink-0", className)} />;
}

/** Primary action button styled with the brass accent. */
export function BrassButton({ size = "default", className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(BASE, VARIANT.default, SIZE[size], "bg-brass text-brass-foreground hover:bg-brass/90", className)}
    />
  );
}

/** Small ghost button for secondary row/panel actions. */
export function GhostButton({ size = "sm", className, ...props }: ButtonProps) {
  return <button {...props} className={cn(BASE, VARIANT.ghost, SIZE[size], className)} />;
}
