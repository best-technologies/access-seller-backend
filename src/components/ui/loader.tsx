import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "primary" | "white";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

const variantClasses = {
  default: "text-gray-400",
  primary: "text-indigo-600",
  white: "text-white",
};

export function Loader({ size = "md", variant = "default", className }: LoaderProps) {
  return (
    <Loader2
      className={cn(
        "animate-spin",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    />
  );
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader size="lg" variant="primary" />
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export function ButtonLoader() {
  return (
    <div className="flex items-center justify-center gap-2">
      <Loader size="sm" variant="white" />
      <span>Loading...</span>
    </div>
  );
} 