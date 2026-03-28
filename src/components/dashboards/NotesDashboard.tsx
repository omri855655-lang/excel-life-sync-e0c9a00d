import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StickyNote, Plus, Trash2, Pin, PinOff, Archive, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  archived: boolean;
  category: string | null;
  created_at: string;
  updated_at: string;
}

const NOTE_COLORS = [
  "#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff",
  "#fed7aa", "#fce7f3", "#d1fae5", "#dbeafe", "#f5f5f4",
];

const NotesDashboard = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [archivedNotes, setArchivedNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .eq("archived", false)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false });
    setNotes((data as any[]) || []);
    setLoading(false);
  }, [user]);

  const fetchArchived = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .eq("archived", true)
      .order("updated_at", { ascending: false })
      .limit(100);
    setArchivedNotes((data as any[]) || []);
  }, [user]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);
  useEffect(() => { if (showArchived) fetchArchived(); }, [showArchived, fetchArchived]);

  const addNote = async () => {
    if (!user) return;
    const { error } = await supabase.from("notes").insert({
      user_id: user.id,
      title: "",
      content: "",
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
    });
    if (error) { toast.error("שגיאה"); return; }
    fetchNotes();
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    await supabase.from("notes").update(updates).eq("id", id);
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    setNotes(prev => prev.filter(n => n.id !== id));
    setArchivedNotes(prev => prev.filter(n => n.id !== id));
  };

  const archiveNote = async (id: string) => {
    await supabase.from("notes").update({ archived: true }).eq("id", id);
    setNotes(prev => prev.filter(n => n.id !== id));
    toast.success("הפתק הועבר לארכיון");
  };

  const restoreNote = async (id: string) => {
    await supabase.from("notes").update({ archived: false }).eq("id", id);
    setArchivedNotes(prev => prev.filter(n => n.id !== id));
    fetchNotes();
    toast.success("הפתק שוחזר");
  };

  const togglePin = async (id: string, current: boolean) => {
    await updateNote(id, { pinned: !current });
    fetchNotes();
  };

  const filtered = notes.filter(n =>
    !search || n.title.includes(search) || n.content.includes(search)
  );

  if (loading) return <div className="p-6 text-center text-muted-foreground">טוען...</div>;

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-4">
        <StickyNote className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold flex-1">פתקים</h2>
        <Button onClick={addNote} size="sm" className="gap-1">
          <Plus className="h-4 w-4" />פתק חדש
        </Button>
        <Button
          variant={showArchived ? "secondary" : "outline"}
          size="sm"
          className="gap-1"
          onClick={() => setShowArchived(!showArchived)}
        >
          <Archive className="h-4 w-4" />ארכיון
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="חיפוש בפתקים..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {showArchived ? (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-muted-foreground">ארכיון ({archivedNotes.length})</h3>
          {archivedNotes.length === 0 && <p className="text-center text-muted-foreground py-6">אין פתקים בארכיון</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {archivedNotes.map(note => (
              <Card key={note.id} style={{ borderColor: note.color, borderWidth: 2 }} className="opacity-60">
                <CardContent className="p-3 space-y-2">
                  <p className="font-medium text-sm">{note.title || "ללא כותרת"}</p>
                  <p className="text-xs text-muted-foreground line-clamp-3">{note.content}</p>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => restoreNote(note.id)}>
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteNote(note.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          {filtered.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <StickyNote className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">אין פתקים עדיין</p>
              <Button onClick={addNote} variant="outline" className="gap-1">
                <Plus className="h-4 w-4" />צור פתק ראשון
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(note => (
              <Card
                key={note.id}
                style={{ borderColor: note.color, borderWidth: 2, backgroundColor: note.color + "20" }}
                className="transition-shadow hover:shadow-md"
              >
                <CardContent className="p-3 space-y-2">
                  {editingId === note.id ? (
                    <>
                      <Input
                        value={note.title}
                        onChange={e => setNotes(prev => prev.map(n => n.id === note.id ? { ...n, title: e.target.value } : n))}
                        onBlur={() => updateNote(note.id, { title: note.title })}
                        placeholder="כותרת..."
                        className="text-sm font-medium bg-transparent border-none p-0 h-auto focus-visible:ring-0"
                        autoFocus
                      />
                      <Textarea
                        value={note.content}
                        onChange={e => setNotes(prev => prev.map(n => n.id === note.id ? { ...n, content: e.target.value } : n))}
                        onBlur={() => updateNote(note.id, { content: note.content })}
                        placeholder="תוכן הפתק..."
                        className="text-xs bg-transparent border-none p-0 min-h-[100px] resize-none focus-visible:ring-0"
                      />
                      <div className="flex gap-1 flex-wrap">
                        {NOTE_COLORS.map(c => (
                          <button
                            key={c}
                            className="h-5 w-5 rounded-full border-2 transition-transform hover:scale-110"
                            style={{ backgroundColor: c, borderColor: note.color === c ? "hsl(var(--primary))" : "transparent" }}
                            onClick={() => updateNote(note.id, { color: c })}
                          />
                        ))}
                      </div>
                      <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => setEditingId(null)}>
                        סיום עריכה
                      </Button>
                    </>
                  ) : (
                    <div onClick={() => setEditingId(note.id)} className="cursor-pointer min-h-[80px]">
                      <div className="flex items-start gap-1">
                        <p className="font-medium text-sm flex-1">{note.title || "לחץ לעריכה..."}</p>
                        {note.pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-6">{note.content}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-1 pt-1 border-t" style={{ borderColor: note.color }}>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={e => { e.stopPropagation(); togglePin(note.id, note.pinned); }}>
                      {note.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={e => { e.stopPropagation(); archiveNote(note.id); }}>
                      <Archive className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={e => { e.stopPropagation(); deleteNote(note.id); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <span className="flex-1" />
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(note.updated_at).toLocaleDateString("he-IL")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default NotesDashboard;
