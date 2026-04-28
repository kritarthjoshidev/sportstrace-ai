import { DetectionResult } from "@/lib/types";
import { statusClasses } from "@/lib/utils";

export function StatusPill({ result }: { result: DetectionResult }) {
  return <span className={statusClasses(result)}>{result}</span>;
}

