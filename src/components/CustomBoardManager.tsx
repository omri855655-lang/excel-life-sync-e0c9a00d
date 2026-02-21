import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface BoardItem {
  id: string;
  title: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface CustomBoardManagerProps {
  boardId: string;
  boardName: string;
  statuses: string[];
}

const CustomBoardManager = ({ boardId, boardName, statuses }: CustomBoardManagerProps) => {
  const { user } = useAuth();
  const [items, setItems] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<BoardItem>>({});

  const fetchItems = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("custom_board_items")
      .select("*")
      .eq("board_id", boardId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) setItems(data || []);
    setLoading(false);
  }, [user, boardId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addItem = async () => {
    if (!user || !newTitle.trim()) return;
    const { error } = await supabase.from("custom_board_items").insert({
      board_id: boardId,
      user_id: user.id,
      title: newTitle.trim(),
      status: statuses[0] || "לביצוע",
    });
    if (error) { toast.error("שגיאה בהוספה"); return; }
    setNewTitle("");
    fetchItems();
    toast.success("נוסף בהצלחה");
  };

  const updateItem = async (id: string, updates: Partial<BoardItem>) => {
    const { error } = await supabase.from("custom_board_items").update(updates).eq("id", id);
    if (error) { toast.error("שגיאה בעדכון"); return; }
    setEditingId(null);
    fetchItems();
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("custom_board_items").delete().eq("id", id);
    if (error) { toast.error("שגיאה במחיקה"); return; }
    fetchItems();
  };

  const startEdit = (item: BoardItem) => {
    setEditingId(item.id);
    setEditValues({ title: item.title, notes: item.notes || "" });
  };

  if (loading) return <div className="p-6 text-center text-muted-foreground">טוען...</div>;

  return (
    <div className="p-4 space-y-4" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold">{boardName}</h2>
      </div>

      {/* Add new item */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-2">
            <Input
              placeholder="הוסף פריט חדש..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
            />
            <Button onClick={addItem} size="icon"><Plus className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Items table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>הערות</TableHead>
                <TableHead className="w-[100px]">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    אין פריטים עדיין
                  </TableCell>
                </TableRow>
              ) : items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {editingId === item.id ? (
                      <Input
                        value={editValues.title || ""}
                        onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                        className="h-8"
                      />
                    ) : item.title}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.status}
                      onValueChange={(val) => updateItem(item.id, { status: val })}
                    >
                      <SelectTrigger className="h-8 w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <Textarea
                        value={editValues.notes || ""}
                        onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })}
                        className="h-8 min-h-[32px]"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">{item.notes || "-"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {editingId === item.id ? (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7"
                            onClick={() => updateItem(item.id, editValues)}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7"
                            onClick={() => setEditingId(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7"
                            onClick={() => startEdit(item)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                            onClick={() => deleteItem(item.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomBoardManager;
