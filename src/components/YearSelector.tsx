import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Calendar, Plus, X, Check } from "lucide-react";

interface YearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
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
    const yearNum = parseInt(newYear, 10);
    if (yearNum && yearNum >= 2020 && yearNum <= 2050 && !years.includes(yearNum)) {
      onAddYear?.(yearNum);
      setNewYear("");
      setIsAdding(false);
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground ml-2">גליון שנתי:</span>
      <div className="flex gap-1 items-center">
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
              type="number"
              placeholder="שנה"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              className="h-7 w-20 text-center"
              min={2020}
              max={2050}
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
