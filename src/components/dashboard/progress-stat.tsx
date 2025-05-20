import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ProgressStatProps {
  label: string;
  value: number;
  maxValue?: number;
  showPercentage?: boolean;
  colorVariant?: "default" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProgressStat({
  label,
  value,
  maxValue = 100,
  showPercentage = true,
  colorVariant = "default",
  size = "md",
  className,
}: ProgressStatProps) {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  const getColorClass = () => {
    switch (colorVariant) {
      case "success":
        return "text-green-700";
      case "warning":
        return "text-amber-700";
      case "danger":
        return "text-red-700";
      default:
        return "text-primary";
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "text-xs";
      case "lg":
        return "text-base";
      default:
        return "text-sm";
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <p className={cn("font-medium", getSizeClass())}>{label}</p>
        {showPercentage && (
          <p className={cn("font-medium", getColorClass(), getSizeClass())}>{percentage.toFixed(0)}%</p>
        )}
      </div>
      <Progress
        value={percentage}
        className={cn("h-2 w-full", {
          "data-[state=progress-indicator]:bg-green-600": colorVariant === "success",
          "data-[state=progress-indicator]:bg-amber-600": colorVariant === "warning",
          "data-[state=progress-indicator]:bg-red-600": colorVariant === "danger",
        })}
      />
    </div>
  );
}
