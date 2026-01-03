import { useState, useCallback } from "react";
import Spreadsheet from "@/components/Spreadsheet";
import SheetTabs from "@/components/SheetTabs";
import { FileSpreadsheet } from "lucide-react";

interface Sheet {
  id: string;
  name: string;
  data: { [key: string]: string }[];
  headers: string[];
}

const Index = () => {
  const [sheets, setSheets] = useState<Sheet[]>([
    {
      id: "1",
      name: "משימות",
      data: [],
      headers: ["משימה", "סטטוס", "תאריך יעד", "אחראי", "הערות"],
    },
    {
      id: "2",
      name: "עסקאות",
      data: [],
      headers: ["תאריך", "תיאור", "סכום", "קטגוריה", "אמצעי תשלום"],
    },
  ]);

  const [activeSheetId, setActiveSheetId] = useState("1");

  const activeSheet = sheets.find((s) => s.id === activeSheetId) || sheets[0];

  const handleAddSheet = useCallback(() => {
    const newId = String(Date.now());
    const newSheet: Sheet = {
      id: newId,
      name: `גיליון ${sheets.length + 1}`,
      data: [],
      headers: ["A", "B", "C", "D", "E"],
    };
    setSheets((prev) => [...prev, newSheet]);
    setActiveSheetId(newId);
  }, [sheets.length]);

  const handleDeleteSheet = useCallback(
    (id: string) => {
      if (sheets.length > 1) {
        const newSheets = sheets.filter((s) => s.id !== id);
        setSheets(newSheets);
        if (activeSheetId === id) {
          setActiveSheetId(newSheets[0].id);
        }
      }
    },
    [sheets, activeSheetId]
  );

  const handleRenameSheet = useCallback((id: string, name: string) => {
    setSheets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s))
    );
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <FileSpreadsheet className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">גיליון עבודה</h1>
      </header>

      {/* Spreadsheet Area */}
      <div className="flex-1 overflow-hidden">
        <Spreadsheet
          key={activeSheet.id}
          title={activeSheet.name}
          initialData={activeSheet.data}
          initialHeaders={activeSheet.headers}
        />
      </div>

      {/* Sheet Tabs */}
      <SheetTabs
        sheets={sheets.map((s) => ({ id: s.id, name: s.name }))}
        activeSheet={activeSheetId}
        onSelectSheet={setActiveSheetId}
        onAddSheet={handleAddSheet}
        onDeleteSheet={handleDeleteSheet}
        onRenameSheet={handleRenameSheet}
      />
    </div>
  );
};

export default Index;
