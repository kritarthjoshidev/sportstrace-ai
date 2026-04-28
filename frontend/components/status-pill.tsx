import { DetectionResult } from "@/lib/types";
import { statusClasses } from "@/lib/utils";

export function StatusPill({ result }: { result: DetectionResult }) {
  return (
    <span className={statusClasses(result)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {result}
    </span>
  );
}
