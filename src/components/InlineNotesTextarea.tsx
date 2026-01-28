import { useEffect, useRef, useState } from "react";

import { Textarea } from "@/components/ui/textarea";

type InlineNotesTextareaProps = {
  initialValue?: string | null;
  placeholder?: string;
  className?: string;
  dir?: "rtl" | "ltr";
  onCommit: (value: string) => Promise<void> | void;
};

/**
 * A resilient textarea for table cells:
 * - Keeps local draft while typing (prevents "text disappears" on parent refetch/rerender)
 * - Persists to backend only onBlur
 */
export default function InlineNotesTextarea({
  initialValue,
  placeholder,
  className,
  dir = "rtl",
  onCommit,
}: InlineNotesTextareaProps) {
  const [value, setValue] = useState(initialValue ?? "");
  const [dirty, setDirty] = useState(false);
  const initialValueRef = useRef(initialValue ?? "");

  useEffect(() => {
    // Only sync from props when user isn't actively editing
    if (!dirty) {
      setValue(initialValue ?? "");
      initialValueRef.current = initialValue ?? "";
    }
  }, [initialValue, dirty]);

  return (
    <Textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => {
        setDirty(true);
        setValue(e.target.value);
      }}
      onBlur={async () => {
        setDirty(false);
        const current = value;
        const previous = initialValueRef.current;
        if (current !== previous) {
          await onCommit(current);
          initialValueRef.current = current;
        }
      }}
      className={className}
      dir={dir}
    />
  );
}
