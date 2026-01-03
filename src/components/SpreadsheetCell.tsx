import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SpreadsheetCellProps {
  value: string;
  onChange: (value: string) => void;
  isHeader?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

const SpreadsheetCell = ({
  value,
  onChange,
  isHeader = false,
  isSelected = false,
  onSelect,
}: SpreadsheetCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleDoubleClick = () => {
    if (!isHeader) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        "min-w-[120px] h-8 border-l border-b border-border px-2 flex items-center",
        isHeader && "bg-muted font-medium text-muted-foreground",
        !isHeader && "bg-background hover:bg-accent/50 cursor-cell",
        isSelected && !isHeader && "ring-2 ring-primary ring-inset bg-primary/5"
      )}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full bg-transparent outline-none text-foreground"
          dir="auto"
        />
      ) : (
        <span className="truncate text-sm" dir="auto">
          {value}
        </span>
      )}
    </div>
  );
};

export default SpreadsheetCell;
