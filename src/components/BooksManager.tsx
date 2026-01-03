import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Search, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface Book {
  id: string;
  title: string;
  author: string | null;
  status: string | null;
  notes: string | null;
}

const BooksManager = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newBook, setNewBook] = useState({ title: '', author: '' });

  useEffect(() => {
    if (user) {
      fetchBooks();
    }
  }, [user]);

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('שגיאה בטעינת הספרים');
      console.error(error);
    } else {
      setBooks(data || []);
    }
    setLoading(false);
  };

  const addBook = async () => {
    if (!newBook.title.trim()) {
      toast.error('נא להזין שם ספר');
      return;
    }

    const { error } = await supabase.from('books').insert({
      user_id: user?.id,
      title: newBook.title,
      author: newBook.author || null,
      status: 'לקרוא',
    });

    if (error) {
      toast.error('שגיאה בהוספת הספר');
      console.error(error);
    } else {
      toast.success('הספר נוסף בהצלחה');
      setNewBook({ title: '', author: '' });
      fetchBooks();
    }
  };

  const updateBookStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('books')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast.error('שגיאה בעדכון הסטטוס');
    } else {
      fetchBooks();
    }
  };

  const deleteBook = async (id: string) => {
    const { error } = await supabase.from('books').delete().eq('id', id);

    if (error) {
      toast.error('שגיאה במחיקת הספר');
    } else {
      toast.success('הספר נמחק');
      fetchBooks();
    }
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">טוען ספרים...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">הספרים שלי</h2>
        <span className="text-sm text-muted-foreground">({books.length} ספרים)</span>
      </div>

      {/* Add new book */}
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="שם הספר"
          value={newBook.title}
          onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
          className="flex-1 min-w-[200px]"
        />
        <Input
          placeholder="מחבר"
          value={newBook.author}
          onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
          className="flex-1 min-w-[150px]"
        />
        <Button onClick={addBook}>
          <Plus className="h-4 w-4 ml-1" />
          הוסף ספר
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="חפש ספר או מחבר..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Books table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">שם הספר</TableHead>
              <TableHead className="text-right">מחבר</TableHead>
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBooks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  {searchTerm ? 'לא נמצאו תוצאות' : 'אין ספרים עדיין'}
                </TableCell>
              </TableRow>
            ) : (
              filteredBooks.map((book) => (
                <TableRow key={book.id}>
                  <TableCell className="font-medium">{book.title}</TableCell>
                  <TableCell>{book.author || '-'}</TableCell>
                  <TableCell>
                    <Select
                      value={book.status || 'לקרוא'}
                      onValueChange={(value) => updateBookStatus(book.id, value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="לקרוא">לקרוא</SelectItem>
                        <SelectItem value="בקריאה">בקריאה</SelectItem>
                        <SelectItem value="נקרא">נקרא</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteBook(book.id)}
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
  );
};

export default BooksManager;
