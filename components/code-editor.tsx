"use client";

import { Textarea } from "@/components/ui/textarea";

export function CodeEditor({
  code,
  onCodeChange,
}: {
  code: string;
  onCodeChange: (value: string) => void;
}) {
  return (
    <Textarea
      value={code}
      onChange={(event) => onCodeChange(event.target.value)}
      className="min-h-80 font-mono text-sm"
      spellCheck={false}
    />
  );
}
