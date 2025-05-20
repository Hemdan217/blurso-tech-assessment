import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "secondary";
  tooltip?: string;
  className?: string;
}

export function StatusBadge({ status, variant = "default", tooltip, className }: StatusBadgeProps) {
  const badgeClass = cn(
    className,
    variant === "success" && "bg-green-100 text-green-800 hover:bg-green-200",
    variant === "warning" && "bg-amber-100 text-amber-800 hover:bg-amber-200",
    variant === "danger" && "bg-red-100 text-red-800 hover:bg-red-200",
    variant === "info" && "bg-blue-100 text-blue-800 hover:bg-blue-200",
    variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  );

  const badge = (
    <Badge
      variant="outline"
      className={badgeClass}
    >
      {status}
    </Badge>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
