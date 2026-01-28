import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Search, Tv } from 'lucide-react';
import { toast } from 'sonner';
import InlineNotesTextarea from '@/components/InlineNotesTextarea';

interface Show {
  id: string;
  title: string;
  type: string | null;
  status: string | null;
  current_season: number | null;
  current_episode: number | null;
  notes: string | null;
}

const parseNullableNumber = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
};

const ShowsManager = () => {
  const { user } = useAuth();
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newShow, setNewShow] = useState({ title: '', type: 'סדרה' });

  useEffect(() => {
    if (user) {
      fetchShows();
    }
  }, [user]);

  const fetchShows = async () => {
    const { data, error } = await supabase
      .from('shows')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('שגיאה בטעינת הסדרות');
      console.error(error);
    } else {
      setShows(data || []);
    }
    setLoading(false);
  };

  const addShow = async () => {
    if (!newShow.title.trim()) {
      toast.error('נא להזין שם סדרה/סרט');
      return;
    }

    const { error } = await supabase.from('shows').insert({
      user_id: user?.id,
      title: newShow.title,
      type: newShow.type,
      status: 'לצפות',
    });

    if (error) {
      toast.error('שגיאה בהוספה');
      console.error(error);
    } else {
      toast.success('נוסף בהצלחה');
      setNewShow({ title: '', type: 'סדרה' });
      fetchShows();
    }
  };

  const updateShowStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('shows')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast.error('שגיאה בעדכון');
    } else {
      setShows((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    }
  };

  const updateShowProgress = async (
    id: string,
    field: 'current_season' | 'current_episode',
    value: number | null,
  ) => {
    const { error } = await supabase
      .from('shows')
      .update({ [field]: value })
      .eq('id', id);

    if (error) {
      toast.error('שגיאה בעדכון');
    } else {
      setShows((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    }
  };

  const updateShowNotes = async (id: string, notes: string) => {
    const { error } = await supabase
      .from('shows')
      .update({ notes })
      .eq('id', id);

    if (error) {
      toast.error('שגיאה בעדכון ההערות');
    } else {
      setShows((prev) => prev.map((s) => (s.id === id ? { ...s, notes } : s)));
    }
  };

  const deleteShow = async (id: string) => {
    const { error } = await supabase.from('shows').delete().eq('id', id);

    if (error) {
      toast.error('שגיאה במחיקה');
    } else {
      toast.success('נמחק בהצלחה');
      setShows((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const filteredShows = shows.filter((show) =>
    show.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">טוען סדרות וסרטים...</div>;
  }

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        <Tv className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">הסדרות והסרטים שלי</h2>
        <span className="text-sm text-muted-foreground">({shows.length} פריטים)</span>
      </div>

      {/* Add new show */}
      <div className="flex gap-2 flex-wrap mb-4 flex-shrink-0">
        <Input
          placeholder="שם הסדרה/סרט"
          value={newShow.title}
          onChange={(e) => setNewShow({ ...newShow, title: e.target.value })}
          className="flex-1 min-w-[200px]"
          dir="rtl"
        />
        <Select
          value={newShow.type}
          onValueChange={(value) => setNewShow({ ...newShow, type: value })}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="סדרה">סדרה</SelectItem>
            <SelectItem value="סרט">סרט</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={addShow}>
          <Plus className="h-4 w-4 ml-1" />
          הוסף
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4 flex-shrink-0">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="חפש סדרה או סרט..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
          dir="rtl"
        />
      </div>

      {/* Shows table with scroll */}
      <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
        <div className="h-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">שם</TableHead>
              <TableHead className="text-right">סוג</TableHead>
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead className="text-right">עונה</TableHead>
              <TableHead className="text-right">פרק</TableHead>
              <TableHead className="text-right">הערות</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {searchTerm ? 'לא נמצאו תוצאות' : 'אין סדרות או סרטים עדיין'}
                </TableCell>
              </TableRow>
            ) : (
              filteredShows.map((show) => (
                <TableRow key={show.id}>
                  <TableCell className="font-medium">{show.title}</TableCell>
                  <TableCell>{show.type || 'סדרה'}</TableCell>
                  <TableCell>
                    <Select
                      value={show.status || 'לצפות'}
                      onValueChange={(value) => updateShowStatus(show.id, value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="לצפות">לצפות</SelectItem>
                        <SelectItem value="בצפייה">בצפייה</SelectItem>
                        <SelectItem value="נצפה">נצפה</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {show.type === 'סדרה' && (
                      <Input
                        type="number"
                        min="1"
                        defaultValue={show.current_season ?? ''}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                        }}
                        onBlur={(e) => {
                          const next = parseNullableNumber(e.target.value);
                          const prev = show.current_season ?? null;
                          if (next !== prev) {
                            updateShowProgress(show.id, 'current_season', next);
                          }
                        }}
                        className="w-16"
                        placeholder="-"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {show.type === 'סדרה' && (
                      <Input
                        type="number"
                        min="1"
                        defaultValue={show.current_episode ?? ''}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                        }}
                        onBlur={(e) => {
                          const next = parseNullableNumber(e.target.value);
                          const prev = show.current_episode ?? null;
                          if (next !== prev) {
                            updateShowProgress(show.id, 'current_episode', next);
                          }
                        }}
                        className="w-16"
                        placeholder="-"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <InlineNotesTextarea
                      placeholder="הוסף הערות..."
                      initialValue={show.notes}
                      onCommit={(val) => updateShowNotes(show.id, val)}
                      className="min-w-[150px] text-right min-h-[60px] w-full resize-y"
                      dir="rtl"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteShow(show.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
};

export default ShowsManager;
