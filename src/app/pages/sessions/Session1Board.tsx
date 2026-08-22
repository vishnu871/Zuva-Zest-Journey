// import { useState, useEffect, useRef, useCallback } from "react";
// import { useNavigate, useLocation, useParams } from "react-router";
// import { motion, AnimatePresence } from "motion/react";
// import { toast } from "sonner";
// import { createClient } from "../../../utils/supabase/client";
// import { projectId, publicAnonKey } from "../../../utils/supabase/info";
// import {
//   ChevronLeft, ChevronRight, ArrowLeft, Wifi, WifiOff, Save,
//   CheckCircle, Plus, X, Pencil, GripVertical, Loader2, Trash2,
// } from "lucide-react";

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface StickyNote {
//   id: string;
//   text: string;
//   zone: string | null;
//   color: string;
//   rotation?: number;
// }

// interface RecognitionWord {
//   id: string;
//   word: string;
// }

// interface BoardState {
//   currentStep: number;
//   step1: { selectedCards: string[] };
//   step2: { exitNotes: StickyNote[] };
//   step3: { stickyNotes: StickyNote[] };
//   step4: { selectedRoles: string[] };
//   step5: { roleNotes: Record<string, StickyNote[]> };
//   step6: { roleZones: Record<string, string | null> };
//   step7: { recognitionWords: RecognitionWord[] };
// }

// // ─── Constants ────────────────────────────────────────────────────────────────

// const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;
// const HEADERS = { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` };
// // Miro-style realistic sticky note colours
// const NOTE_COLORS = ["#FFF176", "#CCFF90", "#FFCCBC", "#B3E5FC", "#E1BEE7"];

// const IDENTITY_CARDS = [
//   { id: "parent", label: "Parent / Grandparent", symbol: "🏡", desc: "Nurturing & family" },
//   { id: "professional", label: "Professional", symbol: "💼", desc: "Career & expertise" },
//   { id: "community_leader", label: "Community Leader", symbol: "🏛️", desc: "Civic & service" },
//   { id: "creative", label: "Creative Soul", symbol: "🎨", desc: "Art & expression" },
//   { id: "explorer", label: "Explorer / Adventurer", symbol: "🗺️", desc: "Discovery & travel" },
//   { id: "mentor", label: "Mentor / Teacher", symbol: "📚", desc: "Guidance & learning" },
//   { id: "entrepreneur", label: "Entrepreneur", symbol: "🚀", desc: "Building & ventures" },
//   { id: "caregiver", label: "Caregiver / Nurturer", symbol: "❤️", desc: "Healing & support" },
//   { id: "activist", label: "Activist", symbol: "✊", desc: "Change & justice" },
//   { id: "spiritual", label: "Spiritual Person", symbol: "🕊️", desc: "Faith & inner life" },
//   { id: "friend", label: "Friend / Companion", symbol: "🤝", desc: "Connection & loyalty" },
//   { id: "learner", label: "Learner / Student", symbol: "🎓", desc: "Curiosity & growth" },
//   { id: "artist", label: "Artist / Creator", symbol: "🎭", desc: "Performance & craft" },
//   { id: "athlete", label: "Athlete / Active", symbol: "⚡", desc: "Movement & vitality" },
//   { id: "nature", label: "Nature Lover", symbol: "🌿", desc: "Environment & outdoors" },
//   { id: "philanthropist", label: "Philanthropist", symbol: "🌟", desc: "Giving & impact" },
// ];

// const ROLE_CARDS = [
//   { id: "entrepreneur", label: "Entrepreneur", description: "Building ventures from scratch" },
//   { id: "executive_coach", label: "Executive Coach", description: "Empowering leaders to excel" },
//   { id: "visiting_faculty", label: "Visiting Faculty", description: "Sharing expertise in academia" },
//   { id: "venture_builder", label: "Learning / Venture Builder", description: "Exploring & building new ideas" },
//   { id: "author", label: "Author / Writer", description: "Crafting stories & knowledge" },
//   { id: "consultant", label: "Independent Consultant", description: "Advising organizations strategically" },
//   { id: "advisor", label: "Advisor", description: "Guiding growth with experience" },
//   { id: "volunteer", label: "Volunteer", description: "Creating change through service" },
//   { id: "social_entrepreneur", label: "Social Entrepreneur", description: "Business with social impact" },
//   { id: "speaker", label: "Speaker / Facilitator", description: "Inspiring through storytelling" },
//   { id: "board_member", label: "Board Member", description: "Governing with wisdom" },
//   { id: "mentor_role", label: "Mentor", description: "Nurturing others' potential" },
// ];

// const STEPS = [
//   { number: 1, title: "Book of Life", subtitle: "Select your life chapters" },
//   { number: 2, title: "Exit Bin", subtitle: "What no longer works?" },
//   { number: 3, title: "Discovery Landscape", subtitle: "Map what draws you forward" },
//   { number: 4, title: "Deck of Recognition", subtitle: "Choose future identities" },
//   { number: 5, title: "Dinner Table", subtitle: "What are they talking about?" },
//   { number: 6, title: "Grounding vs Draining", subtitle: "Sort what energises you" },
//   { number: 7, title: "Recognition Word", subtitle: "The word that unites your path" },
// ];

// const TOTAL_STEPS = 7;

// const DEFAULT_STATE: BoardState = {
//   currentStep: 1,
//   step1: { selectedCards: [] },
//   step2: { exitNotes: [] },
//   step3: { stickyNotes: [] },
//   step4: { selectedRoles: [] },
//   step5: { roleNotes: {} },
//   step6: { roleZones: {} },
//   step7: { recognitionWords: [] },
// };

// function migrateState(raw: any): BoardState {
//   if (!raw) return DEFAULT_STATE;
//   if (raw.step7) return raw as BoardState;
//   return {
//     currentStep: raw.currentStep || 1,
//     step1: raw.step1 || { selectedCards: [] },
//     step2: { exitNotes: [] },
//     step3: raw.step2 || { stickyNotes: [] },
//     step4: raw.step3 || { selectedRoles: [] },
//     step5: { roleNotes: {} },
//     step6: raw.step5 || { roleZones: {} },
//     step7: raw.step6 || { recognitionWords: [] },
//   };
// }

// // ─── Touch/Pointer Drag & Drop ────────────────────────────────────────────────
// // Works on mouse AND touch — no HTML5 drag API (which doesn't work on mobile)

// interface UseTouchDnDResult {
//   draggingId: string | null;
//   overZone: string | null;
//   startDrag: (itemId: string, label: string, e: React.PointerEvent<HTMLElement>) => void;
// }

// function useTouchDnD(onDrop: (itemId: string, targetZone: string) => void): UseTouchDnDResult {
//   const [draggingId, setDraggingId] = useState<string | null>(null);
//   const [overZone, setOverZone] = useState<string | null>(null);
//   const callbackRef = useRef(onDrop);
//   callbackRef.current = onDrop;

//   const startDrag = useCallback((itemId: string, label: string, e: React.PointerEvent<HTMLElement>) => {
//     // Prevent scroll while dragging on touch
//     e.preventDefault();

//     // Create floating ghost element
//     const ghost = document.createElement("div");
//     const shortLabel = label.length > 35 ? label.slice(0, 35) + "…" : label;
//     Object.assign(ghost.style, {
//       position: "fixed",
//       pointerEvents: "none",
//       zIndex: "9999",
//       padding: "8px 12px",
//       background: "white",
//       border: "2px solid #4A1C5C",
//       borderRadius: "10px",
//       fontSize: "12px",
//       lineHeight: "1.4",
//       boxShadow: "0 6px 20px rgba(0,0,0,0.22)",
//       opacity: "0.92",
//       maxWidth: "160px",
//       wordBreak: "break-word",
//       transform: "rotate(2deg) scale(1.04)",
//       transition: "transform 0.1s",
//     });
//     ghost.textContent = shortLabel;
//     document.body.appendChild(ghost);

//     const positionGhost = (x: number, y: number) => {
//       ghost.style.left = `${x - 80}px`;
//       ghost.style.top = `${y - 30}px`;
//     };

//     const findDropZone = (x: number, y: number): string | null => {
//       ghost.style.visibility = "hidden";
//       const els = document.elementsFromPoint(x, y);
//       ghost.style.visibility = "visible";
//       for (const el of els) {
//         const zone = (el as HTMLElement).dataset?.dropzone;
//         if (zone) return zone;
//       }
//       return null;
//     };

//     positionGhost(e.clientX, e.clientY);
//     setDraggingId(itemId);

//     const onMove = (ev: PointerEvent) => {
//       positionGhost(ev.clientX, ev.clientY);
//       const zone = findDropZone(ev.clientX, ev.clientY);
//       setOverZone(zone);
//     };

//     const cleanup = () => {
//       if (document.body.contains(ghost)) document.body.removeChild(ghost);
//       setDraggingId(null);
//       setOverZone(null);
//       document.removeEventListener("pointermove", onMove);
//       document.removeEventListener("pointerup", onUp);
//       document.removeEventListener("pointercancel", onCancel);
//     };

//     const onUp = (ev: PointerEvent) => {
//       const zone = findDropZone(ev.clientX, ev.clientY);
//       if (zone) callbackRef.current(itemId, zone);
//       cleanup();
//     };

//     const onCancel = () => cleanup();

//     document.addEventListener("pointermove", onMove, { passive: false });
//     document.addEventListener("pointerup", onUp);
//     document.addEventListener("pointercancel", onCancel);
//   }, []);

//   return { draggingId, overZone, startDrag };
// }

// // ─── Note Editor Hook ─────────────────────────────────────────────────────────

// function useNoteEditor() {
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [editText, setEditText] = useState("");
//   const startEdit = (id: string, text: string) => { setEditingId(id); setEditText(text); };
//   const cancelEdit = () => setEditingId(null);
//   return { editingId, editText, startEdit, cancelEdit, setEditText };
// }

// // ─── Shared NoteCard ──────────────────────────────────────────────────────────

// interface NoteCardProps {
//   note: StickyNote;
//   canEdit: boolean;
//   draggable?: boolean;
//   isDragging?: boolean;
//   onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
//   editingId: string | null;
//   editText: string;
//   onEditStart: () => void;
//   onEditChange: (t: string) => void;
//   onEditSave: () => void;
//   onEditCancel: () => void;
//   onDelete: () => void;
// }

// function NoteCard({
//   note, canEdit, draggable: isDraggable = true, isDragging, onPointerDown,
//   editingId, editText, onEditStart, onEditChange, onEditSave, onEditCancel, onDelete,
// }: NoteCardProps) {
//   const isEditing = editingId === note.id;
//   // subtle random rotation stored on note, fallback to 0
//   const rot = (note as any).rotation ?? 0;
//   return (
//     <div
//       style={{
//         backgroundColor: note.color,
//         touchAction: canEdit && isDraggable ? "none" : "auto",
//         opacity: isDragging ? 0.35 : 1,
//         userSelect: "none",
//         width: 112,
//         minHeight: 112,
//         borderRadius: 6,
//         padding: "10px 10px 16px 10px",
//         boxShadow: isDragging
//           ? "0 14px 32px rgba(0,0,0,0.2)"
//           : "0 5px 16px rgba(0,0,0,0.11)",
//         transform: `rotate(${rot}deg) scale(${isDragging ? 1.04 : 1}) translateY(${isDragging ? -4 : 0}px)`,
//         transition: isDragging ? "none" : "box-shadow 0.18s, transform 0.15s",
//         position: "relative",
//         flexShrink: 0,
//         cursor: isDragging ? "grabbing" : isEditing ? "text" : canEdit && isDraggable ? "grab" : "default",
//       }}
//       onPointerDown={canEdit && isDraggable ? onPointerDown : undefined}
//       className="group"
//     >
//       {/* Folded corner */}
//       <div style={{
//         position: "absolute", bottom: 0, right: 0, width: 16, height: 16,
//         background: "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.09) 50%)",
//         borderBottomRightRadius: 6, pointerEvents: "none",
//       }} />

//       {isEditing ? (
//         <div className="space-y-1">
//           <textarea
//             autoFocus value={editText} onChange={(e) => onEditChange(e.target.value)}
//             className="w-full bg-transparent resize-none border-b border-black/20 focus:outline-none"
//             style={{ fontSize: 12, fontFamily: "Inter, sans-serif", fontWeight: 500, color: "#2D2D2D", lineHeight: 1.4, touchAction: "auto", padding: 0 }}
//             rows={3}
//             onPointerDown={(e) => e.stopPropagation()}
//             onKeyDown={(e) => {
//               if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onEditSave(); }
//               if (e.key === "Escape") onEditCancel();
//             }}
//           />
//           <div className="flex gap-1">
//             <button onClick={onEditSave} onPointerDown={(e) => e.stopPropagation()} className="text-[10px] px-2 py-0.5 bg-black/10 rounded hover:bg-black/20">Save</button>
//             <button onClick={onEditCancel} onPointerDown={(e) => e.stopPropagation()} className="text-[10px] px-2 py-0.5 bg-black/10 rounded hover:bg-black/20">Cancel</button>
//           </div>
//         </div>
//       ) : (
//         <>
//           {canEdit && isDraggable && <GripVertical className="w-3 h-3 text-black/20 mb-1 pointer-events-none" />}
//           <p style={{ fontSize: 12, fontFamily: "Inter, sans-serif", fontWeight: 500, color: "#2D2D2D", lineHeight: 1.4, wordBreak: "break-word", margin: 0, pointerEvents: "none" }}>
//             {note.text}
//           </p>
//           {canEdit && (
//             <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5" onPointerDown={(e) => e.stopPropagation()}>
//               <button onClick={onEditStart} className="w-5 h-5 bg-white/80 rounded flex items-center justify-center hover:bg-white shadow-sm">
//                 <Pencil className="w-2.5 h-2.5 text-gray-600" />
//               </button>
//               <button onClick={onDelete} className="w-5 h-5 bg-white/80 rounded flex items-center justify-center hover:bg-white shadow-sm">
//                 <X className="w-2.5 h-2.5 text-[#AA5D53]" />
//               </button>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// }

// // ─── Note Input ───────────────────────────────────────────────────────────────

// function NoteInput({ placeholder, onAdd, color = "#D4A843" }: {
//   placeholder: string;
//   onAdd: (text: string) => void;
//   color?: string;
// }) {
//   const [text, setText] = useState("");
//   const submit = () => {
//     if (!text.trim()) return;
//     onAdd(text.trim());
//     setText("");
//   };
//   return (
//     <div className="flex gap-2 items-start">
//       <textarea
//         value={text}
//         onChange={(e) => setText(e.target.value)}
//         placeholder={placeholder}
//         className="flex-1 rounded-lg border border-border p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#4A1C5C]/25 min-w-0"
//         rows={2}
//         onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
//       />
//       <button
//         onClick={submit}
//         className="mt-1 px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1 flex-shrink-0 text-[#2C1810] transition-colors hover:opacity-90"
//         style={{ backgroundColor: color }}
//       >
//         <Plus className="w-4 h-4" />
//         <span className="hidden sm:inline">Add</span>
//       </button>
//     </div>
//   );
// }

// // ─── Drop Zone ────────────────────────────────────────────────────────────────

// function DropZone({ id, label, count, isOver, children, className = "" }: {
//   id: string;
//   label: string;
//   count: number;
//   isOver: boolean;
//   children: React.ReactNode;
//   className?: string;
// }) {
//   return (
//     <div
//       data-dropzone={id}
//       className={`
//         min-h-40 p-4 rounded-xl border-2 transition-all duration-150
//         ${isOver ? "border-[#D4A843] bg-[#EBE2D6] shadow-lg scale-[1.01]" : "border-border bg-white"}
//         ${className}
//       `}
//     >
//       <div className="flex items-center justify-between mb-3 pointer-events-none">
//         <span className="font-semibold text-sm text-foreground">{label}</span>
//         <span className="text-xs text-muted-foreground bg-[#EBE2D6] rounded-full px-2 py-0.5">{count}</span>
//       </div>
//       <div className="flex flex-wrap gap-2">
//         {children}
//       </div>
//     </div>
//   );
// }

// // ─── Step 1: Book of Life ─────────────────────────────────────────────────────

// function Step1BookOfLife({ state, onChange }: {
//   state: BoardState["step1"];
//   onChange: (s: BoardState["step1"]) => void;
// }) {
//   const toggle = (id: string) => {
//     const selected = state.selectedCards.includes(id)
//       ? state.selectedCards.filter(c => c !== id)
//       : [...state.selectedCards, id];
//     onChange({ selectedCards: selected });
//   };

//   return (
//     <div className="space-y-4">
//       <div className="text-center">
//         <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
//           Browse your identity cards and select the ones that feel true to who you are — the chapters of your Book of Life.
//         </p>
//         {state.selectedCards.length > 0 && (
//           <span className="inline-block mt-2 text-xs text-[#4A1C5C] font-semibold bg-[#4A1C5C]/10 px-3 py-1 rounded-full">
//             {state.selectedCards.length} selected
//           </span>
//         )}
//       </div>
//       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
//         {IDENTITY_CARDS.map((card) => {
//           const selected = state.selectedCards.includes(card.id);
//           return (
//             <motion.button
//               key={card.id}
//               onClick={() => toggle(card.id)}
//               whileTap={{ scale: 0.96 }}
//               className={`
//                 relative p-3 sm:p-4 rounded-xl border-2 text-left transition-all cursor-pointer
//                 ${selected ? "border-[#4A1C5C] bg-[#4A1C5C]/8 shadow-md" : "border-border bg-white hover:border-[#4A1C5C]/40"}
//               `}
//             >
//               <div className="text-2xl sm:text-3xl mb-1.5 leading-none">{card.symbol}</div>
//               <p className="text-xs sm:text-sm font-semibold text-foreground leading-tight">{card.label}</p>
//               <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">{card.desc}</p>
//               <div className={`absolute top-2 right-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected ? "border-[#4A1C5C] bg-[#4A1C5C]" : "border-border bg-white"}`}>
//                 {selected && <CheckCircle className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" />}
//               </div>
//             </motion.button>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// // ─── Step 2: Exit Bin ─────────────────────────────────────────────────────────

// function Step2ExitBin({ state, onChange, canEdit }: {
//   state: BoardState["step2"];
//   onChange: (s: BoardState["step2"]) => void;
//   canEdit: boolean;
// }) {
//   const editor = useNoteEditor();

//   const addNote = (text: string) => {
//     onChange({
//       exitNotes: [...state.exitNotes, {
//         id: crypto.randomUUID(),
//         text,
//         zone: "exit",
//         color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)], rotation: (Math.random() * 4) - 2,
//       }],
//     });
//   };

//   const deleteNote = (id: string) => onChange({ exitNotes: state.exitNotes.filter(n => n.id !== id) });

//   const saveEdit = (id: string) => {
//     onChange({ exitNotes: state.exitNotes.map(n => n.id === id ? { ...n, text: editor.editText } : n) });
//     editor.cancelEdit();
//   };

//   return (
//     <div className="space-y-4">
//       <div className="bg-[#AA5D53]/8 border border-[#AA5D53]/25 rounded-xl p-4 text-center">
//         <p className="text-[#AA5D53] font-semibold italic text-base sm:text-lg" style={{ fontFamily: "Playfair Display, serif" }}>
//           "What no longer works for you?"
//         </p>
//         <p className="text-sm text-muted-foreground mt-1">Release what you're leaving behind. One thought per sticky note.</p>
//       </div>

//       {canEdit && <NoteInput placeholder="e.g. People pleasing, overworking, ignoring my creativity..." onAdd={addNote} color="#AA5D53" />}

//       <div className="rounded-2xl border-2 border-dashed border-[#AA5D53]/40 bg-[#AA5D53]/5 min-h-44 p-4">
//         <div className="flex items-center gap-2 mb-4">
//           <div className="w-8 h-8 rounded-full bg-[#AA5D53] flex items-center justify-center flex-shrink-0">
//             <Trash2 className="w-4 h-4 text-white" />
//           </div>
//           <div className="min-w-0">
//             <p className="font-semibold text-[#AA5D53] text-sm">Exit Bin</p>
//             <p className="text-xs text-muted-foreground">Things you're choosing to leave behind</p>
//           </div>
//           {state.exitNotes.length > 0 && (
//             <span className="ml-auto text-xs text-muted-foreground bg-white border rounded-full px-2 py-0.5 flex-shrink-0">
//               {state.exitNotes.length}
//             </span>
//           )}
//         </div>
//         {state.exitNotes.length === 0 ? (
//           <div className="flex items-center justify-center h-24 text-muted-foreground text-sm italic">
//             {canEdit ? "Add notes above to fill the Exit Bin..." : "Waiting for participant to add notes..."}
//           </div>
//         ) : (
//           <div className="flex flex-wrap gap-3">
//             {state.exitNotes.map(note => (
//               <NoteCard
//                 key={note.id} note={note} canEdit={canEdit} draggable={false}
//                 editingId={editor.editingId} editText={editor.editText}
//                 onEditStart={() => editor.startEdit(note.id, note.text)}
//                 onEditChange={editor.setEditText} onEditSave={() => saveEdit(note.id)}
//                 onEditCancel={editor.cancelEdit} onDelete={() => deleteNote(note.id)}
//               />
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // ─── Step 3: Discovery Landscape ──────────────────────────────────────────────

// const DISCOVERY_ZONES = [
//   { id: "admire", label: "Lives You Admire", color: "#4A1C5C" },
//   { id: "miss", label: "Lives You Miss", color: "#AA5D53" },
//   { id: "curious", label: "Lives You're Curious About", color: "#3D6D6C" },
// ];

// function Step3Discovery({ state, onChange, canEdit }: {
//   state: BoardState["step3"];
//   onChange: (s: BoardState["step3"]) => void;
//   canEdit: boolean;
// }) {
//   const editor = useNoteEditor();

//   const { draggingId, overZone, startDrag } = useTouchDnD((noteId, zone) => {
//     const target = zone === "unplaced" ? null : zone;
//     onChange({ stickyNotes: state.stickyNotes.map(n => n.id === noteId ? { ...n, zone: target } : n) });
//   });

//   const addNote = (text: string) => {
//     onChange({
//       stickyNotes: [...state.stickyNotes, {
//         id: crypto.randomUUID(), text, zone: null,
//         color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)], rotation: (Math.random() * 4) - 2,
//       }],
//     });
//   };

//   const deleteNote = (id: string) => onChange({ stickyNotes: state.stickyNotes.filter(n => n.id !== id) });
//   const saveEdit = (id: string) => {
//     onChange({ stickyNotes: state.stickyNotes.map(n => n.id === id ? { ...n, text: editor.editText } : n) });
//     editor.cancelEdit();
//   };

//   const unplaced = state.stickyNotes.filter(n => !n.zone);

//   const noteCard = (note: StickyNote) => (
//     <NoteCard
//       key={note.id} note={note} canEdit={canEdit} isDragging={draggingId === note.id}
//       onPointerDown={(e) => startDrag(note.id, note.text, e)}
//       editingId={editor.editingId} editText={editor.editText}
//       onEditStart={() => editor.startEdit(note.id, note.text)}
//       onEditChange={editor.setEditText} onEditSave={() => saveEdit(note.id)}
//       onEditCancel={editor.cancelEdit} onDelete={() => deleteNote(note.id)}
//     />
//   );

//   return (
//     <div className="space-y-4">
//       {canEdit && <NoteInput placeholder="Write a sticky note, then drag it into a zone..." onAdd={addNote} />}

//       {unplaced.length > 0 && (
//         <div data-dropzone="unplaced" className={`min-h-14 p-3 rounded-xl border-2 border-dashed transition-all ${overZone === "unplaced" ? "border-[#D4A843] bg-[#EBE2D6]" : "border-border"}`}>
//           <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide pointer-events-none">
//             Unplaced — drag into a zone
//           </p>
//           <div className="flex flex-wrap gap-2">{unplaced.map(noteCard)}</div>
//         </div>
//       )}

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
//         {DISCOVERY_ZONES.map(zone => {
//           const zoneNotes = state.stickyNotes.filter(n => n.zone === zone.id);
//           return (
//             <DropZone key={zone.id} id={zone.id} label={zone.label} count={zoneNotes.length} isOver={overZone === zone.id}>
//               {zoneNotes.map(noteCard)}
//               {zoneNotes.length === 0 && <p className="text-xs text-muted-foreground italic pointer-events-none">Drop sticky notes here</p>}
//             </DropZone>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// // ─── Step 4: Deck of Recognition ──────────────────────────────────────────────

// function Step4DeckOfRecognition({ state, onChange }: {
//   state: BoardState["step4"];
//   onChange: (s: BoardState["step4"]) => void;
// }) {
//   const toggle = (roleId: string) => {
//     const selected = state.selectedRoles.includes(roleId)
//       ? state.selectedRoles.filter(id => id !== roleId)
//       : [...state.selectedRoles, roleId];
//     onChange({ selectedRoles: selected });
//   };

//   return (
//     <div className="space-y-4">
//       <div className="text-center">
//         <p className="text-muted-foreground max-w-lg mx-auto text-sm">
//           Select roles that feel like possibilities for your future self. Tap the circle to select or deselect.
//         </p>
//         {state.selectedRoles.length > 0 && (
//           <span className="inline-block mt-2 text-xs text-[#4A1C5C] font-semibold bg-[#4A1C5C]/10 px-3 py-1 rounded-full">
//             {state.selectedRoles.length} selected
//           </span>
//         )}
//       </div>
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//         {ROLE_CARDS.map(role => {
//           const selected = state.selectedRoles.includes(role.id);
//           return (
//             <div key={role.id} className="flex items-center gap-3">
//               {/* Rectangle role card — always visible, never replaced */}
//               <div className={`flex-1 min-w-0 px-4 py-3 rounded-xl border-2 transition-all ${selected ? "border-[#4A1C5C] bg-[#4A1C5C]/6" : "border-gray-200 bg-white"}`}>
//                 <p className={`font-bold text-sm leading-tight ${selected ? "text-[#4A1C5C]" : "text-foreground"}`}>{role.label}</p>
//                 <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{role.description}</p>
//               </div>
//               {/* Circle selector — beside the card, not replacing it */}
//               <button
//                 onClick={() => toggle(role.id)}
//                 className={`
//                   w-11 h-11 sm:w-12 sm:h-12 rounded-full border-[3px] flex-shrink-0 flex items-center justify-center transition-all
//                   ${selected ? "border-[#4A1C5C] bg-[#4A1C5C] shadow-lg scale-110" : "border-gray-300 bg-white hover:border-[#4A1C5C]/60"}
//                 `}
//               >
//                 {selected && <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
//               </button>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// // ─── Step 5: Dinner Table ─────────────────────────────────────────────────────

// function RoleNoteCol({ role, notes, onAdd, onEdit, onDelete, canEdit }: {
//   role: typeof ROLE_CARDS[0];
//   notes: StickyNote[];
//   onAdd: (text: string) => void;
//   onEdit: (noteId: string, text: string) => void;
//   onDelete: (noteId: string) => void;
//   canEdit: boolean;
// }) {
//   const [inp, setInp] = useState("");
//   const editor = useNoteEditor();
//   const add = () => { if (!inp.trim()) return; onAdd(inp.trim()); setInp(""); };

//   return (
//     <div className="flex flex-col items-center gap-2 w-36 sm:w-44 flex-shrink-0">
//       <div className="px-3 py-2 rounded-xl font-semibold text-white text-xs text-center w-full leading-tight" style={{ backgroundColor: "#4A1C5C" }}>
//         {role.label}
//       </div>
//       <div className="w-full space-y-1.5">
//         {notes.map(note => (
//           <div key={note.id} className="group relative rounded-lg p-2 shadow-sm" style={{ backgroundColor: note.color }}>
//             {editor.editingId === note.id ? (
//               <div className="space-y-1">
//                 <textarea autoFocus value={editor.editText} onChange={(e) => editor.setEditText(e.target.value)}
//                   rows={2} className="w-full bg-transparent resize-none text-xs border-b border-black/20 focus:outline-none"
//                   onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onEdit(note.id, editor.editText); editor.cancelEdit(); } if (e.key === "Escape") editor.cancelEdit(); }}
//                 />
//                 <button onClick={() => { onEdit(note.id, editor.editText); editor.cancelEdit(); }} className="text-[10px] px-2 py-0.5 bg-black/10 rounded">Save</button>
//               </div>
//             ) : (
//               <>
//                 <p className="text-xs text-gray-800 leading-snug break-words">{note.text}</p>
//                 {canEdit && (
//                   <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-0.5">
//                     <button onClick={() => editor.startEdit(note.id, note.text)} className="w-4 h-4 bg-white/80 rounded flex items-center justify-center"><Pencil className="w-2 h-2 text-gray-600" /></button>
//                     <button onClick={() => onDelete(note.id)} className="w-4 h-4 bg-white/80 rounded flex items-center justify-center"><X className="w-2 h-2 text-[#AA5D53]" /></button>
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         ))}
//         {canEdit && (
//           <div className="flex gap-1">
//             <input type="text" value={inp} onChange={(e) => setInp(e.target.value)} placeholder="Add theme..."
//               className="flex-1 min-w-0 text-[11px] border border-border rounded-md px-2 py-1 bg-white focus:outline-none"
//               onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
//             />
//             <button onClick={add} className="w-6 h-6 rounded-md bg-[#D4A843] text-[#2C1810] flex items-center justify-center hover:bg-[#C49835] flex-shrink-0">
//               <Plus className="w-3 h-3" />
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// function Step5DinnerTable({ state, onChange, canEdit, selectedRoles }: {
//   state: BoardState["step5"];
//   onChange: (s: BoardState["step5"]) => void;
//   canEdit: boolean;
//   selectedRoles: string[];
// }) {
//   const roles = ROLE_CARDS.filter(r => selectedRoles.includes(r.id));

//   const addNote = (roleId: string, text: string) => {
//     const note: StickyNote = { id: crypto.randomUUID(), text, zone: roleId, color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)] };
//     onChange({ roleNotes: { ...state.roleNotes, [roleId]: [...(state.roleNotes[roleId] || []), note] } });
//   };
//   const editNote = (roleId: string, noteId: string, text: string) => {
//     onChange({ roleNotes: { ...state.roleNotes, [roleId]: (state.roleNotes[roleId] || []).map(n => n.id === noteId ? { ...n, text } : n) } });
//   };
//   const deleteNote = (roleId: string, noteId: string) => {
//     onChange({ roleNotes: { ...state.roleNotes, [roleId]: (state.roleNotes[roleId] || []).filter(n => n.id !== noteId) } });
//   };

//   if (roles.length === 0) {
//     return (
//       <div className="text-center py-12 text-muted-foreground">
//         <p>No roles selected in Step 4.</p>
//         <p className="text-sm mt-1">Go back and select roles from the Deck of Recognition.</p>
//       </div>
//     );
//   }

//   const half = Math.ceil(roles.length / 2);
//   const topRoles = roles.slice(0, half);
//   const bottomRoles = roles.slice(half);

//   return (
//     <div className="space-y-4">
//       <div className="bg-[#4A1C5C]/6 border border-[#4A1C5C]/20 rounded-xl p-3 sm:p-4 text-center">
//         <p className="text-[#4A1C5C] font-semibold italic text-sm sm:text-base" style={{ fontFamily: "Playfair Display, serif" }}>
//           "If these people were sitting at a dinner table, what would they be talking about?"
//         </p>
//       </div>

//       {/* Desktop: roles above/below table. Mobile: scrollable horizontal rows */}
//       <div className="hidden md:block">
//         {/* Top roles */}
//         <div className="flex gap-4 justify-center flex-wrap mb-4">
//           {topRoles.map(role => (
//             <RoleNoteCol key={role.id} role={role} notes={state.roleNotes[role.id] || []}
//               onAdd={(t) => addNote(role.id, t)} onEdit={(id, t) => editNote(role.id, id, t)}
//               onDelete={(id) => deleteNote(role.id, id)} canEdit={canEdit} />
//           ))}
//         </div>

//         {/* Table */}
//         <div className="flex justify-center my-2">
//           <div className="relative flex items-center justify-center shadow-2xl" style={{ width: 280, height: 96, borderRadius: "50%", background: "linear-gradient(160deg,#A0753A 0%,#7A5320 50%,#5C3D15 100%)", border: "5px solid #8B6520" }}>
//             <div className="absolute top-4 left-1/2 -translate-x-1/2 w-44 h-8 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
//             <div className="text-center z-10">
//               <p className="text-amber-100 text-sm font-semibold tracking-wide">🍽️ Dinner Table</p>
//             </div>
//           </div>
//         </div>

//         {/* Bottom roles */}
//         {bottomRoles.length > 0 && (
//           <div className="flex gap-4 justify-center flex-wrap mt-4">
//             {bottomRoles.map(role => (
//               <RoleNoteCol key={role.id} role={role} notes={state.roleNotes[role.id] || []}
//                 onAdd={(t) => addNote(role.id, t)} onEdit={(id, t) => editNote(role.id, id, t)}
//                 onDelete={(id) => deleteNote(role.id, id)} canEdit={canEdit} />
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Mobile: compact vertical list per role */}
//       <div className="md:hidden space-y-4">
//         <div className="flex items-center justify-center">
//           <div className="flex items-center justify-center shadow-lg" style={{ width: 200, height: 64, borderRadius: "50%", background: "linear-gradient(160deg,#A0753A 0%,#7A5320 100%)", border: "4px solid #8B6520" }}>
//             <p className="text-amber-100 text-xs font-semibold">🍽️ Dinner Table</p>
//           </div>
//         </div>
//         {roles.map(role => (
//           <div key={role.id} className="bg-white rounded-xl border border-border p-4">
//             <div className="px-3 py-2 rounded-lg font-semibold text-white text-sm mb-3 inline-block" style={{ backgroundColor: "#4A1C5C" }}>
//               {role.label}
//             </div>
//             <div className="flex flex-wrap gap-2 mb-3">
//               {(state.roleNotes[role.id] || []).map(note => (
//                 <div key={note.id} className="group relative rounded-lg p-2 shadow-sm" style={{ backgroundColor: note.color }}>
//                   <p className="text-xs text-gray-800">{note.text}</p>
//                   {canEdit && (
//                     <button onClick={() => deleteNote(role.id, note.id)} className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow hidden group-hover:flex">
//                       <X className="w-2 h-2 text-[#AA5D53]" />
//                     </button>
//                   )}
//                 </div>
//               ))}
//             </div>
//             {canEdit && (
//               <div className="flex gap-2">
//                 <input type="text" placeholder="Add theme..." className="flex-1 text-sm border border-border rounded-lg px-3 py-2 focus:outline-none"
//                   onKeyDown={(e) => { if (e.key === "Enter") { addNote(role.id, (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ""; } }}
//                 />
//                 <button className="px-3 py-2 bg-[#D4A843] text-[#2C1810] rounded-lg text-sm font-medium" onClick={(e) => {
//                   const inp = (e.currentTarget.previousSibling as HTMLInputElement);
//                   if (inp.value.trim()) { addNote(role.id, inp.value.trim()); inp.value = ""; }
//                 }}>
//                   <Plus className="w-4 h-4" />
//                 </button>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>

//       <p className="text-center text-xs text-muted-foreground">
//         Examples: Impact · Purpose · Meaning · Freedom · Teaching · Creativity · Legacy
//       </p>
//     </div>
//   );
// }

// // ─── Step 6: Grounding vs Draining ────────────────────────────────────────────

// function Step6GroundingDraining({ state, onChange, canEdit, selectedRoles }: {
//   state: BoardState["step6"];
//   onChange: (s: BoardState["step6"]) => void;
//   canEdit: boolean;
//   selectedRoles: string[];
// }) {
//   const roles = ROLE_CARDS.filter(r => selectedRoles.includes(r.id));

//   const { draggingId, overZone, startDrag } = useTouchDnD((roleId, zone) => {
//     if (!canEdit) return;
//     const target = zone === "unplaced" ? null : zone;
//     onChange({ roleZones: { ...state.roleZones, [roleId]: target } });
//   });

//   if (roles.length === 0) {
//     return <div className="text-center py-12 text-muted-foreground">No roles selected in Step 4. Go back and select roles to sort them here.</div>;
//   }

//   const RoleChip = ({ role }: { role: typeof ROLE_CARDS[0] }) => (
//     <div
//       style={{ touchAction: canEdit ? "none" : "auto", opacity: draggingId === role.id ? 0.4 : 1, userSelect: "none" }}
//       onPointerDown={canEdit ? (e) => startDrag(role.id, role.label, e) : undefined}
//       className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 bg-white text-sm font-medium text-foreground shadow-sm transition-all border-border ${canEdit ? "cursor-grab active:cursor-grabbing hover:border-[#4A1C5C]/50 hover:shadow-md" : "cursor-default"}`}
//     >
//       {canEdit && <GripVertical className="w-3 h-3 text-muted-foreground flex-shrink-0 pointer-events-none" />}
//       <span className="pointer-events-none">{role.label}</span>
//     </div>
//   );

//   const unplaced = roles.filter(r => !state.roleZones[r.id]);
//   const grounding = roles.filter(r => state.roleZones[r.id] === "grounding");
//   const draining = roles.filter(r => state.roleZones[r.id] === "draining");

//   return (
//     <div className="space-y-4">
//       <p className="text-center text-sm text-muted-foreground">
//         Drag each role into Grounding or Draining based on how it feels.
//       </p>

//       {unplaced.length > 0 && (
//         <div data-dropzone="unplaced" className={`min-h-14 p-3 rounded-xl border-2 border-dashed transition-all ${overZone === "unplaced" ? "border-[#D4A843] bg-[#EBE2D6]" : "border-border"}`}>
//           <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium pointer-events-none">Drag to sort below</p>
//           <div className="flex flex-wrap gap-2">{unplaced.map(r => <RoleChip key={r.id} role={r} />)}</div>
//         </div>
//       )}

//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//         <div
//           data-dropzone="grounding"
//           className={`min-h-40 p-4 rounded-xl border-2 transition-all duration-150 ${overZone === "grounding" ? "border-[#3D6D6C] bg-[#3D6D6C]/12 shadow-lg scale-[1.01]" : "border-[#3D6D6C]/40 bg-[#3D6D6C]/5"}`}
//         >
//           <div className="flex items-center gap-3 mb-3 pointer-events-none">
//             <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#3D6D6C] flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">G</div>
//             <div>
//               <h4 className="font-semibold text-[#3D6D6C] text-sm">Grounding</h4>
//               <p className="text-xs text-muted-foreground">Energises and sustains you</p>
//             </div>
//           </div>
//           <div className="flex flex-wrap gap-2">
//             {grounding.map(r => <RoleChip key={r.id} role={r} />)}
//             {grounding.length === 0 && <p className="text-xs text-muted-foreground italic pointer-events-none">Drop roles here</p>}
//           </div>
//         </div>

//         <div
//           data-dropzone="draining"
//           className={`min-h-40 p-4 rounded-xl border-2 transition-all duration-150 ${overZone === "draining" ? "border-[#AA5D53] bg-[#AA5D53]/12 shadow-lg scale-[1.01]" : "border-[#AA5D53]/40 bg-[#AA5D53]/5"}`}
//         >
//           <div className="flex items-center gap-3 mb-3 pointer-events-none">
//             <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#AA5D53] flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">D</div>
//             <div>
//               <h4 className="font-semibold text-[#AA5D53] text-sm">Draining</h4>
//               <p className="text-xs text-muted-foreground">Feels heavy or misaligned</p>
//             </div>
//           </div>
//           <div className="flex flex-wrap gap-2">
//             {draining.map(r => <RoleChip key={r.id} role={r} />)}
//             {draining.length === 0 && <p className="text-xs text-muted-foreground italic pointer-events-none">Drop roles here</p>}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Step 7: Recognition Word ──────────────────────────────────────────────────

// function Step7RecognitionWord({ state, onChange, canEdit, boardState }: {
//   state: BoardState["step7"];
//   onChange: (s: BoardState["step7"]) => void;
//   canEdit: boolean;
//   boardState: BoardState;
// }) {
//   const [newWord, setNewWord] = useState("");
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [editText, setEditText] = useState("");

//   const addWord = () => {
//     if (!newWord.trim()) return;
//     onChange({ recognitionWords: [...state.recognitionWords, { id: crypto.randomUUID(), word: newWord.trim() }] });
//     setNewWord("");
//   };

//   const groundingRoles = ROLE_CARDS.filter(r =>
//     boardState.step4.selectedRoles.includes(r.id) && boardState.step6.roleZones[r.id] === "grounding"
//   );

//   return (
//     <div className="space-y-4 sm:space-y-5">
//       <div className="bg-[#4A1C5C]/6 border border-[#4A1C5C]/20 rounded-xl p-3 sm:p-4 text-center">
//         <p className="text-[#4A1C5C] font-semibold italic text-base sm:text-lg" style={{ fontFamily: "Playfair Display, serif" }}>
//           "What word connects them all?"
//         </p>
//         <p className="text-xs sm:text-sm text-muted-foreground mt-1">What single word captures your emerging future self?</p>
//       </div>

//       {groundingRoles.length > 0 && (
//         <div className="bg-[#EBE2D6]/60 rounded-xl p-3 sm:p-4">
//           <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">Your Grounding Roles</p>
//           <div className="flex flex-wrap gap-2">
//             {groundingRoles.map(r => <span key={r.id} className="px-3 py-1 bg-[#3D6D6C] text-white text-xs sm:text-sm rounded-full">{r.label}</span>)}
//           </div>
//         </div>
//       )}

//       {canEdit && (
//         <div className="flex gap-2">
//           <input type="text" value={newWord} onChange={(e) => setNewWord(e.target.value)}
//             placeholder="e.g. Impact, Purpose, Creativity, Freedom..."
//             className="flex-1 rounded-lg border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A1C5C]/25"
//             onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addWord(); } }}
//           />
//           <button onClick={addWord} className="px-3 py-2 bg-[#D4A843] text-[#2C1810] rounded-lg font-medium text-sm hover:bg-[#C49835] transition-colors flex items-center gap-1 flex-shrink-0">
//             <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add</span>
//           </button>
//         </div>
//       )}

//       {state.recognitionWords.length === 0 ? (
//         <div className="text-center py-10 text-muted-foreground text-sm italic">
//           {canEdit ? "Add your recognition words above..." : "Waiting for recognition words..."}
//         </div>
//       ) : (
//         <div className="flex flex-wrap gap-3 sm:gap-4 justify-center py-4">
//           {state.recognitionWords.map(item => (
//             <div key={item.id} className="group relative">
//               {editingId === item.id ? (
//                 <div className="flex gap-2 items-center">
//                   <input autoFocus type="text" value={editText} onChange={(e) => setEditText(e.target.value)}
//                     className="px-4 py-2 rounded-full border-2 border-[#4A1C5C] text-[#4A1C5C] font-bold text-lg focus:outline-none"
//                     onKeyDown={(e) => { if (e.key === "Enter") { onChange({ recognitionWords: state.recognitionWords.map(w => w.id === item.id ? { ...w, word: editText } : w) }); setEditingId(null); } if (e.key === "Escape") setEditingId(null); }}
//                   />
//                   <button onClick={() => { onChange({ recognitionWords: state.recognitionWords.map(w => w.id === item.id ? { ...w, word: editText } : w) }); setEditingId(null); }} className="text-xs px-2 py-1 bg-[#4A1C5C] text-white rounded-lg">Save</button>
//                 </div>
//               ) : (
//                 <div className="relative px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-full bg-[#4A1C5C] text-white font-bold text-xl sm:text-2xl shadow-lg" style={{ fontFamily: "Playfair Display, serif" }}>
//                   {item.word}
//                   {canEdit && (
//                     <span className="absolute -top-2 -right-2 hidden group-hover:flex gap-1">
//                       <button onClick={() => { setEditingId(item.id); setEditText(item.word); }} className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow text-[#4A1C5C]"><Pencil className="w-2.5 h-2.5" /></button>
//                       <button onClick={() => onChange({ recognitionWords: state.recognitionWords.filter(w => w.id !== item.id) })} className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow text-[#AA5D53]"><X className="w-2.5 h-2.5" /></button>
//                     </span>
//                   )}
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       )}

//       {state.recognitionWords.length > 0 && (
//         <div className="bg-gradient-to-r from-[#4A1C5C]/8 to-[#3D6D6C]/8 rounded-xl p-4 sm:p-5 border border-[#4A1C5C]/15">
//           <h4 className="font-semibold text-[#4A1C5C] mb-2 sm:mb-3 text-sm sm:text-base" style={{ fontFamily: "Playfair Display, serif" }}>Session 1 Outcomes</h4>
//           <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
//             <p><span className="font-medium text-foreground">Identity cards:</span> {boardState.step1.selectedCards.length}</p>
//             <p><span className="font-medium text-foreground">Exit bin notes:</span> {boardState.step2.exitNotes.length}</p>
//             <p><span className="font-medium text-foreground">Discovery notes:</span> {boardState.step3.stickyNotes.length}</p>
//             <p><span className="font-medium text-foreground">Future roles:</span> {boardState.step4.selectedRoles.length}</p>
//             <p><span className="font-medium text-foreground">Grounding roles:</span> {groundingRoles.map(r => r.label).join(", ") || "None"}</p>
//             <p className="font-semibold text-[#4A1C5C] text-sm sm:text-base mt-1">
//               Recognition: {state.recognitionWords.map(w => w.word).join(" · ")}
//             </p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── Main Session1Board ────────────────────────────────────────────────────────

// export default function Session1Board() {
//   const { sessionId } = useParams<{ sessionId: string }>();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const isParticipant = location.pathname.startsWith("/participant");
//   const role = isParticipant ? "participant" : "facilitator";
//   const dashboardPath = isParticipant ? "/participant/dashboard" : "/facilitator/dashboard";

//   const [boardState, setBoardState] = useState<BoardState>(DEFAULT_STATE);
//   const [loading, setLoading] = useState(true);
//   const [connected, setConnected] = useState(false);
//   const [peerConnected, setPeerConnected] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [lastSaved, setLastSaved] = useState<Date | null>(null);
//   const [sessionInfo, setSessionInfo] = useState<any>(null);
//   const [endingSession, setEndingSession] = useState(false);

//   const channelRef = useRef<any>(null);
//   const saveTimerRef = useRef<any>(null);
//   const stateRef = useRef(boardState);
//   stateRef.current = boardState;

//   useEffect(() => {
//     if (!sessionId) return;
//     (async () => {
//       try {
//         const [sr, br] = await Promise.all([
//           fetch(`${API}/sessions/${sessionId}`, { headers: HEADERS }),
//           fetch(`${API}/sessions/${sessionId}/board`, { headers: HEADERS }),
//         ]);
//         if (sr.ok) setSessionInfo(await sr.json());
//         if (br.ok) {
//           const d = await br.json();
//           if (d.state) setBoardState(migrateState(d.state));
//         }
//       } catch { toast.error("Failed to load session board."); }
//       finally { setLoading(false); }
//     })();
//   }, [sessionId]);

//   useEffect(() => {
//     if (!sessionId) return;
//     const supabase = createClient();
//     const ch = supabase.channel(`session:${sessionId}`, {
//       config: { broadcast: { self: false }, presence: { key: role } },
//     });
//     ch
//       .on("broadcast", { event: "board_update" }, ({ payload }: any) => {
//         if (payload?.state) setBoardState(migrateState(payload.state));
//       })
//       .on("presence", { event: "sync" }, () => {
//         const ps = ch.presenceState();
//         const roles = Object.values(ps).flat().map((p: any) => p.role);
//         setPeerConnected(roles.some((r: string) => r !== role));
//       })
//       .on("presence", { event: "join" }, ({ newPresences }: any) => {
//         if (newPresences.some((p: any) => p.role !== role))
//           toast.success(isParticipant ? "Facilitator joined" : "Participant joined");
//       })
//       .on("presence", { event: "leave" }, ({ leftPresences }: any) => {
//         if (leftPresences.some((p: any) => p.role !== role))
//           toast.info(isParticipant ? "Facilitator disconnected" : "Participant disconnected");
//       })
//       .subscribe(async (status: string) => {
//         if (status === "SUBSCRIBED") {
//           setConnected(true);
//           await ch.track({ role, joinedAt: new Date().toISOString() });
//         } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
//           setConnected(false);
//         }
//       });
//     channelRef.current = ch;
//     return () => { ch.unsubscribe(); };
//   }, [sessionId, role]);

//   const updateBoardState = useCallback((updater: (prev: BoardState) => BoardState) => {
//     setBoardState(prev => {
//       const next = updater(prev);
//       channelRef.current?.send({ type: "broadcast", event: "board_update", payload: { state: next } });
//       if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
//       saveTimerRef.current = setTimeout(async () => {
//         setSaving(true);
//         try {
//           await fetch(`${API}/sessions/${sessionId}/board`, { method: "PUT", headers: HEADERS, body: JSON.stringify({ state: next }) });
//           setLastSaved(new Date());
//         } catch { /* retry next save */ }
//         finally { setSaving(false); }
//       }, 1200);
//       return next;
//     });
//   }, [sessionId]);

//   const goToStep = (step: number) => {
//     if (step < 1 || step > TOTAL_STEPS) return;
//     updateBoardState(p => ({ ...p, currentStep: step }));
//   };

//   const endSession = async () => {
//     if (!window.confirm("End this session? The board will be saved and marked as complete.")) return;
//     setEndingSession(true);
//     try {
//       await fetch(`${API}/sessions/${sessionId}/board`, { method: "PUT", headers: HEADERS, body: JSON.stringify({ state: stateRef.current }) });
//       await fetch(`${API}/sessions/${sessionId}/status`, { method: "PUT", headers: HEADERS, body: JSON.stringify({ status: "completed" }) });
//       toast.success("Session ended and saved.");
//       navigate(dashboardPath);
//     } catch { toast.error("Failed to end session."); }
//     finally { setEndingSession(false); }
//   };

//   const canNavigate = !isParticipant;
//   const currentStep = boardState.currentStep;
//   const stepInfo = STEPS[currentStep - 1];

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[#EBE2D6] flex items-center justify-center">
//         <div className="text-center space-y-3">
//           <Loader2 className="w-8 h-8 animate-spin text-[#4A1C5C] mx-auto" />
//           <p className="text-muted-foreground text-sm">Loading session board...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-[#EBE2D6] flex flex-col overflow-x-hidden">
//       {/* ── Top bar ── */}
//       <div className="bg-white border-b border-border px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 shadow-sm flex-shrink-0">
//         <button onClick={() => navigate(dashboardPath)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
//           <ArrowLeft className="w-4 h-4" />
//           <span className="hidden sm:inline text-xs">Dashboard</span>
//         </button>

//         <div className="w-px h-4 bg-border flex-shrink-0" />

//         <div className="flex-1 min-w-0">
//           <div className="flex items-center gap-1.5 sm:gap-2">
//             <div className="w-5 h-5 rounded-full bg-[#4A1C5C] flex items-center justify-center flex-shrink-0">
//               <span className="text-white text-[9px] font-bold">Z</span>
//             </div>
//             <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
//               {sessionInfo?.journey?.title || "Zest Journey"}
//               <span className="text-muted-foreground font-normal hidden sm:inline"> — Session 1</span>
//             </p>
//           </div>
//         </div>

//         <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
//           <div className="flex items-center gap-1 text-xs">
//             {connected
//               ? <Wifi className="w-3 h-3 text-[#3D6D6C]" />
//               : <WifiOff className="w-3 h-3 text-[#AA5D53]" />}
//             <span className={`hidden sm:inline ${connected ? "text-[#3D6D6C]" : "text-[#AA5D53]"}`}>
//               {connected ? "Live" : "Offline"}
//             </span>
//           </div>
//           {peerConnected && (
//             <div className="flex items-center gap-1 text-xs text-[#3D6D6C] bg-[#3D6D6C]/10 px-1.5 sm:px-2 py-0.5 rounded-full">
//               <div className="w-1.5 h-1.5 rounded-full bg-[#3D6D6C] animate-pulse" />
//               <span className="hidden sm:inline">{isParticipant ? "Facilitator" : "Participant"}</span>
//             </div>
//           )}
//           {saving
//             ? <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" />Saving</div>
//             : lastSaved
//               ? <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground"><Save className="w-3 h-3" />Saved</div>
//               : null}
//           {!isParticipant && (
//             <button onClick={endSession} disabled={endingSession} className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-[#AA5D53] text-white text-xs rounded-lg hover:bg-[#934D45] transition-colors">
//               {endingSession && <Loader2 className="w-3 h-3 animate-spin" />}
//               <span className="hidden sm:inline">End Session</span>
//               <span className="sm:hidden">End</span>
//             </button>
//           )}
//         </div>
//       </div>

//       {/* ── Progress bar ── */}
//       <div className="bg-white border-b border-border px-3 sm:px-4 py-2 flex-shrink-0">
//         <div className="max-w-5xl mx-auto flex items-center gap-1">
//           {STEPS.map(step => (
//             <button
//               key={step.number}
//               onClick={() => canNavigate && goToStep(step.number)}
//               title={step.title}
//               className={`flex-1 h-1.5 rounded-full transition-all ${currentStep === step.number ? "bg-[#4A1C5C]" : currentStep > step.number ? "bg-[#3D6D6C]" : "bg-border"} ${canNavigate ? "cursor-pointer hover:opacity-75" : "cursor-default"}`}
//             />
//           ))}
//         </div>
//         <div className="max-w-5xl mx-auto mt-1.5 flex items-center justify-between">
//           <span className="text-xs text-muted-foreground truncate">
//             Step {currentStep}/{TOTAL_STEPS} — <span className="font-semibold text-foreground">{stepInfo.title}</span>
//           </span>
//           <span className="text-xs text-muted-foreground hidden sm:block">{stepInfo.subtitle}</span>
//         </div>
//       </div>

//       {/* ── Step content ── */}
//       <div className="flex-1 overflow-auto overflow-x-hidden">
//         <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
//           <AnimatePresence mode="wait">
//             <motion.div key={currentStep} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
//               <div className="mb-4 sm:mb-5">
//                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#4A1C5C]/10 rounded-full mb-2 sm:mb-3">
//                   <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#4A1C5C] text-white text-[10px] sm:text-xs flex items-center justify-center font-bold">{currentStep}</span>
//                   <span className="text-xs font-medium text-[#4A1C5C]">{stepInfo.subtitle}</span>
//                 </div>
//                 <h2 className="text-xl sm:text-2xl" style={{ fontFamily: "Playfair Display, serif", color: "#4A1C5C" }}>{stepInfo.title}</h2>
//               </div>

//               <div className="bg-white rounded-2xl shadow-sm border border-border p-4 sm:p-5 lg:p-7">
//                 {currentStep === 1 && <Step1BookOfLife state={boardState.step1} onChange={s => updateBoardState(p => ({ ...p, step1: s }))} />}
//                 {currentStep === 2 && <Step2ExitBin state={boardState.step2} onChange={s => updateBoardState(p => ({ ...p, step2: s }))} canEdit={true} />}
//                 {currentStep === 3 && <Step3Discovery state={boardState.step3} onChange={s => updateBoardState(p => ({ ...p, step3: s }))} canEdit={true} />}
//                 {currentStep === 4 && <Step4DeckOfRecognition state={boardState.step4} onChange={s => updateBoardState(p => ({ ...p, step4: s }))} />}
//                 {currentStep === 5 && <Step5DinnerTable state={boardState.step5} onChange={s => updateBoardState(p => ({ ...p, step5: s }))} canEdit={true} selectedRoles={boardState.step4.selectedRoles} />}
//                 {currentStep === 6 && <Step6GroundingDraining state={boardState.step6} onChange={s => updateBoardState(p => ({ ...p, step6: s }))} canEdit={true} selectedRoles={boardState.step4.selectedRoles} />}
//                 {currentStep === 7 && <Step7RecognitionWord state={boardState.step7} onChange={s => updateBoardState(p => ({ ...p, step7: s }))} canEdit={true} boardState={boardState} />}
//               </div>
//             </motion.div>
//           </AnimatePresence>
//         </div>
//       </div>

//       {/* ── Bottom navigation ── */}
//       <div className="bg-white border-t border-border px-3 sm:px-4 py-2.5 sm:py-3 flex-shrink-0">
//         <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
//           <button
//             onClick={() => goToStep(currentStep - 1)}
//             disabled={currentStep === 1}
//             className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex-shrink-0 ${currentStep === 1 ? "text-muted-foreground cursor-not-allowed opacity-40" : "text-foreground hover:bg-[#EBE2D6] border border-border"}`}
//           >
//             <ChevronLeft className="w-4 h-4" />
//             <span className="hidden sm:inline">Previous</span>
//           </button>

//           <div className="flex items-center gap-1">
//             {STEPS.map(step => (
//               <button key={step.number} onClick={() => canNavigate && goToStep(step.number)}
//                 className={`h-2 rounded-full transition-all ${currentStep === step.number ? "bg-[#4A1C5C] w-5" : currentStep > step.number ? "bg-[#3D6D6C] w-2" : "bg-border w-2"} ${canNavigate ? "cursor-pointer" : "cursor-default"}`} />
//             ))}
//           </div>

//           {currentStep < TOTAL_STEPS ? (
//             <button
//               onClick={() => goToStep(currentStep + 1)}
//               className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#4A1C5C] text-white hover:bg-[#3A1C4C] transition-all flex-shrink-0"
//             >
//               <span className="hidden sm:inline">Next</span>
//               <ChevronRight className="w-4 h-4" />
//             </button>
//           ) : !isParticipant ? (
//             <button
//               onClick={endSession}
//               disabled={endingSession}
//               className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#3D6D6C] text-white hover:bg-[#2C5958] transition-all flex-shrink-0"
//             >
//               {endingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
//               <span className="hidden sm:inline">Complete</span>
//             </button>
//           ) : (
//             <div className="w-16 text-center text-xs text-muted-foreground">Done</div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useNavigate, useLocation, useParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { createClient } from "../../../utils/supabase/client";
import { getAuthHeaders } from "../../../utils/supabase/api";
import { projectId } from "../../../utils/supabase/info";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Wifi,
  WifiOff,
  Save,
  CheckCircle,
  Plus,
  X,
  Pencil,
  GripVertical,
  Loader2,
  Trash2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StickyNote {
  id: string;
  text: string;
  zone: string | null;
  color: string;
  rotation?: number;
}

interface RecognitionWord {
  id: string;
  word: string;
}

interface BoardState {
  currentStep: number;
  step1: {
    selectedCards: string[];
  };
  step2: {
    exitNotes: StickyNote[];
  };
  step3: {
    stickyNotes: StickyNote[];
  };
  step4: {
    selectedRoles: string[];
  };
  step5: {
    roleNotes: Record<string, StickyNote[]>;
  };
  step6: {
    roleZones: Record<string, string | null>;
  };
  step7: {
    recognitionWords: RecognitionWord[];
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;

const NOTE_COLORS = [
  "#FFF176",
  "#CCFF90",
  "#FFCCBC",
  "#B3E5FC",
  "#E1BEE7",
];

const IDENTITY_CARDS = [
  {
    id: "parent",
    label: "Parent / Grandparent",
    symbol: "🏡",
    desc: "Nurturing & family",
  },
  {
    id: "professional",
    label: "Professional",
    symbol: "💼",
    desc: "Career & expertise",
  },
  {
    id: "community_leader",
    label: "Community Leader",
    symbol: "🏛️",
    desc: "Civic & service",
  },
  {
    id: "creative",
    label: "Creative Soul",
    symbol: "🎨",
    desc: "Art & expression",
  },
  {
    id: "explorer",
    label: "Explorer / Adventurer",
    symbol: "🗺️",
    desc: "Discovery & travel",
  },
  {
    id: "mentor",
    label: "Mentor / Teacher",
    symbol: "📚",
    desc: "Guidance & learning",
  },
  {
    id: "entrepreneur",
    label: "Entrepreneur",
    symbol: "🚀",
    desc: "Building & ventures",
  },
  {
    id: "caregiver",
    label: "Caregiver / Nurturer",
    symbol: "❤️",
    desc: "Healing & support",
  },
  {
    id: "activist",
    label: "Activist",
    symbol: "✊",
    desc: "Change & justice",
  },
  {
    id: "spiritual",
    label: "Spiritual Person",
    symbol: "🕊️",
    desc: "Faith & inner life",
  },
  {
    id: "friend",
    label: "Friend / Companion",
    symbol: "🤝",
    desc: "Connection & loyalty",
  },
  {
    id: "learner",
    label: "Learner / Student",
    symbol: "🎓",
    desc: "Curiosity & growth",
  },
  {
    id: "artist",
    label: "Artist / Creator",
    symbol: "🎭",
    desc: "Performance & craft",
  },
  {
    id: "athlete",
    label: "Athlete / Active",
    symbol: "⚡",
    desc: "Movement & vitality",
  },
  {
    id: "nature",
    label: "Nature Lover",
    symbol: "🌿",
    desc: "Environment & outdoors",
  },
  {
    id: "philanthropist",
    label: "Philanthropist",
    symbol: "🌟",
    desc: "Giving & impact",
  },
];

const ROLE_CARDS = [
  {
    id: "entrepreneur",
    label: "Entrepreneur",
    description: "Building ventures from scratch",
  },
  {
    id: "executive_coach",
    label: "Executive Coach",
    description: "Empowering leaders to excel",
  },
  {
    id: "visiting_faculty",
    label: "Visiting Faculty",
    description: "Sharing expertise in academia",
  },
  {
    id: "venture_builder",
    label: "Learning / Venture Builder",
    description: "Exploring & building new ideas",
  },
  {
    id: "author",
    label: "Author / Writer",
    description: "Crafting stories & knowledge",
  },
  {
    id: "consultant",
    label: "Independent Consultant",
    description: "Advising organizations strategically",
  },
  {
    id: "advisor",
    label: "Advisor",
    description: "Guiding growth with experience",
  },
  {
    id: "volunteer",
    label: "Volunteer",
    description: "Creating change through service",
  },
  {
    id: "social_entrepreneur",
    label: "Social Entrepreneur",
    description: "Business with social impact",
  },
  {
    id: "speaker",
    label: "Speaker / Facilitator",
    description: "Inspiring through storytelling",
  },
  {
    id: "board_member",
    label: "Board Member",
    description: "Governing with wisdom",
  },
  {
    id: "mentor_role",
    label: "Mentor",
    description: "Nurturing others' potential",
  },
];

const STEPS = [
  {
    number: 1,
    title: "Book of Life",
    subtitle: "Select your life chapters",
  },
  {
    number: 2,
    title: "Exit Bin",
    subtitle: "What no longer works?",
  },
  {
    number: 3,
    title: "Discovery Landscape",
    subtitle: "Map what draws you forward",
  },
  {
    number: 4,
    title: "Deck of Recognition",
    subtitle: "Choose future identities",
  },
  {
    number: 5,
    title: "Dinner Table",
    subtitle: "What are they talking about?",
  },
  {
    number: 6,
    title: "Grounding vs Draining",
    subtitle: "Sort what energises you",
  },
  {
    number: 7,
    title: "Recognition Word",
    subtitle: "The word that unites your path",
  },
];

const TOTAL_STEPS = 7;

const DEFAULT_STATE: BoardState = {
  currentStep: 1,
  step1: {
    selectedCards: [],
  },
  step2: {
    exitNotes: [],
  },
  step3: {
    stickyNotes: [],
  },
  step4: {
    selectedRoles: [],
  },
  step5: {
    roleNotes: {},
  },
  step6: {
    roleZones: {},
  },
  step7: {
    recognitionWords: [],
  },
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getRandomNoteColor(): string {
  return NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
}

function getRandomRotation(): number {
  return Math.round((Math.random() * 4 - 2) * 10) / 10;
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

function migrateState(raw: unknown): BoardState {
  if (!isObject(raw)) {
    return { ...DEFAULT_STATE };
  }

  const rawState = raw as any;

  const selectedCards = Array.isArray(rawState.step1?.selectedCards)
    ? rawState.step1.selectedCards
    : [];

  let step2: BoardState["step2"];

  if (Array.isArray(rawState.step2?.exitNotes)) {
    step2 = {
      exitNotes: rawState.step2.exitNotes,
    };
  } else {
    step2 = {
      exitNotes: [],
    };
  }

  let step3: BoardState["step3"];

  if (Array.isArray(rawState.step3?.stickyNotes)) {
    step3 = {
      stickyNotes: rawState.step3.stickyNotes,
    };
  } else if (Array.isArray(rawState.step2?.stickyNotes)) {
    // Older board format
    step3 = {
      stickyNotes: rawState.step2.stickyNotes,
    };
  } else {
    step3 = {
      stickyNotes: [],
    };
  }

  let step4: BoardState["step4"];

  if (Array.isArray(rawState.step4?.selectedRoles)) {
    step4 = {
      selectedRoles: rawState.step4.selectedRoles,
    };
  } else if (Array.isArray(rawState.step3?.selectedRoles)) {
    // Older board format
    step4 = {
      selectedRoles: rawState.step3.selectedRoles,
    };
  } else {
    step4 = {
      selectedRoles: [],
    };
  }

  let step5: BoardState["step5"];

  if (isObject(rawState.step5?.roleNotes)) {
    step5 = {
      roleNotes: rawState.step5.roleNotes,
    };
  } else {
    step5 = {
      roleNotes: {},
    };
  }

  let step6: BoardState["step6"];

  if (isObject(rawState.step6?.roleZones)) {
    step6 = {
      roleZones: rawState.step6.roleZones,
    };
  } else if (isObject(rawState.step5?.roleZones)) {
    // Older board format
    step6 = {
      roleZones: rawState.step5.roleZones,
    };
  } else {
    step6 = {
      roleZones: {},
    };
  }

  let step7: BoardState["step7"];

  if (Array.isArray(rawState.step7?.recognitionWords)) {
    step7 = {
      recognitionWords: rawState.step7.recognitionWords,
    };
  } else if (Array.isArray(rawState.step6?.recognitionWords)) {
    // Older board format
    step7 = {
      recognitionWords: rawState.step6.recognitionWords,
    };
  } else {
    step7 = {
      recognitionWords: [],
    };
  }

  const currentStep =
    typeof rawState.currentStep === "number" &&
    rawState.currentStep >= 1 &&
    rawState.currentStep <= TOTAL_STEPS
      ? rawState.currentStep
      : 1;

  return {
    currentStep,
    step1: {
      selectedCards,
    },
    step2,
    step3,
    step4,
    step5,
    step6,
    step7,
  };
}

// ─── Touch / Pointer Drag & Drop ──────────────────────────────────────────────

interface UseTouchDnDResult {
  draggingId: string | null;
  overZone: string | null;
  startDrag: (
    itemId: string,
    label: string,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
}

function useTouchDnD(
  onDrop: (itemId: string, targetZone: string) => void,
  enabled = true,
): UseTouchDnDResult {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overZone, setOverZone] = useState<string | null>(null);

  const callbackRef = useRef(onDrop);
  callbackRef.current = onDrop;

  const startDrag = useCallback(
    (
      itemId: string,
      label: string,
      event: ReactPointerEvent<HTMLElement>,
    ) => {
      if (!enabled) return;

      event.preventDefault();

      const ghost = document.createElement("div");

      const shortLabel =
        label.length > 35 ? `${label.slice(0, 35)}…` : label;

      Object.assign(ghost.style, {
        position: "fixed",
        pointerEvents: "none",
        zIndex: "9999",
        padding: "8px 12px",
        background: "white",
        border: "2px solid #4A1C5C",
        borderRadius: "10px",
        fontSize: "12px",
        lineHeight: "1.4",
        boxShadow: "0 6px 20px rgba(0,0,0,0.22)",
        opacity: "0.92",
        maxWidth: "160px",
        wordBreak: "break-word",
        transform: "rotate(2deg) scale(1.04)",
      });

      ghost.textContent = shortLabel;
      document.body.appendChild(ghost);

      const positionGhost = (x: number, y: number) => {
        ghost.style.left = `${x - 80}px`;
        ghost.style.top = `${y - 30}px`;
      };

      const findDropZone = (
        x: number,
        y: number,
      ): string | null => {
        ghost.style.visibility = "hidden";

        const elements = document.elementsFromPoint(x, y);

        ghost.style.visibility = "visible";

        for (const element of elements) {
          const htmlElement = element as HTMLElement;
          const zone = htmlElement.dataset?.dropzone;

          if (zone) {
            return zone;
          }
        }

        return null;
      };

      const cleanup = () => {
        if (document.body.contains(ghost)) {
          document.body.removeChild(ghost);
        }

        setDraggingId(null);
        setOverZone(null);

        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onCancel);
      };

      const onMove = (moveEvent: PointerEvent) => {
        moveEvent.preventDefault();

        positionGhost(moveEvent.clientX, moveEvent.clientY);

        const zone = findDropZone(
          moveEvent.clientX,
          moveEvent.clientY,
        );

        setOverZone(zone);
      };

      const onUp = (upEvent: PointerEvent) => {
        const zone = findDropZone(
          upEvent.clientX,
          upEvent.clientY,
        );

        if (zone) {
          callbackRef.current(itemId, zone);
        }

        cleanup();
      };

      const onCancel = () => {
        cleanup();
      };

      positionGhost(event.clientX, event.clientY);

      setDraggingId(itemId);

      document.addEventListener("pointermove", onMove, {
        passive: false,
      });

      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onCancel);
    },
    [enabled],
  );

  return {
    draggingId,
    overZone,
    startDrag,
  };
}

// ─── Note Editor Hook ─────────────────────────────────────────────────────────

function useNoteEditor() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const startEdit = useCallback((id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditText("");
  }, []);

  return {
    editingId,
    editText,
    startEdit,
    cancelEdit,
    setEditText,
  };
}

// ─── Shared Note Card ─────────────────────────────────────────────────────────

interface NoteCardProps {
  note: StickyNote;
  canEdit: boolean;
  draggable?: boolean;
  isDragging?: boolean;
  onPointerDown?: (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => void;
  editingId: string | null;
  editText: string;
  onEditStart: () => void;
  onEditChange: (text: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onDelete: () => void;
}

function NoteCard({
  note,
  canEdit,
  draggable: isDraggable = true,
  isDragging = false,
  onPointerDown,
  editingId,
  editText,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onDelete,
}: NoteCardProps) {
  const isEditing = editingId === note.id;
  const rotation = note.rotation ?? 0;

  return (
    <div
      className="group"
      style={{
        backgroundColor: note.color,
        touchAction:
          canEdit && isDraggable ? "none" : "auto",
        opacity: isDragging ? 0.35 : 1,
        userSelect: "none",
        width: 112,
        minHeight: 112,
        borderRadius: 6,
        padding: "10px 10px 16px 10px",
        boxShadow: isDragging
          ? "0 14px 32px rgba(0,0,0,0.2)"
          : "0 5px 16px rgba(0,0,0,0.11)",
        transform: `rotate(${rotation}deg) scale(${
          isDragging ? 1.04 : 1
        }) translateY(${isDragging ? -4 : 0}px)`,
        transition: isDragging
          ? "none"
          : "box-shadow 0.18s, transform 0.15s",
        position: "relative",
        flexShrink: 0,
        cursor: isDragging
          ? "grabbing"
          : isEditing
            ? "text"
            : canEdit && isDraggable
              ? "grab"
              : "default",
      }}
      onPointerDown={
        canEdit && isDraggable ? onPointerDown : undefined
      }
    >
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 16,
          height: 16,
          background:
            "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.09) 50%)",
          borderBottomRightRadius: 6,
          pointerEvents: "none",
        }}
      />

      {isEditing ? (
        <div className="space-y-1">
          <textarea
            autoFocus
            value={editText}
            onChange={(event) =>
              onEditChange(event.target.value)
            }
            className="w-full bg-transparent resize-none border-b border-black/20 focus:outline-none"
            style={{
              fontSize: 12,
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              color: "#2D2D2D",
              lineHeight: 1.4,
              touchAction: "auto",
              padding: 0,
            }}
            rows={3}
            onPointerDown={(event) =>
              event.stopPropagation()
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();
                onEditSave();
              }

              if (event.key === "Escape") {
                onEditCancel();
              }
            }}
          />

          <div className="flex gap-1">
            <button
              type="button"
              onClick={onEditSave}
              onPointerDown={(event) =>
                event.stopPropagation()
              }
              className="text-[10px] px-2 py-0.5 bg-black/10 rounded hover:bg-black/20"
            >
              Save
            </button>

            <button
              type="button"
              onClick={onEditCancel}
              onPointerDown={(event) =>
                event.stopPropagation()
              }
              className="text-[10px] px-2 py-0.5 bg-black/10 rounded hover:bg-black/20"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {canEdit && isDraggable && (
            <GripVertical className="w-3 h-3 text-black/20 mb-1 pointer-events-none" />
          )}

          <p
            style={{
              fontSize: 12,
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              color: "#2D2D2D",
              lineHeight: 1.4,
              wordBreak: "break-word",
              margin: 0,
              pointerEvents: "none",
            }}
          >
            {note.text}
          </p>

          {canEdit && (
            <div
              className="absolute top-1 right-1 hidden group-hover:flex gap-0.5"
              onPointerDown={(event) =>
                event.stopPropagation()
              }
            >
              <button
                type="button"
                onClick={onEditStart}
                className="w-5 h-5 bg-white/80 rounded flex items-center justify-center hover:bg-white shadow-sm"
              >
                <Pencil className="w-2.5 h-2.5 text-gray-600" />
              </button>

              <button
                type="button"
                onClick={onDelete}
                className="w-5 h-5 bg-white/80 rounded flex items-center justify-center hover:bg-white shadow-sm"
              >
                <X className="w-2.5 h-2.5 text-[#AA5D53]" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Note Input ───────────────────────────────────────────────────────────────

interface NoteInputProps {
  placeholder: string;
  onAdd: (text: string) => void;
  color?: string;
}

function NoteInput({
  placeholder,
  onAdd,
  color = "#D4A843",
}: NoteInputProps) {
  const [text, setText] = useState("");

  const submit = () => {
    const trimmed = text.trim();

    if (!trimmed) return;

    onAdd(trimmed);
    setText("");
  };

  return (
    <div className="flex gap-2 items-start">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-lg border border-border p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#4A1C5C]/25 min-w-0"
        rows={2}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !event.shiftKey
          ) {
            event.preventDefault();
            submit();
          }
        }}
      />

      <button
        type="button"
        onClick={submit}
        className="mt-1 px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1 flex-shrink-0 text-[#2C1810] transition-colors hover:opacity-90"
        style={{ backgroundColor: color }}
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Add</span>
      </button>
    </div>
  );
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

interface DropZoneProps {
  id: string;
  label: string;
  count: number;
  isOver: boolean;
  children: ReactNode;
  className?: string;
}

function DropZone({
  id,
  label,
  count,
  isOver,
  children,
  className = "",
}: DropZoneProps) {
  return (
    <div
      data-dropzone={id}
      className={`
        min-h-40 p-4 rounded-xl border-2 transition-all duration-150
        ${
          isOver
            ? "border-[#D4A843] bg-[#EBE2D6] shadow-lg scale-[1.01]"
            : "border-border bg-white"
        }
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-3 pointer-events-none">
        <span className="font-semibold text-sm text-foreground">
          {label}
        </span>

        <span className="text-xs text-muted-foreground bg-[#EBE2D6] rounded-full px-2 py-0.5">
          {count}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  );
}

// ─── Step 1: Book of Life ─────────────────────────────────────────────────────

interface Step1Props {
  state: BoardState["step1"];
  onChange: (state: BoardState["step1"]) => void;
}

function Step1BookOfLife({
  state,
  onChange,
}: Step1Props) {
  const toggle = (id: string) => {
    const selected = state.selectedCards.includes(id)
      ? state.selectedCards.filter((card) => card !== id)
      : [...state.selectedCards, id];

    onChange({
      selectedCards: selected,
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
          Browse your identity cards and select the ones
          that feel true to who you are — the chapters of
          your Book of Life.
        </p>

        {state.selectedCards.length > 0 && (
          <span className="inline-block mt-2 text-xs text-[#4A1C5C] font-semibold bg-[#4A1C5C]/10 px-3 py-1 rounded-full">
            {state.selectedCards.length} selected
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        {IDENTITY_CARDS.map((card) => {
          const selected =
            state.selectedCards.includes(card.id);

          return (
            <motion.button
              key={card.id}
              type="button"
              onClick={() => toggle(card.id)}
              whileTap={{ scale: 0.96 }}
              className={`
                relative p-3 sm:p-4 rounded-xl border-2 text-left transition-all cursor-pointer
                ${
                  selected
                    ? "border-[#4A1C5C] bg-[#4A1C5C]/8 shadow-md"
                    : "border-border bg-white hover:border-[#4A1C5C]/40"
                }
              `}
            >
              <div className="text-2xl sm:text-3xl mb-1.5 leading-none">
                {card.symbol}
              </div>

              <p className="text-xs sm:text-sm font-semibold text-foreground leading-tight">
                {card.label}
              </p>

              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">
                {card.desc}
              </p>

              <div
                className={`
                  absolute top-2 right-2 w-4 h-4 sm:w-5 sm:h-5
                  rounded-full border-2 flex items-center justify-center transition-all
                  ${
                    selected
                      ? "border-[#4A1C5C] bg-[#4A1C5C]"
                      : "border-border bg-white"
                  }
                `}
              >
                {selected && (
                  <CheckCircle className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2: Exit Bin ─────────────────────────────────────────────────────────

interface Step2Props {
  state: BoardState["step2"];
  onChange: (state: BoardState["step2"]) => void;
  canEdit: boolean;
}

function Step2ExitBin({
  state,
  onChange,
  canEdit,
}: Step2Props) {
  const editor = useNoteEditor();

  const addNote = (text: string) => {
    const note: StickyNote = {
      id: createId(),
      text,
      zone: "exit",
      color: getRandomNoteColor(),
      rotation: getRandomRotation(),
    };

    onChange({
      exitNotes: [...state.exitNotes, note],
    });
  };

  const deleteNote = (id: string) => {
    onChange({
      exitNotes: state.exitNotes.filter(
        (note) => note.id !== id,
      ),
    });
  };

  const saveEdit = (id: string) => {
    const text = editor.editText.trim();

    if (!text) {
      editor.cancelEdit();
      return;
    }

    onChange({
      exitNotes: state.exitNotes.map((note) =>
        note.id === id
          ? {
              ...note,
              text,
            }
          : note,
      ),
    });

    editor.cancelEdit();
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#AA5D53]/8 border border-[#AA5D53]/25 rounded-xl p-4 text-center">
        <p
          className="text-[#AA5D53] font-semibold italic text-base sm:text-lg"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          "What no longer works for you?"
        </p>

        <p className="text-sm text-muted-foreground mt-1">
          Release what you're leaving behind. One thought
          per sticky note.
        </p>
      </div>

      {canEdit && (
        <NoteInput
          placeholder="e.g. People pleasing, overworking, ignoring my creativity..."
          onAdd={addNote}
          color="#AA5D53"
        />
      )}

      <div className="rounded-2xl border-2 border-dashed border-[#AA5D53]/40 bg-[#AA5D53]/5 min-h-44 p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#AA5D53] flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-4 h-4 text-white" />
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-[#AA5D53] text-sm">
              Exit Bin
            </p>

            <p className="text-xs text-muted-foreground">
              Things you're choosing to leave behind
            </p>
          </div>

          {state.exitNotes.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground bg-white border rounded-full px-2 py-0.5 flex-shrink-0">
              {state.exitNotes.length}
            </span>
          )}
        </div>

        {state.exitNotes.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm italic">
            {canEdit
              ? "Add notes above to fill the Exit Bin..."
              : "Waiting for participant to add notes..."}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {state.exitNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                canEdit={canEdit}
                draggable={false}
                editingId={editor.editingId}
                editText={editor.editText}
                onEditStart={() =>
                  editor.startEdit(note.id, note.text)
                }
                onEditChange={editor.setEditText}
                onEditSave={() => saveEdit(note.id)}
                onEditCancel={editor.cancelEdit}
                onDelete={() => deleteNote(note.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Discovery Landscape ──────────────────────────────────────────────

const DISCOVERY_ZONES = [
  {
    id: "admire",
    label: "Lives You Admire",
    color: "#4A1C5C",
  },
  {
    id: "miss",
    label: "Lives You Miss",
    color: "#AA5D53",
  },
  {
    id: "curious",
    label: "Lives You're Curious About",
    color: "#3D6D6C",
  },
];

interface Step3Props {
  state: BoardState["step3"];
  onChange: (state: BoardState["step3"]) => void;
  canEdit: boolean;
}

function Step3Discovery({
  state,
  onChange,
  canEdit,
}: Step3Props) {
  const editor = useNoteEditor();

  const { draggingId, overZone, startDrag } =
    useTouchDnD(
      (noteId, zone) => {
        const target =
          zone === "unplaced" ? null : zone;

        onChange({
          stickyNotes: state.stickyNotes.map(
            (note) =>
              note.id === noteId
                ? {
                    ...note,
                    zone: target,
                  }
                : note,
          ),
        });
      },
      canEdit,
    );

  const addNote = (text: string) => {
    const note: StickyNote = {
      id: createId(),
      text,
      zone: null,
      color: getRandomNoteColor(),
      rotation: getRandomRotation(),
    };

    onChange({
      stickyNotes: [...state.stickyNotes, note],
    });
  };

  const deleteNote = (id: string) => {
    onChange({
      stickyNotes: state.stickyNotes.filter(
        (note) => note.id !== id,
      ),
    });
  };

  const saveEdit = (id: string) => {
    const text = editor.editText.trim();

    if (!text) {
      editor.cancelEdit();
      return;
    }

    onChange({
      stickyNotes: state.stickyNotes.map((note) =>
        note.id === id
          ? {
              ...note,
              text,
            }
          : note,
      ),
    });

    editor.cancelEdit();
  };

  const unplaced = state.stickyNotes.filter(
    (note) => !note.zone,
  );

  const renderNote = (note: StickyNote) => (
    <NoteCard
      key={note.id}
      note={note}
      canEdit={canEdit}
      isDragging={draggingId === note.id}
      onPointerDown={(event) =>
        startDrag(
          note.id,
          note.text,
          event,
        )
      }
      editingId={editor.editingId}
      editText={editor.editText}
      onEditStart={() =>
        editor.startEdit(note.id, note.text)
      }
      onEditChange={editor.setEditText}
      onEditSave={() => saveEdit(note.id)}
      onEditCancel={editor.cancelEdit}
      onDelete={() => deleteNote(note.id)}
    />
  );

  return (
    <div className="space-y-4">
      {canEdit && (
        <NoteInput
          placeholder="Write a sticky note, then drag it into a zone..."
          onAdd={addNote}
        />
      )}

      {unplaced.length > 0 && (
        <div
          data-dropzone="unplaced"
          className={`
            min-h-14 p-3 rounded-xl border-2 border-dashed transition-all
            ${
              overZone === "unplaced"
                ? "border-[#D4A843] bg-[#EBE2D6]"
                : "border-border"
            }
          `}
        >
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide pointer-events-none">
            Unplaced — drag into a zone
          </p>

          <div className="flex flex-wrap gap-2">
            {unplaced.map(renderNote)}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DISCOVERY_ZONES.map((zone) => {
          const zoneNotes =
            state.stickyNotes.filter(
              (note) => note.zone === zone.id,
            );

          return (
            <DropZone
              key={zone.id}
              id={zone.id}
              label={zone.label}
              count={zoneNotes.length}
              isOver={overZone === zone.id}
            >
              {zoneNotes.map(renderNote)}

              {zoneNotes.length === 0 && (
                <p className="text-xs text-muted-foreground italic pointer-events-none">
                  Drop sticky notes here
                </p>
              )}
            </DropZone>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 4: Deck of Recognition ──────────────────────────────────────────────

interface Step4Props {
  state: BoardState["step4"];
  onChange: (state: BoardState["step4"]) => void;
}

function Step4DeckOfRecognition({
  state,
  onChange,
}: Step4Props) {
  const toggle = (roleId: string) => {
    const selected = state.selectedRoles.includes(
      roleId,
    )
      ? state.selectedRoles.filter(
          (id) => id !== roleId,
        )
      : [...state.selectedRoles, roleId];

    onChange({
      selectedRoles: selected,
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-muted-foreground max-w-lg mx-auto text-sm">
          Select roles that feel like possibilities for
          your future self. Tap the circle to select or
          deselect.
        </p>

        {state.selectedRoles.length > 0 && (
          <span className="inline-block mt-2 text-xs text-[#4A1C5C] font-semibold bg-[#4A1C5C]/10 px-3 py-1 rounded-full">
            {state.selectedRoles.length} selected
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ROLE_CARDS.map((role) => {
          const selected =
            state.selectedRoles.includes(role.id);

          return (
            <div
              key={role.id}
              className="flex items-center gap-3"
            >
              <div
                className={`
                  flex-1 min-w-0 px-4 py-3 rounded-xl border-2 transition-all
                  ${
                    selected
                      ? "border-[#4A1C5C] bg-[#4A1C5C]/6"
                      : "border-gray-200 bg-white"
                  }
                `}
              >
                <p
                  className={`
                    font-bold text-sm leading-tight
                    ${
                      selected
                        ? "text-[#4A1C5C]"
                        : "text-foreground"
                    }
                  `}
                >
                  {role.label}
                </p>

                <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                  {role.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggle(role.id)}
                className={`
                  w-11 h-11 sm:w-12 sm:h-12 rounded-full border-[3px]
                  flex-shrink-0 flex items-center justify-center
                  transition-all
                  ${
                    selected
                      ? "border-[#4A1C5C] bg-[#4A1C5C] shadow-lg scale-110"
                      : "border-gray-300 bg-white hover:border-[#4A1C5C]/60"
                  }
                `}
              >
                {selected && (
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 5: Dinner Table ─────────────────────────────────────────────────────

interface RoleNoteColProps {
  role: (typeof ROLE_CARDS)[number];
  notes: StickyNote[];
  onAdd: (text: string) => void;
  onEdit: (noteId: string, text: string) => void;
  onDelete: (noteId: string) => void;
  canEdit: boolean;
}

function RoleNoteCol({
  role,
  notes,
  onAdd,
  onEdit,
  onDelete,
  canEdit,
}: RoleNoteColProps) {
  const [input, setInput] = useState("");
  const editor = useNoteEditor();

  const add = () => {
    const text = input.trim();

    if (!text) return;

    onAdd(text);
    setInput("");
  };

  const saveEdit = () => {
    const text = editor.editText.trim();

    if (!text) {
      editor.cancelEdit();
      return;
    }

    if (editor.editingId) {
      onEdit(editor.editingId, text);
    }

    editor.cancelEdit();
  };

  return (
    <div className="flex flex-col items-center gap-2 w-36 sm:w-44 flex-shrink-0">
      <div
        className="px-3 py-2 rounded-xl font-semibold text-white text-xs text-center w-full leading-tight"
        style={{
          backgroundColor: "#4A1C5C",
        }}
      >
        {role.label}
      </div>

      <div className="w-full space-y-1.5">
        {notes.map((note) => (
          <div
            key={note.id}
            className="group relative rounded-lg p-2 shadow-sm"
            style={{
              backgroundColor: note.color,
            }}
          >
            {editor.editingId === note.id ? (
              <div className="space-y-1">
                <textarea
                  autoFocus
                  value={editor.editText}
                  onChange={(event) =>
                    editor.setEditText(
                      event.target.value,
                    )
                  }
                  rows={2}
                  className="w-full bg-transparent resize-none text-xs border-b border-black/20 focus:outline-none"
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      saveEdit();
                    }

                    if (event.key === "Escape") {
                      editor.cancelEdit();
                    }
                  }}
                />

                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={saveEdit}
                    className="text-[10px] px-2 py-0.5 bg-black/10 rounded"
                  >
                    Save
                  </button>

                  <button
                    type="button"
                    onClick={editor.cancelEdit}
                    className="text-[10px] px-2 py-0.5 bg-black/10 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-800 leading-snug break-words">
                  {note.text}
                </p>

                {canEdit && (
                  <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        editor.startEdit(
                          note.id,
                          note.text,
                        )
                      }
                      className="w-4 h-4 bg-white/80 rounded flex items-center justify-center"
                    >
                      <Pencil className="w-2 h-2 text-gray-600" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onDelete(note.id)
                      }
                      className="w-4 h-4 bg-white/80 rounded flex items-center justify-center"
                    >
                      <X className="w-2 h-2 text-[#AA5D53]" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {canEdit && (
          <div className="flex gap-1">
            <input
              type="text"
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              placeholder="Add theme..."
              className="flex-1 min-w-0 text-[11px] border border-border rounded-md px-2 py-1 bg-white focus:outline-none"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  add();
                }
              }}
            />

            <button
              type="button"
              onClick={add}
              className="w-6 h-6 rounded-md bg-[#D4A843] text-[#2C1810] flex items-center justify-center hover:bg-[#C49835] flex-shrink-0"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface Step5Props {
  state: BoardState["step5"];
  onChange: (state: BoardState["step5"]) => void;
  canEdit: boolean;
  selectedRoles: string[];
}

function Step5DinnerTable({
  state,
  onChange,
  canEdit,
  selectedRoles,
}: Step5Props) {
  const roles = ROLE_CARDS.filter((role) =>
    selectedRoles.includes(role.id),
  );

  const addNote = (
    roleId: string,
    text: string,
  ) => {
    const note: StickyNote = {
      id: createId(),
      text,
      zone: roleId,
      color: getRandomNoteColor(),
      rotation: getRandomRotation(),
    };

    onChange({
      roleNotes: {
        ...state.roleNotes,
        [roleId]: [
          ...(state.roleNotes[roleId] || []),
          note,
        ],
      },
    });
  };

  const editNote = (
    roleId: string,
    noteId: string,
    text: string,
  ) => {
    onChange({
      roleNotes: {
        ...state.roleNotes,
        [roleId]: (
          state.roleNotes[roleId] || []
        ).map((note) =>
          note.id === noteId
            ? {
                ...note,
                text,
              }
            : note,
        ),
      },
    });
  };

  const deleteNote = (
    roleId: string,
    noteId: string,
  ) => {
    onChange({
      roleNotes: {
        ...state.roleNotes,
        [roleId]: (
          state.roleNotes[roleId] || []
        ).filter((note) => note.id !== noteId),
      },
    });
  };

  if (roles.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No roles selected in Step 4.</p>
        <p className="text-sm mt-1">
          Go back and select roles from the Deck of
          Recognition.
        </p>
      </div>
    );
  }

  const half = Math.ceil(roles.length / 2);
  const topRoles = roles.slice(0, half);
  const bottomRoles = roles.slice(half);

  return (
    <div className="space-y-4">
      <div className="bg-[#4A1C5C]/6 border border-[#4A1C5C]/20 rounded-xl p-3 sm:p-4 text-center">
        <p
          className="text-[#4A1C5C] font-semibold italic text-sm sm:text-base"
          style={{
            fontFamily: "Playfair Display, serif",
          }}
        >
          "If these people were sitting at a dinner table,
          what would they be talking about?"
        </p>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="flex gap-4 justify-center flex-wrap mb-4">
          {topRoles.map((role) => (
            <RoleNoteCol
              key={role.id}
              role={role}
              notes={
                state.roleNotes[role.id] || []
              }
              onAdd={(text) =>
                addNote(role.id, text)
              }
              onEdit={(noteId, text) =>
                editNote(
                  role.id,
                  noteId,
                  text,
                )
              }
              onDelete={(noteId) =>
                deleteNote(
                  role.id,
                  noteId,
                )
              }
              canEdit={canEdit}
            />
          ))}
        </div>

        <div className="flex justify-center my-2">
          <div
            className="relative flex items-center justify-center shadow-2xl"
            style={{
              width: 280,
              height: 96,
              borderRadius: "50%",
              background:
                "linear-gradient(160deg,#A0753A 0%,#7A5320 50%,#5C3D15 100%)",
              border: "5px solid #8B6520",
            }}
          >
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 w-44 h-8 rounded-full"
              style={{
                background:
                  "rgba(255,255,255,0.07)",
              }}
            />

            <div className="text-center z-10">
              <p className="text-amber-100 text-sm font-semibold tracking-wide">
                🍽️ Dinner Table
              </p>
            </div>
          </div>
        </div>

        {bottomRoles.length > 0 && (
          <div className="flex gap-4 justify-center flex-wrap mt-4">
            {bottomRoles.map((role) => (
              <RoleNoteCol
                key={role.id}
                role={role}
                notes={
                  state.roleNotes[role.id] || []
                }
                onAdd={(text) =>
                  addNote(role.id, text)
                }
                onEdit={(noteId, text) =>
                  editNote(
                    role.id,
                    noteId,
                    text,
                  )
                }
                onDelete={(noteId) =>
                  deleteNote(
                    role.id,
                    noteId,
                  )
                }
                canEdit={canEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center justify-center">
          <div
            className="flex items-center justify-center shadow-lg"
            style={{
              width: 200,
              height: 64,
              borderRadius: "50%",
              background:
                "linear-gradient(160deg,#A0753A 0%,#7A5320 100%)",
              border: "4px solid #8B6520",
            }}
          >
            <p className="text-amber-100 text-xs font-semibold">
              🍽️ Dinner Table
            </p>
          </div>
        </div>

        {roles.map((role) => {
          const roleNotes =
            state.roleNotes[role.id] || [];

          return (
            <div
              key={role.id}
              className="bg-white rounded-xl border border-border p-4"
            >
              <div
                className="px-3 py-2 rounded-lg font-semibold text-white text-sm mb-3 inline-block"
                style={{
                  backgroundColor: "#4A1C5C",
                }}
              >
                {role.label}
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {roleNotes.map((note) => (
                  <div
                    key={note.id}
                    className="group relative rounded-lg p-2 shadow-sm"
                    style={{
                      backgroundColor: note.color,
                    }}
                  >
                    <p className="text-xs text-gray-800">
                      {note.text}
                    </p>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() =>
                          deleteNote(
                            role.id,
                            note.id,
                          )
                        }
                        className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow hidden group-hover:flex"
                      >
                        <X className="w-2 h-2 text-[#AA5D53]" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {canEdit && (
                <MobileRoleInput
                  onAdd={(text) =>
                    addNote(role.id, text)
                  }
                />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Examples: Impact · Purpose · Meaning · Freedom ·
        Teaching · Creativity · Legacy
      </p>
    </div>
  );
}

function MobileRoleInput({
  onAdd,
}: {
  onAdd: (text: string) => void;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    const text = value.trim();

    if (!text) return;

    onAdd(text);
    setValue("");
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(event) =>
          setValue(event.target.value)
        }
        placeholder="Add theme..."
        className="flex-1 text-sm border border-border rounded-lg px-3 py-2 focus:outline-none"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          }
        }}
      />

      <button
        type="button"
        onClick={submit}
        className="px-3 py-2 bg-[#D4A843] text-[#2C1810] rounded-lg text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Step 6: Grounding vs Draining ────────────────────────────────────────────

interface Step6Props {
  state: BoardState["step6"];
  onChange: (state: BoardState["step6"]) => void;
  canEdit: boolean;
  selectedRoles: string[];
}

function Step6GroundingDraining({
  state,
  onChange,
  canEdit,
  selectedRoles,
}: Step6Props) {
  const roles = ROLE_CARDS.filter((role) =>
    selectedRoles.includes(role.id),
  );

  const { draggingId, overZone, startDrag } =
    useTouchDnD(
      (roleId, zone) => {
        if (!canEdit) return;

        const target =
          zone === "unplaced" ? null : zone;

        onChange({
          roleZones: {
            ...state.roleZones,
            [roleId]: target,
          },
        });
      },
      canEdit,
    );

  if (roles.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No roles selected in Step 4. Go back and select
        roles to sort them here.
      </div>
    );
  }

  const unplaced = roles.filter(
    (role) => !state.roleZones[role.id],
  );

  const grounding = roles.filter(
    (role) =>
      state.roleZones[role.id] ===
      "grounding",
  );

  const draining = roles.filter(
    (role) =>
      state.roleZones[role.id] ===
      "draining",
  );

  const RoleChip = ({
    role,
  }: {
    role: (typeof ROLE_CARDS)[number];
  }) => (
    <div
      style={{
        touchAction: canEdit ? "none" : "auto",
        opacity:
          draggingId === role.id ? 0.4 : 1,
        userSelect: "none",
      }}
      onPointerDown={
        canEdit
          ? (event) =>
              startDrag(
                role.id,
                role.label,
                event,
              )
          : undefined
      }
      className={`
        flex items-center gap-1.5 px-3 py-2 rounded-xl border-2
        bg-white text-sm font-medium text-foreground shadow-sm
        transition-all border-border
        ${
          canEdit
            ? "cursor-grab active:cursor-grabbing hover:border-[#4A1C5C]/50 hover:shadow-md"
            : "cursor-default"
        }
      `}
    >
      {canEdit && (
        <GripVertical className="w-3 h-3 text-muted-foreground flex-shrink-0 pointer-events-none" />
      )}

      <span className="pointer-events-none">
        {role.label}
      </span>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-muted-foreground">
        Drag each role into Grounding or Draining based
        on how it feels.
      </p>

      {unplaced.length > 0 && (
        <div
          data-dropzone="unplaced"
          className={`
            min-h-14 p-3 rounded-xl border-2 border-dashed transition-all
            ${
              overZone === "unplaced"
                ? "border-[#D4A843] bg-[#EBE2D6]"
                : "border-border"
            }
          `}
        >
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium pointer-events-none">
            Drag to sort below
          </p>

          <div className="flex flex-wrap gap-2">
            {unplaced.map((role) => (
              <RoleChip
                key={role.id}
                role={role}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          data-dropzone="grounding"
          className={`
            min-h-40 p-4 rounded-xl border-2 transition-all duration-150
            ${
              overZone === "grounding"
                ? "border-[#3D6D6C] bg-[#3D6D6C]/12 shadow-lg scale-[1.01]"
                : "border-[#3D6D6C]/40 bg-[#3D6D6C]/5"
            }
          `}
        >
          <div className="flex items-center gap-3 mb-3 pointer-events-none">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#3D6D6C] flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
              G
            </div>

            <div>
              <h4 className="font-semibold text-[#3D6D6C] text-sm">
                Grounding
              </h4>

              <p className="text-xs text-muted-foreground">
                Energises and sustains you
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {grounding.map((role) => (
              <RoleChip
                key={role.id}
                role={role}
              />
            ))}

            {grounding.length === 0 && (
              <p className="text-xs text-muted-foreground italic pointer-events-none">
                Drop roles here
              </p>
            )}
          </div>
        </div>

        <div
          data-dropzone="draining"
          className={`
            min-h-40 p-4 rounded-xl border-2 transition-all duration-150
            ${
              overZone === "draining"
                ? "border-[#AA5D53] bg-[#AA5D53]/12 shadow-lg scale-[1.01]"
                : "border-[#AA5D53]/40 bg-[#AA5D53]/5"
            }
          `}
        >
          <div className="flex items-center gap-3 mb-3 pointer-events-none">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#AA5D53] flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
              D
            </div>

            <div>
              <h4 className="font-semibold text-[#AA5D53] text-sm">
                Draining
              </h4>

              <p className="text-xs text-muted-foreground">
                Feels heavy or misaligned
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {draining.map((role) => (
              <RoleChip
                key={role.id}
                role={role}
              />
            ))}

            {draining.length === 0 && (
              <p className="text-xs text-muted-foreground italic pointer-events-none">
                Drop roles here
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 7: Recognition Word ─────────────────────────────────────────────────

interface Step7Props {
  state: BoardState["step7"];
  onChange: (state: BoardState["step7"]) => void;
  canEdit: boolean;
  boardState: BoardState;
}

function Step7RecognitionWord({
  state,
  onChange,
  canEdit,
  boardState,
}: Step7Props) {
  const [newWord, setNewWord] = useState("");
  const [editingId, setEditingId] =
    useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const addWord = () => {
    const word = newWord.trim();

    if (!word) return;

    onChange({
      recognitionWords: [
        ...state.recognitionWords,
        {
          id: createId(),
          word,
        },
      ],
    });

    setNewWord("");
  };

  const groundingRoles = ROLE_CARDS.filter(
    (role) =>
      boardState.step4.selectedRoles.includes(
        role.id,
      ) &&
      boardState.step6.roleZones[role.id] ===
        "grounding",
  );

  const saveWord = (id: string) => {
    const word = editText.trim();

    if (!word) {
      setEditingId(null);
      setEditText("");
      return;
    }

    onChange({
      recognitionWords:
        state.recognitionWords.map((item) =>
          item.id === id
            ? {
                ...item,
                word,
              }
            : item,
        ),
    });

    setEditingId(null);
    setEditText("");
  };

  const deleteWord = (id: string) => {
    onChange({
      recognitionWords:
        state.recognitionWords.filter(
          (item) => item.id !== id,
        ),
    });
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="bg-[#4A1C5C]/6 border border-[#4A1C5C]/20 rounded-xl p-3 sm:p-4 text-center">
        <p
          className="text-[#4A1C5C] font-semibold italic text-base sm:text-lg"
          style={{
            fontFamily: "Playfair Display, serif",
          }}
        >
          "What word connects them all?"
        </p>

        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          What single word captures your emerging future
          self?
        </p>
      </div>

      {groundingRoles.length > 0 && (
        <div className="bg-[#EBE2D6]/60 rounded-xl p-3 sm:p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">
            Your Grounding Roles
          </p>

          <div className="flex flex-wrap gap-2">
            {groundingRoles.map((role) => (
              <span
                key={role.id}
                className="px-3 py-1 bg-[#3D6D6C] text-white text-xs sm:text-sm rounded-full"
              >
                {role.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {canEdit && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newWord}
            onChange={(event) =>
              setNewWord(event.target.value)
            }
            placeholder="e.g. Impact, Purpose, Creativity, Freedom..."
            className="flex-1 rounded-lg border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A1C5C]/25"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addWord();
              }
            }}
          />

          <button
            type="button"
            onClick={addWord}
            className="px-3 py-2 bg-[#D4A843] text-[#2C1810] rounded-lg font-medium text-sm hover:bg-[#C49835] transition-colors flex items-center gap-1 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">
              Add
            </span>
          </button>
        </div>
      )}

      {state.recognitionWords.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm italic">
          {canEdit
            ? "Add your recognition words above..."
            : "Waiting for recognition words..."}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 sm:gap-4 justify-center py-4">
          {state.recognitionWords.map((item) => (
            <div
              key={item.id}
              className="group relative"
            >
              {editingId === item.id ? (
                <div className="flex gap-2 items-center">
                  <input
                    autoFocus
                    type="text"
                    value={editText}
                    onChange={(event) =>
                      setEditText(
                        event.target.value,
                      )
                    }
                    className="px-4 py-2 rounded-full border-2 border-[#4A1C5C] text-[#4A1C5C] font-bold text-lg focus:outline-none"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        saveWord(item.id);
                      }

                      if (event.key === "Escape") {
                        setEditingId(null);
                        setEditText("");
                      }
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      saveWord(item.id)
                    }
                    className="text-xs px-2 py-1 bg-[#4A1C5C] text-white rounded-lg"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div
                  className="relative px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-full bg-[#4A1C5C] text-white font-bold text-xl sm:text-2xl shadow-lg"
                  style={{
                    fontFamily:
                      "Playfair Display, serif",
                  }}
                >
                  {item.word}

                  {canEdit && (
                    <span className="absolute -top-2 -right-2 hidden group-hover:flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditText(item.word);
                        }}
                        className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow text-[#4A1C5C]"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteWord(item.id)
                        }
                        className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow text-[#AA5D53]"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {state.recognitionWords.length > 0 && (
        <div className="bg-gradient-to-r from-[#4A1C5C]/8 to-[#3D6D6C]/8 rounded-xl p-4 sm:p-5 border border-[#4A1C5C]/15">
          <h4
            className="font-semibold text-[#4A1C5C] mb-2 sm:mb-3 text-sm sm:text-base"
            style={{
              fontFamily: "Playfair Display, serif",
            }}
          >
            Session 1 Outcomes
          </h4>

          <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">
                Identity cards:
              </span>{" "}
              {boardState.step1.selectedCards.length}
            </p>

            <p>
              <span className="font-medium text-foreground">
                Exit bin notes:
              </span>{" "}
              {boardState.step2.exitNotes.length}
            </p>

            <p>
              <span className="font-medium text-foreground">
                Discovery notes:
              </span>{" "}
              {boardState.step3.stickyNotes.length}
            </p>

            <p>
              <span className="font-medium text-foreground">
                Future roles:
              </span>{" "}
              {boardState.step4.selectedRoles.length}
            </p>

            <p>
              <span className="font-medium text-foreground">
                Grounding roles:
              </span>{" "}
              {groundingRoles
                .map((role) => role.label)
                .join(", ") || "None"}
            </p>

            <p className="font-semibold text-[#4A1C5C] text-sm sm:text-base mt-1">
              Recognition:{" "}
              {state.recognitionWords
                .map((word) => word.word)
                .join(" · ")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Session 1 Board ─────────────────────────────────────────────────────

export default function Session1Board() {
  const { sessionId } =
    useParams<{ sessionId: string }>();

  const location = useLocation();
  const navigate = useNavigate();

  const isParticipant =
    location.pathname.startsWith(
      "/participant",
    );

  const userRole = isParticipant
    ? "participant"
    : "facilitator";

  const dashboardPath = isParticipant
    ? "/participant/dashboard"
    : "/facilitator/dashboard";

  const [boardState, setBoardState] =
    useState<BoardState>(() => ({
      ...DEFAULT_STATE,
    }));

  const [loading, setLoading] =
    useState(true);

  const [connected, setConnected] =
    useState(false);

  const [peerConnected, setPeerConnected] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [lastSaved, setLastSaved] =
    useState<Date | null>(null);

  const [sessionInfo, setSessionInfo] =
    useState<any>(null);

  const [endingSession, setEndingSession] =
    useState(false);

  const channelRef = useRef<any>(null);
  const saveTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

  const stateRef = useRef<BoardState>(
    boardState,
  );

  const dirtyRef = useRef(false);

  const instanceIdRef = useRef(createId());

  stateRef.current = boardState;

  // ─── Load session + board ─────────────────────────────────────────────────

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadSession = async () => {
      setLoading(true);

      try {
        const headers = await getAuthHeaders();
        const [sessionResponse, boardResponse] =
          await Promise.all([
            fetch(
              `${API}/sessions/${sessionId}`,
              {
                headers,
              },
            ),
            fetch(
              `${API}/sessions/${sessionId}/board`,
              {
                headers,
              },
            ),
          ]);

        if (cancelled) return;

        if (sessionResponse.ok) {
          const sessionData =
            await sessionResponse.json();

          setSessionInfo(sessionData);
        }

        if (boardResponse.ok) {
          const boardData =
            await boardResponse.json();

          if (boardData?.state) {
            const migrated =
              migrateState(boardData.state);

            setBoardState(migrated);
            stateRef.current = migrated;
          }
        } else if (
          boardResponse.status !== 404
        ) {
          toast.error(
            "Failed to load the session board.",
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Session board load error:",
            error,
          );

          toast.error(
            "Failed to load session board.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // ─── Realtime channel ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!sessionId) return;

    const supabase = createClient();

    const presenceKey = `${userRole}:${instanceIdRef.current}`;

    const channel = supabase.channel(
      `session:${sessionId}`,
      {
        config: {
          broadcast: {
            self: false,
          },
          presence: {
            key: presenceKey,
          },
        },
      },
    );

    channel
      .on(
        "broadcast",
        {
          event: "board_update",
        },
        ({ payload }: any) => {
          if (!payload?.state) return;

          const incoming =
            migrateState(payload.state);

          dirtyRef.current = false;

          setBoardState(incoming);
          stateRef.current = incoming;
        },
      )
      .on(
        "presence",
        {
          event: "sync",
        },
        () => {
          const presenceState =
            channel.presenceState();

          const roles = Object.values(
            presenceState,
          )
            .flat()
            .map(
              (presence: any) =>
                presence?.role,
            );

          const hasPeer = roles.some(
            (peerRole) =>
              peerRole &&
              peerRole !== userRole,
          );

          setPeerConnected(hasPeer);
        },
      )
      .on(
        "presence",
        {
          event: "join",
        },
        ({ newPresences }: any) => {
          const hasPeer =
            Array.isArray(newPresences) &&
            newPresences.some(
              (presence: any) =>
                presence?.role &&
                presence.role !==
                  userRole,
            );

          if (hasPeer) {
            toast.success(
              isParticipant
                ? "Facilitator joined"
                : "Participant joined",
            );
          }
        },
      )
      .on(
        "presence",
        {
          event: "leave",
        },
        ({ leftPresences }: any) => {
          const hasPeer =
            Array.isArray(leftPresences) &&
            leftPresences.some(
              (presence: any) =>
                presence?.role &&
                presence.role !==
                  userRole,
            );

          if (hasPeer) {
            toast.info(
              isParticipant
                ? "Facilitator disconnected"
                : "Participant disconnected",
            );
          }
        },
      );

    channel.subscribe(
      async (status: string) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);

          try {
            await channel.track({
              role: userRole,
              joinedAt:
                new Date().toISOString(),
            });
          } catch (error) {
            console.error(
              "Presence tracking error:",
              error,
            );
          }
        } else if (
          status === "CLOSED" ||
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT"
        ) {
          setConnected(false);
          setPeerConnected(false);
        }
      },
    );

    channelRef.current = channel;

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(
          saveTimerRef.current,
        );
        saveTimerRef.current = null;
      }

      setConnected(false);
      setPeerConnected(false);

      void channel.unsubscribe();

      if (
        channelRef.current === channel
      ) {
        channelRef.current = null;
      }
    };
  }, [
    sessionId,
    userRole,
    isParticipant,
  ]);

  // ─── Save + broadcast after local changes ─────────────────────────────────

  useEffect(() => {
    if (!sessionId) return;

    if (!dirtyRef.current) {
      return;
    }

    const nextState = boardState;

    if (channelRef.current) {
      void channelRef.current.send({
        type: "broadcast",
        event: "board_update",
        payload: {
          state: nextState,
        },
      });
    }

    if (saveTimerRef.current) {
      clearTimeout(
        saveTimerRef.current,
      );
    }

    saveTimerRef.current = setTimeout(
      async () => {
        setSaving(true);

        try {
          const response = await fetch(
            `${API}/sessions/${sessionId}/board`,
            {
              method: "PUT",
              headers: await getAuthHeaders(),
              body: JSON.stringify({
                state: nextState,
              }),
            },
          );

          if (!response.ok) {
            throw new Error(
              `Board save failed: ${response.status}`,
            );
          }

          dirtyRef.current = false;
          setLastSaved(new Date());
        } catch (error) {
          console.error(
            "Board save error:",
            error,
          );

          // Keep dirty=true so the next local update
          // will retry the save.
          toast.error(
            "Unable to save the board. Your changes will retry on the next update.",
          );
        } finally {
          setSaving(false);
        }
      },
      1200,
    );

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(
          saveTimerRef.current,
        );
        saveTimerRef.current = null;
      }
    };
  }, [boardState, sessionId]);

  // ─── Board state updater ──────────────────────────────────────────────────

  const updateBoardState = useCallback(
    (
      updater: (
        previous: BoardState,
      ) => BoardState,
    ) => {
      if (isParticipant) {
        return;
      }

      dirtyRef.current = true;

      setBoardState((previous) => {
        const next = updater(previous);

        stateRef.current = next;

        return next;
      });
    },
    [isParticipant],
  );

  // ─── Navigation ───────────────────────────────────────────────────────────

  const goToStep = useCallback(
    (step: number) => {
      if (isParticipant) {
        return;
      }

      if (
        step < 1 ||
        step > TOTAL_STEPS
      ) {
        return;
      }

      updateBoardState(
        (previous) => ({
          ...previous,
          currentStep: step,
        }),
      );
    },
    [isParticipant, updateBoardState],
  );

  // ─── End session ──────────────────────────────────────────────────────────

  const endSession = useCallback(
    async () => {
      if (isParticipant || !sessionId) {
        return;
      }

      const confirmed =
        window.confirm(
          "End this session? The board will be saved and marked as complete.",
        );

      if (!confirmed) {
        return;
      }

      setEndingSession(true);

      try {
        if (saveTimerRef.current) {
          clearTimeout(
            saveTimerRef.current,
          );
          saveTimerRef.current = null;
        }

        const finalState =
          stateRef.current;

        setSaving(true);

        const boardResponse =
          await fetch(
            `${API}/sessions/${sessionId}/board`,
            {
              method: "PUT",
              headers: await getAuthHeaders(),
              body: JSON.stringify({
                state: finalState,
              }),
            },
          );

        if (!boardResponse.ok) {
          throw new Error(
            "Failed to save board.",
          );
        }

        dirtyRef.current = false;
        setLastSaved(new Date());

        const statusResponse =
          await fetch(
            `${API}/sessions/${sessionId}/status`,
            {
              method: "PUT",
              headers: await getAuthHeaders(),
              body: JSON.stringify({
                status: "completed",
              }),
            },
          );

        if (!statusResponse.ok) {
          throw new Error(
            "Failed to complete session.",
          );
        }

        toast.success(
          "Session ended and saved.",
        );

        navigate(dashboardPath);
      } catch (error) {
        console.error(
          "End session error:",
          error,
        );

        toast.error(
          "Failed to end session. Please try again.",
        );
      } finally {
        setSaving(false);
        setEndingSession(false);
      }
    },
    [
      dashboardPath,
      isParticipant,
      navigate,
      sessionId,
    ],
  );

  // ─── Derived state ────────────────────────────────────────────────────────

  const canEdit = !isParticipant;
  const canNavigate = !isParticipant;

  const currentStep =
    boardState.currentStep >= 1 &&
    boardState.currentStep <= TOTAL_STEPS
      ? boardState.currentStep
      : 1;

  const stepInfo =
    STEPS[currentStep - 1];

  // ─── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EBE2D6] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#4A1C5C] mx-auto" />

          <p className="text-muted-foreground text-sm">
            Loading session board...
          </p>
        </div>
      </div>
    );
  }

  // ─── Main UI ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#EBE2D6] flex flex-col overflow-x-hidden">
      {/* Top bar */}
      <div className="bg-white border-b border-border px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 shadow-sm flex-shrink-0">
        <button
          type="button"
          onClick={() =>
            navigate(dashboardPath)
          }
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />

          <span className="hidden sm:inline text-xs">
            Dashboard
          </span>
        </button>

        <div className="w-px h-4 bg-border flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-5 h-5 rounded-full bg-[#4A1C5C] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[9px] font-bold">
                Z
              </span>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
              {sessionInfo?.journey?.title ||
                "Zest Journey"}

              <span className="text-muted-foreground font-normal hidden sm:inline">
                {" "}
                — Session 1
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 text-xs">
            {connected ? (
              <Wifi className="w-3 h-3 text-[#3D6D6C]" />
            ) : (
              <WifiOff className="w-3 h-3 text-[#AA5D53]" />
            )}

            <span
              className={`
                hidden sm:inline
                ${
                  connected
                    ? "text-[#3D6D6C]"
                    : "text-[#AA5D53]"
                }
              `}
            >
              {connected
                ? "Live"
                : "Offline"}
            </span>
          </div>

          {peerConnected && (
            <div className="flex items-center gap-1 text-xs text-[#3D6D6C] bg-[#3D6D6C]/10 px-1.5 sm:px-2 py-0.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3D6D6C] animate-pulse" />

              <span className="hidden sm:inline">
                {isParticipant
                  ? "Facilitator"
                  : "Participant"}
              </span>
            </div>
          )}

          {saving ? (
            <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving
            </div>
          ) : lastSaved ? (
            <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
              <Save className="w-3 h-3" />
              Saved
            </div>
          ) : null}

          {!isParticipant && (
            <button
              type="button"
              onClick={endSession}
              disabled={endingSession}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-[#AA5D53] text-white text-xs rounded-lg hover:bg-[#934D45] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {endingSession && (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}

              <span className="hidden sm:inline">
                End Session
              </span>

              <span className="sm:hidden">
                End
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b border-border px-3 sm:px-4 py-2 flex-shrink-0">
        <div className="max-w-5xl mx-auto flex items-center gap-1">
          {STEPS.map((step) => (
            <button
              key={step.number}
              type="button"
              onClick={() =>
                canNavigate &&
                goToStep(step.number)
              }
              disabled={!canNavigate}
              title={step.title}
              className={`
                flex-1 h-1.5 rounded-full transition-all
                ${
                  currentStep ===
                  step.number
                    ? "bg-[#4A1C5C]"
                    : currentStep >
                        step.number
                      ? "bg-[#3D6D6C]"
                      : "bg-border"
                }
                ${
                  canNavigate
                    ? "cursor-pointer hover:opacity-75"
                    : "cursor-default"
                }
              `}
            />
          ))}
        </div>

        <div className="max-w-5xl mx-auto mt-1.5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate">
            Step {currentStep}/
            {TOTAL_STEPS} —{" "}
            <span className="font-semibold text-foreground">
              {stepInfo.title}
            </span>
          </span>

          <span className="text-xs text-muted-foreground hidden sm:block">
            {stepInfo.subtitle}
          </span>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-auto overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <AnimatePresence
            mode="wait"
          >
            <motion.div
              key={currentStep}
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -12,
              }}
              transition={{
                duration: 0.2,
              }}
            >
              <div className="mb-4 sm:mb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#4A1C5C]/10 rounded-full mb-2 sm:mb-3">
                  <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#4A1C5C] text-white text-[10px] sm:text-xs flex items-center justify-center font-bold">
                    {currentStep}
                  </span>

                  <span className="text-xs font-medium text-[#4A1C5C]">
                    {stepInfo.subtitle}
                  </span>
                </div>

                <h2
                  className="text-xl sm:text-2xl"
                  style={{
                    fontFamily:
                      "Playfair Display, serif",
                    color: "#4A1C5C",
                  }}
                >
                  {stepInfo.title}
                </h2>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-border p-4 sm:p-5 lg:p-7">
                {currentStep === 1 && (
                  <Step1BookOfLife
                    state={
                      boardState.step1
                    }
                    onChange={(state) =>
                      updateBoardState(
                        (previous) => ({
                          ...previous,
                          step1: state,
                        }),
                      )
                    }
                  />
                )}

                {currentStep === 2 && (
                  <Step2ExitBin
                    state={
                      boardState.step2
                    }
                    onChange={(state) =>
                      updateBoardState(
                        (previous) => ({
                          ...previous,
                          step2: state,
                        }),
                      )
                    }
                    canEdit={canEdit}
                  />
                )}

                {currentStep === 3 && (
                  <Step3Discovery
                    state={
                      boardState.step3
                    }
                    onChange={(state) =>
                      updateBoardState(
                        (previous) => ({
                          ...previous,
                          step3: state,
                        }),
                      )
                    }
                    canEdit={canEdit}
                  />
                )}

                {currentStep === 4 && (
                  <Step4DeckOfRecognition
                    state={
                      boardState.step4
                    }
                    onChange={(state) =>
                      updateBoardState(
                        (previous) => ({
                          ...previous,
                          step4: state,
                        }),
                      )
                    }
                  />
                )}

                {currentStep === 5 && (
                  <Step5DinnerTable
                    state={
                      boardState.step5
                    }
                    onChange={(state) =>
                      updateBoardState(
                        (previous) => ({
                          ...previous,
                          step5: state,
                        }),
                      )
                    }
                    canEdit={canEdit}
                    selectedRoles={
                      boardState.step4
                        .selectedRoles
                    }
                  />
                )}

                {currentStep === 6 && (
                  <Step6GroundingDraining
                    state={
                      boardState.step6
                    }
                    onChange={(state) =>
                      updateBoardState(
                        (previous) => ({
                          ...previous,
                          step6: state,
                        }),
                      )
                    }
                    canEdit={canEdit}
                    selectedRoles={
                      boardState.step4
                        .selectedRoles
                    }
                  />
                )}

                {currentStep === 7 && (
                  <Step7RecognitionWord
                    state={
                      boardState.step7
                    }
                    onChange={(state) =>
                      updateBoardState(
                        (previous) => ({
                          ...previous,
                          step7: state,
                        }),
                      )
                    }
                    canEdit={canEdit}
                    boardState={
                      boardState
                    }
                  />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="bg-white border-t border-border px-3 sm:px-4 py-2.5 sm:py-3 flex-shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() =>
              goToStep(currentStep - 1)
            }
            disabled={
              currentStep === 1 ||
              !canNavigate
            }
            className={`
              flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl
              text-xs sm:text-sm font-medium transition-all flex-shrink-0
              ${
                currentStep === 1 ||
                !canNavigate
                  ? "text-muted-foreground cursor-not-allowed opacity-40"
                  : "text-foreground hover:bg-[#EBE2D6] border border-border"
              }
            `}
          >
            <ChevronLeft className="w-4 h-4" />

            <span className="hidden sm:inline">
              Previous
            </span>
          </button>

          <div className="flex items-center gap-1">
            {STEPS.map((step) => (
              <button
                key={step.number}
                type="button"
                disabled={!canNavigate}
                onClick={() =>
                  canNavigate &&
                  goToStep(step.number)
                }
                className={`
                  h-2 rounded-full transition-all
                  ${
                    currentStep ===
                    step.number
                      ? "bg-[#4A1C5C] w-5"
                      : currentStep >
                          step.number
                        ? "bg-[#3D6D6C] w-2"
                        : "bg-border w-2"
                  }
                  ${
                    canNavigate
                      ? "cursor-pointer"
                      : "cursor-default"
                  }
                `}
              />
            ))}
          </div>

          {currentStep < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={() =>
                goToStep(currentStep + 1)
              }
              disabled={!canNavigate}
              className={`
                flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl
                text-xs sm:text-sm font-medium transition-all flex-shrink-0
                ${
                  canNavigate
                    ? "bg-[#4A1C5C] text-white hover:bg-[#3A1C4C]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }
              `}
            >
              <span className="hidden sm:inline">
                Next
              </span>

              <ChevronRight className="w-4 h-4" />
            </button>
          ) : !isParticipant ? (
            <button
              type="button"
              onClick={endSession}
              disabled={endingSession}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#3D6D6C] text-white hover:bg-[#2C5958] transition-all flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {endingSession ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}

              <span className="hidden sm:inline">
                Complete
              </span>
            </button>
          ) : (
            <div className="w-16 text-center text-xs text-muted-foreground">
              Done
            </div>
          )}
        </div>
      </div>
    </div>
  );
}