import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { createClient } from "../../../utils/supabase/client";
import { getAuthHeaders } from "../../../utils/supabase/api";
import { projectId } from "../../../utils/supabase/info";
import {
  ChevronLeft, ChevronRight, ArrowLeft, Wifi, WifiOff, Save,
  CheckCircle, Plus, X, Pencil, GripVertical, Loader2, Trash2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StickyNote { id: string; text: string; color: string; }

interface GridState {
  assets: string[];
  customAssets: { id: string; label: string }[];
  actions: StickyNote[];
  challenges: StickyNote[];
}

interface Session2State {
  currentStep: number;
  step1: { notes: StickyNote[] };
  step2: { selectedIdentities: string[] };
  step3: { notes: StickyNote[] };
  step4: { level: number | null };
  step5: GridState;
  step6: { notes: StickyNote[] };
  step7: { level: number | null };
  step8: GridState;
  step9: { notes: StickyNote[]; selectedAligned: string | null };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;
const HEADERS = getAuthHeaders;

const NOTE_COLORS = ["#FFF9C4", "#C8E6C9", "#E1BEE7", "#FFE0B2", "#B3E5FC", "#F8BBD9", "#DCEDC8"];

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

const ASSET_CARDS = [
  "Functional Expertise",
  "High-Trust Network",
  "Deep Industry Experience",
  "Credibility with Senior Leaders",
  "Ecosystem Knowledge",
  "Facilitation and Teaching Ability",
  "Low-Burn Lifestyle Flexibility",
  "Thought Leadership Potential",
  "Professional Infrastructure",
  "Professional Reputation",
  "Digital Tools and Platforms",
  "Ability to Mentor and Develop People",
  "Natural Authority in a Room",
  "Community Trust",
  "Access to Capital",
  "Personal Financial Cushion",
];

const STEPS = [
  { number: 1, title: "Re-Entry", subtitle: "What stayed with you?" },
  { number: 2, title: "Identity Selection", subtitle: "Choose two identities to explore" },
  { number: 3, title: "Identity A — Bridge", subtitle: "What draws you into this life?" },
  { number: 4, title: "Identity A — Energy", subtitle: "Where does this sit on your thermometer?" },
  { number: 5, title: "Identity A — Life Reality Grid", subtitle: "Assets, actions & challenges" },
  { number: 6, title: "Identity B — Bridge", subtitle: "What draws you into this life?" },
  { number: 7, title: "Identity B — Energy", subtitle: "Where does this sit on your thermometer?" },
  { number: 8, title: "Identity B — Life Reality Grid", subtitle: "Assets, actions & challenges" },
  { number: 9, title: "Alignment Reflection", subtitle: "Which identity fits your life most naturally?" },
];

const TOTAL_STEPS = 9;

const EMPTY_GRID: GridState = { assets: [], customAssets: [], actions: [], challenges: [] };

const DEFAULT_STATE: Session2State = {
  currentStep: 1,
  step1: { notes: [] },
  step2: { selectedIdentities: [] },
  step3: { notes: [] },
  step4: { level: null },
  step5: { ...EMPTY_GRID },
  step6: { notes: [] },
  step7: { level: null },
  step8: { ...EMPTY_GRID },
  step9: { notes: [], selectedAligned: null },
};

// ─── Pointer Drag & Drop (touch + mouse) ─────────────────────────────────────

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
      padding: "6px 10px", background: "white", border: "2px solid #4A1C5C",
      borderRadius: "8px", fontSize: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
      opacity: "0.9", maxWidth: "150px", wordBreak: "break-word", transform: "rotate(1.5deg)",
    });
    ghost.textContent = short;
    document.body.appendChild(ghost);
    setDraggingId(id);

    const pos = (x: number, y: number) => { ghost.style.left = `${x - 75}px`; ghost.style.top = `${y - 25}px`; };
    const zone = (x: number, y: number) => {
      ghost.style.visibility = "hidden";
      const els = document.elementsFromPoint(x, y);
      ghost.style.visibility = "visible";
      for (const el of els) { const z = (el as HTMLElement).dataset?.dropzone; if (z) return z; }
      return null;
    };
    pos(e.clientX, e.clientY);

    const onMove = (ev: PointerEvent) => { pos(ev.clientX, ev.clientY); setOverZone(zone(ev.clientX, ev.clientY)); };
    const cleanup = () => {
      if (document.body.contains(ghost)) document.body.removeChild(ghost);
      setDraggingId(null); setOverZone(null);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", cleanup);
    };
    const onUp = (ev: PointerEvent) => {
      const z = zone(ev.clientX, ev.clientY);
      if (z) cb.current(id, z);
      cleanup();
    };
    document.addEventListener("pointermove", onMove, { passive: false });
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", cleanup);
  }, []);

  return { draggingId, overZone, startDrag };
}

// ─── Shared components ────────────────────────────────────────────────────────

function NoteInput({ placeholder, onAdd, btnColor = "#D4A843" }: { placeholder: string; onAdd: (t: string) => void; btnColor?: string }) {
  const [text, setText] = useState("");
  const submit = () => { if (!text.trim()) return; onAdd(text.trim()); setText(""); };
  return (
    <div className="flex gap-2 items-start">
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder={placeholder}
        className="flex-1 rounded-lg border border-border p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#4A1C5C]/25" rows={2}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} />
      <button onClick={submit} style={{ backgroundColor: btnColor }}
        className="mt-1 px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1 flex-shrink-0 text-[#2C1810] hover:opacity-90 transition-opacity">
        <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add</span>
      </button>
    </div>
  );
}

function SmallNote({ note, onEdit, onDelete, canEdit }: {
  note: StickyNote; onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void; canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.text);
  return (
    <div className="group relative rounded-lg p-2.5 shadow-sm w-28 flex-shrink-0" style={{ backgroundColor: note.color }}>
      {editing ? (
        <div className="space-y-1">
          <textarea autoFocus value={text} onChange={e => setText(e.target.value)} rows={3}
            className="w-full bg-transparent resize-none text-xs border-b border-black/20 focus:outline-none"
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onEdit(note.id, text); setEditing(false); } if (e.key === "Escape") setEditing(false); }} />
          <button onClick={() => { onEdit(note.id, text); setEditing(false); }} className="text-[10px] px-2 py-0.5 bg-black/10 rounded">Save</button>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-800 leading-snug break-words">{note.text}</p>
          {canEdit && (
            <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
              <button onClick={() => { setText(note.text); setEditing(true); }} className="w-4 h-4 bg-white/80 rounded flex items-center justify-center"><Pencil className="w-2.5 h-2.5 text-gray-600" /></button>
              <button onClick={() => onDelete(note.id)} className="w-4 h-4 bg-white/80 rounded flex items-center justify-center"><X className="w-2.5 h-2.5 text-[#AA5D53]" /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NotesBoard({ notes, onAdd, onEdit, onDelete, placeholder, canEdit }: {
  notes: StickyNote[]; onAdd: (t: string) => void; onEdit: (id: string, t: string) => void;
  onDelete: (id: string) => void; placeholder: string; canEdit: boolean;
}) {
  return (
    <div className="space-y-3">
      {canEdit && <NoteInput placeholder={placeholder} onAdd={onAdd} />}
      {notes.length === 0
        ? <div className="h-24 flex items-center justify-center text-sm text-muted-foreground italic border-2 border-dashed border-border rounded-xl">{canEdit ? "Add notes above…" : "No notes yet"}</div>
        : <div className="flex flex-wrap gap-2">{notes.map(n => <SmallNote key={n.id} note={n} onEdit={onEdit} onDelete={onDelete} canEdit={canEdit} />)}</div>
      }
    </div>
  );
}

// ─── Identity card (compact) ──────────────────────────────────────────────────

function IdentityPill({ id, allCards, allRoles }: { id: string; allCards: string[]; allRoles: string[] }) {
  const card = IDENTITY_CARDS.find(c => c.id === id);
  const role = ROLE_CARDS.find(r => r.id === id);
  const label = card?.label || role?.label || id;
  const symbol = card?.symbol || "✦";
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#4A1C5C] text-white text-sm font-medium">
      <span>{symbol}</span> {label}
    </span>
  );
}

// ─── Thermometer ──────────────────────────────────────────────────────────────

function Thermometer({ level, onChange, identityLabel, canEdit }: {
  level: number | null; onChange: (v: number) => void; identityLabel: string; canEdit: boolean;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  const getLevel = (clientY: number) => {
    if (!barRef.current) return 50;
    const rect = barRef.current.getBoundingClientRect();
    const pct = 1 - (clientY - rect.top) / rect.height;
    return Math.round(Math.max(0, Math.min(100, pct * 100)));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    onChange(getLevel(e.clientY));
    const onMove = (ev: PointerEvent) => onChange(getLevel(ev.clientY));
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    document.addEventListener("pointermove", onMove, { passive: false });
    document.addEventListener("pointerup", onUp);
  };

  const zone = level === null ? null : level >= 67 ? "energising" : level >= 34 ? "grounding" : "draining";
  const zoneColor = zone === "energising" ? "#3D6D6C" : zone === "grounding" ? "#D4A843" : zone === "draining" ? "#AA5D53" : "#9CA3AF";
  const zoneLabel = zone === "energising" ? "Energising" : zone === "grounding" ? "Grounding" : zone === "draining" ? "Draining" : "—";

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm font-semibold text-center text-foreground">{identityLabel}</p>

      <div className="flex items-stretch gap-6">
        {/* Labels left side */}
        <div className="flex flex-col justify-between py-2 text-xs font-medium text-right w-24">
          <span className="text-[#3D6D6C]">⚡ Energising</span>
          <span className="text-[#D4A843]">🌱 Grounding</span>
          <span className="text-[#AA5D53]">💧 Draining</span>
        </div>

        {/* Thermometer bar */}
        <div className="relative flex flex-col items-center">
          <div
            ref={barRef}
            onPointerDown={handlePointerDown}
            className="relative w-12 h-56 rounded-full overflow-hidden shadow-inner border border-border/30"
            style={{ background: "linear-gradient(to bottom, #3D6D6C 0%, #D4A843 50%, #AA5D53 100%)", touchAction: "none", cursor: canEdit ? "pointer" : "default" }}
          >
            {/* Zone dividers */}
            <div className="absolute w-full h-px bg-white/30" style={{ top: "33%" }} />
            <div className="absolute w-full h-px bg-white/30" style={{ top: "67%" }} />

            {/* Fill indicator */}
            {level !== null && (
              <div
                className="absolute bottom-0 left-0 right-0 bg-black/20 transition-none"
                style={{ height: `${100 - level}%` }}
              />
            )}

            {/* Drag handle */}
            {level !== null ? (
              <div
                className="absolute left-1/2 w-10 h-10 rounded-full bg-white border-[3px] shadow-lg flex items-center justify-center text-xs font-bold"
                style={{ bottom: `calc(${level}% - 20px)`, transform: "translateX(-50%)", borderColor: zoneColor, color: zoneColor }}
              >
                {level}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white/80 text-[10px] text-center leading-tight px-1">{canEdit ? "Tap to\nplace" : "—"}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zone readout */}
      <div className="px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors"
        style={{ borderColor: zoneColor, color: zoneColor, backgroundColor: `${zoneColor}18` }}>
        {zoneLabel}
      </div>
    </div>
  );
}

// ─── Life Reality Grid ────────────────────────────────────────────────────────

function LifeRealityGrid({ state, onChange, canEdit, identityLabel }: {
  state: GridState; onChange: (s: GridState) => void; canEdit: boolean; identityLabel: string;
}) {
  const [customInput, setCustomInput] = useState("");
  const [showAssets, setShowAssets] = useState(false);

  const toggleAsset = (asset: string) => {
    const next = state.assets.includes(asset)
      ? state.assets.filter(a => a !== asset)
      : [...state.assets, asset];
    onChange({ ...state, assets: next });
  };

  const addCustomAsset = () => {
    if (!customInput.trim()) return;
    onChange({ ...state, customAssets: [...state.customAssets, { id: crypto.randomUUID(), label: customInput.trim() }] });
    setCustomInput("");
  };

  const removeCustomAsset = (id: string) => onChange({ ...state, customAssets: state.customAssets.filter(a => a.id !== id) });

  const makeNote = (text: string): StickyNote => ({ id: crypto.randomUUID(), text, color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)] });
  const addAction = (t: string) => onChange({ ...state, actions: [...state.actions, makeNote(t)] });
  const editAction = (id: string, t: string) => onChange({ ...state, actions: state.actions.map(n => n.id === id ? { ...n, text: t } : n) });
  const deleteAction = (id: string) => onChange({ ...state, actions: state.actions.filter(n => n.id !== id) });
  const addChallenge = (t: string) => onChange({ ...state, challenges: [...state.challenges, makeNote(t)] });
  const editChallenge = (id: string, t: string) => onChange({ ...state, challenges: state.challenges.map(n => n.id === id ? { ...n, text: t } : n) });
  const deleteChallenge = (id: string) => onChange({ ...state, challenges: state.challenges.filter(n => n.id !== id) });

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A1C5C]/10 rounded-full">
          <span className="text-sm font-semibold text-[#4A1C5C]">{identityLabel}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Assets */}
        <div className="bg-white rounded-xl border border-border p-4 space-y-3">
          <h4 className="font-semibold text-[#4A1C5C] text-sm">Assets</h4>
          <p className="text-xs text-muted-foreground">What do you bring to this identity?</p>

          {/* Selected assets */}
          {(state.assets.length > 0 || state.customAssets.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {state.assets.map(a => (
                <button key={a} onClick={() => canEdit && toggleAsset(a)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#4A1C5C] text-white text-xs font-medium">
                  {a}
                  {canEdit && <X className="w-3 h-3 ml-0.5 opacity-70" />}
                </button>
              ))}
              {state.customAssets.map(a => (
                <div key={a.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#3D6D6C] text-white text-xs font-medium">
                  {a.label}
                  {canEdit && <button onClick={() => removeCustomAsset(a.id)}><X className="w-3 h-3 ml-0.5 opacity-70" /></button>}
                </div>
              ))}
            </div>
          )}

          {canEdit && (
            <>
              <button onClick={() => setShowAssets(v => !v)}
                className="w-full py-2 px-3 border border-dashed border-[#4A1C5C]/40 rounded-lg text-xs text-[#4A1C5C] hover:bg-[#4A1C5C]/5 transition-colors flex items-center justify-center gap-1">
                <Plus className="w-3 h-3" /> {showAssets ? "Hide asset list" : "Add from asset list"}
              </button>

              {showAssets && (
                <div className="max-h-40 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                  {ASSET_CARDS.filter(a => !state.assets.includes(a)).map(a => (
                    <button key={a} onClick={() => toggleAsset(a)}
                      className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-[#EBE2D6] transition-colors">
                      {a}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-1.5">
                <input type="text" value={customInput} onChange={e => setCustomInput(e.target.value)}
                  placeholder="Add your own asset…"
                  className="flex-1 text-xs border border-border rounded-lg px-3 py-2 focus:outline-none"
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomAsset(); } }} />
                <button onClick={addCustomAsset} className="px-3 py-2 bg-[#3D6D6C] text-white rounded-lg text-xs hover:bg-[#2C5958] flex-shrink-0">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </>
          )}

          {!canEdit && state.assets.length === 0 && state.customAssets.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No assets selected</p>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl border border-border p-4 space-y-3">
          <h4 className="font-semibold text-[#D4A843] text-sm">Actions</h4>
          <p className="text-xs text-muted-foreground italic">"Imagine a Tuesday at 10 AM in this life. What are you doing?"</p>
          <NotesBoard notes={state.actions} onAdd={addAction} onEdit={editAction} onDelete={deleteAction}
            placeholder="e.g. Coaching a senior leader, writing a chapter…" canEdit={canEdit} />
        </div>

        {/* Challenges */}
        <div className="bg-white rounded-xl border border-border p-4 space-y-3">
          <h4 className="font-semibold text-[#AA5D53] text-sm">Challenges</h4>
          <p className="text-xs text-muted-foreground italic">"What might test this path?"</p>
          <NotesBoard notes={state.challenges} onAdd={addChallenge} onEdit={editChallenge} onDelete={deleteChallenge}
            placeholder="e.g. Building client base, irregular income…" canEdit={canEdit} />
        </div>
      </div>
    </div>
  );
}

// ─── Step Components ──────────────────────────────────────────────────────────

function Step1ReEntry({ state, onChange, canEdit }: { state: Session2State["step1"]; onChange: (s: Session2State["step1"]) => void; canEdit: boolean }) {
  const makeNote = (t: string): StickyNote => ({ id: crypto.randomUUID(), text: t, color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)] });
  return (
    <div className="space-y-5">
      <div className="bg-[#4A1C5C]/6 border border-[#4A1C5C]/20 rounded-xl p-4 text-center">
        <p className="text-[#4A1C5C] font-semibold italic text-base sm:text-lg" style={{ fontFamily: "Playfair Display, serif" }}>
          "What stayed with you?"
        </p>
        <p className="text-sm text-muted-foreground mt-1">Reflect on Session 1. What insights, images or words have been with you since?</p>
      </div>
      {canEdit && <NoteInput placeholder="Something that stayed with me since our last session…" onAdd={t => onChange({ notes: [...state.notes, makeNote(t)] })} />}
      <div className="flex flex-wrap gap-3 min-h-24">
        {state.notes.length === 0
          ? <div className="w-full flex items-center justify-center h-24 text-muted-foreground text-sm italic border-2 border-dashed border-border rounded-xl">
              {canEdit ? "Add your reflections above…" : "Waiting for reflections…"}
            </div>
          : state.notes.map(n => (
              <SmallNote key={n.id} note={n} canEdit={canEdit}
                onEdit={(id, t) => onChange({ notes: state.notes.map(x => x.id === id ? { ...x, text: t } : x) })}
                onDelete={id => onChange({ notes: state.notes.filter(x => x.id !== id) })} />
            ))}
      </div>
    </div>
  );
}

function Step2IdentitySelection({ state, onChange, session1Cards, session1Roles }: {
  state: Session2State["step2"]; onChange: (s: Session2State["step2"]) => void;
  session1Cards: string[]; session1Roles: string[];
}) {
  const allAvailable = [
    ...IDENTITY_CARDS.filter(c => session1Cards.includes(c.id)),
    ...ROLE_CARDS.filter(r => session1Roles.includes(r.id)).map(r => ({ id: r.id, label: r.label, symbol: "✦" })),
  ];

  const toggle = (id: string) => {
    const sel = state.selectedIdentities;
    if (sel.includes(id)) {
      onChange({ selectedIdentities: sel.filter(x => x !== id) });
    } else if (sel.length < 2) {
      onChange({ selectedIdentities: [...sel, id] });
    } else {
      toast.error("You can only select 2 identities. Deselect one first.");
    }
  };

  const count = state.selectedIdentities.length;

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <p className="text-muted-foreground max-w-lg mx-auto text-sm">
          Choose exactly <strong>2 identities</strong> from your Session 1 selections to explore more deeply today.
        </p>
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${count === 2 ? "bg-[#3D6D6C] text-white" : "bg-[#EBE2D6] text-foreground"}`}>
          {count === 2 ? <CheckCircle className="w-4 h-4" /> : null}
          {count}/2 selected
        </div>
      </div>

      {allAvailable.length === 0 && (
        <div className="text-center py-10 text-muted-foreground bg-[#EBE2D6]/50 rounded-xl">
          <p className="font-medium mb-1">No Session 1 identities found</p>
          <p className="text-sm">Complete Session 1 first to populate this step.</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {allAvailable.map(card => {
          const selected = state.selectedIdentities.includes(card.id);
          return (
            <motion.button key={card.id} onClick={() => toggle(card.id)} whileTap={{ scale: 0.96 }}
              className={`relative p-3 sm:p-4 rounded-xl border-2 text-left transition-all ${selected ? "border-[#4A1C5C] bg-[#4A1C5C]/8 shadow-md" : "border-border bg-white hover:border-[#4A1C5C]/40"}`}>
              <div className="text-2xl mb-1.5">{(card as any).symbol || "✦"}</div>
              <p className="text-xs sm:text-sm font-semibold leading-tight">{card.label}</p>
              <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? "border-[#4A1C5C] bg-[#4A1C5C]" : "border-border bg-white"}`}>
                {selected && <CheckCircle className="w-3 h-3 text-white" />}
              </div>
              {selected && (
                <div className="absolute bottom-2 right-2 text-xs font-bold text-[#4A1C5C]">
                  {state.selectedIdentities.indexOf(card.id) === 0 ? "A" : "B"}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function BridgeStep({ state, onChange, canEdit, identityLabel, prompt }: {
  state: { notes: StickyNote[] }; onChange: (s: { notes: StickyNote[] }) => void;
  canEdit: boolean; identityLabel: string; prompt: string;
}) {
  const makeNote = (t: string): StickyNote => ({ id: crypto.randomUUID(), text: t, color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)] });
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 p-4 bg-[#4A1C5C]/6 border border-[#4A1C5C]/20 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-[#4A1C5C] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {identityLabel.charAt(0)}
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Exploring Identity</p>
          <p className="font-semibold text-[#4A1C5C]">{identityLabel}</p>
        </div>
      </div>
      <div className="bg-[#EBE2D6]/60 rounded-xl p-4 text-center">
        <p className="text-[#4A1C5C] font-semibold italic text-sm sm:text-base" style={{ fontFamily: "Playfair Display, serif" }}>
          {prompt}
        </p>
      </div>
      {canEdit && <NoteInput placeholder="What about this identity draws you in?" onAdd={t => onChange({ notes: [...state.notes, makeNote(t)] })} />}
      <div className="flex flex-wrap gap-3 min-h-24">
        {state.notes.length === 0
          ? <div className="w-full flex items-center justify-center h-24 text-muted-foreground text-sm italic border-2 border-dashed border-border rounded-xl">
              {canEdit ? "Add your reflections above…" : "Waiting for reflections…"}
            </div>
          : state.notes.map(n => (
              <SmallNote key={n.id} note={n} canEdit={canEdit}
                onEdit={(id, t) => onChange({ notes: state.notes.map(x => x.id === id ? { ...x, text: t } : x) })}
                onDelete={id => onChange({ notes: state.notes.filter(x => x.id !== id) })} />
            ))}
      </div>
    </div>
  );
}

function Step9Alignment({ state, onChange, canEdit, identityA, identityB }: {
  state: Session2State["step9"]; onChange: (s: Session2State["step9"]) => void;
  canEdit: boolean; identityA: string; identityB: string;
}) {
  const makeNote = (t: string): StickyNote => ({ id: crypto.randomUUID(), text: t, color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)] });
  const PROMPTS = [
    "Which identity fits your life most naturally right now?",
    "Which one energises you more?",
    "Which one fits your current pace of life?",
    "Which one feels sustainable?",
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[{ id: identityA, label: "Identity A" }, { id: identityB, label: "Identity B" }].map(({ id, label }) => {
          const cardData = IDENTITY_CARDS.find(c => c.id === id) || ROLE_CARDS.find(r => r.id === id);
          const name = (cardData as any)?.label || id;
          const symbol = (cardData as any)?.symbol || "✦";
          const isSelected = state.selectedAligned === id;
          return (
            <button key={id} onClick={() => canEdit && onChange({ ...state, selectedAligned: isSelected ? null : id })}
              className={`p-5 rounded-xl border-2 text-left transition-all ${isSelected ? "border-[#3D6D6C] bg-[#3D6D6C]/8 shadow-md" : "border-border bg-white hover:border-[#3D6D6C]/40"} ${!canEdit ? "cursor-default" : "cursor-pointer"}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-bold text-foreground">{symbol} {name}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-[#3D6D6C] bg-[#3D6D6C]" : "border-border bg-white"}`}>
                  {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
              </div>
              {isSelected && <p className="text-xs text-[#3D6D6C] font-medium">Most aligned ✓</p>}
            </button>
          );
        })}
      </div>

      <div className="bg-[#EBE2D6]/50 rounded-xl p-4 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">Reflection prompts</p>
        {PROMPTS.map((p, i) => (
          <p key={i} className="text-sm text-foreground flex items-start gap-2">
            <span className="text-[#D4A843] font-bold flex-shrink-0">{i + 1}.</span> {p}
          </p>
        ))}
      </div>

      {canEdit && (
        <NoteInput placeholder="Add your reflections on alignment…" onAdd={t => onChange({ ...state, notes: [...state.notes, makeNote(t)] })} />
      )}
      <div className="flex flex-wrap gap-3">
        {state.notes.map(n => (
          <SmallNote key={n.id} note={n} canEdit={canEdit}
            onEdit={(id, t) => onChange({ ...state, notes: state.notes.map(x => x.id === id ? { ...x, text: t } : x) })}
            onDelete={id => onChange({ ...state, notes: state.notes.filter(x => x.id !== id) })} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Session2Board ────────────────────────────────────────────────────────

export default function Session2Board() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const isParticipant = location.pathname.startsWith("/participant");
  const role = isParticipant ? "participant" : "facilitator";
  const dashboardPath = isParticipant ? "/participant/dashboard" : "/facilitator/dashboard";

  const [boardState, setBoardState] = useState<Session2State>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [session1Board, setSession1Board] = useState<any>(null);
  const [endingSession, setEndingSession] = useState(false);

  const channelRef = useRef<any>(null);
  const saveTimerRef = useRef<any>(null);
  const stateRef = useRef(boardState);
  stateRef.current = boardState;

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      try {
        const [sessRes, boardRes] = await Promise.all([
          fetch(`${API}/sessions/${sessionId}`, { headers: await HEADERS() }),
          fetch(`${API}/sessions/${sessionId}/board`, { headers: await HEADERS() }),
        ]);

        if (sessRes.ok) {
          const d = await sessRes.json();
          setSessionInfo(d);
          // Load session 1 board from previousBoards
          if (d.previousBoards?.[1]) setSession1Board(d.previousBoards[1]);
        }

        if (boardRes.ok) {
          const d = await boardRes.json();
          if (d.state && Object.keys(d.state).length > 1) setBoardState({ ...DEFAULT_STATE, ...d.state });
        }
      } catch (e) {
        toast.error("Failed to load session board.");
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const supabase = createClient();
    const ch = supabase.channel(`session:${sessionId}`, {
      config: { broadcast: { self: false }, presence: { key: role } },
    });
    ch
      .on("broadcast", { event: "board_update" }, ({ payload }: any) => {
        if (payload?.state) setBoardState(prev => ({ ...DEFAULT_STATE, ...prev, ...payload.state }));
      })
      .on("presence", { event: "sync" }, () => {
        const ps = ch.presenceState();
        setPeerConnected(Object.values(ps).flat().some((p: any) => p.role !== role));
      })
      .on("presence", { event: "join" }, ({ newPresences }: any) => {
        if (newPresences.some((p: any) => p.role !== role))
          toast.success(isParticipant ? "Facilitator joined" : "Participant joined");
      })
      .on("presence", { event: "leave" }, ({ leftPresences }: any) => {
        if (leftPresences.some((p: any) => p.role !== role))
          toast.info(isParticipant ? "Facilitator disconnected" : "Participant disconnected");
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
          await ch.track({ role, joinedAt: new Date().toISOString() });
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setConnected(false);
        }
      });
    channelRef.current = ch;
    return () => { ch.unsubscribe(); };
  }, [sessionId, role]);

  const updateState = useCallback((updater: (prev: Session2State) => Session2State) => {
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
    if (!window.confirm("End Session 2? All data will be saved and Session 3 will be unlocked.")) return;
    setEndingSession(true);
    try {
      await fetch(`${API}/sessions/${sessionId}/board`, { method: "PUT", headers: await HEADERS(), body: JSON.stringify({ state: stateRef.current }) });
      await fetch(`${API}/sessions/${sessionId}/status`, { method: "PUT", headers: await HEADERS(), body: JSON.stringify({ status: "completed" }) });
      toast.success("Session 2 complete. Session 3 is now unlocked.");
      navigate(dashboardPath);
    } catch { toast.error("Failed to end session."); } finally { setEndingSession(false); }
  };

  // Derive identities A & B from step2
  const sel = boardState.step2.selectedIdentities;
  const identityAId = sel[0] || "";
  const identityBId = sel[1] || "";
  const getLabel = (id: string) => IDENTITY_CARDS.find(c => c.id === id)?.label || ROLE_CARDS.find(r => r.id === id)?.label || id || "Identity";

  // Session 1 carry-forward data
  const s1Cards: string[] = session1Board?.step1?.selectedCards || [];
  const s1Roles: string[] = session1Board?.step4?.selectedRoles || [];

  const canNavigate = true;
  const step = boardState.currentStep;
  const stepInfo = STEPS[step - 1];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EBE2D6] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#4A1C5C] mx-auto" />
          <p className="text-sm text-muted-foreground">Loading Session 2…</p>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1ReEntry state={boardState.step1} onChange={s => updateState(p => ({ ...p, step1: s }))} canEdit={true} />;
      case 2:
        return <Step2IdentitySelection state={boardState.step2} onChange={s => updateState(p => ({ ...p, step2: s }))} session1Cards={s1Cards} session1Roles={s1Roles} />;
      case 3:
        return <BridgeStep state={boardState.step3} onChange={s => updateState(p => ({ ...p, step3: s }))} canEdit={true} identityLabel={getLabel(identityAId)} prompt="Imagine stepping into this life. What about this identity draws you in?" />;
      case 4:
        return (
          <div className="flex flex-col items-center gap-6">
            <div className="bg-[#EBE2D6]/60 rounded-xl p-3 sm:p-4 text-center max-w-lg">
              <p className="text-[#4A1C5C] font-semibold italic text-sm sm:text-base" style={{ fontFamily: "Playfair Display, serif" }}>
                "Where does this identity sit on your energy thermometer?"
              </p>
            </div>
            <Thermometer level={boardState.step4.level} onChange={v => updateState(p => ({ ...p, step4: { level: v } }))} identityLabel={getLabel(identityAId)} canEdit={true} />
          </div>
        );
      case 5:
        return <LifeRealityGrid state={boardState.step5} onChange={s => updateState(p => ({ ...p, step5: s }))} canEdit={true} identityLabel={getLabel(identityAId)} />;
      case 6:
        return <BridgeStep state={boardState.step6} onChange={s => updateState(p => ({ ...p, step6: s }))} canEdit={true} identityLabel={getLabel(identityBId)} prompt="Imagine stepping into this life. What about this identity draws you in?" />;
      case 7:
        return (
          <div className="flex flex-col items-center gap-6">
            <div className="bg-[#EBE2D6]/60 rounded-xl p-3 sm:p-4 text-center max-w-lg">
              <p className="text-[#4A1C5C] font-semibold italic text-sm sm:text-base" style={{ fontFamily: "Playfair Display, serif" }}>
                "Where does this identity sit on your energy thermometer?"
              </p>
            </div>
            <Thermometer level={boardState.step7.level} onChange={v => updateState(p => ({ ...p, step7: { level: v } }))} identityLabel={getLabel(identityBId)} canEdit={true} />
          </div>
        );
      case 8:
        return <LifeRealityGrid state={boardState.step8} onChange={s => updateState(p => ({ ...p, step8: s }))} canEdit={true} identityLabel={getLabel(identityBId)} />;
      case 9:
        return <Step9Alignment state={boardState.step9} onChange={s => updateState(p => ({ ...p, step9: s }))} canEdit={true} identityA={identityAId} identityB={identityBId} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#EBE2D6] flex flex-col overflow-x-hidden">
      {/* Top bar */}
      <div className="bg-white border-b border-border px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-3 shadow-sm flex-shrink-0">
        <button onClick={() => navigate(dashboardPath)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline text-xs">Dashboard</span>
        </button>
        <div className="w-px h-4 bg-border flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#3D6D6C] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[9px] font-bold">2</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
              {sessionInfo?.journey?.title || "Zest Journey"}
              <span className="text-muted-foreground font-normal hidden sm:inline"> — Session 2</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 text-xs">
            {connected ? <Wifi className="w-3 h-3 text-[#3D6D6C]" /> : <WifiOff className="w-3 h-3 text-[#AA5D53]" />}
            <span className={`hidden sm:inline ${connected ? "text-[#3D6D6C]" : "text-[#AA5D53]"}`}>{connected ? "Live" : "Offline"}</span>
          </div>
          {peerConnected && (
            <div className="flex items-center gap-1 text-xs text-[#3D6D6C] bg-[#3D6D6C]/10 px-1.5 py-0.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3D6D6C] animate-pulse" />
              <span className="hidden sm:inline">{isParticipant ? "Facilitator" : "Participant"}</span>
            </div>
          )}
          {saving ? <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" />Saving</div>
            : lastSaved ? <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground"><Save className="w-3 h-3" />Saved</div> : null}
          {!isParticipant && (
            <button onClick={endSession} disabled={endingSession} className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-[#AA5D53] text-white text-xs rounded-lg hover:bg-[#934D45] transition-colors">
              {endingSession && <Loader2 className="w-3 h-3 animate-spin" />}
              <span className="hidden sm:inline">End Session</span><span className="sm:hidden">End</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b border-border px-3 sm:px-4 py-2 flex-shrink-0">
        <div className="max-w-5xl mx-auto flex items-center gap-1">
          {STEPS.map(s => (
            <button key={s.number} onClick={() => canNavigate && goToStep(s.number)} title={s.title}
              className={`flex-1 h-1.5 rounded-full transition-all ${step === s.number ? "bg-[#3D6D6C]" : step > s.number ? "bg-[#4A1C5C]" : "bg-border"} ${canNavigate ? "cursor-pointer hover:opacity-75" : "cursor-default"}`} />
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
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#3D6D6C]/10 rounded-full mb-2">
                  <span className="w-4 h-4 rounded-full bg-[#3D6D6C] text-white text-[10px] flex items-center justify-center font-bold">{step}</span>
                  <span className="text-xs font-medium text-[#3D6D6C]">{stepInfo.subtitle}</span>
                </div>
                <h2 className="text-xl sm:text-2xl" style={{ fontFamily: "Playfair Display, serif", color: "#3D6D6C" }}>{stepInfo.title}</h2>
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
                className={`h-2 rounded-full transition-all ${step === s.number ? "bg-[#3D6D6C] w-5" : step > s.number ? "bg-[#4A1C5C] w-2" : "bg-border w-2"} ${canNavigate ? "cursor-pointer" : "cursor-default"}`} />
            ))}
          </div>

          {step < TOTAL_STEPS ? (
            <button onClick={() => goToStep(step + 1)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#3D6D6C] text-white hover:bg-[#2C5958] transition-all flex-shrink-0">
              <span className="hidden sm:inline">Next</span><ChevronRight className="w-4 h-4" />
            </button>
          ) : !isParticipant ? (
            <button onClick={endSession} disabled={endingSession}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#4A1C5C] text-white hover:bg-[#3A1C4C] transition-all flex-shrink-0">
              {endingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span className="hidden sm:inline">Complete Session 2</span><span className="sm:hidden">Complete</span>
            </button>
          ) : (
            <div className="w-16 text-center text-xs text-muted-foreground">Done</div>
          )}
        </div>
      </div>
    </div>
  );
}
