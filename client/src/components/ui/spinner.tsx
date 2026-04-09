import { cn } from "@/lib/utils";

function Spinner({ className }: { className?: string }) {
  return (
    <i
      role="status"
      aria-label="Loading"
      className={cn("fa-solid fa-spinner animate-spin", className)}
    />
  );
}

export { Spinner };
