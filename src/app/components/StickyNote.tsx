/**
 * StickyNote — Miro-style sticky note system used across Sessions 1–4.
 *
 * Exports:
 *   StickyNoteData     — note data type with optional position
 *   NOTE_COLORS        — 5 realistic sticky note colours
 *   randomColor()      — picks a random colour
 *   StickyNoteCanvas   — free-positioning board canvas with sticky stack
 *   ZoneStickyNote     — compact note for zone-based boards
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Copy, Pencil, Trash2, Palette, Plus, GripVertical } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StickyNoteData {
  id: string;
  text: string;
  color: string;
  x?: number;       // board-relative pixels
  y?: number;
  rotation?: number; // degrees ±2
}

// ─── Colours ──────────────────────────────────────────────────────────────────

export const NOTE_COLORS = [
  "#FFF176", // light yellow
  "#CCFF90", // light green
  "#FFCCBC", // peach
  "#B3E5FC", // light blue
  "#E1BEE7", // lavender
];

export function randomColor(): string {
  return NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
}

export function makeNote(text = ""): StickyNoteData {
  return {
    id: crypto.randomUUID(),
    text,
    color: randomColor(),
    rotation: (Math.random() * 4) - 2, // ±2°
  };
}

// ─── Single Sticky Note Card ──────────────────────────────────────────────────

interface StickyNoteCardProps {
  note: StickyNoteData;
  canEdit: boolean;
  isAbsolute?: boolean;   // true = absolutely positioned on canvas
  isDragging?: boolean;
  autoFocus?: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onEdit: (text: string) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onColorChange?: (color: string) => void;
}

export function StickyNoteCard({
  note, canEdit, isAbsolute, isDragging, autoFocus,
  onPointerDown, onEdit, onDelete, onDuplicate, onColorChange,
}: StickyNoteCardProps) {
  const [editing, setEditing] = useState(autoFocus || (!note.text));
  const [text, setText] = useState(note.text);
  const [hovered, setHovered] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync text when note.text changes from external (realtime)
  useEffect(() => {
    if (!editing) setText(note.text);
  }, [note.text, editing]);

  const save = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      onDelete();
      return;
    }
    onEdit(trimmed);
    setEditing(false);
    setShowColors(false);
  }, [text, onEdit, onDelete]);

  const startEdit = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canEdit) return;
    e.stopPropagation();
    setText(note.text);
    setEditing(true);
    setShowColors(false);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (editing) return; // don't drag while editing
    onPointerDown?.(e);
  };

  const containerStyle: React.CSSProperties = {
    width: 130,
    minHeight: 130,
    backgroundColor: note.color,
    borderRadius: 6,
    padding: "12px 12px 18px 12px",
    position: isAbsolute ? "absolute" : "relative",
    left: isAbsolute ? (note.x ?? 0) : undefined,
    top: isAbsolute ? (note.y ?? 0) : undefined,
    boxShadow: isDragging
      ? "0 14px 36px rgba(0,0,0,0.22)"
      : hovered
      ? "0 10px 28px rgba(0,0,0,0.18)"
      : "0 6px 18px rgba(0,0,0,0.12)",
    transform: `rotate(${note.rotation ?? 0}deg) scale(${isDragging ? 1.04 : 1}) translateY(${isDragging ? -4 : hovered ? -2 : 0}px)`,
    transition: isDragging ? "none" : "box-shadow 0.18s ease, transform 0.15s ease",
    zIndex: isDragging ? 999 : hovered ? 10 : 1,
    cursor: isDragging ? "grabbing" : editing ? "text" : canEdit ? "grab" : "default",
    touchAction: editing ? "auto" : "none",
    userSelect: "none",
    flexShrink: 0,
  };

  return (
    <div
      style={containerStyle}
      onPointerDown={handlePointerDown}
      onDoubleClick={startEdit}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); if (!editing) setShowColors(false); }}
    >
      {/* Folded corner */}
      <div style={{
        position: "absolute", bottom: 0, right: 0,
        width: 18, height: 18, borderBottomRightRadius: 6,
        background: "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%)",
        pointerEvents: "none",
      }} />

      {/* Action toolbar — shown on hover */}
      {hovered && !editing && canEdit && (
        <div
          onPointerDown={e => e.stopPropagation()}
          style={{
            position: "absolute", top: -14, right: -6,
            display: "flex", gap: 3, zIndex: 20,
          }}
        >
          <ActionBtn title="Edit" color="#4A1C5C" onClick={startEdit as any}>
            <Pencil style={{ width: 10, height: 10 }} />
          </ActionBtn>
          {onDuplicate && (
            <ActionBtn title="Duplicate" color="#3D6D6C" onClick={() => { onDuplicate(); setHovered(false); }}>
              <Copy style={{ width: 10, height: 10 }} />
            </ActionBtn>
          )}
          {onColorChange && (
            <ActionBtn title="Color" color="#D4A843" onClick={() => setShowColors(v => !v)}>
              <Palette style={{ width: 10, height: 10 }} />
            </ActionBtn>
          )}
          <ActionBtn title="Delete" color="#AA5D53" onClick={() => { onDelete(); setHovered(false); }}>
            <Trash2 style={{ width: 10, height: 10 }} />
          </ActionBtn>
        </div>
      )}

      {/* Color picker */}
      {showColors && (
        <div
          onPointerDown={e => e.stopPropagation()}
          style={{
            position: "absolute", top: -36, left: 0, display: "flex", gap: 5,
            background: "white", padding: "6px 8px", borderRadius: 8,
            boxShadow: "0 4px 14px rgba(0,0,0,0.18)", zIndex: 30,
          }}
        >
          {NOTE_COLORS.map(c => (
            <button
              key={c}
              onClick={() => { onColorChange?.(c); setShowColors(false); }}
              style={{
                width: 20, height: 20, borderRadius: 4,
                backgroundColor: c,
                border: c === note.color ? "2px solid #333" : "2px solid transparent",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      )}

      {/* Note content */}
      {editing ? (
        <textarea
          ref={textareaRef}
          autoFocus
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={save}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); }
            if (e.key === "Escape") { setText(note.text); setEditing(false); }
          }}
          placeholder="Write here…"
          style={{
            width: "100%", minHeight: 80,
            background: "transparent", border: "none", outline: "none",
            resize: "none", fontFamily: "Inter, sans-serif",
            fontSize: 14, fontWeight: 500, color: "#2D2D2D", lineHeight: 1.45,
            cursor: "text", touchAction: "auto", padding: 0,
          }}
        />
      ) : (
        <p style={{
          fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 500,
          color: "#2D2D2D", lineHeight: 1.45, wordBreak: "break-word",
          margin: 0, pointerEvents: "none",
        }}>
          {note.text || <span style={{ opacity: 0.4, fontStyle: "italic" }}>Double-click to write</span>}
        </p>
      )}
    </div>
  );
}

// ─── Small action button ──────────────────────────────────────────────────────

function ActionBtn({ children, onClick, color, title }: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  color: string;
  title: string;
}) {
  return (
    <button
      title={title}
      onClick={e => { e.stopPropagation(); onClick(e); }}
      style={{
        width: 22, height: 22, borderRadius: "50%",
        backgroundColor: color, color: "white",
        border: "none", cursor: "pointer", display: "flex",
        alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

// ─── Sticky Note Stack ────────────────────────────────────────────────────────

function StickyStack({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      title="Click to add a sticky note"
      style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", userSelect: "none" }}
    >
      {/* Stacked notes */}
      <div style={{ position: "relative", width: 64, height: 64 }}>
        {[
          { color: "#E1BEE7", rotate: -6, top: 6, left: 6 },
          { color: "#B3E5FC", rotate: 4,  top: 3, left: 3 },
          { color: "#FFF176", rotate: 0,  top: 0, left: 0 },
        ].map((s, i) => (
          <div key={i} style={{
            position: "absolute", top: s.top, left: s.left,
            width: 58, height: 58, backgroundColor: s.color,
            borderRadius: 6, boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
            transform: `rotate(${s.rotate}deg)`,
            transition: "transform 0.2s",
          }} />
        ))}
        {/* Plus icon on top note */}
        <div style={{
          position: "absolute", top: 0, left: 0, width: 58, height: 58,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Plus style={{ width: 22, height: 22, color: "#555", opacity: 0.7 }} />
        </div>
      </div>
      <span style={{
        marginTop: 6, fontSize: 11, fontWeight: 600,
        color: "#666", textAlign: "center", letterSpacing: 0.3,
      }}>
        Add Note
      </span>
    </div>
  );
}

// ─── Free-positioning Canvas ──────────────────────────────────────────────────

interface StickyNoteCanvasProps {
  notes: StickyNoteData[];
  onChange: (notes: StickyNoteData[]) => void;
  prompt: string;
  canEdit: boolean;
  minHeight?: number;
  background?: React.ReactNode; // tree illustration / rings
}

export function StickyNoteCanvas({
  notes,
  onChange,
  prompt,
  canEdit,
  minHeight = 480,
  background,
}: StickyNoteCanvasProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [newNoteId, setNewNoteId] = useState<string | null>(null);
  const notesRef = useRef(notes);
  notesRef.current = notes;

  // Ensure all notes have positions; assign them once on first render
  const ensurePositions = useCallback((incoming: StickyNoteData[]): StickyNoteData[] => {
    const board = boardRef.current;
    const w = board?.clientWidth || 700;
    const h = Math.max(board?.clientHeight || 480, minHeight);
    return incoming.map((n, i) => {
      if (n.x !== undefined && n.y !== undefined) return n;
      const col = i % 4;
      const row = Math.floor(i / 4);
      return {
        ...n,
        x: 24 + col * 155,
        y: 24 + row * 160,
        rotation: n.rotation ?? ((Math.random() * 4) - 2),
      };
    });
  }, [minHeight]);

  const startDrag = useCallback((noteId: string, e: React.PointerEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    e.preventDefault();
    e.stopPropagation();

    const board = boardRef.current!;
    const boardRect = board.getBoundingClientRect();
    const note = notesRef.current.find(n => n.id === noteId)!;
    const offsetX = e.clientX - boardRect.left - (note.x ?? 0);
    const offsetY = e.clientY - boardRect.top - (note.y ?? 0);

    setDraggingId(noteId);

    const onMove = (ev: PointerEvent) => {
      ev.preventDefault();
      const newX = Math.max(0, ev.clientX - boardRect.left - offsetX);
      const newY = Math.max(0, ev.clientY - boardRect.top - offsetY);
      const updated = notesRef.current.map(n =>
        n.id === noteId ? { ...n, x: newX, y: newY } : n
      );
      onChange(updated);
    };

    const onUp = () => {
      setDraggingId(null);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
    };

    document.addEventListener("pointermove", onMove, { passive: false });
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  }, [canEdit, onChange]);

  const addNote = useCallback(() => {
    const board = boardRef.current;
    const w = board?.clientWidth || 700;
    const h = Math.max(board?.clientHeight || 480, minHeight);
    const note: StickyNoteData = {
      ...makeNote(),
      // Place near the stack (right side) with some y randomness
      x: Math.max(20, w - 210),
      y: 20 + Math.random() * Math.max(0, h - 170),
    };
    onChange([...notesRef.current, note]);
    setNewNoteId(note.id);
  }, [onChange, minHeight]);

  const editNote = useCallback((id: string, text: string) => {
    onChange(notesRef.current.map(n => n.id === id ? { ...n, text } : n));
    setNewNoteId(prev => prev === id ? null : prev);
  }, [onChange]);

  const deleteNote = useCallback((id: string) => {
    onChange(notesRef.current.filter(n => n.id !== id));
    setNewNoteId(prev => prev === id ? null : prev);
  }, [onChange]);

  const duplicateNote = useCallback((id: string) => {
    const note = notesRef.current.find(n => n.id === id);
    if (!note) return;
    const dup: StickyNoteData = {
      ...note,
      id: crypto.randomUUID(),
      x: (note.x ?? 0) + 24,
      y: (note.y ?? 0) + 24,
      rotation: (Math.random() * 4) - 2,
    };
    onChange([...notesRef.current, dup]);
  }, [onChange]);

  const colorNote = useCallback((id: string, color: string) => {
    onChange(notesRef.current.map(n => n.id === id ? { ...n, color } : n));
  }, [onChange]);

  // Assign positions to notes that don't have them
  const positionedNotes = ensurePositions(notes);

  return (
    <div className="space-y-3">
      {/* Prompt */}
      <div className="bg-[#4A1C5C]/6 border border-[#4A1C5C]/18 rounded-xl px-4 py-3 text-center">
        <p
          className="text-[#4A1C5C] font-semibold italic text-sm sm:text-base"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          "{prompt}"
        </p>
      </div>

      {/* Board */}
      <div
        ref={boardRef}
        style={{ position: "relative", minHeight, overflow: "auto" }}
        className="rounded-2xl border-2 border-dashed border-border bg-[#FAFAF7]"
        onDoubleClick={canEdit ? addNote : undefined}
      >
        {/* Background decoration */}
        {background && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            {background}
          </div>
        )}

        {/* Empty state */}
        {positionedNotes.length === 0 && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <p style={{ fontSize: 13, color: "#999", fontStyle: "italic" }}>
              {canEdit ? "Click the stack or double-click to add notes" : "No notes yet"}
            </p>
          </div>
        )}

        {/* Notes */}
        {positionedNotes.map(note => (
          <StickyNoteCard
            key={note.id}
            note={note}
            canEdit={canEdit}
            isAbsolute={true}
            isDragging={draggingId === note.id}
            autoFocus={newNoteId === note.id}
            onPointerDown={e => startDrag(note.id, e)}
            onEdit={text => editNote(note.id, text)}
            onDelete={() => deleteNote(note.id)}
            onDuplicate={() => duplicateNote(note.id)}
            onColorChange={color => colorNote(note.id, color)}
          />
        ))}

        {/* Sticky stack — right side */}
        {canEdit && (
          <div style={{
            position: "absolute", right: 12, bottom: 12, zIndex: 5,
          }}>
            <StickyStack onClick={addNote} />
          </div>
        )}
      </div>

      <p style={{ fontSize: 11, color: "#999", textAlign: "center" }}>
        {positionedNotes.length > 0
          ? `${positionedNotes.length} note${positionedNotes.length !== 1 ? "s" : ""} · Double-click the board or use the stack to add more`
          : ""}
      </p>
    </div>
  );
}

// ─── Zone sticky note (for drag-between-zone boards) ─────────────────────────
// Visually consistent with StickyNoteCard but participates in zone DnD.

interface ZoneStickyNoteProps {
  note: StickyNoteData;
  canEdit: boolean;
  isDragging?: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onColorChange?: (id: string, color: string) => void;
}

export function ZoneStickyNote({
  note, canEdit, isDragging, onPointerDown, onEdit, onDelete, onDuplicate, onColorChange,
}: ZoneStickyNoteProps) {
  const [editing, setEditing] = useState(!note.text);
  const [text, setText] = useState(note.text);
  const [hovered, setHovered] = useState(false);
  const [showColors, setShowColors] = useState(false);

  useEffect(() => { if (!editing) setText(note.text); }, [note.text, editing]);

  const save = () => {
    const trimmed = text.trim();
    if (!trimmed) { onDelete(note.id); return; }
    onEdit(note.id, trimmed);
    setEditing(false);
    setShowColors(false);
  };

  return (
    <div
      onPointerDown={(!editing && canEdit) ? onPointerDown : undefined}
      onDoubleClick={() => { if (canEdit) { setText(note.text); setEditing(true); } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); if (!editing) setShowColors(false); }}
      style={{
        position: "relative",
        width: 110,
        minHeight: 110,
        backgroundColor: note.color,
        borderRadius: 6,
        padding: "10px 10px 16px 10px",
        boxShadow: isDragging
          ? "0 14px 32px rgba(0,0,0,0.2)"
          : hovered
          ? "0 8px 22px rgba(0,0,0,0.16)"
          : "0 5px 14px rgba(0,0,0,0.1)",
        transform: `rotate(${note.rotation ?? 0}deg) scale(${isDragging ? 1.04 : 1}) translateY(${isDragging ? -4 : 0}px)`,
        transition: isDragging ? "none" : "box-shadow 0.18s, transform 0.15s",
        zIndex: isDragging ? 999 : hovered ? 10 : 1,
        cursor: isDragging ? "grabbing" : editing ? "text" : canEdit ? "grab" : "default",
        touchAction: editing ? "auto" : "none",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {/* Fold */}
      <div style={{
        position: "absolute", bottom: 0, right: 0, width: 16, height: 16,
        background: "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.09) 50%)",
        borderBottomRightRadius: 6, pointerEvents: "none",
      }} />

      {/* Action toolbar */}
      {hovered && !editing && canEdit && (
        <div onPointerDown={e => e.stopPropagation()} style={{
          position: "absolute", top: -13, right: -4,
          display: "flex", gap: 3, zIndex: 20,
        }}>
          <ActionBtn title="Edit" color="#4A1C5C" onClick={() => { setText(note.text); setEditing(true); }}>
            <Pencil style={{ width: 9, height: 9 }} />
          </ActionBtn>
          {onDuplicate && (
            <ActionBtn title="Duplicate" color="#3D6D6C" onClick={() => onDuplicate(note.id)}>
              <Copy style={{ width: 9, height: 9 }} />
            </ActionBtn>
          )}
          {onColorChange && (
            <ActionBtn title="Color" color="#D4A843" onClick={() => setShowColors(v => !v)}>
              <Palette style={{ width: 9, height: 9 }} />
            </ActionBtn>
          )}
          <ActionBtn title="Delete" color="#AA5D53" onClick={() => onDelete(note.id)}>
            <Trash2 style={{ width: 9, height: 9 }} />
          </ActionBtn>
        </div>
      )}

      {/* Color picker */}
      {showColors && (
        <div onPointerDown={e => e.stopPropagation()} style={{
          position: "absolute", top: -34, left: 0, display: "flex", gap: 4,
          background: "white", padding: "5px 7px", borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.16)", zIndex: 30,
        }}>
          {NOTE_COLORS.map(c => (
            <button key={c} onClick={() => { onColorChange?.(note.id, c); setShowColors(false); }}
              style={{ width: 18, height: 18, borderRadius: 3, backgroundColor: c, border: c === note.color ? "2px solid #333" : "2px solid transparent", cursor: "pointer" }} />
          ))}
        </div>
      )}

      {/* Content */}
      {editing ? (
        <textarea autoFocus value={text} onChange={e => setText(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); } if (e.key === "Escape") { setText(note.text); setEditing(false); } }}
          placeholder="Write here…"
          style={{
            width: "100%", minHeight: 70, background: "transparent", border: "none",
            outline: "none", resize: "none", fontFamily: "Inter, sans-serif",
            fontSize: 13, fontWeight: 500, color: "#2D2D2D", lineHeight: 1.4,
            cursor: "text", touchAction: "auto", padding: 0,
          }}
        />
      ) : (
        <p style={{
          fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500,
          color: "#2D2D2D", lineHeight: 1.4, wordBreak: "break-word", margin: 0,
          pointerEvents: "none",
        }}>
          {note.text || <span style={{ opacity: 0.35, fontStyle: "italic" }}>Double-click to write</span>}
        </p>
      )}
    </div>
  );
}
