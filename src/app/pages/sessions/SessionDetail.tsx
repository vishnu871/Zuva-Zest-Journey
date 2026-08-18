import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import DashboardLayout from "../../components/DashboardLayout";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { ArrowLeft, Play, RotateCcw, Eye, Users, Hash, Loader2, Lock, CheckCircle, Clock } from "lucide-react";
import { motion } from "motion/react";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;
const HEADERS = { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` };

const SESSION_NAMES: Record<number, string> = {
  1: "Identity Discovery",
  2: "Identities In Reality",
  3: "Experiment Design",
  4: "What I Tried",
};

const SESSION_COLORS: Record<number, string> = {
  1: "#4A1C5C",
  2: "#3D6D6C",
  3: "#D4A843",
  4: "#AA5D53",
};

const SESSION_DESCRIPTIONS: Record<number, string> = {
  1: "Explore who you are across the different roles and identities in your life, and identify the recognition word that best captures your essence.",
  2: "Examine how your identities show up in reality — which feel energising, grounding, or draining — and select your anchor identity.",
  3: "Design experiments to act on your anchor identity through observe, converse, and act tiers.",
  4: "Reflect on what you tried, what stayed with you, and map your next chapter and 90-day roadmap.",
};

type SessionStatus = "locked" | "available" | "in_progress" | "completed";

export default function SessionDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const role = location.pathname.startsWith("/participant") ? "participant" : "facilitator";
  const dashboardPath = role === "facilitator" ? "/facilitator/dashboard" : "/participant/dashboard";

  const [sessionData, setSessionData] = useState<any>(null);
  const [journeyData, setJourneyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`${API}/sessions/${id}`, { headers: HEADERS });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || "Session not found.");
          return;
        }
        setSessionData(data.session);
        setJourneyData(data.journey);
      } catch {
        setError("Failed to load session. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout role={role}>
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="w-6 h-6 animate-spin text-[#4A1C5C]" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !sessionData) {
    return (
      <DashboardLayout role={role}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(dashboardPath)} className="mb-6 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
          <Card className="p-10 text-center">
            <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
            <h3 className="font-semibold text-foreground mb-2">{error || "Session not found"}</h3>
            <Button onClick={() => navigate(dashboardPath)} className="mt-4 bg-[#4A1C5C] hover:bg-[#3A1C4C] text-white">
              Return to Dashboard
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const sessionNumber: number = Number(sessionData.sessionNumber) || 1;
  const status: SessionStatus = sessionData.status || "locked";
  const currentStep: number = sessionData.currentStep || 1;
  const sessionName = SESSION_NAMES[sessionNumber] || `Session ${sessionNumber}`;
  const sessionColor = SESSION_COLORS[sessionNumber] || "#4A1C5C";
  const sessionDescription = SESSION_DESCRIPTIONS[sessionNumber] || "";
  const participantCount = journeyData?.participants?.length || 0;
  const boardPath = `/${role}/session/${id}/board`;

  const statusConfig: Record<SessionStatus, { label: string; badgeClass: string; icon: React.ReactNode }> = {
    locked:      { label: "Locked",       badgeClass: "bg-gray-200 text-gray-600",           icon: <Lock className="w-4 h-4" /> },
    available:   { label: "Ready",        badgeClass: "bg-[#D4A843]/20 text-[#A07820]",      icon: <Clock className="w-4 h-4" /> },
    in_progress: { label: "In Progress",  badgeClass: "bg-[#4A1C5C]/15 text-[#4A1C5C]",     icon: <Play className="w-4 h-4" /> },
    completed:   { label: "Completed",    badgeClass: "bg-[#3D6D6C]/15 text-[#3D6D6C]",     icon: <CheckCircle className="w-4 h-4" /> },
  };
  const statusCfg = statusConfig[status] ?? statusConfig.locked;

  return (
    <DashboardLayout role={role}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" onClick={() => navigate(dashboardPath)} className="mb-4 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: sessionColor }}>
                  Session {sessionNumber}
                </span>
                <Badge className={statusCfg.badgeClass + " flex items-center gap-1"}>
                  {statusCfg.icon} {statusCfg.label}
                </Badge>
              </div>
              <h1 className="mb-1" style={{ fontFamily: "Playfair Display, serif" }}>{sessionName}</h1>
              {journeyData?.title && (
                <p className="text-muted-foreground">{journeyData.title}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Info card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <Card className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center gap-3">
                <Hash className="w-5 h-5 flex-shrink-0" style={{ color: sessionColor }} />
                <div>
                  <p className="text-xs text-muted-foreground">Session</p>
                  <p className="font-medium text-foreground">{sessionNumber} of 4</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center" style={{ color: sessionColor }}>
                  {statusCfg.icon}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium text-foreground">{statusCfg.label}</p>
                </div>
              </div>
              {status === "in_progress" && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 flex-shrink-0" style={{ color: sessionColor }} />
                  <div>
                    <p className="text-xs text-muted-foreground">Current Step</p>
                    <p className="font-medium text-foreground">Step {currentStep} of 7</p>
                  </div>
                </div>
              )}
              {role === "facilitator" && (
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 flex-shrink-0" style={{ color: sessionColor }} />
                  <div>
                    <p className="text-xs text-muted-foreground">Participants</p>
                    <p className="font-medium text-foreground">{participantCount}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Open board button */}
            {status !== "locked" && (
              <Button
                className="w-full text-white"
                style={{ backgroundColor: sessionColor }}
                onClick={() => navigate(boardPath)}
              >
                {status === "completed"
                  ? <><Eye className="w-4 h-4 mr-2" /> Review Board</>
                  : status === "in_progress"
                  ? <><RotateCcw className="w-4 h-4 mr-2" /> Resume Session</>
                  : <><Play className="w-4 h-4 mr-2" /> Start Session</>}
              </Button>
            )}
            {status === "locked" && (
              <div className="w-full py-3 rounded-xl border-2 border-dashed border-border text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" /> Complete the previous session to unlock this one
              </div>
            )}
          </Card>
        </motion.div>

        {/* Description */}
        {sessionDescription && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
            <Card className="p-6">
              <h3 className="mb-3" style={{ color: sessionColor }}>About This Session</h3>
              <p className="text-foreground leading-relaxed">{sessionDescription}</p>
            </Card>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1" onClick={() => navigate(dashboardPath)}>
            Back to Dashboard
          </Button>
          {role === "facilitator" && journeyData?.id && (
            <Button
              className="flex-1 bg-[#4A1C5C] hover:bg-[#3A1C4C] text-white"
              onClick={() => navigate(`/facilitator/journey/${journeyData.id}`)}
            >
              View Journey Details
            </Button>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
