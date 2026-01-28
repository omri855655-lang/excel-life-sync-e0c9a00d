import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Calendar, Plus, X, Check, List } from "lucide-react";

interface YearSelectorProps {
  selectedYear: number | null;
  onYearChange: (year: number | null) => void;
  years: number[];
  onAddYear?: (year: number) => void;
}

const YearSelector = ({ 
  selectedYear, 
  onYearChange, 
  years,
  onAddYear
}: YearSelectorProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newYear, setNewYear] = useState("");

  const handleAddYear = () => {
    const trimmed = newYear.trim();
    if (!trimmed || years.map(String).includes(trimmed)) return;
    
    const yearNum = parseInt(trimmed, 10);
    // Accept either a valid year number OR any non-empty text
    if (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2050) {
      onAddYear?.(yearNum);
    } else if (trimmed.length > 0) {
      // For text entries, use a special encoding (negative hash or just pass as-is)
      // Since years array is number[], we'll need to update the type
      onAddYear?.(trimmed as unknown as number);
    }
    setNewYear("");
    setIsAdding(false);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border" dir="rtl">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground ml-2">גליון:</span>
      <div className="flex gap-1 items-center">
        {/* All tasks button */}
        <Button
          variant={selectedYear === null ? "default" : "outline"}
          size="sm"
          onClick={() => onYearChange(null)}
          className={cn(
            "h-7 px-3 gap-1",
            selectedYear === null && "font-bold"
          )}
        >
          <List className="h-3.5 w-3.5" />
          הכל
        </Button>
        
        {years.sort((a, b) => a - b).map((year) => (
          <Button
            key={year}
            variant={selectedYear === year ? "default" : "outline"}
            size="sm"
            onClick={() => onYearChange(year)}
            className={cn(
              "h-7 px-3",
              selectedYear === year && "font-bold"
            )}
          >
            {year}
          </Button>
        ))}
        
        {isAdding ? (
          <div className="flex items-center gap-1">
            <Input
              type="text"
              placeholder="שנה או טקסט"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              className="h-7 w-24 text-center"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddYear();
                if (e.key === 'Escape') setIsAdding(false);
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleAddYear}
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsAdding(false)}
            >
              <X className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setIsAdding(true)}
            title="הוסף שנה חדשה"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default YearSelector;
