import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

interface YearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  years?: number[];
}

const YearSelector = ({ 
  selectedYear, 
  onYearChange, 
  years = [2025, 2026, 2027] 
}: YearSelectorProps) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground ml-2">גליון שנתי:</span>
      <div className="flex gap-1">
        {years.map((year) => (
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
      </div>
    </div>
  );
};

export default YearSelector;
