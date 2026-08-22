import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { createClient } from "../../../utils/supabase/client";
import { getAuthHeaders } from "../../../utils/supabase/api";
import { projectId } from "../../../utils/supabase/info";
import SessionCompletionModal from "../../components/SessionCompletionModal";
import {
  ChevronLeft, ChevronRight, ArrowLeft, Wifi, WifiOff, Save,
  CheckCircle, Plus, X, Pencil, Loader2, GripVertical, Zap, Leaf, Droplets,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StickyNote { id: string; text: string; color: string; }

type EnergyLevel = "energising" | "grounding" | "draining" | null;

interface Session3State {
  currentStep: number;
  // Step 2 — participant-created sticky notes per tier
  step1: { response: "yes" | "no" | null; notes: StickyNote[]; anchorIdentityOverride: string | null };
  step2: { observe: StickyNote[]; converse: StickyNote[]; act: StickyNote[] };
  step3: {
    challengeMappings: Record<string, string[]>; // experimentNoteId → challengeNoteId[]
    additionalNotes: StickyNote[];
    experimentEnergy: Record<string, EnergyLevel>; // experimentNoteId → energy
  };
  step4: { commitmentDate: string; numberOfActions: number; notes: StickyNote[] };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;
const HEADERS = getAuthHeaders;
const NOTE_COLORS = ["#FFF9C4", "#C8E6C9", "#E1BEE7", "#FFE0B2", "#B3E5FC", "#F8BBD9", "#DCEDC8", "#FCE4EC"];

const IDENTITY_CARDS = [
  { id: "parent", label: "Parent / Grandparent", symbol: "🏡" },
  { id: "professional", label: "Professional", symbol: "💼" },
  { id: "community_leader", label: "Community Leader", symbol: "🏛️" },
  { id: "creative", label: "Creative Soul", symbol: "🎨" },
  { id: "explorer", label: "Explorer / Adventurer", symbol: "🗺️" },
  { id: "mentor", label: "Mentor / Teacher", symbol: "📚" },
  { id: "entrepreneur", label: "Entrepreneur", symbol: "🚀" },
  { id: "caregiver", label: "Caregiver / Nurturer", symbol: "❤️" },
  { id: "activist", label: "Activist", symbol: "✊" },
  { id: "spiritual", label: "Spiritual Person", symbol: "🕊️" },
  { id: "friend", label: "Friend / Companion", symbol: "🤝" },
  { id: "learner", label: "Learner / Student", symbol: "🎓" },
  { id: "artist", label: "Artist / Creator", symbol: "🎭" },
  { id: "athlete", label: "Athlete / Active", symbol: "⚡" },
  { id: "nature", label: "Nature Lover", symbol: "🌿" },
  { id: "philanthropist", label: "Philanthropist", symbol: "🌟" },
];

const ROLE_CARDS = [
  { id: "entrepreneur", label: "Entrepreneur" },
  { id: "executive_coach", label: "Executive Coach" },
  { id: "visiting_faculty", label: "Visiting Faculty" },
  { id: "venture_builder", label: "Learning / Venture Builder" },
  { id: "author", label: "Author / Writer" },
  { id: "consultant", label: "Independent Consultant" },
  { id: "advisor", label: "Advisor" },
  { id: "volunteer", label: "Volunteer" },
  { id: "social_entrepreneur", label: "Social Entrepreneur" },
  { id: "speaker", label: "Speaker / Facilitator" },
  { id: "board_member", label: "Board Member" },
  { id: "mentor_role", label: "Mentor" },
];

const TIERS = [
  { id: "observe",  label: "Observe",  badge: "Low Friction",      effort: "Under 2 Hours",      color: "#4A1C5C", bg: "#4A1C5C08" },
  { id: "converse", label: "Converse", badge: "Medium Engagement", effort: "Half Day",            color: "#3D6D6C", bg: "#3D6D6C08" },
  { id: "act",      label: "Act",      badge: "High Stakes",       effort: "Full Day or Public",  color: "#AA5D53", bg: "#AA5D5308" },
];

const STEPS = [
  { number: 1, title: "Recalibration",         subtitle: "A moment to reconsider" },
  { number: 2, title: "Experiment Design",     subtitle: "Design your path into this identity" },
  { number: 3, title: "Friction Mapping",      subtitle: "Map what might challenge your experiments" },
  { number: 4, title: "First Step Commitment", subtitle: "Your commitment to action" },
];

const TOTAL_STEPS = 4;

const DEFAULT_STATE: Session3State = {
  currentStep: 1,
  step1: { response: null, notes: [], anchorIdentityOverride: null },
  step2: { observe: [], converse: [], act: [] },
  step3: { challengeMappings: {}, additionalNotes: [], experimentEnergy: {} },
  step4: { commitmentDate: "", numberOfActions: 1, notes: [] },
};

// Migrate old step2 (string[] of card IDs) to new StickyNote[]
function migrateStep2(raw: any): Session3State["step2"] {
  const toNotes = (arr: any[]): StickyNote[] => {
    if (!Array.isArray(arr) || arr.length === 0) return [];
    // If items are already StickyNote objects, keep them
    if (typeof arr[0] === "object" && arr[0] !== null && "id" in arr[0] && "text" in arr[0]) return arr as StickyNote[];
    // Old format was string IDs — discard them (can't reconstruct text)
    return [];
  };
  return {
    observe: toNotes(raw?.observe || []),
    converse: toNotes(raw?.converse || []),
    act: toNotes(raw?.act || []),
  };
}

function migrateState(raw: any): Session3State {
  if (!raw || Object.keys(raw).length <= 1) return DEFAULT_STATE;
  return {
    ...DEFAULT_STATE,
    ...raw,
    step2: migrateStep2(raw.step2),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getIdentityLabel(id: string): string {
  return IDENTITY_CARDS.find(c => c.id === id)?.label || ROLE_CARDS.find(r => r.id === id)?.label || id;
}
function getIdentitySymbol(id: string): string {
  return IDENTITY_CARDS.find(c => c.id === id)?.symbol || "✦";
}
function makeNote(text = ""): StickyNote {
  return { id: crypto.randomUUID(), text, color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)] };
}

// ─── Touch / Pointer DnD ──────────────────────────────────────────────────────

function useTouchDnD(onDrop: (itemId: string, zone: string) => void) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overZone, setOverZone] = useState<string | null>(null);
  const cb = useRef(onDrop);
  cb.current = onDrop;

  const startDrag = useCallback((id: string, label: string, e: React.PointerEvent<HTMLElement>) => {
    e.preventDefault();
    const ghost = document.createElement("div");
    const short = label.length > 30 ? label.slice(0, 30) + "…" : label;
    Object.assign(ghost.style, {
      position: "fixed", pointerEvents: "none", zIndex: "9999",
      padding: "8px 12px", background: "white", border: "2px solid #4A1C5C",
      borderRadius: "10px", fontSize: "12px", boxShadow: "0 6px 20px rgba(0,0,0,0.22)",
      opacity: "0.92", maxWidth: "160px", wordBreak: "break-word", transform: "rotate(2deg)",
    });
    ghost.textContent = short || "Note";
    document.body.appendChild(ghost);
    setDraggingId(id);

    const pos = (x: number, y: number) => { ghost.style.left = `${x - 80}px`; ghost.style.top = `${y - 22}px`; };
    const findZone = (x: number, y: number) => {
      ghost.style.visibility = "hidden";
      const els = document.elementsFromPoint(x, y);
      ghost.style.visibility = "visible";
      for (const el of els) { const z = (el as HTMLElement).dataset?.dropzone; if (z) return z; }
      return null;
    };
    pos(e.clientX, e.clientY);

    const onMove = (ev: PointerEvent) => { pos(ev.clientX, ev.clientY); setOverZone(findZone(ev.clientX, ev.clientY)); };
    const cleanup = () => {
      if (document.body.contains(ghost)) document.body.removeChild(ghost);
      setDraggingId(null); setOverZone(null);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", cleanup);
    };
    const onUp = (ev: PointerEvent) => { const z = findZone(ev.clientX, ev.clientY); if (z) cb.current(id, z); cleanup(); };
    document.addEventListener("pointermove", onMove, { passive: false });
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", cleanup);
  }, []);

  return { draggingId, overZone, startDrag };
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function NoteInput({ placeholder, onAdd, btnColor = "#D4A843" }: {
  placeholder: string; onAdd: (t: string) => void; btnColor?: string;
}) {
  const [text, setText] = useState("");
  const submit = () => { if (!text.trim()) return; onAdd(text.trim()); setText(""); };
  return (
    <div className="flex gap-2 items-start">
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder={placeholder}
        className="flex-1 rounded-lg border border-border p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#4A1C5C]/25 min-w-0" rows={2}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} />
      <button onClick={submit} style={{ backgroundColor: btnColor }}
        className="mt-1 px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1 flex-shrink-0 text-white hover:opacity-90 transition-opacity">
        <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add</span>
      </button>
    </div>
  );
}

// Inline-editable sticky note used in both Step 2 and Step 3
interface StickyProps {
  note: StickyNote;
  canEdit: boolean;
  isDragging?: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  startEditing?: boolean; // auto-focus on mount
  extraContent?: React.ReactNode; // energy buttons etc.
}

function StickyNoteCard({ note, canEdit, isDragging, onPointerDown, onEdit, onDelete, startEditing, extraContent }: StickyProps) {
  const [editing, setEditing] = useState(startEditing || false);
  const [text, setText] = useState(note.text);

  const save = () => {
    if (!text.trim()) { onDelete(note.id); return; }
    onEdit(note.id, text.trim());
    setEditing(false);
  };

  return (
    <div
      onPointerDown={(!editing && canEdit) ? onPointerDown : undefined}
      style={{
        backgroundColor: note.color,
        touchAction: (!editing && canEdit) ? "none" : "auto",
        opacity: isDragging ? 0.35 : 1,
        userSelect: "none",
      }}
      className={`group relative rounded-xl p-3 shadow-sm transition-all w-full ${!editing && canEdit ? "cursor-grab active:cursor-grabbing hover:shadow-md" : ""}`}
    >
      {editing ? (
        <div className="space-y-2" onPointerDown={e => e.stopPropagation()}>
          <textarea
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Describe your experiment idea…"
            rows={3}
            className="w-full bg-transparent resize-none text-sm border-b-2 border-black/20 focus:border-black/40 focus:outline-none placeholder:text-black/30"
            style={{ touchAction: "auto" }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); } if (e.key === "Escape") { setText(note.text); setEditing(false); } }}
          />
          <div className="flex gap-2">
            <button onClick={save} className="text-xs px-3 py-1 bg-black/15 rounded-lg hover:bg-black/25 font-medium transition-colors">Save</button>
            <button onClick={() => { setText(note.text); setEditing(false); }} className="text-xs px-3 py-1 bg-black/10 rounded-lg hover:bg-black/20 transition-colors">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          {canEdit && <GripVertical className="w-3 h-3 text-black/20 mb-1 pointer-events-none" />}
          <p className="text-sm text-gray-800 leading-snug break-words">{note.text || <span className="italic text-black/30">Empty note</span>}</p>
          {extraContent}
          {canEdit && (
            <div className="absolute top-2 right-2 hidden group-hover:flex gap-1" onPointerDown={e => e.stopPropagation()}>
              <button onClick={() => { setText(note.text); setEditing(true); }}
                className="w-6 h-6 bg-white/80 rounded-lg flex items-center justify-center hover:bg-white shadow-sm transition-colors">
                <Pencil className="w-3 h-3 text-gray-600" />
              </button>
              <button onClick={() => onDelete(note.id)}
                className="w-6 h-6 bg-white/80 rounded-lg flex items-center justify-center hover:bg-white shadow-sm transition-colors">
                <X className="w-3 h-3 text-[#AA5D53]" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Step 1: Recalibration ────────────────────────────────────────────────────

function Step1Recalibration({ state, onChange, anchorId, shortlistedIds }: {
  state: Session3State["step1"];
  onChange: (s: Session3State["step1"]) => void;
  anchorId: string; shortlistedIds: string[];
}) {
  const effectiveAnchor = state.anchorIdentityOverride || anchorId;
  const otherIdentities = shortlistedIds.filter(id => id !== effectiveAnchor);

  return (
    <div className="space-y-6">
      {/* Identity card */}
      <div className="flex justify-center">
        <div className="p-6 rounded-2xl border-2 border-[#4A1C5C]/30 bg-[#4A1C5C]/5 text-center max-w-xs w-full shadow-sm">
          <div className="text-5xl mb-3">{getIdentitySymbol(effectiveAnchor)}</div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Anchor Identity from Session 2</p>
          <p className="text-lg font-bold text-[#4A1C5C]" style={{ fontFamily: "Playfair Display, serif" }}>{getIdentityLabel(effectiveAnchor)}</p>
          {state.anchorIdentityOverride && <span className="mt-2 inline-block text-xs bg-[#3D6D6C] text-white px-2 py-0.5 rounded-full">Updated this session</span>}
        </div>
      </div>

      <div className="bg-[#4A1C5C]/6 border border-[#4A1C5C]/20 rounded-xl p-4 text-center">
        <p className="text-[#4A1C5C] font-semibold italic text-base sm:text-lg" style={{ fontFamily: "Playfair Display, serif" }}>
          "Does the Anchor Identity still feel right?"
        </p>
      </div>

      {state.response === null ? (
        <div className="flex gap-4 justify-center">
          {(["yes", "no"] as const).map(val => (
            <motion.button key={val} whileTap={{ scale: 0.95 }}
              onClick={() => onChange({ ...state, response: val })}
              className={`px-10 py-4 rounded-2xl text-lg font-bold border-2 transition-all shadow-sm ${
                val === "yes" ? "border-[#3D6D6C] text-[#3D6D6C] hover:bg-[#3D6D6C] hover:text-white"
                              : "border-[#AA5D53] text-[#AA5D53] hover:bg-[#AA5D53] hover:text-white"}`}>
              {val === "yes" ? "✓ Yes" : "✗ No"}
            </motion.button>
          ))}
        </div>
      ) : (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="flex items-center justify-center gap-3">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 ${state.response === "yes" ? "border-[#3D6D6C] bg-[#3D6D6C]/10 text-[#3D6D6C]" : "border-[#AA5D53] bg-[#AA5D53]/10 text-[#AA5D53]"}`}>
                {state.response === "yes" ? "✓ Yes — still right" : "✗ No — something shifted"}
              </span>
              <button onClick={() => onChange({ ...state, response: null, anchorIdentityOverride: null })} className="text-xs text-muted-foreground hover:text-foreground underline">Change</button>
            </div>
            <div className="bg-[#EBE2D6]/60 rounded-xl p-4 text-center">
              <p className="text-[#4A1C5C] font-semibold italic text-sm sm:text-base" style={{ fontFamily: "Playfair Display, serif" }}>
                {state.response === "yes" ? '"What has strengthened your confidence in this identity since Session 2?"' : '"What has shifted since Session 2?"'}
              </p>
            </div>
            <NoteInput placeholder={state.response === "yes" ? "What's reinforced your confidence…" : "What's changed or feels different…"}
              onAdd={t => onChange({ ...state, notes: [...state.notes, makeNote(t)] })} />
            <div className="flex flex-wrap gap-3">
              {state.notes.map(n => (
                <div key={n.id} className="group relative rounded-lg p-2.5 shadow-sm w-28 flex-shrink-0" style={{ backgroundColor: n.color }}>
                  <p className="text-xs text-gray-800 break-words">{n.text}</p>
                  <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                    <button onClick={() => onChange({ ...state, notes: state.notes.filter(x => x.id !== n.id) })} className="w-4 h-4 bg-white/80 rounded flex items-center justify-center"><X className="w-2.5 h-2.5 text-[#AA5D53]" /></button>
                  </div>
                </div>
              ))}
            </div>
            {state.response === "no" && otherIdentities.length > 0 && (
              <div className="border border-[#AA5D53]/30 rounded-xl p-4 bg-[#AA5D53]/5 space-y-3">
                <p className="text-sm font-medium">Would you like to choose another Anchor Identity from your shortlist?</p>
                <div className="flex flex-wrap gap-3">
                  {otherIdentities.map(id => {
                    const isSelected = state.anchorIdentityOverride === id;
                    return (
                      <button key={id} onClick={() => onChange({ ...state, anchorIdentityOverride: isSelected ? null : id })}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${isSelected ? "border-[#4A1C5C] bg-[#4A1C5C] text-white shadow-md" : "border-border bg-white text-foreground hover:border-[#4A1C5C]/50"}`}>
                        <span>{getIdentitySymbol(id)}</span> {getIdentityLabel(id)} {isSelected && <CheckCircle className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// ─── Step 2: Experiment Design (Miro-style sticky note workspace) ─────────────

function Step2ExperimentDesign({ state, onChange, canEdit }: {
  state: Session3State["step2"];
  onChange: (s: Session3State["step2"]) => void;
  canEdit: boolean;
}) {
  // Track which note was just created so it auto-focuses
  const [newNoteId, setNewNoteId] = useState<string | null>(null);

  const allNotes = [...state.observe, ...state.converse, ...state.act];

  const { draggingId, overZone, startDrag } = useTouchDnD((noteId, targetZone) => {
    // Find current zone
    const srcZone =
      state.observe.some(n => n.id === noteId) ? "observe" :
      state.converse.some(n => n.id === noteId) ? "converse" :
      state.act.some(n => n.id === noteId) ? "act" : null;

    if (!srcZone || srcZone === targetZone) return;

    const note = (state[srcZone as keyof typeof state] as StickyNote[]).find(n => n.id === noteId)!;
    const updated = { ...state };
    (updated[srcZone as keyof typeof state] as StickyNote[]) = (state[srcZone as keyof typeof state] as StickyNote[]).filter(n => n.id !== noteId);
    (updated[targetZone as keyof typeof state] as StickyNote[]) = [...(state[targetZone as keyof typeof state] as StickyNote[]), note];
    onChange(updated);
  });

  const addNote = (tier: "observe" | "converse" | "act") => {
    const note = makeNote("");
    onChange({ ...state, [tier]: [...state[tier], note] });
    setNewNoteId(note.id);
  };

  const editNote = (tier: "observe" | "converse" | "act", id: string, text: string) => {
    onChange({ ...state, [tier]: state[tier].map(n => n.id === id ? { ...n, text } : n) });
    if (newNoteId === id) setNewNoteId(null);
  };

  const deleteNote = (tier: "observe" | "converse" | "act", id: string) => {
    onChange({ ...state, [tier]: state[tier].filter(n => n.id !== id) });
    if (newNoteId === id) setNewNoteId(null);
  };

  const totalNotes = allNotes.length;

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">
          Create your own experiment ideas. Add sticky notes to each section — drag to move them between sections.
        </p>
        <p className="text-xs text-muted-foreground italic">
          Examples: Talk to a mentor · Attend a community event · Teach one small session · Write an article
        </p>
        {totalNotes > 0 && <p className="text-xs text-[#4A1C5C] font-semibold bg-[#4A1C5C]/10 inline-block px-3 py-1 rounded-full">{totalNotes} experiment{totalNotes !== 1 ? "s" : ""} created</p>}
      </div>

      {/* Three zone workspace */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TIERS.map(tier => {
          const notes = state[tier.id as keyof typeof state] as StickyNote[];
          const isOver = overZone === tier.id;
          return (
            <div
              key={tier.id}
              data-dropzone={tier.id}
              onDoubleClick={(e) => {
                // Create note on double-click anywhere on the zone background
                if ((e.target as HTMLElement).closest("[data-no-create]")) return;
                if (canEdit) addNote(tier.id as any);
              }}
              className={`min-h-64 rounded-2xl border-2 p-4 flex flex-col transition-all duration-150 ${isOver ? "shadow-xl scale-[1.01]" : "hover:shadow-sm"}`}
              style={{
                borderColor: isOver ? tier.color : `${tier.color}35`,
                backgroundColor: isOver ? `${tier.color}14` : tier.bg,
              }}
            >
              {/* Zone header */}
              <div className="mb-4 pointer-events-none" data-no-create>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
                    style={{ backgroundColor: tier.color }}>
                    {tier.label.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-tight" style={{ color: tier.color }}>{tier.label}</h3>
                    <p className="text-[10px] text-muted-foreground">{tier.badge}</p>
                  </div>
                  <span className="ml-auto text-[10px] bg-white/70 border rounded-full px-2 py-0.5 text-muted-foreground">{notes.length}</span>
                </div>
                <div className="flex items-center gap-1.5 ml-10">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${tier.color}18`, color: tier.color }}>
                    ⏱ {tier.effort}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="flex-1 flex flex-col gap-2" data-no-create>
                {notes.map(note => (
                  <StickyNoteCard
                    key={note.id}
                    note={note}
                    canEdit={canEdit}
                    isDragging={draggingId === note.id}
                    onPointerDown={e => startDrag(note.id, note.text, e)}
                    onEdit={(id, text) => editNote(tier.id as any, id, text)}
                    onDelete={id => deleteNote(tier.id as any, id)}
                    startEditing={newNoteId === note.id}
                  />
                ))}

                {notes.length === 0 && !isOver && (
                  <div className="flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 text-center"
                    style={{ borderColor: `${tier.color}40` }}>
                    <p className="text-xs text-muted-foreground italic mb-3">No experiments yet</p>
                    {canEdit && <p className="text-[10px] text-muted-foreground">Double-click anywhere or use the button below</p>}
                  </div>
                )}

                {isOver && (
                  <div className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed py-6"
                    style={{ borderColor: tier.color, backgroundColor: `${tier.color}10` }}>
                    <p className="text-xs font-semibold" style={{ color: tier.color }}>Drop here</p>
                  </div>
                )}
              </div>

              {/* Add button */}
              {canEdit && (
                <button
                  data-no-create
                  onClick={() => addNote(tier.id as any)}
                  className="mt-3 w-full py-2 rounded-xl border-2 border-dashed text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
                  style={{ borderColor: `${tier.color}50`, color: tier.color, backgroundColor: `${tier.color}08` }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Experiment
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 3: Friction Mapping ──────────────────────────────────────────────────

const ENERGY_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  energising: { label: "Energising", color: "#3D6D6C", icon: <Zap className="w-3 h-3" /> },
  grounding:  { label: "Grounding",  color: "#D4A843", icon: <Leaf className="w-3 h-3" /> },
  draining:   { label: "Draining",   color: "#AA5D53", icon: <Droplets className="w-3 h-3" /> },
};

function Step3FrictionMapping({ state, onChange, step2, s2Challenges, canEdit }: {
  state: Session3State["step3"];
  onChange: (s: Session3State["step3"]) => void;
  step2: Session3State["step2"];
  s2Challenges: StickyNote[];
  canEdit: boolean;
}) {
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);

  const allChallenges: StickyNote[] = [...s2Challenges, ...state.additionalNotes];
  const allExperiments: { note: StickyNote; tier: typeof TIERS[0] }[] = [
    ...step2.observe.map(n => ({ note: n, tier: TIERS[0] })),
    ...step2.converse.map(n => ({ note: n, tier: TIERS[1] })),
    ...step2.act.map(n => ({ note: n, tier: TIERS[2] })),
  ];

  const toggleMapping = (expId: string, chalId: string) => {
    const cur = state.challengeMappings[expId] || [];
    onChange({ ...state, challengeMappings: { ...state.challengeMappings, [expId]: cur.includes(chalId) ? cur.filter(id => id !== chalId) : [...cur, chalId] } });
    setSelectedChallengeId(null);
  };

  const setEnergy = (expId: string, level: EnergyLevel) => {
    const cur = state.experimentEnergy[expId];
    onChange({ ...state, experimentEnergy: { ...state.experimentEnergy, [expId]: cur === level ? null : level } });
  };

  const addChallenge = (text: string) => onChange({ ...state, additionalNotes: [...state.additionalNotes, makeNote(text)] });
  const deleteChallenge = (id: string) => {
    const mappings = Object.fromEntries(Object.entries(state.challengeMappings).map(([k, v]) => [k, v.filter(x => x !== id)]));
    onChange({ ...state, additionalNotes: state.additionalNotes.filter(n => n.id !== id), challengeMappings: mappings });
  };

  const getChallengeNote = (id: string) => allChallenges.find(n => n.id === id);
  const isFromS2 = (id: string) => s2Challenges.some(n => n.id === id);

  const hasExperiments = allExperiments.length > 0;

  return (
    <div className="space-y-5">
      {/* Challenge pool */}
      <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div>
            <h4 className="font-semibold text-sm">Challenge Notes</h4>
            <p className="text-xs text-muted-foreground">
              {s2Challenges.length > 0 ? `${s2Challenges.length} loaded from Session 2` : "No Session 2 challenges"} · {state.additionalNotes.length} added here
            </p>
          </div>
          {selectedChallengeId ? (
            <span className="text-xs font-semibold text-[#4A1C5C] bg-[#4A1C5C]/10 px-3 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Tap an experiment below to link
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Tap a challenge to select, then tap an experiment</span>
          )}
        </div>

        {allChallenges.length === 0 && (
          <p className="text-xs text-muted-foreground italic mb-3">No challenges yet. Add below or complete Session 2 challenges first.</p>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          {allChallenges.map(note => {
            const isSelected = selectedChallengeId === note.id;
            return (
              <div key={note.id} onClick={() => setSelectedChallengeId(isSelected ? null : note.id)}
                className={`relative group rounded-xl p-2.5 shadow-sm cursor-pointer transition-all border-2 max-w-[140px] ${isSelected ? "border-[#4A1C5C] scale-105 shadow-lg" : "border-transparent hover:border-[#4A1C5C]/30"}`}
                style={{ backgroundColor: note.color }}>
                <p className="text-xs text-gray-800 leading-snug break-words">{note.text}</p>
                {isFromS2(note.id) && <span className="text-[9px] text-gray-500 mt-0.5 block">from S2</span>}
                {!isFromS2(note.id) && canEdit && (
                  <button onClick={e => { e.stopPropagation(); deleteChallenge(note.id); }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full hidden group-hover:flex items-center justify-center shadow">
                    <X className="w-2.5 h-2.5 text-[#AA5D53]" />
                  </button>
                )}
                {isSelected && <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#4A1C5C] rounded-full flex items-center justify-center"><CheckCircle className="w-2.5 h-2.5 text-white" /></div>}
              </div>
            );
          })}
        </div>

        {canEdit && <NoteInput placeholder="Add a challenge not yet listed…" onAdd={addChallenge} btnColor="#AA5D53" />}
      </div>

      {/* Experiments from Step 2, grouped by tier */}
      {!hasExperiments ? (
        <div className="text-center py-10 bg-[#EBE2D6]/50 rounded-2xl text-muted-foreground">
          <p className="font-medium mb-1">No experiments yet</p>
          <p className="text-sm">Go back to Step 2 and add experiment sticky notes first.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {TIERS.map(tier => {
            const tierNotes = step2[tier.id as keyof typeof step2] as StickyNote[];
            if (tierNotes.length === 0) return null;
            return (
              <div key={tier.id}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: tier.color }}>{tier.label.charAt(0)}</div>
                  <h4 className="text-sm font-bold" style={{ color: tier.color }}>{tier.label}</h4>
                  <span className="text-[10px] text-muted-foreground">· {tier.effort}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tierNotes.map(note => {
                    const mappedChallengeIds = state.challengeMappings[note.id] || [];
                    const energy = state.experimentEnergy[note.id] || null;
                    const energyCfg = energy ? ENERGY_CFG[energy] : null;

                    return (
                      <div key={note.id}
                        onClick={() => { if (selectedChallengeId) toggleMapping(note.id, selectedChallengeId); }}
                        className={`rounded-xl border-2 p-3 bg-white transition-all ${selectedChallengeId ? "cursor-pointer hover:shadow-lg hover:border-[#4A1C5C]/50" : ""}`}
                        style={{ borderColor: selectedChallengeId ? "#4A1C5C30" : `${tier.color}30` }}>

                        {/* Experiment text */}
                        <p className="text-sm font-semibold text-foreground mb-2 leading-snug">{note.text}</p>

                        {/* Energy selector */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(["energising", "grounding", "draining"] as const).map(lvl => {
                            const cfg = ENERGY_CFG[lvl];
                            const active = energy === lvl;
                            return (
                              <button key={lvl}
                                onClick={e => { e.stopPropagation(); if (canEdit) setEnergy(note.id, lvl); }}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all"
                                style={{
                                  borderColor: active ? cfg.color : "#E5E7EB",
                                  backgroundColor: active ? `${cfg.color}22` : "transparent",
                                  color: active ? cfg.color : "#9CA3AF",
                                }}>
                                {cfg.icon} {cfg.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Linked challenges */}
                        <div className="flex flex-wrap gap-1 min-h-5">
                          {mappedChallengeIds.map(cid => {
                            const cn = getChallengeNote(cid);
                            if (!cn) return null;
                            return (
                              <div key={cid} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border max-w-[120px]"
                                style={{ backgroundColor: cn.color }}>
                                <span className="truncate">{cn.text}</span>
                                {canEdit && (
                                  <button onClick={e => { e.stopPropagation(); toggleMapping(note.id, cid); }} className="flex-shrink-0 ml-0.5">
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          {mappedChallengeIds.length === 0 && !selectedChallengeId && (
                            <span className="text-[10px] text-muted-foreground italic">No challenges mapped</span>
                          )}
                          {selectedChallengeId && !mappedChallengeIds.includes(selectedChallengeId) && (
                            <span className="text-[10px] text-[#4A1C5C] font-medium animate-pulse">Tap to link ↑</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Session3Board() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const isParticipant = location.pathname.startsWith("/participant");
  const role = isParticipant ? "participant" : "facilitator";
  const dashboardPath = isParticipant ? "/participant/dashboard" : "/facilitator/dashboard";

  const [boardState, setBoardState] = useState<Session3State>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [s2Board, setS2Board] = useState<any>(null);
  const [endingSession, setEndingSession] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const channelRef = useRef<any>(null);
  const saveTimerRef = useRef<any>(null);
  const stateRef = useRef(boardState);
  stateRef.current = boardState;

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      try {
        const [sr, br] = await Promise.all([
          fetch(`${API}/sessions/${sessionId}`, { headers: await HEADERS() }),
          fetch(`${API}/sessions/${sessionId}/board`, { headers: await HEADERS() }),
        ]);
        if (sr.ok) { const d = await sr.json(); setSessionInfo(d); if (d.previousBoards?.[2]) setS2Board(d.previousBoards[2]); }
        if (br.ok) { const d = await br.json(); if (d.state) setBoardState(migrateState(d.state)); }
      } catch { toast.error("Failed to load session board."); }
      finally { setLoading(false); }
    })();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const supabase = createClient();
    const ch = supabase.channel(`session:${sessionId}`, { config: { broadcast: { self: false }, presence: { key: role } } });
    ch
      .on("broadcast", { event: "board_update" }, ({ payload }: any) => {
        if (payload?.state) setBoardState(prev => migrateState({ ...DEFAULT_STATE, ...prev, ...payload.state }));
      })
      .on("presence", { event: "sync" }, () => {
        const ps = ch.presenceState();
        setPeerConnected(Object.values(ps).flat().some((p: any) => p.role !== role));
      })
      .on("presence", { event: "join" }, ({ newPresences }: any) => {
        if (newPresences.some((p: any) => p.role !== role)) toast.success(isParticipant ? "Facilitator joined" : "Participant joined");
      })
      .on("presence", { event: "leave" }, ({ leftPresences }: any) => {
        if (leftPresences.some((p: any) => p.role !== role)) toast.info(isParticipant ? "Facilitator disconnected" : "Participant disconnected");
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") { setConnected(true); await ch.track({ role, joinedAt: new Date().toISOString() }); }
        else if (status === "CLOSED" || status === "CHANNEL_ERROR") setConnected(false);
      });
    channelRef.current = ch;
    return () => { ch.unsubscribe(); };
  }, [sessionId, role]);

  const updateState = useCallback((updater: (prev: Session3State) => Session3State) => {
    setBoardState(prev => {
      const next = updater(prev);
      channelRef.current?.send({ type: "broadcast", event: "board_update", payload: { state: next } });
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          await fetch(`${API}/sessions/${sessionId}/board`, { method: "PUT", headers: await HEADERS(), body: JSON.stringify({ state: next }) });
          setLastSaved(new Date());
        } catch { /* retry */ } finally { setSaving(false); }
      }, 1200);
      return next;
    });
  }, [sessionId]);

  const goToStep = (step: number) => {
    if (step < 1 || step > TOTAL_STEPS) return;
    updateState(p => ({ ...p, currentStep: step }));
  };

  const endSession = async () => {
    setEndingSession(true);
    try {
      const boardResponse = await fetch(`${API}/sessions/${sessionId}/board`, { method: "PUT", headers: await HEADERS(), body: JSON.stringify({ state: stateRef.current }) });
      const boardData = await boardResponse.json();
      if (!boardResponse.ok || !boardData?.success) throw new Error("Board save failed.");
      const statusResponse = await fetch(`${API}/sessions/${sessionId}/status`, { method: "PUT", headers: await HEADERS(), body: JSON.stringify({ status: "completed" }) });
      const statusData = await statusResponse.json();
      if (!statusResponse.ok || !statusData?.success) throw new Error("Session completion failed.");
      setShowCompletionModal(false);
      toast.success("Session 3 complete. Session 4 is now unlocked.");
      navigate(dashboardPath);
    } catch { toast.error("We couldn't complete this session. Please try again."); } finally { setEndingSession(false); }
  };

  // S2 carry-forward
  const s2AnchorId: string = s2Board?.step9?.selectedAligned || "";
  const s2ShortlistedIds: string[] = s2Board?.step2?.selectedIdentities || [];
  const s2Challenges: StickyNote[] = [
    ...(s2Board?.step5?.challenges || []),
    ...(s2Board?.step8?.challenges || []),
  ];

  const effectiveAnchorId = boardState.step1.anchorIdentityOverride || s2AnchorId;
  const anchorLabel = getIdentityLabel(effectiveAnchorId) || "your Anchor Identity";
  const experimentCount = [...boardState.step2.observe, ...boardState.step2.converse, ...boardState.step2.act].length;

  const step = boardState.currentStep;
  const stepInfo = STEPS[step - 1];
  const canNavigate = true;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EBE2D6] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#4A1C5C] mx-auto" />
          <p className="text-sm text-muted-foreground">Loading Session 3…</p>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1: return (
        <Step1Recalibration state={boardState.step1} onChange={s => updateState(p => ({ ...p, step1: s }))}
          anchorId={s2AnchorId} shortlistedIds={s2ShortlistedIds} />
      );
      case 2: return (
        <Step2ExperimentDesign state={boardState.step2} onChange={s => updateState(p => ({ ...p, step2: s }))} canEdit={true} />
      );
      case 3: return (
        <Step3FrictionMapping state={boardState.step3} onChange={s => updateState(p => ({ ...p, step3: s }))}
          step2={boardState.step2} s2Challenges={s2Challenges} canEdit={true} />
      );
      case 4: return (
        <Step4CommitmentFixed state={boardState.step4} onChange={s => updateState(p => ({ ...p, step4: s }))}
          anchorLabel={anchorLabel} canEdit={true} experimentCount={experimentCount} />
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#EBE2D6] flex flex-col overflow-x-hidden">
      <SessionCompletionModal open={showCompletionModal} sessionLabel="Session 3" confirming={endingSession} onCancel={() => setShowCompletionModal(false)} onConfirm={endSession} />
      {/* Top bar */}
      <div className="bg-white border-b border-border px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-3 shadow-sm flex-shrink-0">
        <button onClick={() => navigate(dashboardPath)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline text-xs">Dashboard</span>
        </button>
        <div className="w-px h-4 bg-border flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[9px] font-bold" style={{ backgroundColor: "#D4A843" }}>3</div>
            <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
              {sessionInfo?.journey?.title || "Zest Journey"}
              <span className="text-muted-foreground font-normal hidden sm:inline"> — Session 3</span>
            </p>
            {effectiveAnchorId && (
              <span className="hidden md:inline text-xs text-muted-foreground bg-[#EBE2D6] px-2 py-0.5 rounded-full flex-shrink-0">
                {getIdentitySymbol(effectiveAnchorId)} {anchorLabel}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1 text-xs">
            {connected ? <Wifi className="w-3 h-3 text-[#3D6D6C]" /> : <WifiOff className="w-3 h-3 text-[#AA5D53]" />}
            <span className={`hidden sm:inline ${connected ? "text-[#3D6D6C]" : "text-[#AA5D53]"}`}>{connected ? "Live" : "Offline"}</span>
          </div>
          {peerConnected && (
            <div className="flex items-center gap-1 text-xs text-[#D4A843] bg-[#D4A843]/10 px-1.5 py-0.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4A843] animate-pulse" />
              <span className="hidden sm:inline">{isParticipant ? "Facilitator" : "Participant"}</span>
            </div>
          )}
          {saving ? <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" />Saving</div>
            : lastSaved ? <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground"><Save className="w-3 h-3" />Saved</div> : null}
          {!isParticipant && (
            <button onClick={() => setShowCompletionModal(true)} disabled={endingSession}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-[#AA5D53] text-white text-xs rounded-lg hover:bg-[#934D45] transition-colors">
              {endingSession && <Loader2 className="w-3 h-3 animate-spin" />}
              <span className="hidden sm:inline">End Session</span><span className="sm:hidden">End</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b border-border px-3 sm:px-4 py-2 flex-shrink-0">
        <div className="max-w-5xl mx-auto flex items-center gap-1">
          {STEPS.map(s => (
            <button key={s.number} onClick={() => canNavigate && goToStep(s.number)} title={s.title}
              className={`flex-1 h-1.5 rounded-full transition-all ${step === s.number ? "bg-[#D4A843]" : step > s.number ? "bg-[#4A1C5C]" : "bg-border"} ${canNavigate ? "cursor-pointer hover:opacity-75" : "cursor-default"}`} />
          ))}
        </div>
        <div className="max-w-5xl mx-auto mt-1.5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate">Step {step}/{TOTAL_STEPS} — <span className="font-semibold text-foreground">{stepInfo.title}</span></span>
          <span className="text-xs text-muted-foreground hidden sm:block">{stepInfo.subtitle}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4A843]/15 rounded-full mb-2">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: "#D4A843" }}>{step}</span>
                  <span className="text-xs font-medium text-[#A07820]">{stepInfo.subtitle}</span>
                </div>
                <h2 className="text-xl sm:text-2xl" style={{ fontFamily: "Playfair Display, serif", color: "#D4A843" }}>{stepInfo.title}</h2>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-border p-4 sm:p-5 lg:p-7">
                {renderStep()}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="bg-white border-t border-border px-3 sm:px-4 py-2.5 flex-shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <button onClick={() => goToStep(step - 1)} disabled={step === 1}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex-shrink-0 ${step === 1 ? "text-muted-foreground cursor-not-allowed opacity-40" : "text-foreground hover:bg-[#EBE2D6] border border-border"}`}>
            <ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline">Previous</span>
          </button>
          <div className="flex items-center gap-1">
            {STEPS.map(s => (
              <button key={s.number} onClick={() => canNavigate && goToStep(s.number)}
                className={`h-2 rounded-full transition-all ${step === s.number ? "w-5 bg-[#D4A843]" : step > s.number ? "w-2 bg-[#4A1C5C]" : "w-2 bg-border"} ${canNavigate ? "cursor-pointer" : "cursor-default"}`} />
            ))}
          </div>
          {step < TOTAL_STEPS ? (
            <button onClick={() => goToStep(step + 1)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-white hover:opacity-90 transition-all flex-shrink-0"
              style={{ backgroundColor: "#D4A843" }}>
              <span className="hidden sm:inline">Next</span><ChevronRight className="w-4 h-4" />
            </button>
          ) : !isParticipant ? (
            <button onClick={() => setShowCompletionModal(true)} disabled={endingSession}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#4A1C5C] text-white hover:bg-[#3A1C4C] transition-all flex-shrink-0">
              {endingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span className="hidden sm:inline">Complete Session 3</span><span className="sm:hidden">Complete</span>
            </button>
          ) : (
            <div className="w-20 text-center text-xs text-muted-foreground">Session done</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 4 (fixed — no module-level ref) ────────────────────────────────────

function Step4CommitmentFixed({ state, onChange, anchorLabel, canEdit, experimentCount }: {
  state: Session3State["step4"]; onChange: (s: Session3State["step4"]) => void;
  anchorLabel: string; canEdit: boolean; experimentCount: number;
}) {
  const date = state.commitmentDate || new Date().toISOString().split("T")[0];
  const n = state.numberOfActions || 1;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-[#4A1C5C]/8 to-[#3D6D6C]/8 rounded-2xl border border-[#4A1C5C]/20 p-6 sm:p-8">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-4">Your Commitment</p>
        <div className="text-base sm:text-xl font-semibold text-foreground leading-relaxed" style={{ fontFamily: "Playfair Display, serif" }}>
          <span>By </span>
          {canEdit
            ? <input type="date" value={date} onChange={e => onChange({ ...state, commitmentDate: e.target.value })}
                className="border-b-2 border-[#4A1C5C] bg-transparent font-semibold text-[#4A1C5C] focus:outline-none px-1 text-base sm:text-xl" />
            : <span className="text-[#4A1C5C] font-bold">{date}</span>}
          <span> I will take </span>
          {canEdit
            ? <input type="number" min={1} max={20} value={n} onChange={e => onChange({ ...state, numberOfActions: Math.max(1, parseInt(e.target.value) || 1) })}
                className="border-b-2 border-[#4A1C5C] bg-transparent w-12 text-center font-semibold text-[#4A1C5C] focus:outline-none text-base sm:text-xl" />
            : <span className="text-[#4A1C5C] font-bold">{n}</span>}
          <span> action{n !== 1 ? "s" : ""} related to being a </span>
          <span className="text-[#4A1C5C] font-bold">{anchorLabel}</span>
          <span>.</span>
        </div>
      </div>

      <div className="bg-[#EBE2D6]/60 rounded-xl p-4 text-center">
        <p className="text-[#4A1C5C] font-semibold italic text-sm sm:text-base" style={{ fontFamily: "Playfair Display, serif" }}>
          "How does taking this first step feel?"
        </p>
      </div>

      {canEdit && <NoteInput placeholder="Reflect on how this first step feels…" onAdd={t => onChange({ ...state, notes: [...state.notes, makeNote(t)] })} />}

      <div className="flex flex-wrap gap-3">
        {state.notes.map(note => (
          <div key={note.id} className="group relative rounded-lg p-2.5 shadow-sm w-28 flex-shrink-0" style={{ backgroundColor: note.color }}>
            <p className="text-xs text-gray-800 break-words">{note.text}</p>
            {canEdit && (
              <button onClick={() => onChange({ ...state, notes: state.notes.filter(x => x.id !== note.id) })}
                className="absolute top-1 right-1 w-4 h-4 bg-white/80 rounded hidden group-hover:flex items-center justify-center">
                <X className="w-2.5 h-2.5 text-[#AA5D53]" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border p-4">
        <h4 className="font-semibold text-[#4A1C5C] mb-3 text-sm" style={{ fontFamily: "Playfair Display, serif" }}>Session 3 Summary</h4>
        <div className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
          <p><span className="font-medium text-foreground">Anchor Identity:</span> {anchorLabel}</p>
          <p><span className="font-medium text-foreground">Commitment date:</span> {date ? new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "—"}</p>
          <p><span className="font-medium text-foreground">Planned actions:</span> {n}</p>
          <p><span className="font-medium text-foreground">Experiments designed:</span> {experimentCount}</p>
          <p><span className="font-medium text-foreground">Reflection notes:</span> {state.notes.length}</p>
        </div>
      </div>
    </div>
  );
}

