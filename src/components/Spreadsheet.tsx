import { useState, useCallback } from "react";
import SpreadsheetCell from "./SpreadsheetCell";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Download, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface CellData {
  [key: string]: string;
}

interface SpreadsheetProps {
  initialData?: CellData[];
  initialHeaders?: string[];
  title?: string;
}

const generateColumnLabel = (index: number): string => {
  let label = "";
  while (index >= 0) {
    label = String.fromCharCode(65 + (index % 26)) + label;
    index = Math.floor(index / 26) - 1;
  }
  return label;
};

const Spreadsheet = ({
  initialData = [],
  initialHeaders = [],
  title = "גיליון חדש",
}: SpreadsheetProps) => {
  const defaultColumns = 10;
  const defaultRows = 20;

  const [headers, setHeaders] = useState<string[]>(
    initialHeaders.length > 0
      ? initialHeaders
      : Array.from({ length: defaultColumns }, (_, i) => generateColumnLabel(i))
  );

  const [data, setData] = useState<CellData[]>(() => {
    if (initialData.length > 0) return initialData;
    return Array.from({ length: defaultRows }, () =>
      headers.reduce((acc, header) => ({ ...acc, [header]: "" }), {})
    );
  });

  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const handleCellChange = useCallback(
    (rowIndex: number, header: string, value: string) => {
      setData((prev) => {
        const newData = [...prev];
        newData[rowIndex] = { ...newData[rowIndex], [header]: value };
        return newData;
      });
    },
    []
  );

  const handleHeaderChange = useCallback(
    (colIndex: number, value: string) => {
      const oldHeader = headers[colIndex];
      const newHeaders = [...headers];
      newHeaders[colIndex] = value || generateColumnLabel(colIndex);

      setHeaders(newHeaders);
      setData((prev) =>
        prev.map((row) => {
          const newRow = { ...row };
          if (oldHeader !== newHeaders[colIndex]) {
            newRow[newHeaders[colIndex]] = newRow[oldHeader] || "";
            delete newRow[oldHeader];
          }
          return newRow;
        })
      );
    },
    [headers]
  );

  const addRow = () => {
    setData((prev) => [
      ...prev,
      headers.reduce((acc, header) => ({ ...acc, [header]: "" }), {}),
    ]);
  };

  const addColumn = () => {
    const newHeader = generateColumnLabel(headers.length);
    setHeaders((prev) => [...prev, newHeader]);
    setData((prev) => prev.map((row) => ({ ...row, [newHeader]: "" })));
  };

  const deleteRow = () => {
    if (selectedCell && data.length > 1) {
      setData((prev) => prev.filter((_, i) => i !== selectedCell.row));
      setSelectedCell(null);
    }
  };

  const deleteColumn = () => {
    if (selectedCell && headers.length > 1) {
      const headerToDelete = headers[selectedCell.col];
      setHeaders((prev) => prev.filter((_, i) => i !== selectedCell.col));
      setData((prev) =>
        prev.map((row) => {
          const newRow = { ...row };
          delete newRow[headerToDelete];
          return newRow;
        })
      );
      setSelectedCell(null);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((h) => `"${(row[h] || "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.csv`;
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-background" dir="rtl">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-card">
        <h2 className="text-lg font-semibold text-foreground ml-4">{title}</h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4 ml-1" />
            שורה
          </Button>
          <Button variant="outline" size="sm" onClick={addColumn}>
            <Plus className="h-4 w-4 ml-1" />
            עמודה
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deleteRow}
            disabled={!selectedCell || data.length <= 1}
          >
            <Trash2 className="h-4 w-4 ml-1" />
            מחק שורה
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deleteColumn}
            disabled={!selectedCell || headers.length <= 1}
          >
            <Trash2 className="h-4 w-4 ml-1" />
            מחק עמודה
          </Button>
        </div>
        <div className="mr-auto">
          <Button variant="secondary" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 ml-1" />
            ייצוא
          </Button>
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto">
        <div className="inline-block min-w-full">
          {/* Header Row */}
          <div className="flex sticky top-0 z-10">
            {/* Row number header */}
            <div className="min-w-[50px] h-8 bg-muted border-l border-b border-border flex items-center justify-center text-xs text-muted-foreground font-medium sticky right-0 z-20">
              #
            </div>
            {headers.map((header, colIndex) => (
              <SpreadsheetCell
                key={`header-${colIndex}`}
                value={header}
                onChange={(value) => handleHeaderChange(colIndex, value)}
                isHeader
              />
            ))}
          </div>

          {/* Data Rows */}
          {data.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="flex">
              {/* Row number */}
              <div className="min-w-[50px] h-8 bg-muted border-l border-b border-border flex items-center justify-center text-xs text-muted-foreground sticky right-0 z-10">
                {rowIndex + 1}
              </div>
              {headers.map((header, colIndex) => (
                <SpreadsheetCell
                  key={`cell-${rowIndex}-${colIndex}`}
                  value={row[header] || ""}
                  onChange={(value) => handleCellChange(rowIndex, header, value)}
                  isSelected={
                    selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                  }
                  onSelect={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Spreadsheet;
