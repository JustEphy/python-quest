"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export function CodeEditor({
  initialCode,
  name,
}: {
  initialCode: string;
  name: string;
}) {
  const [code, setCode] = useState(initialCode);

  return (
    <Textarea
      name={name}
      value={code}
      onChange={(event) => setCode(event.target.value)}
      className="min-h-80 font-mono text-sm"
      spellCheck={false}
    />
  );
}
