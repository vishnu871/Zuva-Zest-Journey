import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import DashboardLayout from "../../components/DashboardLayout";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { ArrowLeft, Search, CheckCircle, Users, Loader2, FileText } from "lucide-react";
import { motion } from "motion/react";
import { createClient } from "../../../utils/supabase/client";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;
const HEADERS = { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` };

const SESSION_NAMES: Record<number, string> = {
  1: "Identity Discovery",
  2: "Identities In Reality",
  3: "Experiment Design",
  4: "What I Tried",
};

interface CompletedSession {
  sessionId: string;
  sessionNumber: number;
  journeyTitle: string;
  journeyId: string;
  participantCount: number;
}

export default function SessionHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sessions, setSessions] = useState<CompletedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const role = location.pathname.startsWith("/participant") ? "participant" : "facilitator";
  const dashboardPath = role === "facilitator" ? "/facilitator/dashboard" : "/participant/dashboard";

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate(dashboardPath); return; }

        let res: Response;
        if (role === "facilitator") {
          res = await fetch(`${API}/journeys/facilitator/${user.id}`, { headers: HEADERS });
        } else {
          res = await fetch(`${API}/journeys/participant/${encodeURIComponent(user.email || "")}`, { headers: HEADERS });
        }
        const data = await res.json();
        if (!data.success) return;

        // Extract completed sessions from every journey
        const completed: CompletedSession[] = [];
        for (const journey of data.journeys as any[]) {
          for (const s of (journey.sessions || []) as any[]) {
            if (s.status === "completed") {
              completed.push({
                sessionId: s.id,
                sessionNumber: s.number,
                journeyTitle: journey.title,
                journeyId: journey.id,
                participantCount: journey.participants?.length || 0,
              });
            }
          }
        }
        // Most recent first (higher session numbers last in a journey, but later journeys first)
        setSessions(completed.reverse());
      } catch (e) {
        console.error("Failed to load session history:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [role]);

  const filtered = sessions.filter(s =>
    s.journeyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    SESSION_NAMES[s.sessionNumber]?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout role={role}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" onClick={() => navigate(dashboardPath)} className="mb-4 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
          <h1 className="mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
            {role === "facilitator" ? "Reports" : "Session History"}
          </h1>
          <p className="text-muted-foreground">
            {role === "facilitator"
              ? "Completed sessions across all your journeys"
              : "Sessions you have completed"}
          </p>
        </motion.div>

        {/* Search + stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <Card className="p-5">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by session or journey name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 w-full"
                />
              </div>
              {!loading && (
                <div className="flex gap-6 justify-around lg:justify-start flex-shrink-0">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#4A1C5C]">{sessions.length}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  {role === "facilitator" && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#3D6D6C]">
                        {new Set(sessions.map(s => s.journeyId)).size}
                      </p>
                      <p className="text-sm text-muted-foreground">Journeys</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Session list */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-5 sm:p-6">
            <h3 className="mb-5" style={{ color: "#3D6D6C" }}>
              {loading ? "Loading…" : `Completed Sessions (${filtered.length})`}
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#4A1C5C]" />
              </div>

            ) : filtered.length === 0 ? (
              <div className="text-center py-14">
                <div className="inline-flex p-5 rounded-full bg-[#EBE2D6] mb-4">
                  <FileText className="w-10 h-10 text-[#4A1C5C] opacity-30" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">
                  {searchQuery ? "No sessions match your search" : "No completed sessions yet"}
                </h4>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {searchQuery
                    ? "Try a different search term."
                    : "Completed sessions will appear here once participants finish their journey sessions."}
                </p>
              </div>

            ) : (
              <div className="space-y-4">
                {filtered.map((session, index) => (
                  <motion.div
                    key={`${session.journeyId}-${session.sessionNumber}`}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * index }}
                    onClick={() => navigate(`/${role}/session/${session.sessionId}/board`)}
                    className="p-5 border border-border rounded-xl hover:border-[#4A1C5C]/30 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <Badge className="bg-[#3D6D6C] text-white flex-shrink-0">Completed</Badge>
                          <span className="text-xs font-semibold text-[#4A1C5C] bg-[#4A1C5C]/10 px-2 py-0.5 rounded-full flex-shrink-0">
                            Session {session.sessionNumber}
                          </span>
                        </div>
                        <h4 className="font-semibold text-foreground mb-0.5">
                          {SESSION_NAMES[session.sessionNumber] || `Session ${session.sessionNumber}`}
                        </h4>
                        <p className="text-sm text-muted-foreground truncate">{session.journeyTitle}</p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-[#3D6D6C] flex-shrink-0 mt-0.5" />
                    </div>
                    {role === "facilitator" && session.participantCount > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
                        <Users className="w-4 h-4 text-[#3D6D6C]" />
                        <span>{session.participantCount} participant{session.participantCount !== 1 ? "s" : ""}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
