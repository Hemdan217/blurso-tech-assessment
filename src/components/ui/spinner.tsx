import { cn } from "@/lib/utils";

interface SpinnerProps {
  /** The size of the spinner */
  size?: "xs" | "sm" | "md" | "lg";
  /** The variant of the spinner */
  variant?: "primary" | "secondary" | "accent";
  /** Additional class names to apply */
  className?: string;
}

export function Spinner({ size = "md", variant = "primary", className }: SpinnerProps) {
  // Size maps
  const sizeMap = {
    xs: "h-3 w-3 border-[1.5px]",
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3",
  };

  // Variant maps
  const variantMap = {
    primary: "border-primary border-b-primary/30",
    secondary: "border-secondary-foreground border-b-secondary-foreground/30",
    accent: "border-accent-foreground border-b-accent-foreground/30",
  };

  return (
    <div className="flex items-center justify-center">
      <div className={cn("animate-spin rounded-full", sizeMap[size], variantMap[variant], className)} />
    </div>
  );
}
