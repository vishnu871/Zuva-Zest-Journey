import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { createClient } from "../../../utils/supabase/client";
import { getAuthHeaders } from "../../../utils/supabase/api";
import { projectId } from "../../../utils/supabase/info";
import {
  ChevronLeft, ChevronRight, ArrowLeft, Wifi, WifiOff, Save,
  X, Loader2, Trophy, Star, ArrowRight, Plus, Edit2, Printer,
} from "lucide-react";
import { StickyNoteCanvas, StickyNoteData, makeNote as makeNewNote, NOTE_COLORS as STICKY_COLORS } from "../../components/StickyNote";

// ─── Types ────────────────────────────────────────────────────────────────────

type StickyNote = StickyNoteData;

interface Session4State {
  currentStep: number;
  step1: { notes: StickyNote[] };
  step2: {
    easy: StickyNote[];
    requiredEffort: StickyNote[];
    postponed: StickyNote[];
    surprised: StickyNote[];
  };
  step3: {
    energy: string;
    avoid: string;
    strengths: string;
    surprisedMost: string;
    moreTrueNow: string;
  };
  step4: {
    noLongerTryingToProve: string;
    expectationsReleasing: string;
    notPursuing: string;
    permissionToStop: string;
  };
  step5: { nextChapter: StickyNote[] };
  step6: { first30: StickyNote[]; second30: StickyNote[]; third30: StickyNote[] };
  step7: { finalReflection: string };
  journeyCompleted: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;
const HEADERS = getAuthHeaders;
const SESSION_COLOR = "#AA5D53";

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

const STEPS = [
  { number: 1, title: "What I Tried",              subtitle: "Over the past week, what did you actually do?" },
  { number: 2, title: "Experience Reflection",      subtitle: "What did you notice about your experience?" },
  { number: 3, title: "Who I Am",                  subtitle: "This tells me something about who I am" },
  { number: 4, title: "Letting Go",                subtitle: "What am I choosing to let go of?" },
  { number: 5, title: "My Next Chapter",           subtitle: "What kind of next chapter am I choosing?" },
  { number: 6, title: "The Next 90 Days",          subtitle: "Planning your path forward" },
  { number: 7, title: "Final Reflection",          subtitle: "What feels clearer to me now than when I started?" },
];

const TOTAL_STEPS = 7;

const DEFAULT_STATE: Session4State = {
  currentStep: 1,
  step1: { notes: [] },
  step2: { easy: [], requiredEffort: [], postponed: [], surprised: [] },
  step3: { energy: "", avoid: "", strengths: "", surprisedMost: "", moreTrueNow: "" },
  step4: { noLongerTryingToProve: "", expectationsReleasing: "", notPursuing: "", permissionToStop: "" },
  step5: { nextChapter: [] },
  step6: { first30: [], second30: [], third30: [] },
  step7: { finalReflection: "" },
  journeyCompleted: false,
};

function migrateState(raw: any): Session4State {
  if (!raw || Object.keys(raw).length <= 1) return DEFAULT_STATE;

  const s2raw = raw.step2 || {};
  const step2: Session4State["step2"] = {
    easy: s2raw.easy || [],
    requiredEffort: s2raw.requiredEffort || [],
    postponed: s2raw.postponed || [],
    surprised: s2raw.surprised || [],
  };

  const s3raw = raw.step3 || {};
  const step3: Session4State["step3"] = typeof s3raw === "object" && "energy" in s3raw
    ? { energy: s3raw.energy || "", avoid: s3raw.avoid || "", strengths: s3raw.strengths || "", surprisedMost: s3raw.surprisedMost || "", moreTrueNow: s3raw.moreTrueNow || "" }
    : DEFAULT_STATE.step3;

  const s4raw = raw.step4 || {};
  const step4: Session4State["step4"] = typeof s4raw === "object" && "noLongerTryingToProve" in s4raw
    ? { noLongerTryingToProve: s4raw.noLongerTryingToProve || "", expectationsReleasing: s4raw.expectationsReleasing || "", notPursuing: s4raw.notPursuing || "", permissionToStop: s4raw.permissionToStop || "" }
    : DEFAULT_STATE.step4;

  const step5: Session4State["step5"] = raw.step5?.nextChapter
    ? raw.step5
    : { nextChapter: [] };

  // Migrate old step4a/4b/4c → step6
  const step6: Session4State["step6"] = raw.step6
    ? { first30: raw.step6.first30 || [], second30: raw.step6.second30 || [], third30: raw.step6.third30 || [] }
    : { first30: raw.step4a?.notes || [], second30: raw.step4b?.notes || [], third30: raw.step4c?.notes || [] };

  // Migrate old step7.notes[] → step7.finalReflection string
  const s7raw = raw.step7 || {};
  const step7: Session4State["step7"] = typeof s7raw.finalReflection === "string"
    ? { finalReflection: s7raw.finalReflection }
    : Array.isArray(s7raw.notes)
    ? { finalReflection: s7raw.notes.map((n: any) => n.text).filter(Boolean).join("\n\n") }
    : DEFAULT_STATE.step7;

  return {
    ...DEFAULT_STATE,
    currentStep: raw.currentStep || 1,
    step1: raw.step1 || DEFAULT_STATE.step1,
    step2,
    step3,
    step4,
    step5,
    step6,
    step7,
    journeyCompleted: raw.journeyCompleted || false,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLabel(id: string) {
  return IDENTITY_CARDS.find(c => c.id === id)?.label || ROLE_CARDS.find(r => r.id === id)?.label || id;
}
function getSymbol(id: string) {
  return IDENTITY_CARDS.find(c => c.id === id)?.symbol || "✦";
}
function makeNote(text = ""): StickyNote {
  return makeNewNote(text);
}

// ─── Decorative SVG tree ──────────────────────────────────────────────────────

function TreeIllustrationBg() {
  return (
    <svg viewBox="0 0 160 220" style={{ width: 140, height: 196, opacity: 0.12, pointerEvents: "none", userSelect: "none" }} fill="none">
      <ellipse cx="80" cy="95" rx="68" ry="58" fill="#3D6D6C" />
      <ellipse cx="80" cy="70" rx="52" ry="42" fill="#3D6D6C" />
      <ellipse cx="80" cy="48" rx="36" ry="30" fill="#4A7C7B" />
      <ellipse cx="80" cy="30" rx="22" ry="20" fill="#5A8C8B" />
      <rect x="72" y="148" width="16" height="52" rx="5" fill="#92702C" />
      <path d="M72 195 Q55 210 38 218" stroke="#92702C" strokeWidth="5" strokeLinecap="round" />
      <path d="M88 195 Q105 210 122 218" stroke="#92702C" strokeWidth="5" strokeLinecap="round" />
      <path d="M80 198 Q80 212 80 220" stroke="#92702C" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function TreeRingsBg() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", inset: 0, pointerEvents: "none" }}>
      {[300, 240, 180, 130, 85].map((r, i) => (
        <div key={i} style={{ position: "absolute", width: r, height: r, borderRadius: "50%", border: "1px solid #D4A843", opacity: 0.07 + i * 0.014 }} />
      ))}
    </div>
  );
}

// ─── Shared NoteItem (editable sticky note for zone-based steps) ──────────────

function NoteItem({ note, onEdit, onDelete, canEdit }: {
  note: StickyNote; onEdit: (text: string) => void; onDelete: () => void; canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.text);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  useEffect(() => { if (!editing) setDraft(note.text); }, [note.text, editing]);

  const commit = () => { onEdit(draft); setEditing(false); };

  return (
    <div className="group relative rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md" style={{ backgroundColor: note.color, transform: `rotate(${note.rotation ?? 0}deg)` }}>
      {editing ? (
        <textarea
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commit(); } if (e.key === "Escape") { setDraft(note.text); setEditing(false); } }}
          className="w-full bg-transparent text-sm text-gray-800 resize-none outline-none leading-relaxed"
          rows={3}
          style={{ fontFamily: "Inter, sans-serif" }}
        />
      ) : (
        <p
          className="text-sm text-gray-800 break-words leading-relaxed min-h-8"
          onDoubleClick={canEdit ? () => { setDraft(note.text); setEditing(true); } : undefined}
        >
          {note.text || <span className="italic text-gray-400 text-xs">Double-click to edit</span>}
        </p>
      )}
      {canEdit && !editing && (
        <div className="absolute top-1.5 right-1.5 hidden group-hover:flex gap-1">
          <button
            onClick={() => { setDraft(note.text); setEditing(true); }}
            className="w-5 h-5 bg-white/80 rounded flex items-center justify-center hover:bg-white transition-colors"
          >
            <Edit2 className="w-2.5 h-2.5 text-gray-600" />
          </button>
          <button
            onClick={onDelete}
            className="w-5 h-5 bg-white/80 rounded flex items-center justify-center hover:bg-white transition-colors"
          >
            <X className="w-2.5 h-2.5 text-red-500" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── ReflectionCard (rich text area for Steps 3 & 4) ─────────────────────────

function ReflectionCard({ question, value, onChange, color, canEdit }: {
  question: string; value: string; onChange: (v: string) => void; color: string; canEdit: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }
  };

  useEffect(() => { autoResize(); }, [value]);

  return (
    <div
      className="rounded-2xl border-2 overflow-hidden transition-all duration-200"
      style={{ borderColor: focused && canEdit ? color : `${color}30` }}
    >
      <div className="px-5 py-4" style={{ backgroundColor: color }}>
        <p className="text-white font-semibold text-base leading-snug" style={{ fontFamily: "Playfair Display, serif" }}>{question}</p>
      </div>
      <div className="bg-white p-4">
        {canEdit ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => { onChange(e.target.value); autoResize(); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Write your reflection here..."
            className="w-full min-h-24 text-sm text-foreground resize-none outline-none placeholder:text-muted-foreground/50 leading-relaxed"
            style={{ fontFamily: "Inter, sans-serif" }}
          />
        ) : (
          <p className="text-sm text-foreground min-h-16 leading-relaxed whitespace-pre-wrap">
            {value || <span className="italic text-muted-foreground text-xs">No reflection added yet</span>}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Step 1 — What I Tried (UNCHANGED) ───────────────────────────────────────

function Step1({ state, onChange, canEdit }: { state: Session4State["step1"]; onChange: (s: Session4State["step1"]) => void; canEdit: boolean }) {
  return (
    <StickyNoteCanvas
      notes={state.notes}
      onChange={notes => onChange({ notes })}
      prompt="Over the past week, what did you actually do?"
      background={<TreeIllustrationBg />}
      canEdit={canEdit}
      minHeight={480}
    />
  );
}

// ─── Step 2 — Experience Reflection ──────────────────────────────────────────

const STEP2_SECTIONS = [
  { key: "easy",          label: "What felt easy to step into?",    color: "#3D6D6C" },
  { key: "requiredEffort",label: "What required effort to begin?",  color: "#D4A843" },
  { key: "postponed",     label: "What did I postpone or avoid?",   color: "#AA5D53" },
  { key: "surprised",     label: "What surprised me?",              color: "#4A1C5C" },
];

function Step2({ state, onChange, canEdit }: {
  state: Session4State["step2"]; onChange: (s: Session4State["step2"]) => void; canEdit: boolean;
}) {
  const addNote = (key: keyof Session4State["step2"]) => {
    const note = makeNote();
    onChange({ ...state, [key]: [...state[key], note] });
  };

  const editNote = (key: keyof Session4State["step2"], noteId: string, text: string) => {
    onChange({ ...state, [key]: state[key].map(n => n.id === noteId ? { ...n, text } : n) });
  };

  const deleteNote = (key: keyof Session4State["step2"], noteId: string) => {
    onChange({ ...state, [key]: state[key].filter(n => n.id !== noteId) });
  };

  return (
    <div className="space-y-5">
      <div className="text-center p-4 bg-[#AA5D53]/8 border border-[#AA5D53]/20 rounded-xl">
        <p className="text-[#AA5D53] font-semibold italic text-base sm:text-lg" style={{ fontFamily: "Playfair Display, serif" }}>
          "As you look at each of these, what did you notice about your experience?"
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {STEP2_SECTIONS.map(({ key, label, color }) => {
          const notes = state[key as keyof Session4State["step2"]];
          return (
            <div key={key} className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: `${color}40` }}>
              {/* Question card */}
              <div className="px-5 py-6 text-center" style={{ backgroundColor: color }}>
                <p className="text-white font-bold text-lg leading-snug" style={{ fontFamily: "Playfair Display, serif" }}>{label}</p>
              </div>
              {/* Notes area */}
              <div className="p-4 space-y-2 min-h-32" style={{ backgroundColor: `${color}06` }}>
                {notes.map(note => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onEdit={text => editNote(key as keyof Session4State["step2"], note.id, text)}
                    onDelete={() => deleteNote(key as keyof Session4State["step2"], note.id)}
                    canEdit={canEdit}
                  />
                ))}
                {notes.length === 0 && !canEdit && (
                  <p className="text-xs text-center text-muted-foreground italic py-6">No notes added yet</p>
                )}
                {canEdit && (
                  <button
                    onClick={() => addNote(key as keyof Session4State["step2"])}
                    className="w-full py-2.5 rounded-xl border-2 border-dashed text-sm font-medium flex items-center justify-center gap-1.5 transition-all hover:opacity-80"
                    style={{ borderColor: `${color}50`, color }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add sticky note
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 3 — What This Tells Me About Who I Am ───────────────────────────────

const STEP3_QUESTIONS = [
  { key: "energy",       question: "What consistently gives me energy?",                   color: "#3D6D6C" },
  { key: "avoid",        question: "What do I seem to avoid?",                             color: "#AA5D53" },
  { key: "strengths",    question: "What strengths do I naturally rely on?",               color: "#4A1C5C" },
  { key: "surprisedMost",question: "What surprised me most?",                              color: "#D4A843" },
  { key: "moreTrueNow",  question: "What feels more true now than it did earlier?",        color: "#3D6D6C" },
];

function Step3({ state, onChange, canEdit }: {
  state: Session4State["step3"]; onChange: (s: Session4State["step3"]) => void; canEdit: boolean;
}) {
  // Row 1: first 3 questions; Row 2: last 2 centered
  const row1 = STEP3_QUESTIONS.slice(0, 3);
  const row2 = STEP3_QUESTIONS.slice(3);

  return (
    <div className="space-y-5">
      <div className="text-center p-4 bg-[#4A1C5C]/8 border border-[#4A1C5C]/20 rounded-xl">
        <p className="text-[#4A1C5C] font-semibold italic text-base sm:text-lg" style={{ fontFamily: "Playfair Display, serif" }}>
          "This tells me something about who I am."
        </p>
      </div>

      {/* Row 1 — 3 equal cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {row1.map(({ key, question, color }) => (
          <ReflectionCard
            key={key}
            question={question}
            value={state[key as keyof Session4State["step3"]]}
            onChange={v => onChange({ ...state, [key]: v })}
            color={color}
            canEdit={canEdit}
          />
        ))}
      </div>

      {/* Row 2 — 2 cards centered at same width as row 1 cells */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-start-1">
          <ReflectionCard
            question={row2[0].question}
            value={state[row2[0].key as keyof Session4State["step3"]]}
            onChange={v => onChange({ ...state, [row2[0].key]: v })}
            color={row2[0].color}
            canEdit={canEdit}
          />
        </div>
        <div className="sm:col-start-2">
          <ReflectionCard
            question={row2[1].question}
            value={state[row2[1].key as keyof Session4State["step3"]]}
            onChange={v => onChange({ ...state, [row2[1].key]: v })}
            color={row2[1].color}
            canEdit={canEdit}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Step 4 — What Am I Choosing To Let Go Of? ───────────────────────────────

const STEP4_QUESTIONS = [
  { key: "noLongerTryingToProve",  question: "What am I no longer trying to prove?",                   color: "#AA5D53" },
  { key: "expectationsReleasing",  question: "What expectations am I releasing?",                       color: "#4A1C5C" },
  { key: "notPursuing",            question: "What am I choosing not to pursue right now?",             color: "#3D6D6C" },
  { key: "permissionToStop",       question: "What am I giving myself permission to stop doing?",       color: "#D4A843" },
];

function Step4({ state, onChange, canEdit }: {
  state: Session4State["step4"]; onChange: (s: Session4State["step4"]) => void; canEdit: boolean;
}) {
  // Top row: first 3 questions; bottom: wide single card
  const top3 = STEP4_QUESTIONS.slice(0, 3);
  const bottom = STEP4_QUESTIONS[3];

  return (
    <div className="space-y-5">
      <div className="text-center p-4 bg-[#AA5D53]/8 border border-[#AA5D53]/20 rounded-xl">
        <p className="text-[#AA5D53] font-semibold italic text-base sm:text-lg" style={{ fontFamily: "Playfair Display, serif" }}>
          "What Am I Choosing To Let Go Of?"
        </p>
      </div>

      {/* Row 1 — 3 equal cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {top3.map(({ key, question, color }) => (
          <ReflectionCard
            key={key}
            question={question}
            value={state[key as keyof Session4State["step4"]]}
            onChange={v => onChange({ ...state, [key]: v })}
            color={color}
            canEdit={canEdit}
          />
        ))}
      </div>

      {/* Row 2 — one wide card centered, capped at 2/3 width on large screens */}
      <div className="flex justify-center">
        <div className="w-full sm:w-2/3">
          <ReflectionCard
            question={bottom.question}
            value={state[bottom.key as keyof Session4State["step4"]]}
            onChange={v => onChange({ ...state, [bottom.key]: v })}
            color={bottom.color}
            canEdit={canEdit}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Step 5 — What Kind Of Next Chapter Am I Choosing? ───────────────────────

function Step5({ state, onChange, canEdit }: {
  state: Session4State["step5"]; onChange: (s: Session4State["step5"]) => void; canEdit: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-[#3D6D6C]/8 border border-[#3D6D6C]/20 rounded-xl">
        <p className="text-[#3D6D6C] font-semibold italic text-base sm:text-lg" style={{ fontFamily: "Playfair Display, serif" }}>
          "What Kind Of Next Chapter Am I Choosing?"
        </p>
        <p className="text-xs text-muted-foreground mt-1.5">
          Create sticky notes describing the qualities of your next chapter — Purpose, Freedom, Coaching, Leadership, Teaching…
        </p>
      </div>
      <StickyNoteCanvas
        notes={state.nextChapter}
        onChange={nextChapter => onChange({ nextChapter })}
        prompt="What qualities define your next chapter?"
        background={<TreeRingsBg />}
        canEdit={canEdit}
        minHeight={480}
      />
    </div>
  );
}

// ─── Step 6 — The Next 90 Days ────────────────────────────────────────────────

const STEP6_COLUMNS = [
  {
    key: "first30",
    label: "First 30 Days",
    color: "#4A1C5C",
    prompts: ["What will I begin?", "What support do I need?"],
  },
  {
    key: "second30",
    label: "Second 30 Days",
    color: "#3D6D6C",
    prompts: ["Who will I engage with?", "What conversations matter?"],
  },
  {
    key: "third30",
    label: "Third 30 Days",
    color: "#AA5D53",
    prompts: ["What meaningful step will I commit to?", "What would make this feel real?"],
  },
];

function Step6({ state, onChange, canEdit }: {
  state: Session4State["step6"]; onChange: (s: Session4State["step6"]) => void; canEdit: boolean;
}) {
  const addNote = (key: keyof Session4State["step6"]) => {
    const note = makeNote();
    onChange({ ...state, [key]: [...state[key], note] });
  };

  const editNote = (key: keyof Session4State["step6"], noteId: string, text: string) => {
    onChange({ ...state, [key]: state[key].map(n => n.id === noteId ? { ...n, text } : n) });
  };

  const deleteNote = (key: keyof Session4State["step6"], noteId: string) => {
    onChange({ ...state, [key]: state[key].filter(n => n.id !== noteId) });
  };

  return (
    <div className="space-y-5">
      <div className="text-center p-4 bg-[#4A1C5C]/8 border border-[#4A1C5C]/20 rounded-xl">
        <p className="text-[#4A1C5C] font-semibold italic text-base sm:text-lg" style={{ fontFamily: "Playfair Display, serif" }}>
          "The Next 90 Days"
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STEP6_COLUMNS.map(({ key, label, color, prompts }) => {
          const notes = state[key as keyof Session4State["step6"]];
          return (
            <div key={key} className="rounded-2xl border-2 overflow-hidden flex flex-col" style={{ borderColor: `${color}35` }}>
              {/* Column header */}
              <div className="px-4 py-4" style={{ backgroundColor: color }}>
                <h4 className="font-bold text-sm tracking-wide uppercase" style={{ color: "#ffffff" }}>{label}</h4>
                <div className="mt-2 space-y-1">
                  {prompts.map((p, i) => (
                    <p key={i} className="text-xs font-semibold flex items-start gap-1.5" style={{ color: "#ffffff", textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
                      <span className="flex-shrink-0 mt-0.5">›</span>{p}
                    </p>
                  ))}
                </div>
              </div>
              {/* Notes */}
              <div className="flex-1 p-3 space-y-2 min-h-48" style={{ backgroundColor: `${color}05` }}>
                {notes.map(note => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onEdit={text => editNote(key as keyof Session4State["step6"], note.id, text)}
                    onDelete={() => deleteNote(key as keyof Session4State["step6"], note.id)}
                    canEdit={canEdit}
                  />
                ))}
                {notes.length === 0 && !canEdit && (
                  <p className="text-xs text-center text-muted-foreground italic py-8">No notes added yet</p>
                )}
                {canEdit && (
                  <button
                    onClick={() => addNote(key as keyof Session4State["step6"])}
                    className="w-full py-2 rounded-xl border-2 border-dashed text-xs font-medium flex items-center justify-center gap-1.5 transition-all hover:opacity-80 mt-1"
                    style={{ borderColor: `${color}50`, color }}
                  >
                    <Plus className="w-3 h-3" /> Add note
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 7 — Final Reflection ────────────────────────────────────────────────

function Step7({ state, onChange, canEdit, isFacilitator, onViewSummary, showCompletion }: {
  state: Session4State["step7"];
  onChange: (s: Session4State["step7"]) => void;
  canEdit: boolean;
  isFacilitator: boolean;
  onViewSummary: () => void;
  showCompletion: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = `${Math.max(160, el.scrollHeight)}px`; }
  };

  useEffect(() => { autoResize(); }, [state.finalReflection]);

  return (
    <div className="space-y-5">
      <div className="text-center p-4 bg-[#AA5D53]/8 border border-[#AA5D53]/20 rounded-xl">
        <p className="text-xs font-bold uppercase tracking-widest text-[#AA5D53] mb-1">Final Reflection</p>
        <p className="text-[#AA5D53] font-semibold italic text-base sm:text-lg" style={{ fontFamily: "Playfair Display, serif" }}>
          "What feels clearer to me now than it did when I started this journey?"
        </p>
      </div>

      <div
        className="rounded-2xl border-2 overflow-hidden transition-all duration-200"
        style={{ borderColor: focused && canEdit ? SESSION_COLOR : `${SESSION_COLOR}30` }}
      >
        <div className="px-5 py-4" style={{ backgroundColor: SESSION_COLOR }}>
          <p className="text-white/90 text-sm font-medium">Your final reflection</p>
        </div>
        <div className="bg-white p-5">
          {canEdit ? (
            <textarea
              ref={textareaRef}
              value={state.finalReflection}
              onChange={e => { onChange({ finalReflection: e.target.value }); autoResize(); }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="What feels clearer to me now than it did when I started this journey?"
              className="w-full text-sm text-foreground resize-none outline-none placeholder:text-muted-foreground/50 leading-relaxed"
              style={{ minHeight: 160, fontFamily: "Inter, sans-serif" }}
            />
          ) : (
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap" style={{ minHeight: 80 }}>
              {state.finalReflection || <span className="italic text-muted-foreground">No reflection written yet</span>}
            </p>
          )}
        </div>
      </div>

      {isFacilitator && state.finalReflection.trim().length > 0 && !showCompletion && (
        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground mb-3">Review the participant's reflection above, then complete the journey.</p>
          <button
            onClick={onViewSummary}
            className="px-6 py-3 rounded-xl text-white font-semibold flex items-center gap-2 mx-auto hover:opacity-90 transition-all shadow-md"
            style={{ backgroundColor: SESSION_COLOR }}
          >
            View Journey Summary <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Journey Completion screen ─────────────────────────────────────────────────

function JourneyCompletion({ boardState, prevBoards, journeyTitle, onEndJourney, endingSession }: {
  boardState: Session4State;
  prevBoards: Record<number, any>;
  journeyTitle: string;
  onEndJourney: () => void;
  endingSession: boolean;
}) {
  const s1 = prevBoards[1] || {};
  const s2 = prevBoards[2] || {};
  const s3 = prevBoards[3] || {};

  const recognitionWords: { word: string }[] = s1?.step7?.recognitionWords || [];
  const anchorId: string = s2?.step9?.selectedAligned || "";
  const selectedAssets: string[] = s2?.step5?.assets || [];
  const s3Experiments = [
    ...(s3?.step2?.observe || []).map((n: StickyNote) => ({ ...n, tier: "Observe" })),
    ...(s3?.step2?.converse || []).map((n: StickyNote) => ({ ...n, tier: "Converse" })),
    ...(s3?.step2?.act || []).map((n: StickyNote) => ({ ...n, tier: "Act" })),
  ];
  const commitmentDate: string = s3?.step4?.commitmentDate || "";
  const commitmentActions: number = s3?.step4?.numberOfActions || 1;

  const { step2, step3, step4, step6, step7 } = boardState;
  const roadmapTotal = step6.first30.length + step6.second30.length + step6.third30.length;
  const reflectionTotal = step2.easy.length + step2.requiredEffort.length + step2.postponed.length + step2.surprised.length;

  const handlePrint = () => window.print();

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
      {/* Hero */}
      <div className="text-center py-8 bg-gradient-to-b from-[#4A1C5C] to-[#3D6D6C] rounded-2xl text-white px-6 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          {[300, 220, 150, 90].map((r, i) => <div key={i} className="absolute rounded-full border-2 border-white" style={{ width: r, height: r }} />)}
        </div>
        <div className="relative z-10">
          <Trophy className="w-12 h-12 text-[#D4A843] mx-auto mb-3" />
          <h2 className="text-2xl sm:text-3xl text-white font-bold mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
            Zest Journey Complete
          </h2>
          <p className="text-white/80 text-sm">{journeyTitle}</p>
          <p className="text-white/60 text-xs mt-1">{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        </div>
      </div>

      {/* Recognition Word */}
      {recognitionWords.length > 0 && (
        <SummarySection title="Recognition Word" color="#4A1C5C">
          <div className="flex flex-wrap gap-3">
            {recognitionWords.map((w, i) => (
              <span key={i} className="px-5 py-2.5 rounded-full bg-[#4A1C5C] text-white font-bold text-xl shadow-md" style={{ fontFamily: "Playfair Display, serif" }}>{w.word}</span>
            ))}
          </div>
        </SummarySection>
      )}

      {/* Anchor Identity */}
      {anchorId && (
        <SummarySection title="Anchor Identity" color="#3D6D6C">
          <div className="flex items-center gap-3 p-4 bg-[#3D6D6C]/8 rounded-xl border border-[#3D6D6C]/20">
            <span className="text-4xl">{getSymbol(anchorId)}</span>
            <p className="font-bold text-lg text-foreground">{getLabel(anchorId)}</p>
          </div>
        </SummarySection>
      )}

      {/* Key Assets */}
      {selectedAssets.length > 0 && (
        <SummarySection title="Key Assets" color="#D4A843">
          <div className="flex flex-wrap gap-2">
            {selectedAssets.map((a, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-[#D4A843]/15 text-[#A07820] text-sm font-medium border border-[#D4A843]/30">{a}</span>
            ))}
          </div>
        </SummarySection>
      )}

      {/* S3 Experiments */}
      {s3Experiments.length > 0 && (
        <SummarySection title="Experiments Designed" color="#AA5D53">
          <div className="space-y-2">
            {s3Experiments.map((exp, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 bg-[#EBE2D6]/50 rounded-lg">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white flex-shrink-0" style={{ backgroundColor: exp.tier === "Observe" ? "#4A1C5C" : exp.tier === "Converse" ? "#3D6D6C" : "#AA5D53" }}>{exp.tier}</span>
                <p className="text-sm text-foreground">{exp.text}</p>
              </div>
            ))}
          </div>
          {commitmentDate && (
            <div className="mt-3 p-3 bg-white rounded-xl border border-border">
              <p className="text-sm font-semibold text-[#4A1C5C]">
                By {new Date(commitmentDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} — {commitmentActions} action{commitmentActions !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </SummarySection>
      )}

      {/* Session 4 Experience Reflections */}
      {reflectionTotal > 0 && (
        <SummarySection title="Session 4 — Experience Reflections" color="#3D6D6C">
          {[
            { label: "Easy to step into",      notes: step2.easy },
            { label: "Required effort",        notes: step2.requiredEffort },
            { label: "Postponed or avoided",   notes: step2.postponed },
            { label: "What surprised me",      notes: step2.surprised },
          ].map(({ label, notes }) => notes.length > 0 && (
            <div key={label} className="mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{label}</p>
              <div className="flex flex-wrap gap-1.5">
                {notes.map((n, i) => <span key={i} className="px-2.5 py-1 rounded-lg text-xs border" style={{ backgroundColor: n.color }}>{n.text}</span>)}
              </div>
            </div>
          ))}
        </SummarySection>
      )}

      {/* Who I Am */}
      {Object.values(step3).some(v => v.trim()) && (
        <SummarySection title="Session 4 — Who I Am" color="#4A1C5C">
          <div className="space-y-3">
            {STEP3_QUESTIONS.map(({ key, question, color }) => {
              const v = step3[key as keyof Session4State["step3"]];
              if (!v?.trim()) return null;
              return (
                <div key={key} className="p-3 rounded-xl" style={{ backgroundColor: `${color}08`, borderLeft: `3px solid ${color}` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color }}>{question}</p>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{v}</p>
                </div>
              );
            })}
          </div>
        </SummarySection>
      )}

      {/* Letting Go */}
      {Object.values(step4).some(v => v.trim()) && (
        <SummarySection title="Session 4 — Letting Go" color="#AA5D53">
          <div className="space-y-3">
            {STEP4_QUESTIONS.map(({ key, question, color }) => {
              const v = step4[key as keyof Session4State["step4"]];
              if (!v?.trim()) return null;
              return (
                <div key={key} className="p-3 rounded-xl" style={{ backgroundColor: `${color}08`, borderLeft: `3px solid ${color}` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color }}>{question}</p>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{v}</p>
                </div>
              );
            })}
          </div>
        </SummarySection>
      )}

      {/* 90-Day Roadmap */}
      {roadmapTotal > 0 && (
        <SummarySection title="The Next 90 Days" color="#4A1C5C">
          {STEP6_COLUMNS.map(({ key, label, color }) => {
            const notes = boardState.step6[key as keyof Session4State["step6"]];
            if (notes.length === 0) return null;
            return (
              <div key={key} className="mb-3">
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color }}>{label}</p>
                <div className="flex flex-wrap gap-2">
                  {notes.map((n, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg text-xs border" style={{ backgroundColor: n.color }}>{n.text}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </SummarySection>
      )}

      {/* Final Reflection */}
      {step7.finalReflection.trim() && (
        <SummarySection title="Final Reflection" color="#AA5D53">
          <div className="p-4 bg-[#AA5D53]/5 rounded-xl border border-[#AA5D53]/20">
            <p className="text-sm text-foreground leading-relaxed italic whitespace-pre-wrap" style={{ fontFamily: "Playfair Display, serif" }}>
              "{step7.finalReflection}"
            </p>
          </div>
        </SummarySection>
      )}

      {/* Actions */}
      <div className="text-center pt-4 pb-2 space-y-3">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-[#EBE2D6] transition-colors mx-auto"
        >
          <Printer className="w-4 h-4" /> Download / Print Summary
        </button>
        <button
          onClick={onEndJourney}
          disabled={endingSession}
          className="px-8 py-4 rounded-2xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-3 mx-auto disabled:opacity-70"
          style={{ background: "linear-gradient(135deg, #4A1C5C, #3D6D6C)" }}
        >
          {endingSession && <Loader2 className="w-5 h-5 animate-spin" />}
          <Star className="w-5 h-5 text-[#D4A843]" />
          Complete Zest Journey
          <Star className="w-5 h-5 text-[#D4A843]" />
        </button>
        <p className="text-xs text-muted-foreground">The journey will be marked as complete and saved for review.</p>
      </div>
    </motion.div>
  );
}

function SummarySection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <h4 className="font-semibold text-sm" style={{ color }}>{title}</h4>
      </div>
      {children}
    </div>
  );
}

// ─── Main Session4Board ────────────────────────────────────────────────────────

export default function Session4Board() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const isParticipant = location.pathname.startsWith("/participant");
  const role = isParticipant ? "participant" : "facilitator";
  const dashboardPath = isParticipant ? "/participant/dashboard" : "/facilitator/dashboard";

  const [boardState, setBoardState] = useState<Session4State>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [prevBoards, setPrevBoards] = useState<Record<number, any>>({});
  const [endingSession, setEndingSession] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

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
        if (sr.ok) {
          const d = await sr.json();
          setSessionInfo(d);
          if (d.previousBoards) setPrevBoards(d.previousBoards);
        }
        if (br.ok) {
          const d = await br.json();
          if (d.state) {
            const migrated = migrateState(d.state);
            setBoardState(migrated);
            if (migrated.journeyCompleted) setShowCompletion(true);
          }
        }
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
        if (payload?.state) {
          const migrated = migrateState(payload.state);
          setBoardState(migrated);
          if (migrated.journeyCompleted) setShowCompletion(true);
        }
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

  const updateState = useCallback((updater: (prev: Session4State) => Session4State) => {
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

  const saveAndComplete = async () => {
    const finalState = { ...stateRef.current, journeyCompleted: true };
    await fetch(`${API}/sessions/${sessionId}/board`, { method: "PUT", headers: await HEADERS(), body: JSON.stringify({ state: finalState }) });
    await fetch(`${API}/sessions/${sessionId}/status`, { method: "PUT", headers: await HEADERS(), body: JSON.stringify({ status: "completed" }) });
    setBoardState(finalState);
    channelRef.current?.send({ type: "broadcast", event: "board_update", payload: { state: finalState } });
    return finalState;
  };

  const endSession = async () => {
    if (!window.confirm("Complete Session 4 and end the Zest Journey? Everything will be saved.")) return;
    setEndingSession(true);
    try {
      await saveAndComplete();
      setShowCompletion(true);
      toast.success("Zest Journey completed! 🎉");
    } catch { toast.error("Failed to complete journey."); } finally { setEndingSession(false); }
  };

  const completeAndLeave = async () => {
    setEndingSession(true);
    try {
      if (!stateRef.current.journeyCompleted) await saveAndComplete();
      toast.success("Journey saved. Well done! 🎉");
      navigate(dashboardPath);
    } catch { toast.error("Failed to save. Please try again."); } finally { setEndingSession(false); }
  };

  const step = boardState.currentStep;
  const stepInfo = STEPS[step - 1];
  const canNavigate = !isParticipant;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EBE2D6] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#4A1C5C] mx-auto" />
          <p className="text-sm text-muted-foreground">Loading Session 4…</p>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Step1
            state={boardState.step1}
            onChange={s => updateState(p => ({ ...p, step1: s }))}
            canEdit={true}
          />
        );
      case 2:
        return (
          <Step2
            state={boardState.step2}
            onChange={s => updateState(p => ({ ...p, step2: s }))}
            canEdit={true}
          />
        );
      case 3:
        return (
          <Step3
            state={boardState.step3}
            onChange={s => updateState(p => ({ ...p, step3: s }))}
            canEdit={true}
          />
        );
      case 4:
        return (
          <Step4
            state={boardState.step4}
            onChange={s => updateState(p => ({ ...p, step4: s }))}
            canEdit={true}
          />
        );
      case 5:
        return (
          <Step5
            state={boardState.step5}
            onChange={s => updateState(p => ({ ...p, step5: s }))}
            canEdit={true}
          />
        );
      case 6:
        return (
          <Step6
            state={boardState.step6}
            onChange={s => updateState(p => ({ ...p, step6: s }))}
            canEdit={true}
          />
        );
      case 7:
        return (
          <Step7
            state={boardState.step7}
            onChange={s => updateState(p => ({ ...p, step7: s }))}
            canEdit={true}
            isFacilitator={!isParticipant}
            onViewSummary={() => setShowCompletion(true)}
            showCompletion={showCompletion}
          />
        );
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
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[9px] font-bold" style={{ backgroundColor: SESSION_COLOR }}>4</div>
            <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
              {sessionInfo?.journey?.title || "Zest Journey"}
              <span className="text-muted-foreground font-normal hidden sm:inline"> — Session 4</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1 text-xs">
            {connected ? <Wifi className="w-3 h-3 text-[#3D6D6C]" /> : <WifiOff className="w-3 h-3 text-[#AA5D53]" />}
            <span className={`hidden sm:inline ${connected ? "text-[#3D6D6C]" : "text-[#AA5D53]"}`}>{connected ? "Live" : "Offline"}</span>
          </div>
          {peerConnected && (
            <div className="flex items-center gap-1 text-xs bg-[#AA5D53]/10 px-1.5 py-0.5 rounded-full" style={{ color: SESSION_COLOR }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: SESSION_COLOR }} />
              <span className="hidden sm:inline">{isParticipant ? "Facilitator" : "Participant"}</span>
            </div>
          )}
          {saving
            ? <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" />Saving</div>
            : lastSaved
            ? <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground"><Save className="w-3 h-3" />Saved</div>
            : null}
          {!isParticipant && !showCompletion && (
            <button
              onClick={endSession}
              disabled={endingSession}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-white text-xs rounded-lg hover:opacity-90 transition-colors"
              style={{ backgroundColor: SESSION_COLOR }}
            >
              {endingSession && <Loader2 className="w-3 h-3 animate-spin" />}
              <span className="hidden sm:inline">End Session</span><span className="sm:hidden">End</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {!showCompletion && (
        <div className="bg-white border-b border-border px-3 sm:px-4 py-2 flex-shrink-0">
          <div className="max-w-5xl mx-auto flex items-center gap-1">
            {STEPS.map(s => (
              <button
                key={s.number}
                onClick={() => canNavigate && goToStep(s.number)}
                title={s.title}
                className={`flex-1 h-1.5 rounded-full transition-all ${step === s.number ? "bg-[#AA5D53]" : step > s.number ? "bg-[#4A1C5C]" : "bg-border"} ${canNavigate ? "cursor-pointer hover:opacity-75" : "cursor-default"}`}
              />
            ))}
          </div>
          <div className="max-w-5xl mx-auto mt-1.5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground truncate">
              Step {step}/{TOTAL_STEPS} — <span className="font-semibold text-foreground">{stepInfo.title}</span>
            </span>
            <span className="text-xs text-muted-foreground hidden sm:block">{stepInfo.subtitle}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <AnimatePresence mode="wait">
            {showCompletion ? (
              <motion.div key="completion" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <JourneyCompletion
                  boardState={boardState}
                  prevBoards={prevBoards}
                  journeyTitle={sessionInfo?.journey?.title || "Zest Journey"}
                  onEndJourney={completeAndLeave}
                  endingSession={endingSession}
                />
              </motion.div>
            ) : (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2" style={{ backgroundColor: `${SESSION_COLOR}15` }}>
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: SESSION_COLOR }}>{step}</span>
                    <span className="text-xs font-medium" style={{ color: SESSION_COLOR }}>{stepInfo.subtitle}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl" style={{ fontFamily: "Playfair Display, serif", color: SESSION_COLOR }}>{stepInfo.title}</h2>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-border p-4 sm:p-5 lg:p-7">
                  {renderStep()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom nav */}
      {!showCompletion && (
        <div className="bg-white border-t border-border px-3 sm:px-4 py-2.5 flex-shrink-0">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
            <button
              onClick={() => goToStep(step - 1)}
              disabled={step === 1}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex-shrink-0 ${step === 1 ? "text-muted-foreground cursor-not-allowed opacity-40" : "text-foreground hover:bg-[#EBE2D6] border border-border"}`}
            >
              <ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline">Previous</span>
            </button>
            <div className="flex items-center gap-1">
              {STEPS.map(s => (
                <button
                  key={s.number}
                  onClick={() => canNavigate && goToStep(s.number)}
                  className={`h-2 rounded-full transition-all ${step === s.number ? "w-5" : "w-2"} ${step === s.number ? "" : step > s.number ? "bg-[#4A1C5C]" : "bg-border"} ${canNavigate ? "cursor-pointer" : "cursor-default"}`}
                  style={step === s.number ? { backgroundColor: SESSION_COLOR, width: 20 } : {}}
                />
              ))}
            </div>
            {step < TOTAL_STEPS ? (
              <button
                onClick={() => goToStep(step + 1)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-white hover:opacity-90 transition-all flex-shrink-0"
                style={{ backgroundColor: SESSION_COLOR }}
              >
                <span className="hidden sm:inline">Next</span><ChevronRight className="w-4 h-4" />
              </button>
            ) : !isParticipant ? (
              <button
                onClick={() => setShowCompletion(true)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#4A1C5C] text-white hover:bg-[#3A1C4C] transition-all flex-shrink-0"
              >
                <Trophy className="w-4 h-4" /><span className="hidden sm:inline">Journey Summary</span><span className="sm:hidden">Summary</span>
              </button>
            ) : (
              <div className="w-24 text-center text-xs text-muted-foreground">Journey complete</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
