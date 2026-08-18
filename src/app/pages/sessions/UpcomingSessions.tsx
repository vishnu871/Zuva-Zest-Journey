import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import DashboardLayout from "../../components/DashboardLayout";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  ArrowLeft, Calendar, FolderOpen, Users, Play, Eye, RotateCcw,
  Loader2, CheckCircle, Lock, Clock, Plus,
} from "lucide-react";
import { motion } from "motion/react";
import { createClient } from "@/utils/supabase/client";
import { projectId, publicAnonKey } from "@/utils/supabase/info";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;
const HEADERS = { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` };

type SessionStatus = "locked" | "available" | "in_progress" | "completed";

interface SessionEntry { id: string; number: number; status: SessionStatus; }

interface Journey {
  id: string;
  title: string;
  description: string;
  facilitatorId: string;
  participantEmail: string | null;
  participants: { email: string; linkedAt: string }[];
  sessions: SessionEntry[];
  status: string;
  createdAt: string;
}

const SESSION_NAMES = [
  "Identity Discovery",
  "Identities In Reality",
  "Experiment Design",
  "What I Tried",
];

const SESSION_COLORS: Record<SessionStatus, string> = {
  locked:      "#9CA3AF",
  available:   "#D4A843",
  in_progress: "#3D6D6C",
  completed:   "#4A1C5C",
};

function StatusBadge({ status }: { status: SessionStatus }) {
  const labels: Record<SessionStatus, string> = {
    locked: "Locked", available: "Available", in_progress: "In Progress", completed: "Completed",
  };
  const icons: Record<SessionStatus, React.ReactNode> = {
    locked:      <Lock className="w-3 h-3" />,
    available:   <Clock className="w-3 h-3" />,
    in_progress: <Play className="w-3 h-3" />,
    completed:   <CheckCircle className="w-3 h-3" />,
  };
  const color = SESSION_COLORS[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
      style={{ borderColor: `${color}40`, color, backgroundColor: `${color}10` }}>
      {icons[status]} {labels[status]}
    </span>
  );
}

export default function UpcomingSessions() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.pathname.startsWith("/participant") ? "participant" : "facilitator";
  const dashboardPath = role === "facilitator" ? "/facilitator/dashboard" : "/participant/dashboard";
  const isParticipant = role === "participant";

  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate(isParticipant ? "/participant/login" : "/facilitator/login"); return; }

        setUserName(user.user_metadata?.name?.split(" ")[0] || "");
        setUserEmail(user.email || "");

        let res;
        if (isParticipant) {
          res = await fetch(`${API}/journeys/participant/${encodeURIComponent(user.email || "")}`, { headers: HEADERS });
        } else {
          res = await fetch(`${API}/journeys/facilitator/${user.id}`, { headers: HEADERS });
        }

        const data = await res.json();
        if (data.success) setJourneys(data.journeys);
      } catch (e) {
        console.error("Failed to load journeys:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isParticipant]);

  const openSession = (session: SessionEntry) => {
    const prefix = isParticipant ? "/participant" : "/facilitator";
    navigate(`${prefix}/session/${session.id}/board`);
  };

  // Flatten journeys into session rows for display
  const sessionRows = journeys.flatMap(journey =>
    (journey.sessions || []).map(sess => ({ journey, session: sess }))
  );

  // Stats
  const activeCount = sessionRows.filter(r => r.session.status === "in_progress").length;
  const availableCount = sessionRows.filter(r => r.session.status === "available").length;
  const completedCount = sessionRows.filter(r => r.session.status === "completed").length;

  return (
    <DashboardLayout role={role}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" onClick={() => navigate(dashboardPath)} className="mb-4 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
          <h1 className="mb-2" style={{ fontFamily: "Playfair Display, serif" }}>Sessions</h1>
          <p className="text-muted-foreground">
            {isParticipant ? "Your journey sessions" : "All sessions across your journeys"}
          </p>
        </motion.div>

        {/* Stats */}
        {!loading && journeys.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {[
              { label: "Total Sessions",  value: sessionRows.length,  color: "#4A1C5C" },
              { label: "In Progress",     value: activeCount,          color: "#3D6D6C" },
              { label: "Available",       value: availableCount,       color: "#D4A843" },
              { label: "Completed",       value: completedCount,       color: "#AA5D53" },
            ].map(s => (
              <Card key={s.label} className="p-4 sm:p-5">
                <p className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{s.label}</p>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Session list */}
        {loading ? (
          <Card className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#4A1C5C]" />
          </Card>
        ) : journeys.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-25" />
              <h4 className="font-semibold text-foreground mb-2">No sessions available yet</h4>
              <p className="text-sm text-muted-foreground mb-6">
                {isParticipant
                  ? "Your facilitator hasn't linked you to a journey yet."
                  : "Create a journey to generate sessions automatically."}
              </p>
              {!isParticipant && (
                <Button onClick={() => navigate("/facilitator/journey/create")}
                  className="bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810]">
                  <Plus className="w-4 h-4 mr-2" /> Create Journey
                </Button>
              )}
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {journeys.map((journey, ji) => {
              const sessions = journey.sessions || [];
              const completedSessions = sessions.filter(s => s.status === "completed").length;

              return (
                <motion.div key={journey.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ji * 0.07 }}>
                  {/* Journey header */}
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-[#4A1C5C]" />
                      <span className="font-semibold text-foreground">{journey.title}</span>
                      <Badge className={journey.status === "completed" ? "bg-[#3D6D6C] text-white" : "bg-[#D4A843]/20 text-[#A07820]"}>
                        {journey.status === "completed" ? "Complete" : "Active"}
                      </Badge>
                    </div>
                    {journey.participantEmail && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {journey.participantEmail}
                        {(journey.participants?.length || 0) > 1 && ` +${journey.participants.length - 1}`}
                      </span>
                    )}
                  </div>

                  {/* Session cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                    {sessions.map((sess, si) => {
                      const name = SESSION_NAMES[sess.number - 1] || `Session ${sess.number}`;
                      const color = SESSION_COLORS[sess.status];
                      const isLocked = sess.status === "locked";
                      const canOpen = !isLocked;

                      return (
                        <div key={sess.id}
                          className={`bg-white rounded-xl border-2 p-4 transition-all ${canOpen && !isParticipant ? "hover:shadow-md cursor-pointer" : ""} ${isParticipant && canOpen ? "hover:shadow-md cursor-pointer" : ""}`}
                          style={{ borderColor: isLocked ? "#E5E7EB" : `${color}25` }}
                          onClick={() => canOpen ? openSession(sess) : undefined}
                        >
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                style={{ backgroundColor: isLocked ? "#9CA3AF" : color }}>
                                {sess.number}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">Session {sess.number}</p>
                                <p className="font-semibold text-sm text-foreground leading-tight truncate">{name}</p>
                              </div>
                            </div>
                            <StatusBadge status={sess.status} />
                          </div>

                          {/* Action */}
                          {canOpen && (
                            <button
                              onClick={e => { e.stopPropagation(); openSession(sess); }}
                              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                              style={{ backgroundColor: color }}
                            >
                              {sess.status === "completed"
                                ? <><Eye className="w-3.5 h-3.5" /> Review Board</>
                                : sess.status === "in_progress"
                                ? <><RotateCcw className="w-3.5 h-3.5" /> Resume Session</>
                                : <><Play className="w-3.5 h-3.5" /> {isParticipant ? "Join Session" : "Start Session"}</>
                              }
                            </button>
                          )}

                          {isLocked && (
                            <div className="flex items-center justify-center gap-1.5 py-2 text-xs text-gray-400">
                              <Lock className="w-3 h-3" /> Locked
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-2 px-1">
                    <div className="flex-1 bg-[#EBE2D6] rounded-full h-1.5">
                      <div className="bg-[#4A1C5C] h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.round((completedSessions / 4) * 100)}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{completedSessions}/4 complete</span>
                  </div>

                  {/* Divider between journeys */}
                  {ji < journeys.length - 1 && <div className="border-t border-border mt-5" />}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
