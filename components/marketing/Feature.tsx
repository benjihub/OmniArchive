import type { ReactNode } from "react";
import { Check } from "lucide-react";

export function Feature({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm text-slate-400">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" aria-hidden />
      <span>{children}</span>
    </li>
  );
}
