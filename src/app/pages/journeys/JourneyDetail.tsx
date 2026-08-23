// import React, { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router";
// import DashboardLayout from "../../components/DashboardLayout";
// import { Card } from "../../components/ui/card";
// import { Button } from "../../components/ui/button";
// import { Badge } from "../../components/ui/badge";
// import { Input } from "../../components/ui/input";
// import {
//   ArrowLeft, Users, Mail, Play, Eye, Loader2, CheckCircle,
//   Clock, Plus, Lock, ChevronRight, RotateCcw,
// } from "lucide-react";
// import { motion, AnimatePresence } from "motion/react";
// import { toast } from "sonner";
// import { projectId, publicAnonKey } from "../../../utils/supabase/info";

// const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;
// const HEADERS = { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` };

// // ─── Session metadata ─────────────────────────────────────────────────────────

// const SESSION_META = [
//   {
//     number: 1,
//     title: "Identity Discovery",
//     description: "Book of Life · Exit Bin · Discovery Landscape · Deck of Recognition · Dinner Table · Grounding & Draining · Recognition Word",
//     steps: 7,
//     color: "#4A1C5C",
//     lightBg: "#4A1C5C10",
//   },
//   {
//     number: 2,
//     title: "Identities In Reality",
//     description: "Re-Entry · Identity Selection · Identity Bridge · Energy Thermometer · Life Reality Grid · Alignment Reflection",
//     steps: 9,
//     color: "#3D6D6C",
//     lightBg: "#3D6D6C10",
//   },
//   {
//     number: 3,
//     title: "Future Self Exploration",
//     description: "Deepening the exploration of your most aligned identity and mapping the path forward.",
//     steps: 8,
//     color: "#D4A843",
//     lightBg: "#D4A84310",
//   },
//   {
//     number: 4,
//     title: "Integration & Next Steps",
//     description: "Bringing it all together — your commitments, support system, and first bold steps.",
//     steps: 6,
//     color: "#AA5D53",
//     lightBg: "#AA5D5310",
//   },
// ];

// // ─── Types ────────────────────────────────────────────────────────────────────

// type SessionStatus = "locked" | "available" | "in_progress" | "completed";

// interface SessionEntry {
//   id: string;
//   number: number;
//   status: SessionStatus;
// }

// interface Participant {
//   email: string;
//   linkedAt: string;
// }

// interface Journey {
//   id: string;
//   title: string;
//   description: string;
//   facilitatorId: string;
//   participantEmail: string | null;
//   participants: Participant[];
//   sessionId: string;
//   sessions: SessionEntry[];
//   status: string;
//   createdAt: string;
// }

// // ─── Status display helpers ───────────────────────────────────────────────────

// function StatusBadge({ status }: { status: SessionStatus }) {
//   const CONFIGS: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
//     locked:      { label: "Locked",      cls: "bg-gray-100 text-gray-500 border-gray-200",           icon: <Lock className="w-3 h-3" /> },
//     available:   { label: "Available",   cls: "bg-[#D4A843]/15 text-[#A07820] border-[#D4A843]/40", icon: <Play className="w-3 h-3" /> },
//     in_progress: { label: "In Progress", cls: "bg-[#3D6D6C]/15 text-[#3D6D6C] border-[#3D6D6C]/40", icon: <Clock className="w-3 h-3" /> },
//     completed:   { label: "Completed",   cls: "bg-[#4A1C5C]/15 text-[#4A1C5C] border-[#4A1C5C]/40", icon: <CheckCircle className="w-3 h-3" /> },
//   };
//   const cfg = CONFIGS[status] ?? CONFIGS.locked;
//   return (
//     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
//       {cfg.icon} {cfg.label}
//     </span>
//   );
// }

// function ActionButton({
//   status, sessionId, sessionNumber, isParticipant = false,
// }: {
//   status: SessionStatus; sessionId: string; sessionNumber: number; isParticipant?: boolean;
// }) {
//   const navigate = useNavigate();
//   const prefix = isParticipant ? "/participant" : "/facilitator";
//   const go = () => navigate(`${prefix}/session/${sessionId}/board`);

//   if (status === "locked") {
//     return (
//       <button disabled className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-gray-400 border border-gray-200 bg-gray-50 cursor-not-allowed">
//         <Lock className="w-3.5 h-3.5" /> Locked
//       </button>
//     );
//   }
//   if (status === "completed") {
//     return (
//       <button onClick={go} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border-2 border-[#4A1C5C]/30 text-[#4A1C5C] hover:bg-[#4A1C5C]/5 transition-colors">
//         <Eye className="w-3.5 h-3.5" /> Review Board
//       </button>
//     );
//   }
//   if (status === "in_progress") {
//     return (
//       <button onClick={go} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#3D6D6C] text-white hover:bg-[#2C5958] transition-colors shadow-sm">
//         <RotateCcw className="w-3.5 h-3.5" /> Resume Session
//       </button>
//     );
//   }
//   // available
//   return (
//     <button onClick={go} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#4A1C5C] text-white hover:bg-[#3A1C4C] transition-colors shadow-sm">
//       <Play className="w-3.5 h-3.5" /> Start Session {sessionNumber}
//     </button>
//   );
// }

// // ─── Session card ─────────────────────────────────────────────────────────────

// function SessionCard({ meta, entry, index }: {
//   meta: typeof SESSION_META[0];
//   entry: SessionEntry;
//   index: number;
// }) {
//   const isLocked = entry.status === "locked";
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 16 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ delay: index * 0.08 }}
//       className={`relative rounded-2xl border-2 p-5 sm:p-6 transition-all ${
//         isLocked
//           ? "border-border bg-white/50 opacity-70"
//           : "border-border bg-white hover:shadow-md hover:border-opacity-60"
//       }`}
//       style={isLocked ? {} : { borderColor: `${meta.color}30` }}
//     >
//       {/* Session number pill */}
//       <div
//         className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-white font-bold text-sm mb-4 shadow-sm"
//         style={{ backgroundColor: isLocked ? "#9CA3AF" : meta.color }}
//       >
//         {meta.number}
//       </div>

//       <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
//         <div className="min-w-0">
//           <h3 className="font-semibold text-foreground text-base leading-tight">
//             Session {meta.number} — {meta.title}
//           </h3>
//           <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{meta.description}</p>
//         </div>
//         <StatusBadge status={entry.status} />
//       </div>

//       <div className="flex items-center justify-between flex-wrap gap-3 mt-4">
//         <span className="text-xs text-muted-foreground">
//           {meta.steps} steps {isLocked ? "· Complete previous session to unlock" : ""}
//         </span>
//         <ActionButton status={entry.status} sessionId={entry.id} sessionNumber={meta.number} />
//       </div>

//       {/* Completed checkmark overlay */}
//       {entry.status === "completed" && (
//         <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#4A1C5C] flex items-center justify-center">
//           <CheckCircle className="w-3.5 h-3.5 text-white" />
//         </div>
//       )}
//     </motion.div>
//   );
// }

// // ─── Main ─────────────────────────────────────────────────────────────────────

// export default function JourneyDetail() {
//   const navigate = useNavigate();
//   const { id } = useParams<{ id: string }>();

//   const [journey, setJourney] = useState<Journey | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [linkEmail, setLinkEmail] = useState("");
//   const [linking, setLinking] = useState(false);
//   const [showAddParticipant, setShowAddParticipant] = useState(false);

//   // Session quick-select state
//   const [quickSession, setQuickSession] = useState<string>("");

//   useEffect(() => {
//     if (!id) return;
//     (async () => {
//       try {
//         const res = await fetch(`${API}/journeys/${id}`, { headers: HEADERS });
//         const data = await res.json();
//         if (data.success) {
//           const j = data.journey;
//           if (!j.participants) {
//             j.participants = j.participantEmail
//               ? [{ email: j.participantEmail, linkedAt: j.createdAt }]
//               : [];
//           }
//           setJourney(j);
//         } else {
//           toast.error("Journey not found.");
//         }
//       } catch {
//         toast.error("Failed to load journey.");
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [id]);

//   const linkParticipant = async () => {
//     if (!linkEmail.trim() || !id) return;
//     setLinking(true);
//     try {
//       const res = await fetch(`${API}/journeys/${id}/link`, {
//         method: "POST",
//         headers: HEADERS,
//         body: JSON.stringify({ participantEmail: linkEmail.trim() }),
//       });
//       const data = await res.json();
//       if (data.success) {
//         const j = data.journey;
//         if (!j.participants) j.participants = j.participantEmail ? [{ email: j.participantEmail, linkedAt: new Date().toISOString() }] : [];
//         setJourney(j);
//         setLinkEmail("");
//         toast.success(`${linkEmail.trim()} linked successfully!`);
//       } else {
//         toast.error(data.error || "Failed to link participant.");
//       }
//     } catch {
//       toast.error("Failed to link participant.");
//     } finally {
//       setLinking(false);
//     }
//   };

//   // Quick-select: navigate to the chosen session board
//   const handleQuickSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const val = e.target.value;
//     setQuickSession(val);
//     if (!val || !journey) return;
//     const session = journey.sessions.find(s => s.number === parseInt(val));
//     if (!session) return;
//     if (session.status === "locked") {
//       toast.error("This session is locked. Complete the previous session first.");
//       setQuickSession("");
//       return;
//     }
//     navigate(`/facilitator/session/${session.id}/board`);
//     setQuickSession("");
//   };

//   // ── Loading / error states ──

//   if (loading) {
//     return (
//       <DashboardLayout role="facilitator">
//         <div className="p-8 flex items-center justify-center min-h-64">
//           <Loader2 className="w-6 h-6 animate-spin text-[#4A1C5C]" />
//         </div>
//       </DashboardLayout>
//     );
//   }

//   if (!journey) {
//     return (
//       <DashboardLayout role="facilitator">
//         <div className="p-8 text-center">
//           <p className="text-muted-foreground mb-4">Journey not found.</p>
//           <Button onClick={() => navigate("/facilitator/dashboard")}>Back to Dashboard</Button>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   const sessions: SessionEntry[] = journey.sessions || [];
//   const participants = journey.participants || [];
//   const completedCount = sessions.filter(s => s.status === "completed").length;
//   const progressPct = Math.round((completedCount / 4) * 100);

//   return (
//     <DashboardLayout role="facilitator">
//       <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
//         {/* ── Back ── */}
//         <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
//           <Button variant="ghost" onClick={() => navigate("/facilitator/dashboard")} className="-ml-2 mb-4">
//             <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
//           </Button>

//           {/* Journey header */}
//           <div className="flex items-start justify-between gap-4 flex-wrap">
//             <div>
//               <h1 className="mb-1" style={{ fontFamily: "Playfair Display, serif" }}>{journey.title}</h1>
//               {journey.description && <p className="text-muted-foreground text-sm">{journey.description}</p>}
//             </div>
//             <Badge className={journey.status === "completed" ? "bg-[#3D6D6C] text-white" : "bg-[#D4A843] text-[#2C1810]"}>
//               {journey.status === "completed" ? "Journey Complete" : "Active Journey"}
//             </Badge>
//           </div>
//         </motion.div>

//         {/* ── Overall progress ── */}
//         <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
//           <Card className="p-5">
//             <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
//               <div>
//                 <p className="text-sm font-semibold text-foreground">Journey Progress</p>
//                 <p className="text-xs text-muted-foreground mt-0.5">{completedCount} of 4 sessions completed</p>
//               </div>
//               {/* Session Quick-Select dropdown */}
//               <div className="flex items-center gap-2">
//                 <label htmlFor="session-select" className="text-xs text-muted-foreground whitespace-nowrap">Open session:</label>
//                 <select
//                   id="session-select"
//                   value={quickSession}
//                   onChange={handleQuickSelect}
//                   className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#4A1C5C]/30 pr-8 cursor-pointer"
//                 >
//                   <option value="">Select Session ▾</option>
//                   {SESSION_META.map(meta => {
//                     const entry = sessions.find(s => s.number === meta.number);
//                     const status = entry?.status || "locked";
//                     const label = status === "locked" ? "🔒" : status === "completed" ? "✓" : status === "in_progress" ? "▶" : "▷";
//                     return (
//                       <option key={meta.number} value={meta.number} disabled={status === "locked"}>
//                         {label} Session {meta.number} — {meta.title}
//                       </option>
//                     );
//                   })}
//                 </select>
//               </div>
//             </div>
//             <div className="w-full bg-[#EBE2D6] rounded-full h-2.5">
//               <motion.div
//                 className="bg-[#4A1C5C] h-2.5 rounded-full transition-all"
//                 initial={{ width: 0 }}
//                 animate={{ width: `${progressPct}%` }}
//                 transition={{ duration: 0.6, delay: 0.2 }}
//               />
//             </div>
//             <div className="flex justify-between mt-1.5">
//               {SESSION_META.map(meta => {
//                 const entry = sessions.find(s => s.number === meta.number);
//                 const done = entry?.status === "completed";
//                 return (
//                   <span key={meta.number} className={`text-[10px] font-medium ${done ? "text-[#4A1C5C]" : "text-muted-foreground"}`}>
//                     S{meta.number}
//                   </span>
//                 );
//               })}
//             </div>
//           </Card>
//         </motion.div>

//         {/* ── Sessions ── */}
//         <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
//           <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Sessions</h3>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             {SESSION_META.map((meta, i) => {
//               const entry = sessions.find(s => s.number === meta.number);
//               if (!entry) return null;
//               return <SessionCard key={meta.number} meta={meta} entry={entry} index={i} />;
//             })}
//           </div>
//         </motion.div>

//         {/* ── Participants ── */}
//         <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
//           <Card className="p-5 sm:p-6">
//             <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
//               <div>
//                 <h3 className="font-semibold" style={{ color: "#3D6D6C" }}>Participants</h3>
//                 <p className="text-xs text-muted-foreground mt-0.5">
//                   {participants.length === 0 ? "No participants linked" : `${participants.length} linked`}
//                 </p>
//               </div>
//               <Button
//                 size="sm"
//                 onClick={() => setShowAddParticipant(v => !v)}
//                 className="bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810]"
//               >
//                 <Plus className="w-3.5 h-3.5 mr-1.5" />
//                 {showAddParticipant ? "Close" : "Add Participant"}
//               </Button>
//             </div>

//             {/* Add participant form */}
//             <AnimatePresence>
//               {showAddParticipant && (
//                 <motion.div
//                   initial={{ opacity: 0, height: 0 }}
//                   animate={{ opacity: 1, height: "auto" }}
//                   exit={{ opacity: 0, height: 0 }}
//                   className="overflow-hidden"
//                 >
//                   <div className="mb-4 p-4 bg-[#EBE2D6]/50 rounded-xl border border-border space-y-3">
//                     <p className="text-sm font-medium">Link participant by email</p>
//                     <p className="text-xs text-muted-foreground">
//                       They need a participant account. After linking they'll see this journey on their dashboard.
//                     </p>
//                     <div className="flex gap-2">
//                       <Input type="email" value={linkEmail} onChange={e => setLinkEmail(e.target.value)}
//                         placeholder="participant@example.com" className="h-10 flex-1"
//                         onKeyDown={e => e.key === "Enter" && linkParticipant()} autoFocus />
//                       <Button onClick={linkParticipant} disabled={linking || !linkEmail.trim()}
//                         className="bg-[#4A1C5C] hover:bg-[#3A1C4C] text-white h-10 px-4 flex-shrink-0">
//                         {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
//                       </Button>
//                     </div>
//                     <p className="text-xs text-muted-foreground">Input clears after linking so you can add another immediately.</p>
//                   </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>

//             {/* Participant list */}
//             {participants.length === 0 ? (
//               <div className="text-center py-8 text-muted-foreground">
//                 <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
//                 <p className="text-sm">No participants linked yet.</p>
//                 <p className="text-xs mt-1">Use the button above to invite by email.</p>
//               </div>
//             ) : (
//               <div className="space-y-2.5">
//                 {participants.map((p, i) => (
//                   <motion.div key={p.email} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
//                     className="flex items-center gap-3 p-3 bg-[#EBE2D6]/40 rounded-xl">
//                     <div className="w-8 h-8 rounded-full bg-[#3D6D6C] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
//                       {p.email[0].toUpperCase()}
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <p className="font-medium text-sm text-foreground truncate">{p.email}</p>
//                       <p className="text-xs text-muted-foreground">
//                         Linked {new Date(p.linkedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
//                       </p>
//                     </div>
//                     <Badge className="bg-[#3D6D6C] text-white text-xs flex-shrink-0">Linked</Badge>
//                   </motion.div>
//                 ))}
//               </div>
//             )}

//             {participants.length > 0 && (
//               <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 border border-blue-100">
//                 Participants join at <span className="font-mono font-medium">/participant/dashboard</span> using their participant account.
//               </div>
//             )}
//           </Card>
//         </motion.div>
//       </div>
//     </DashboardLayout>
//   );
// }


import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";

import DashboardLayout from "../../components/DashboardLayout";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";

import {
  ArrowLeft,
  Users,
  Mail,
  Play,
  Eye,
  Loader2,
  CheckCircle,
  Clock,
  Plus,
  Lock,
  RotateCcw,
  Trash2,
  AlertTriangle,
  X,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";

import {
  motion,
  AnimatePresence,
} from "motion/react";

import { toast } from "sonner";

import { createClient } from "../../../utils/supabase/client";
import { projectId } from "../../../utils/supabase/info";

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────

const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATED HEADERS
// ─────────────────────────────────────────────────────────────────────────────

async function getAuthenticatedHeaders(): Promise<HeadersInit> {
  const supabase = createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error("AUTHENTICATION_REQUIRED");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION METADATA
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_META = [
  {
    number: 1,
    title: "Identity Discovery",
    description:
      "Book of Life · Exit Bin · Discovery Landscape · Deck of Recognition · Dinner Table · Grounding & Draining · Recognition Word",
    steps: 7,
    color: "#4A1C5C",
  },
  {
    number: 2,
    title: "Identities In Reality",
    description:
      "Re-Entry · Identity Selection · Identity Bridge · Energy Thermometer · Life Reality Grid · Alignment Reflection",
    steps: 9,
    color: "#3D6D6C",
  },
  {
    number: 3,
    title: "Future Self Exploration",
    description:
      "Deepening the exploration of your most aligned identity and mapping the path forward.",
    steps: 4,
    color: "#D4A843",
  },
  {
    number: 4,
    title: "Integration & Next Steps",
    description:
      "Bringing it all together — your commitments, support system, and first bold steps.",
    steps: 7,
    color: "#AA5D53",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type SessionStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "completed";

interface SessionEntry {
  id: string;
  number: number;
  status: SessionStatus;
}

interface Participant {
  email: string;
  linkedAt?: string;
}

interface Journey {
  id: string;
  title: string;
  description: string;
  facilitatorId?: string;
  participantEmail: string | null;
  participants: Participant[];
  sessions: SessionEntry[];
  status: string;
  createdAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZATION
// ─────────────────────────────────────────────────────────────────────────────

function normalizeSession(
  raw: any
): SessionEntry | null {
  if (
    !raw ||
    typeof raw.id !== "string" ||
    !raw.id.trim()
  ) {
    return null;
  }

  const number = Number(raw.number);

  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > 4
  ) {
    return null;
  }

  const validStatuses: SessionStatus[] = [
    "locked",
    "available",
    "in_progress",
    "completed",
  ];

  const status: SessionStatus =
    validStatuses.includes(raw.status)
      ? raw.status
      : "locked";

  return {
    id: raw.id,
    number,
    status,
  };
}

function normalizeJourney(
  raw: any
): Journey | null {
  if (
    !raw ||
    typeof raw.id !== "string" ||
    !raw.id.trim() ||
    typeof raw.title !== "string"
  ) {
    return null;
  }

  const rawSessions = Array.isArray(raw.sessions)
    ? raw.sessions
    : [];

  const sessions = rawSessions
    .map(normalizeSession)
    .filter(
      (
        session: SessionEntry | null
      ): session is SessionEntry =>
        session !== null
    );

  const normalizedSessions: SessionEntry[] = [];

  for (let number = 1; number <= 4; number++) {
    const session = sessions.find(
      (item: SessionEntry) => item.number === number
    );

    if (session) {
      normalizedSessions.push(session);
    }
  }

  let participants: Participant[] = [];

  if (Array.isArray(raw.participants)) {
    participants = raw.participants
      .filter(
        (participant: any) =>
          participant &&
          typeof participant.email === "string" &&
          participant.email.trim()
      )
      .map((participant: any) => ({
        email: participant.email
          .trim()
          .toLowerCase(),
        linkedAt:
          typeof participant.linkedAt === "string"
            ? participant.linkedAt
            : undefined,
      }));
  }

  // Backward compatibility with older records.
  if (
    participants.length === 0 &&
    typeof raw.participantEmail === "string" &&
    raw.participantEmail.trim()
  ) {
    participants = [
      {
        email: raw.participantEmail
          .trim()
          .toLowerCase(),
        linkedAt:
          typeof raw.createdAt === "string"
            ? raw.createdAt
            : undefined,
      },
    ];
  }

  return {
    id: raw.id,

    title: raw.title,

    description:
      typeof raw.description === "string"
        ? raw.description
        : "",

    facilitatorId:
      typeof raw.facilitatorId === "string"
        ? raw.facilitatorId
        : undefined,

    participantEmail:
      typeof raw.participantEmail === "string"
        ? raw.participantEmail
            .trim()
            .toLowerCase()
        : participants[0]?.email || null,

    participants,

    sessions: normalizedSessions,

    status:
      typeof raw.status === "string"
        ? raw.status
        : "active",

    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({
  status,
}: {
  status: SessionStatus;
}) {
  const CONFIGS: Record<
    SessionStatus,
    {
      label: string;
      cls: string;
      icon: React.ReactNode;
    }
  > = {
    locked: {
      label: "Locked",
      cls:
        "bg-gray-100 text-gray-500 border-gray-200",
      icon: (
        <Lock className="w-3 h-3" />
      ),
    },

    available: {
      label: "Available",
      cls:
        "bg-[#D4A843]/15 text-[#A07820] border-[#D4A843]/40",
      icon: (
        <Play className="w-3 h-3" />
      ),
    },

    in_progress: {
      label: "In Progress",
      cls:
        "bg-[#3D6D6C]/15 text-[#3D6D6C] border-[#3D6D6C]/40",
      icon: (
        <Clock className="w-3 h-3" />
      ),
    },

    completed: {
      label: "Completed",
      cls:
        "bg-[#4A1C5C]/15 text-[#4A1C5C] border-[#4A1C5C]/40",
      icon: (
        <CheckCircle className="w-3 h-3" />
      ),
    },
  };

  const cfg =
    CONFIGS[status] ||
    CONFIGS.locked;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION ACTION BUTTON
// ─────────────────────────────────────────────────────────────────────────────

function ActionButton({
  status,
  journeyId,
  sessionId,
  sessionNumber,
  canEnable,
}: {
  status: SessionStatus;
  journeyId: string;
  sessionId: string;
  sessionNumber: number;
  canEnable: boolean;
}) {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  const go = async () => {
    if (!sessionId) {
      toast.error("Session ID is missing.");
      return;
    }

    if (status === "available") {
      setStarting(true);

      try {
        const headers = await getAuthenticatedHeaders();
        const response = await fetch(
          `${API}/sessions/${sessionId}/status`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({ status: "in_progress" }),
          }
        );
        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(data?.error || "Failed to start session.");
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to start session."
        );
        setStarting(false);
        return;
      }

      setStarting(false);
    }

    navigate(
      `/facilitator/session/${sessionId}/board`
    );
  };

  const enable = async () => {
    setStarting(true);

    try {
      const headers = await getAuthenticatedHeaders();
      const response = await fetch(
        `${API}/journeys/${journeyId}/sessions/${sessionNumber}/enable`,
        {
          method: "POST",
          headers,
        }
      );
      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Failed to enable session.");
      }

      navigate(
        `/facilitator/session/${sessionId}/board`
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to enable session."
      );
      setStarting(false);
    }
  };

  if (status === "locked") {
    if (!canEnable) {
      return (
        <button
          disabled
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
        >
          <Lock className="w-3.5 h-3.5" />
          Locked
        </button>
      );
    }

    return (
      <button
        onClick={enable}
        disabled={starting}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#4A1C5C] text-white hover:bg-[#3A1C4C] transition-colors shadow-sm"
      >
        {starting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
        {starting ? "Starting..." : `Start Session ${sessionNumber}`}
      </button>
    );
  }

  if (status === "completed") {
    return (
      <button
        onClick={go}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border-2 border-[#4A1C5C]/30 text-[#4A1C5C] hover:bg-[#4A1C5C]/5 transition-colors"
      >
        <Eye className="w-3.5 h-3.5" />
        Review Board
      </button>
    );
  }

  if (status === "in_progress") {
    return (
      <button
        onClick={go}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#3D6D6C] text-white hover:bg-[#2C5958] transition-colors shadow-sm"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Resume Session
      </button>
    );
  }

  return (
    <button
      onClick={go}
      disabled={starting}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#4A1C5C] text-white hover:bg-[#3A1C4C] transition-colors shadow-sm"
    >
      <Play className="w-3.5 h-3.5" />
      {starting ? "Starting..." : `Start Session ${sessionNumber}`}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION CARD
// ─────────────────────────────────────────────────────────────────────────────

function SessionCard({
  journeyId,
  meta,
  entry,
  index,
  previousCompleted,
}: {
  journeyId: string;
  meta: (typeof SESSION_META)[0];
  entry: SessionEntry;
  index: number;
  previousCompleted: boolean;
}) {
  const isLocked = entry.status === "locked";
  const canEnable = previousCompleted || meta.number === 1;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 16,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: index * 0.08,
      }}
      className={`relative rounded-2xl border-2 p-5 sm:p-6 transition-all ${
        isLocked && !canEnable
          ? "border-border bg-white/50 opacity-70"
          : "border-border bg-white hover:shadow-md"
      }`}
      style={
        isLocked && !canEnable
          ? {}
          : {
              borderColor: `${meta.color}30`,
            }
      }
    >
      <div
        className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-white font-bold text-sm mb-4 shadow-sm"
        style={{
          backgroundColor: isLocked && !canEnable ? "#9CA3AF" : meta.color,
        }}
      >
        {meta.number}
      </div>

      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground text-base leading-tight">
            Session {meta.number} — {meta.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {meta.description}
          </p>
        </div>
        <StatusBadge status={entry.status} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mt-4">
        <span className="text-xs text-muted-foreground">
          {meta.steps} steps{" "}
          {isLocked
            ? !canEnable
              ? `· Complete Session ${meta.number - 1} to unlock`
              : "· Ready to start"
            : ""}
        </span>

        <ActionButton
          status={entry.status}
          journeyId={journeyId}
          sessionId={entry.id}
          sessionNumber={meta.number}
          canEnable={canEnable}
        />
      </div>

      {entry.status === "completed" && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#4A1C5C] flex items-center justify-center">
          <CheckCircle className="w-3.5 h-3.5 text-white" />
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE CONFIRMATION MODAL
// ─────────────────────────────────────────────────────────────────────────────

function DeleteConfirmationModal({
  open,
  journeyTitle,
  deleting,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  journeyTitle: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
        >

          <motion.div
            className="absolute inset-0 bg-[#24152B]/55 backdrop-blur-sm"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={() => {
              if (!deleting) {
                onCancel();
              }
            }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-journey-title"
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-white/60"
            initial={{
              opacity: 0,
              scale: 0.94,
              y: 18,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.94,
              y: 18,
            }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 26,
            }}
          >

            <div className="h-1.5 bg-gradient-to-r from-[#AA5D53] via-[#AA5D53] to-[#D4A843]" />

            <div className="p-6 sm:p-7">

              <button
                type="button"
                onClick={onCancel}
                disabled={deleting}
                aria-label="Close"
                className="absolute right-4 top-4 w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-[#EBE2D6]/70 transition-colors disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex justify-center mb-5">

                <div className="relative">

                  <div className="absolute inset-0 rounded-2xl bg-[#AA5D53]/10 blur-xl" />

                  <div className="relative w-16 h-16 rounded-2xl bg-[#AA5D53]/10 border border-[#AA5D53]/20 flex items-center justify-center">

                    <div className="w-11 h-11 rounded-xl bg-[#AA5D53]/15 flex items-center justify-center">
                      <ShieldAlert className="w-6 h-6 text-[#AA5D53]" />
                    </div>

                  </div>

                </div>

              </div>

              <div className="text-center">

                <h2
                  id="delete-journey-title"
                  className="text-xl sm:text-2xl font-semibold text-[#2C1810]"
                  style={{
                    fontFamily:
                      "Playfair Display, serif",
                  }}
                >
                  Delete this journey?
                </h2>

                <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-sm mx-auto">
                  You are about to permanently
                  delete this Zest Journey.
                </p>

              </div>

              <div className="mt-5 rounded-2xl border border-[#AA5D53]/15 bg-[#EBE2D6]/45 p-4">

                <p className="text-[11px] uppercase tracking-wider font-semibold text-[#AA5D53] mb-1.5">
                  Journey
                </p>

                <p className="font-semibold text-[#2C1810] text-sm sm:text-base break-words">
                  {journeyTitle}
                </p>

              </div>

              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#AA5D53]/5 border border-[#AA5D53]/10 p-4">

                <AlertTriangle className="w-4 h-4 text-[#AA5D53] mt-0.5 flex-shrink-0" />

                <p className="text-xs sm:text-sm text-[#60443E] leading-relaxed">
                  This will permanently delete
                  all four sessions, session
                  boards, participant links,
                  and journey data.{" "}
                  <span className="font-semibold text-[#AA5D53]">
                    This action cannot be undone.
                  </span>
                </p>

              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">

                <button
                  type="button"
                  onClick={onCancel}
                  disabled={deleting}
                  className="flex-1 h-11 rounded-xl border border-border bg-white text-sm font-semibold text-foreground hover:bg-[#EBE2D6]/50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={deleting}
                  className="flex-1 h-11 rounded-xl bg-[#AA5D53] text-white text-sm font-semibold hover:bg-[#934C44] transition-all shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Journey
                    </>
                  )}
                </button>

              </div>

              <p className="text-[11px] text-center text-muted-foreground mt-4">
                Your facilitator and participant
                accounts will not be deleted.
              </p>

            </div>
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

export default function JourneyDetail() {
  const navigate = useNavigate();

  const { id } =
    useParams<{ id: string }>();

  const [journey, setJourney] =
    useState<Journey | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [linkEmail, setLinkEmail] =
    useState("");

  const [linking, setLinking] =
    useState(false);

  const [
    showAddParticipant,
    setShowAddParticipant,
  ] = useState(false);

  const [quickSession, setQuickSession] =
    useState("");

  const [deleting, setDeleting] =
    useState(false);

  const [
    showDeleteConfirm,
    setShowDeleteConfirm,
  ] = useState(false);

  // ───────────────────────────────────────────────────────────────────────────
  // LOAD JOURNEY
  // ───────────────────────────────────────────────────────────────────────────

  const loadJourney = async (
    showLoader = true
  ) => {
    if (!id) {
      setJourney(null);
      setLoading(false);
      return;
    }

    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const headers =
        await getAuthenticatedHeaders();

      const response =
        await fetch(
          `${API}/journeys/${encodeURIComponent(id)}`,
          {
            method: "GET",
            headers,
            cache: "no-store",
          }
        );

      let data: any = null;

      try {
        data =
          await response.json();
      } catch (jsonError) {
        console.error(
          "[journey-detail] Failed to parse response:",
          jsonError
        );
      }

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        throw new Error(
          "AUTHENTICATION_REQUIRED"
        );
      }

      if (
        response.status === 404
      ) {
        throw new Error(
          "JOURNEY_NOT_FOUND"
        );
      }

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.error ||
            "Failed to load journey."
        );
      }

      const normalized =
        normalizeJourney(
          data.journey
        );

      if (!normalized) {
        throw new Error(
          "Invalid journey data returned by server."
        );
      }

      setJourney(normalized);
    } catch (error) {
      console.error(
        "[journey-detail] Failed to load journey:",
        error
      );

      if (
        error instanceof Error &&
        error.message ===
          "AUTHENTICATION_REQUIRED"
      ) {
        toast.error(
          "Your login session has expired. Please sign in again."
        );

        navigate(
          "/facilitator/login",
          {
            replace: true,
          }
        );

        return;
      }

      if (
        error instanceof Error &&
        error.message ===
          "JOURNEY_NOT_FOUND"
      ) {
        toast.error(
          "Journey not found."
        );

        setJourney(null);

        return;
      }

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load journey."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // INITIAL LOAD
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadJourney();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ───────────────────────────────────────────────────────────────────────────
  // LINK PARTICIPANT
  // ───────────────────────────────────────────────────────────────────────────

  const linkParticipant =
    async () => {
      if (
        !linkEmail.trim() ||
        !id ||
        linking
      ) {
        return;
      }

      setLinking(true);

      try {
        const headers =
          await getAuthenticatedHeaders();

        const email =
          linkEmail
            .trim()
            .toLowerCase();

        const response =
          await fetch(
            `${API}/journeys/${encodeURIComponent(id)}/link`,
            {
              method: "POST",
              headers,
              body: JSON.stringify({
                participantEmail:
                  email,
              }),
            }
          );

        let data: any = null;

        try {
          data =
            await response.json();
        } catch (jsonError) {
          console.error(
            "[journey-detail] Failed to parse link response:",
            jsonError
          );
        }

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          throw new Error(
            "AUTHENTICATION_REQUIRED"
          );
        }

        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.error ||
              "Failed to link participant."
          );
        }

        const linkedJourney =
          normalizeJourney(
            data.journey
          );

        if (!linkedJourney) {
          throw new Error(
            "The server linked the participant but returned invalid journey data."
          );
        }

        setJourney(
          linkedJourney
        );

        setLinkEmail("");

        setShowAddParticipant(
          false
        );

        toast.success(
          `${email} linked successfully!`
        );

        // Refresh from backend so every page gets the same
        // persisted state.
        await loadJourney(false);
      } catch (error) {
        console.error(
          "[journey-detail] Link participant error:",
          error
        );

        if (
          error instanceof Error &&
          error.message ===
            "AUTHENTICATION_REQUIRED"
        ) {
          toast.error(
            "Your login session has expired. Please sign in again."
          );

          navigate(
            "/facilitator/login",
            {
              replace: true,
            }
          );

          return;
        }

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to link participant."
        );
      } finally {
        setLinking(false);
      }
    };

  // ───────────────────────────────────────────────────────────────────────────
  // DELETE JOURNEY
  // ───────────────────────────────────────────────────────────────────────────

  const deleteJourney =
    async () => {
      if (
        !id ||
        deleting
      ) {
        return;
      }

      setDeleting(true);

      try {
        const headers =
          await getAuthenticatedHeaders();

        const response =
          await fetch(
            `${API}/journeys/${encodeURIComponent(id)}`,
            {
              method: "DELETE",
              headers,
            }
          );

        let data: any = null;

        try {
          data =
            await response.json();
        } catch (jsonError) {
          console.error(
            "[journey-detail] Failed to parse delete response:",
            jsonError
          );
        }

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          throw new Error(
            "AUTHENTICATION_REQUIRED"
          );
        }

        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.error ||
              "Failed to delete journey."
          );
        }

        toast.success(
          "Journey deleted successfully."
        );

        setShowDeleteConfirm(
          false
        );

        navigate(
          "/facilitator/dashboard",
          {
            replace: true,
          }
        );
      } catch (error) {
        console.error(
          "[journey-detail] Delete journey error:",
          error
        );

        if (
          error instanceof Error &&
          error.message ===
            "AUTHENTICATION_REQUIRED"
        ) {
          toast.error(
            "Your login session has expired. Please sign in again."
          );

          navigate(
            "/facilitator/login",
            {
              replace: true,
            }
          );

          return;
        }

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to delete journey."
        );
      } finally {
        setDeleting(false);
      }
    };

  // ───────────────────────────────────────────────────────────────────────────
  // QUICK SESSION
  // ───────────────────────────────────────────────────────────────────────────

  const handleQuickSelect = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value =
      e.target.value;

    setQuickSession(value);

    if (
      !value ||
      !journey
    ) {
      return;
    }

    const session =
      journey.sessions.find(
        (item) =>
          item.number ===
          Number(value)
      );

    if (!session) {
      toast.error(
        "Session not found."
      );

      setQuickSession("");

      return;
    }

    if (
      session.status ===
      "locked"
    ) {
      toast.error(
        "This session is locked. Complete the previous session first."
      );

      setQuickSession("");

      return;
    }

    navigate(
      `/facilitator/session/${session.id}/board`
    );

    setQuickSession("");
  };

  // ───────────────────────────────────────────────────────────────────────────
  // LOADING
  // ───────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout role="facilitator">

        <div className="p-8 flex items-center justify-center min-h-64">

          <Loader2 className="w-6 h-6 animate-spin text-[#4A1C5C]" />

        </div>

      </DashboardLayout>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // NOT FOUND
  // ───────────────────────────────────────────────────────────────────────────

  if (!journey) {
    return (
      <DashboardLayout role="facilitator">

        <div className="p-8 text-center">

          <p className="text-muted-foreground mb-4">
            Journey not found.
          </p>

          <Button
            onClick={() =>
              navigate(
                "/facilitator/dashboard"
              )
            }
          >
            Back to Dashboard
          </Button>

        </div>

      </DashboardLayout>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // DERIVED DATA
  // ───────────────────────────────────────────────────────────────────────────

  const sessions =
    journey.sessions || [];

  const participants =
    journey.participants || [];

  const completedCount =
    sessions.filter(
      (session) =>
        session.status ===
        "completed"
    ).length;

  const progressPct =
    Math.min(
      100,
      Math.round(
        (completedCount / 4) *
          100
      )
    );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout role="facilitator">

      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">

        {/* ── Back + Header ─────────────────────────────────────────────── */}

        <motion.div
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mb-6"
        >

          <div className="flex items-center justify-between gap-3 mb-4">

            <Button
              variant="ghost"
              onClick={() =>
                navigate(
                  "/facilitator/dashboard"
                )
              }
              className="-ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                loadJourney(false)
              }
              disabled={
                refreshing
              }
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}

              <span className="hidden sm:inline ml-2">
                Refresh
              </span>
            </Button>

          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap">

            <div>

              <h1
                className="mb-1"
                style={{
                  fontFamily:
                    "Playfair Display, serif",
                }}
              >
                {journey.title}
              </h1>

              {journey.description && (
                <p className="text-muted-foreground text-sm">
                  {journey.description}
                </p>
              )}

            </div>

            <div className="flex items-center gap-2">

              <Badge
                className={
                  journey.status ===
                  "completed"
                    ? "bg-[#3D6D6C] text-white"
                    : "bg-[#D4A843] text-[#2C1810]"
                }
              >
                {journey.status ===
                "completed"
                  ? "Journey Complete"
                  : "Active Journey"}
              </Badge>

              <Button
                variant="outline"
                onClick={() =>
                  setShowDeleteConfirm(
                    true
                  )
                }
                disabled={deleting}
                className="border-[#AA5D53]/40 text-[#AA5D53] hover:bg-[#AA5D53]/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Journey
              </Button>

            </div>

          </div>

        </motion.div>

        {/* ── Delete Modal ─────────────────────────────────────────────── */}

        <DeleteConfirmationModal
          open={
            showDeleteConfirm
          }
          journeyTitle={
            journey.title
          }
          deleting={deleting}
          onCancel={() =>
            setShowDeleteConfirm(
              false
            )
          }
          onConfirm={
            deleteJourney
          }
        />

        {/* ── Overall Progress ─────────────────────────────────────────── */}

        <motion.div
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.05,
          }}
          className="mb-6"
        >

          <Card className="p-5">

            <div className="flex items-center justify-between mb-3 flex-wrap gap-3">

              <div>

                <p className="text-sm font-semibold text-foreground">
                  Journey Progress
                </p>

                <p className="text-xs text-muted-foreground mt-0.5">
                  {completedCount} of 4
                  sessions completed
                </p>

              </div>

              <div className="flex items-center gap-2">

                <label
                  htmlFor="session-select"
                  className="text-xs text-muted-foreground whitespace-nowrap"
                >
                  Open session:
                </label>

                <select
                  id="session-select"
                  value={
                    quickSession
                  }
                  onChange={
                    handleQuickSelect
                  }
                  className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#4A1C5C]/30 pr-8 cursor-pointer"
                >

                  <option value="">
                    Select Session ▾
                  </option>

                  {SESSION_META.map(
                    (meta) => {

                      const entry =
                        sessions.find(
                          (session) =>
                            session.number ===
                            meta.number
                        );

                      const status =
                        entry?.status ||
                        "locked";

                      const label =
                        status ===
                        "locked"
                          ? "🔒"
                          : status ===
                            "completed"
                          ? "✓"
                          : status ===
                            "in_progress"
                          ? "▶"
                          : "▷";

                      return (
                        <option
                          key={
                            meta.number
                          }
                          value={
                            meta.number
                          }
                          disabled={
                            status ===
                            "locked"
                          }
                        >
                          {label} Session{" "}
                          {meta.number} —{" "}
                          {meta.title}
                        </option>
                      );
                    }
                  )}

                </select>

              </div>

            </div>

            <div className="w-full bg-[#EBE2D6] rounded-full h-2.5">

              <motion.div
                className="bg-[#4A1C5C] h-2.5 rounded-full transition-all"
                initial={{
                  width: 0,
                }}
                animate={{
                  width: `${progressPct}%`,
                }}
                transition={{
                  duration: 0.6,
                  delay: 0.2,
                }}
              />

            </div>

            <div className="flex justify-between mt-1.5">

              {SESSION_META.map(
                (meta) => {

                  const entry =
                    sessions.find(
                      (session) =>
                        session.number ===
                        meta.number
                    );

                  const done =
                    entry?.status ===
                    "completed";

                  return (
                    <span
                      key={
                        meta.number
                      }
                      className={`text-[10px] font-medium ${
                        done
                          ? "text-[#4A1C5C]"
                          : "text-muted-foreground"
                      }`}
                    >
                      S{meta.number}
                    </span>
                  );
                }
              )}

            </div>

          </Card>

        </motion.div>

        {/* ── Sessions ─────────────────────────────────────────────────── */}

        <motion.div
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.1,
          }}
          className="mb-6"
        >

          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Sessions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {SESSION_META.map(
              (meta, i) => {
                const entry =
                  sessions.find(
                    (session) =>
                      session.number ===
                      meta.number
                  );

                if (!entry) {
                  return null;
                }

                const prevSession = meta.number > 1
                  ? sessions.find((s) => s.number === meta.number - 1)
                  : null;
                const isPreviousCompleted = meta.number === 1 || prevSession?.status === "completed";

                return (
                  <SessionCard
                    key={
                      meta.number
                    }
                    journeyId={journey.id}
                    meta={meta}
                    entry={entry}
                    index={i}
                    previousCompleted={isPreviousCompleted}
                  />
                );
              }
            )}

          </div>

        </motion.div>

        {/* ── Participants ─────────────────────────────────────────────── */}

        <motion.div
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.2,
          }}
        >

          <Card className="p-5 sm:p-6">

            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">

              <div>

                <h3
                  className="font-semibold"
                  style={{
                    color:
                      "#3D6D6C",
                  }}
                >
                  Participants
                </h3>

                <p className="text-xs text-muted-foreground mt-0.5">
                  {participants.length ===
                  0
                    ? "No participants linked"
                    : `${participants.length} linked`}
                </p>

              </div>

              <Button
                size="sm"
                onClick={() =>
                  setShowAddParticipant(
                    (value) =>
                      !value
                  )
                }
                className="bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810]"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />

                {showAddParticipant
                  ? "Close"
                  : "Add Participant"}
              </Button>

            </div>

            {/* Add participant */}

            <AnimatePresence>

              {showAddParticipant && (
                <motion.div
                  initial={{
                    opacity: 0,
                    height: 0,
                  }}
                  animate={{
                    opacity: 1,
                    height: "auto",
                  }}
                  exit={{
                    opacity: 0,
                    height: 0,
                  }}
                  className="overflow-hidden"
                >

                  <div className="mb-4 p-4 bg-[#EBE2D6]/50 rounded-xl border border-border space-y-3">

                    <p className="text-sm font-medium">
                      Link participant by
                      email
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Enter the email address
                      associated with the
                      participant's account.
                      Once linked, the journey
                      will appear on their
                      participant dashboard.
                    </p>

                    <div className="flex gap-2">

                      <Input
                        type="email"
                        value={
                          linkEmail
                        }
                        onChange={(e) =>
                          setLinkEmail(
                            e.target.value
                          )
                        }
                        placeholder="participant@example.com"
                        className="h-10 flex-1"
                        onKeyDown={(e) => {
                          if (
                            e.key ===
                            "Enter"
                          ) {
                            e.preventDefault();
                            linkParticipant();
                          }
                        }}
                        autoFocus
                      />

                      <Button
                        onClick={
                          linkParticipant
                        }
                        disabled={
                          linking ||
                          !linkEmail.trim()
                        }
                        className="bg-[#4A1C5C] hover:bg-[#3A1C4C] text-white h-10 px-4 flex-shrink-0"
                      >
                        {linking ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Mail className="w-4 h-4" />
                        )}
                      </Button>

                    </div>

                    <p className="text-xs text-muted-foreground">
                      After linking, the
                      participant can refresh
                      their dashboard to see
                      this journey.
                    </p>

                  </div>

                </motion.div>
              )}

            </AnimatePresence>

            {/* Participant list */}

            {participants.length ===
            0 ? (

              <div className="text-center py-8 text-muted-foreground">

                <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />

                <p className="text-sm">
                  No participants linked
                  yet.
                </p>

                <p className="text-xs mt-1">
                  Use the button above to
                  link a participant by
                  email.
                </p>

              </div>

            ) : (

              <div className="space-y-2.5">

                {participants.map(
                  (participant, index) => (

                    <motion.div
                      key={
                        participant.email
                      }
                      initial={{
                        opacity: 0,
                        x: -10,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      transition={{
                        delay:
                          index *
                          0.05,
                      }}
                      className="flex items-center gap-3 p-3 bg-[#EBE2E6]/40 rounded-xl"
                    >

                      <div className="w-8 h-8 rounded-full bg-[#3D6D6C] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {participant.email
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">

                        <p className="font-medium text-sm text-foreground truncate">
                          {
                            participant.email
                          }
                        </p>

                        {participant.linkedAt && (
                          <p className="text-xs text-muted-foreground">
                            Linked{" "}
                            {new Date(
                              participant.linkedAt
                            ).toLocaleDateString(
                              "en-US",
                              {
                                month:
                                  "short",
                                day:
                                  "numeric",
                                year:
                                  "numeric",
                              }
                            )}
                          </p>
                        )}

                      </div>

                      <Badge className="bg-[#3D6D6C] text-white text-xs flex-shrink-0">
                        Linked
                      </Badge>

                    </motion.div>

                  )
                )}

              </div>

            )}

            {participants.length >
              0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 border border-blue-100">

                Participants join at{" "}

                <span className="font-mono font-medium">
                  /participant/dashboard
                </span>{" "}

                using their participant
                account.

              </div>
            )}

          </Card>

        </motion.div>

      </div>

    </DashboardLayout>
  );
}