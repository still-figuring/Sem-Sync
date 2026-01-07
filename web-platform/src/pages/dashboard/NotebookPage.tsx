import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronLeft, Search, PenLine } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import {
  subscribeToNotes,
  createNote,
  updateNote,
  deleteNote,
  type Note,
} from "../../lib/notes";

// Debounce hook for auto-saving
function useDebounce(value: any, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function NotebookPage() {
  const { user } = useAuthStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Editor State
  const [activeNoteTitle, setActiveNoteTitle] = useState("");
  const [activeNoteContent, setActiveNoteContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load Notes
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToNotes(user.uid, (data) => {
      setNotes(data);
    });
    return () => unsubscribe();
  }, [user]);

  // Handle Note Selection
  useEffect(() => {
    if (selectedNoteId) {
      const note = notes.find((n) => n.id === selectedNoteId);
      if (note) {
        setActiveNoteTitle(note.title);
        setActiveNoteContent(note.content);
      }
    }
  }, [selectedNoteId]); // Only reset when ID changes, not when notes list updates to avoid cursor jumps if valid

  // Auto-Save Logic
  const debouncedTitle = useDebounce(activeNoteTitle, 1000);
  const debouncedContent = useDebounce(activeNoteContent, 1000);

  useEffect(() => {
    if (!user || !selectedNoteId) return;

    const saveChanges = async () => {
      setIsSaving(true);
      try {
        await updateNote(user.uid, selectedNoteId, {
          title: debouncedTitle,
          content: debouncedContent,
        });
      } catch (error) {
        console.error("Failed to save note", error);
      } finally {
        setIsSaving(false);
      }
    };

    // Only save if dirty (comparing to current memory might be tricky, simplified to save on debounce change)
    // To prevent overwrite loops, we could check against the 'notes' array,
    // but for now, simple debounce update is robust enough for single user.
    if (debouncedTitle !== "" || debouncedContent !== "") {
      // Check if it actually differs from what's in the list to avoid redundant writes
      const currentNote = notes.find((n) => n.id === selectedNoteId);
      if (
        currentNote &&
        (currentNote.title !== debouncedTitle ||
          currentNote.content !== debouncedContent)
      ) {
        saveChanges();
      }
    }
  }, [debouncedTitle, debouncedContent, selectedNoteId, user]);

  const handleCreateNote = async () => {
    if (!user) return;
    const newId = await createNote(user.uid);
    setSelectedNoteId(newId);
    // Focus title logic handled by UI state
  };

  const handleDeleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (!user) return;
    if (confirm("Delete this note?")) {
      await deleteNote(user.uid, noteId);
      if (selectedNoteId === noteId) {
        setSelectedNoteId(null);
      }
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mobile View Logic: If selectedNoteId is null, show list. Else show editor.
  // Desktop View: Always show both (sidebar + main).

  return (
    <div className="flex h-[calc(100vh-6rem)] sm:h-[calc(100vh-8rem)] gap-4 overflow-hidden">
      {/* Sidebar / Note List */}
      <div
        className={`
        flex-1 flex-col border rounded-lg bg-card shadow-sm overflow-hidden md:flex md:w-80 md:flex-none
        ${selectedNoteId ? "hidden md:flex" : "flex"}
      `}
      >
        {/* Header */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Notebook</h2>
            <button
              onClick={handleCreateNote}
              className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery ? "No matching notes." : "Create your first note!"}
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                className={`
                  group relative p-3 rounded-md cursor-pointer transition-all border
                  ${
                    selectedNoteId === note.id
                      ? "bg-accent border-primary/20 shadow-sm"
                      : "bg-transparent border-transparent hover:bg-accent/50 hover:border-border"
                  }
                `}
              >
                <h3
                  className={`font-semibold text-sm truncate ${
                    !note.title && "text-muted-foreground italic"
                  }`}
                >
                  {note.title || "Untitled Note"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 h-8">
                  {note.content || "No additional text"}
                </p>

                <button
                  onClick={(e) => handleDeleteNote(e, note.id)}
                  className="absolute right-2 top-2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                <div className="mt-2 text-[10px] text-muted-foreground/60 text-right">
                  {new Date(note.lastModified).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div
        className={`
        flex-1 flex-col bg-card border rounded-lg shadow-sm overflow-hidden relative
        ${!selectedNoteId ? "hidden md:flex" : "flex"}
      `}
      >
        {selectedNoteId ? (
          <>
            {/* Mobile Back Button & Toolbar */}
            <div className="flex items-center justify-between p-2 border-b md:hidden">
              <button
                onClick={() => setSelectedNoteId(null)}
                className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                Back
              </button>
              <div className="text-xs text-muted-foreground">
                {isSaving ? "Saving..." : "Saved"}
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 flex flex-col p-4 md:p-8 max-w-3xl mx-auto w-full">
              <input
                type="text"
                value={activeNoteTitle}
                onChange={(e) => setActiveNoteTitle(e.target.value)}
                placeholder="Note Title"
                className="text-3xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground/40 mb-4"
              />
              <textarea
                value={activeNoteContent}
                onChange={(e) => setActiveNoteContent(e.target.value)}
                placeholder="Start writing..."
                className="flex-1 resize-none bg-transparent border-none focus:outline-none focus:ring-0 text-base leading-relaxed placeholder:text-muted-foreground/30"
              />
            </div>

            {/* Desktop Save Indicator */}
            <div className="hidden md:block absolute bottom-4 right-6 text-xs text-muted-foreground/50 select-none">
              {isSaving ? "Saving..." : "All changes saved"}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
              <PenLine className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-medium">Select a note to view</p>
            <p className="text-sm">or create a new one to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
