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
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  projectId,
  publicAnonKey,
} from "../../../utils/supabase/info";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;

const HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${publicAnonKey}`,
};

// ─── Session metadata ─────────────────────────────────────────────────────────

const SESSION_META = [
  {
    number: 1,
    title: "Identity Discovery",
    description:
      "Book of Life · Exit Bin · Discovery Landscape · Deck of Recognition · Dinner Table · Grounding & Draining · Recognition Word",
    steps: 7,
    color: "#4A1C5C",
    lightBg: "#4A1C5C10",
  },
  {
    number: 2,
    title: "Identities In Reality",
    description:
      "Re-Entry · Identity Selection · Identity Bridge · Energy Thermometer · Life Reality Grid · Alignment Reflection",
    steps: 9,
    color: "#3D6D6C",
    lightBg: "#3D6D6C10",
  },
  {
    number: 3,
    title: "Future Self Exploration",
    description:
      "Deepening the exploration of your most aligned identity and mapping the path forward.",
    steps: 8,
    color: "#D4A843",
    lightBg: "#D4A84310",
  },
  {
    number: 4,
    title: "Integration & Next Steps",
    description:
      "Bringing it all together — your commitments, support system, and first bold steps.",
    steps: 6,
    color: "#AA5D53",
    lightBg: "#AA5D5310",
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

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
  linkedAt: string;
}

interface Journey {
  id: string;
  title: string;
  description: string;
  facilitatorId: string;
  participantEmail: string | null;
  participants: Participant[];
  sessionId: string;
  sessions: SessionEntry[];
  status: string;
  createdAt: string;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({
  status,
}: {
  status: SessionStatus;
}) {
  const CONFIGS: Record<
    string,
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
      icon: <Lock className="w-3 h-3" />,
    },

    available: {
      label: "Available",
      cls:
        "bg-[#D4A843]/15 text-[#A07820] border-[#D4A843]/40",
      icon: <Play className="w-3 h-3" />,
    },

    in_progress: {
      label: "In Progress",
      cls:
        "bg-[#3D6D6C]/15 text-[#3D6D6C] border-[#3D6D6C]/40",
      icon: <Clock className="w-3 h-3" />,
    },

    completed: {
      label: "Completed",
      cls:
        "bg-[#4A1C5C]/15 text-[#4A1C5C] border-[#4A1C5C]/40",
      icon: <CheckCircle className="w-3 h-3" />,
    },
  };

  const cfg =
    CONFIGS[status] ?? CONFIGS.locked;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Session action button ────────────────────────────────────────────────────

function ActionButton({
  status,
  sessionId,
  sessionNumber,
  isParticipant = false,
}: {
  status: SessionStatus;
  sessionId: string;
  sessionNumber: number;
  isParticipant?: boolean;
}) {
  const navigate = useNavigate();

  const prefix = isParticipant
    ? "/participant"
    : "/facilitator";

  const go = () => {
    navigate(
      `${prefix}/session/${sessionId}/board`
    );
  };

  if (status === "locked") {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-gray-400 border border-gray-200 bg-gray-50 cursor-not-allowed"
      >
        <Lock className="w-3.5 h-3.5" />
        Locked
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
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#4A1C5C] text-white hover:bg-[#3A1C4C] transition-colors shadow-sm"
    >
      <Play className="w-3.5 h-3.5" />
      Start Session {sessionNumber}
    </button>
  );
}

// ─── Session card ─────────────────────────────────────────────────────────────

function SessionCard({
  meta,
  entry,
  index,
}: {
  meta: typeof SESSION_META[0];
  entry: SessionEntry;
  index: number;
}) {
  const isLocked =
    entry.status === "locked";

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
        isLocked
          ? "border-border bg-white/50 opacity-70"
          : "border-border bg-white hover:shadow-md hover:border-opacity-60"
      }`}
      style={
        isLocked
          ? {}
          : {
              borderColor:
                `${meta.color}30`,
            }
      }
    >
      <div
        className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-white font-bold text-sm mb-4 shadow-sm"
        style={{
          backgroundColor:
            isLocked
              ? "#9CA3AF"
              : meta.color,
        }}
      >
        {meta.number}
      </div>

      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground text-base leading-tight">
            Session {meta.number} —{" "}
            {meta.title}
          </h3>

          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {meta.description}
          </p>
        </div>

        <StatusBadge
          status={entry.status}
        />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mt-4">
        <span className="text-xs text-muted-foreground">
          {meta.steps} steps{" "}
          {isLocked
            ? "· Complete previous session to unlock"
            : ""}
        </span>

        <ActionButton
          status={entry.status}
          sessionId={entry.id}
          sessionNumber={meta.number}
        />
      </div>

      {entry.status ===
        "completed" && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#4A1C5C] flex items-center justify-center">
          <CheckCircle className="w-3.5 h-3.5 text-white" />
        </div>
      )}
    </motion.div>
  );
}

// ─── Delete confirmation modal ────────────────────────────────────────────────

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
          {/* Backdrop */}

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

          {/* Modal */}

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
            {/* Top accent */}

            <div className="h-1.5 bg-gradient-to-r from-[#AA5D53] via-[#AA5D53] to-[#D4A843]" />

            <div className="p-6 sm:p-7">
              {/* Close button */}

              <button
                type="button"
                onClick={onCancel}
                disabled={deleting}
                aria-label="Close"
                className="absolute right-4 top-4 w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-[#EBE2D6]/70 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Warning icon */}

              <div className="flex justify-center mb-5">
                <motion.div
                  initial={{
                    scale: 0.7,
                    opacity: 0,
                  }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                  }}
                  transition={{
                    delay: 0.08,
                    type: "spring",
                    stiffness: 350,
                    damping: 20,
                  }}
                  className="relative"
                >
                  <div className="absolute inset-0 rounded-2xl bg-[#AA5D53]/10 blur-xl" />

                  <div className="relative w-16 h-16 rounded-2xl bg-[#AA5D53]/10 border border-[#AA5D53]/20 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-xl bg-[#AA5D53]/15 flex items-center justify-center">
                      <ShieldAlert className="w-6 h-6 text-[#AA5D53]" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Heading */}

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

              {/* Journey name */}

              <div className="mt-5 rounded-2xl border border-[#AA5D53]/15 bg-[#EBE2D6]/45 p-4">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-[#AA5D53] mb-1.5">
                  Journey
                </p>

                <p className="font-semibold text-[#2C1810] text-sm sm:text-base break-words">
                  {journeyTitle}
                </p>
              </div>

              {/* Warning */}

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

              {/* Actions */}

              <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={deleting}
                  className="flex-1 h-11 rounded-xl border border-border bg-white text-sm font-semibold text-foreground hover:bg-[#EBE2D6]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={deleting}
                  className="flex-1 h-11 rounded-xl bg-[#AA5D53] text-white text-sm font-semibold hover:bg-[#934C44] transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

              {/* Small reassurance */}

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

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function JourneyDetail() {
  const navigate = useNavigate();

  const { id } =
    useParams<{ id: string }>();

  const [journey, setJourney] =
    useState<Journey | null>(null);

  const [loading, setLoading] =
    useState(true);

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

  // ─── Load journey ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const res = await fetch(
          `${API}/journeys/${id}`,
          {
            headers: HEADERS,
          }
        );

        const data =
          await res.json();

        if (data.success) {
          const j =
            data.journey;

          if (!j.participants) {
            j.participants =
              j.participantEmail
                ? [
                    {
                      email:
                        j.participantEmail,
                      linkedAt:
                        j.createdAt,
                    },
                  ]
                : [];
          }

          setJourney(j);
        } else {
          toast.error(
            data.error ||
              "Journey not found."
          );
        }
      } catch (error) {
        console.error(
          "Failed to load journey:",
          error
        );

        toast.error(
          "Failed to load journey."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ─── Link participant ──────────────────────────────────────────────────────

  const linkParticipant = async () => {
    if (
      !linkEmail.trim() ||
      !id
    ) {
      return;
    }

    setLinking(true);

    try {
      const email =
        linkEmail.trim();

      const res = await fetch(
        `${API}/journeys/${id}/link`,
        {
          method: "POST",
          headers: HEADERS,
          body: JSON.stringify({
            participantEmail:
              email,
          }),
        }
      );

      const data =
        await res.json();

      if (data.success) {
        const j =
          data.journey;

        if (!j.participants) {
          j.participants =
            j.participantEmail
              ? [
                  {
                    email:
                      j.participantEmail,
                    linkedAt:
                      new Date().toISOString(),
                  },
                ]
              : [];
        }

        setJourney(j);
        setLinkEmail("");

        toast.success(
          `${email} linked successfully!`
        );
      } else {
        toast.error(
          data.error ||
            "Failed to link participant."
        );
      }
    } catch (error) {
      console.error(
        "Link participant error:",
        error
      );

      toast.error(
        "Failed to link participant."
      );
    } finally {
      setLinking(false);
    }
  };

  // ─── Delete journey ────────────────────────────────────────────────────────

  const deleteJourney = async () => {
    if (
      !id ||
      deleting
    ) {
      return;
    }

    setDeleting(true);

    try {
      const res = await fetch(
        `${API}/journeys/${id}`,
        {
          method: "DELETE",
          headers: HEADERS,
        }
      );

      const data =
        await res.json();

      if (
        !res.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Failed to delete journey."
        );
      }

      toast.success(
        "Journey deleted successfully."
      );

      setShowDeleteConfirm(false);

      setTimeout(() => {
        navigate(
          "/facilitator/dashboard",
          {
            replace: true,
          }
        );
      }, 500);
    } catch (error) {
      console.error(
        "Delete journey error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete journey."
      );

      setDeleting(false);
    }
  };

  // ─── Quick session ─────────────────────────────────────────────────────────

  const handleQuickSelect = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const val =
      e.target.value;

    setQuickSession(val);

    if (
      !val ||
      !journey
    ) {
      return;
    }

    const session =
      journey.sessions.find(
        (s) =>
          s.number ===
          parseInt(val)
      );

    if (!session) {
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

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout role="facilitator">
        <div className="p-8 flex items-center justify-center min-h-64">
          <Loader2 className="w-6 h-6 animate-spin text-[#4A1C5C]" />
        </div>
      </DashboardLayout>
    );
  }

  // ─── Not found ─────────────────────────────────────────────────────────────

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

  const sessions: SessionEntry[] =
    journey.sessions || [];

  const participants =
    journey.participants || [];

  const completedCount =
    sessions.filter(
      (s) =>
        s.status ===
        "completed"
    ).length;

  const progressPct =
    Math.round(
      (completedCount / 4) *
        100
    );

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
          <Button
            variant="ghost"
            onClick={() =>
              navigate(
                "/facilitator/dashboard"
              )
            }
            className="-ml-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

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
                className="border-[#AA5D53]/40 text-[#AA5D53] hover:bg-[#AA5D53]/10 hover:text-[#AA5D53]"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Journey
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ── Delete Confirmation Modal ────────────────────────────────── */}

        <DeleteConfirmationModal
          open={showDeleteConfirm}
          journeyTitle={journey.title}
          deleting={deleting}
          onCancel={() =>
            setShowDeleteConfirm(false)
          }
          onConfirm={deleteJourney}
        />

        {/* ── Overall progress ─────────────────────────────────────────── */}

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
                          (s) =>
                            s.number ===
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
                      (s) =>
                        s.number ===
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
                    (s) =>
                      s.number ===
                      meta.number
                  );

                if (!entry) {
                  return null;
                }

                return (
                  <SessionCard
                    key={
                      meta.number
                    }
                    meta={meta}
                    entry={entry}
                    index={i}
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
                    (v) => !v
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
                      They need a participant
                      account. After linking
                      they'll see this journey
                      on their dashboard.
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
                        onKeyDown={(e) =>
                          e.key ===
                            "Enter" &&
                          linkParticipant()
                        }
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
                      Input clears after
                      linking so you can add
                      another immediately.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                  invite by email.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {participants.map(
                  (p, i) => (
                    <motion.div
                      key={
                        p.email
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
                          i * 0.05,
                      }}
                      className="flex items-center gap-3 p-3 bg-[#EBE2E6]/40 rounded-xl"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#3D6D6C] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {p.email[0].toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {p.email}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Linked{" "}
                          {new Date(
                            p.linkedAt
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