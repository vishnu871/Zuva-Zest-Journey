import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import DashboardLayout from "../../components/DashboardLayout";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import {
  ArrowLeft, Users, Mail, Play, Eye, Loader2, CheckCircle,
  Clock, Plus, Lock, ChevronRight, RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;
const HEADERS = { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` };

// ─── Session metadata ─────────────────────────────────────────────────────────

const SESSION_META = [
  {
    number: 1,
    title: "Identity Discovery",
    description: "Book of Life · Exit Bin · Discovery Landscape · Deck of Recognition · Dinner Table · Grounding & Draining · Recognition Word",
    steps: 7,
    color: "#4A1C5C",
    lightBg: "#4A1C5C10",
  },
  {
    number: 2,
    title: "Identities In Reality",
    description: "Re-Entry · Identity Selection · Identity Bridge · Energy Thermometer · Life Reality Grid · Alignment Reflection",
    steps: 9,
    color: "#3D6D6C",
    lightBg: "#3D6D6C10",
  },
  {
    number: 3,
    title: "Future Self Exploration",
    description: "Deepening the exploration of your most aligned identity and mapping the path forward.",
    steps: 8,
    color: "#D4A843",
    lightBg: "#D4A84310",
  },
  {
    number: 4,
    title: "Integration & Next Steps",
    description: "Bringing it all together — your commitments, support system, and first bold steps.",
    steps: 6,
    color: "#AA5D53",
    lightBg: "#AA5D5310",
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionStatus = "locked" | "available" | "in_progress" | "completed";

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

// ─── Status display helpers ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: SessionStatus }) {
  const CONFIGS: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    locked:      { label: "Locked",      cls: "bg-gray-100 text-gray-500 border-gray-200",           icon: <Lock className="w-3 h-3" /> },
    available:   { label: "Available",   cls: "bg-[#D4A843]/15 text-[#A07820] border-[#D4A843]/40", icon: <Play className="w-3 h-3" /> },
    in_progress: { label: "In Progress", cls: "bg-[#3D6D6C]/15 text-[#3D6D6C] border-[#3D6D6C]/40", icon: <Clock className="w-3 h-3" /> },
    completed:   { label: "Completed",   cls: "bg-[#4A1C5C]/15 text-[#4A1C5C] border-[#4A1C5C]/40", icon: <CheckCircle className="w-3 h-3" /> },
  };
  const cfg = CONFIGS[status] ?? CONFIGS.locked;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function ActionButton({
  status, sessionId, sessionNumber, isParticipant = false,
}: {
  status: SessionStatus; sessionId: string; sessionNumber: number; isParticipant?: boolean;
}) {
  const navigate = useNavigate();
  const prefix = isParticipant ? "/participant" : "/facilitator";
  const go = () => navigate(`${prefix}/session/${sessionId}/board`);

  if (status === "locked") {
    return (
      <button disabled className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-gray-400 border border-gray-200 bg-gray-50 cursor-not-allowed">
        <Lock className="w-3.5 h-3.5" /> Locked
      </button>
    );
  }
  if (status === "completed") {
    return (
      <button onClick={go} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border-2 border-[#4A1C5C]/30 text-[#4A1C5C] hover:bg-[#4A1C5C]/5 transition-colors">
        <Eye className="w-3.5 h-3.5" /> Review Board
      </button>
    );
  }
  if (status === "in_progress") {
    return (
      <button onClick={go} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#3D6D6C] text-white hover:bg-[#2C5958] transition-colors shadow-sm">
        <RotateCcw className="w-3.5 h-3.5" /> Resume Session
      </button>
    );
  }
  // available
  return (
    <button onClick={go} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#4A1C5C] text-white hover:bg-[#3A1C4C] transition-colors shadow-sm">
      <Play className="w-3.5 h-3.5" /> Start Session {sessionNumber}
    </button>
  );
}

// ─── Session card ─────────────────────────────────────────────────────────────

function SessionCard({ meta, entry, index }: {
  meta: typeof SESSION_META[0];
  entry: SessionEntry;
  index: number;
}) {
  const isLocked = entry.status === "locked";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`relative rounded-2xl border-2 p-5 sm:p-6 transition-all ${
        isLocked
          ? "border-border bg-white/50 opacity-70"
          : "border-border bg-white hover:shadow-md hover:border-opacity-60"
      }`}
      style={isLocked ? {} : { borderColor: `${meta.color}30` }}
    >
      {/* Session number pill */}
      <div
        className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-white font-bold text-sm mb-4 shadow-sm"
        style={{ backgroundColor: isLocked ? "#9CA3AF" : meta.color }}
      >
        {meta.number}
      </div>

      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground text-base leading-tight">
            Session {meta.number} — {meta.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{meta.description}</p>
        </div>
        <StatusBadge status={entry.status} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mt-4">
        <span className="text-xs text-muted-foreground">
          {meta.steps} steps {isLocked ? "· Complete previous session to unlock" : ""}
        </span>
        <ActionButton status={entry.status} sessionId={entry.id} sessionNumber={meta.number} />
      </div>

      {/* Completed checkmark overlay */}
      {entry.status === "completed" && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#4A1C5C] flex items-center justify-center">
          <CheckCircle className="w-3.5 h-3.5 text-white" />
        </div>
      )}
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function JourneyDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkEmail, setLinkEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);

  // Session quick-select state
  const [quickSession, setQuickSession] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`${API}/journeys/${id}`, { headers: HEADERS });
        const data = await res.json();
        if (data.success) {
          const j = data.journey;
          if (!j.participants) {
            j.participants = j.participantEmail
              ? [{ email: j.participantEmail, linkedAt: j.createdAt }]
              : [];
          }
          setJourney(j);
        } else {
          toast.error("Journey not found.");
        }
      } catch {
        toast.error("Failed to load journey.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const linkParticipant = async () => {
    if (!linkEmail.trim() || !id) return;
    setLinking(true);
    try {
      const res = await fetch(`${API}/journeys/${id}/link`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({ participantEmail: linkEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        const j = data.journey;
        if (!j.participants) j.participants = j.participantEmail ? [{ email: j.participantEmail, linkedAt: new Date().toISOString() }] : [];
        setJourney(j);
        setLinkEmail("");
        toast.success(`${linkEmail.trim()} linked successfully!`);
      } else {
        toast.error(data.error || "Failed to link participant.");
      }
    } catch {
      toast.error("Failed to link participant.");
    } finally {
      setLinking(false);
    }
  };

  // Quick-select: navigate to the chosen session board
  const handleQuickSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setQuickSession(val);
    if (!val || !journey) return;
    const session = journey.sessions.find(s => s.number === parseInt(val));
    if (!session) return;
    if (session.status === "locked") {
      toast.error("This session is locked. Complete the previous session first.");
      setQuickSession("");
      return;
    }
    navigate(`/facilitator/session/${session.id}/board`);
    setQuickSession("");
  };

  // ── Loading / error states ──

  if (loading) {
    return (
      <DashboardLayout role="facilitator">
        <div className="p-8 flex items-center justify-center min-h-64">
          <Loader2 className="w-6 h-6 animate-spin text-[#4A1C5C]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!journey) {
    return (
      <DashboardLayout role="facilitator">
        <div className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Journey not found.</p>
          <Button onClick={() => navigate("/facilitator/dashboard")}>Back to Dashboard</Button>
        </div>
      </DashboardLayout>
    );
  }

  const sessions: SessionEntry[] = journey.sessions || [];
  const participants = journey.participants || [];
  const completedCount = sessions.filter(s => s.status === "completed").length;
  const progressPct = Math.round((completedCount / 4) * 100);

  return (
    <DashboardLayout role="facilitator">
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        {/* ── Back ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/facilitator/dashboard")} className="-ml-2 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>

          {/* Journey header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="mb-1" style={{ fontFamily: "Playfair Display, serif" }}>{journey.title}</h1>
              {journey.description && <p className="text-muted-foreground text-sm">{journey.description}</p>}
            </div>
            <Badge className={journey.status === "completed" ? "bg-[#3D6D6C] text-white" : "bg-[#D4A843] text-[#2C1810]"}>
              {journey.status === "completed" ? "Journey Complete" : "Active Journey"}
            </Badge>
          </div>
        </motion.div>

        {/* ── Overall progress ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Journey Progress</p>
                <p className="text-xs text-muted-foreground mt-0.5">{completedCount} of 4 sessions completed</p>
              </div>
              {/* Session Quick-Select dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="session-select" className="text-xs text-muted-foreground whitespace-nowrap">Open session:</label>
                <select
                  id="session-select"
                  value={quickSession}
                  onChange={handleQuickSelect}
                  className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#4A1C5C]/30 pr-8 cursor-pointer"
                >
                  <option value="">Select Session ▾</option>
                  {SESSION_META.map(meta => {
                    const entry = sessions.find(s => s.number === meta.number);
                    const status = entry?.status || "locked";
                    const label = status === "locked" ? "🔒" : status === "completed" ? "✓" : status === "in_progress" ? "▶" : "▷";
                    return (
                      <option key={meta.number} value={meta.number} disabled={status === "locked"}>
                        {label} Session {meta.number} — {meta.title}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            <div className="w-full bg-[#EBE2D6] rounded-full h-2.5">
              <motion.div
                className="bg-[#4A1C5C] h-2.5 rounded-full transition-all"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              {SESSION_META.map(meta => {
                const entry = sessions.find(s => s.number === meta.number);
                const done = entry?.status === "completed";
                return (
                  <span key={meta.number} className={`text-[10px] font-medium ${done ? "text-[#4A1C5C]" : "text-muted-foreground"}`}>
                    S{meta.number}
                  </span>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* ── Sessions ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Sessions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SESSION_META.map((meta, i) => {
              const entry = sessions.find(s => s.number === meta.number);
              if (!entry) return null;
              return <SessionCard key={meta.number} meta={meta} entry={entry} index={i} />;
            })}
          </div>
        </motion.div>

        {/* ── Participants ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-semibold" style={{ color: "#3D6D6C" }}>Participants</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {participants.length === 0 ? "No participants linked" : `${participants.length} linked`}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowAddParticipant(v => !v)}
                className="bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810]"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                {showAddParticipant ? "Close" : "Add Participant"}
              </Button>
            </div>

            {/* Add participant form */}
            <AnimatePresence>
              {showAddParticipant && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mb-4 p-4 bg-[#EBE2D6]/50 rounded-xl border border-border space-y-3">
                    <p className="text-sm font-medium">Link participant by email</p>
                    <p className="text-xs text-muted-foreground">
                      They need a participant account. After linking they'll see this journey on their dashboard.
                    </p>
                    <div className="flex gap-2">
                      <Input type="email" value={linkEmail} onChange={e => setLinkEmail(e.target.value)}
                        placeholder="participant@example.com" className="h-10 flex-1"
                        onKeyDown={e => e.key === "Enter" && linkParticipant()} autoFocus />
                      <Button onClick={linkParticipant} disabled={linking || !linkEmail.trim()}
                        className="bg-[#4A1C5C] hover:bg-[#3A1C4C] text-white h-10 px-4 flex-shrink-0">
                        {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Input clears after linking so you can add another immediately.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Participant list */}
            {participants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No participants linked yet.</p>
                <p className="text-xs mt-1">Use the button above to invite by email.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {participants.map((p, i) => (
                  <motion.div key={p.email} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 bg-[#EBE2D6]/40 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-[#3D6D6C] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {p.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{p.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Linked {new Date(p.linkedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <Badge className="bg-[#3D6D6C] text-white text-xs flex-shrink-0">Linked</Badge>
                  </motion.div>
                ))}
              </div>
            )}

            {participants.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 border border-blue-100">
                Participants join at <span className="font-mono font-medium">/participant/dashboard</span> using their participant account.
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
