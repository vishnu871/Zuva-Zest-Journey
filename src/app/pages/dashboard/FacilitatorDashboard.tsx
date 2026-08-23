// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router";
// import DashboardLayout from "../../components/DashboardLayout";
// import { Card } from "../../components/ui/card";
// import { Button } from "../../components/ui/button";
// import { Badge } from "../../components/ui/badge";
// import {
//   Plus, Users, FolderOpen, Play, Eye, Loader2, ArrowRight,
//   CheckCircle, Clock, Lock, RotateCcw,
// } from "lucide-react";
// import { motion } from "motion/react";
// import { createClient } from "../../../utils/supabase/client";
// import { projectId, publicAnonKey } from "../../../utils/supabase/info";

// const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;
// const HEADERS = { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` };

// type SessionStatus = "locked" | "available" | "in_progress" | "completed";
// interface SessionEntry { id: string; number: number; status: SessionStatus; }
// interface Journey {
//   id: string; title: string; description: string;
//   facilitatorId: string;
//   participantEmail: string | null; participants: any[];
//   sessions: SessionEntry[]; status: string; sessionId: string;
// }

// const SESSION_META = [
//   { number: 1, title: "Identity Discovery",        color: "#4A1C5C" },
//   { number: 2, title: "Identities In Reality",     color: "#3D6D6C" },
//   { number: 3, title: "Future Self Exploration",   color: "#D4A843" },
//   { number: 4, title: "Integration & Next Steps",  color: "#AA5D53" },
// ];

// function SessionPip({ status, color }: { status: SessionStatus; color: string }) {
//   if (status === "completed") return <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}><CheckCircle className="w-2.5 h-2.5 text-white" /></div>;
//   if (status === "in_progress") return <div className="w-4 h-4 rounded-full border-2 animate-pulse" style={{ borderColor: color, backgroundColor: `${color}30` }} />;
//   if (status === "available") return <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: color }} />;
//   return <div className="w-4 h-4 rounded-full border border-gray-200 bg-gray-50" />;
// }

// export default function FacilitatorDashboard() {
//   const navigate = useNavigate();
//   const [journeys, setJourneys] = useState<Journey[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [userName, setUserName] = useState("Facilitator");

//   useEffect(() => {
//     (async () => {
//       try {
//         const supabase = createClient();
//         const { data: { user } } = await supabase.auth.getUser();
//         if (!user) { navigate("/facilitator/login"); return; }
//         setUserName(user.user_metadata?.name?.split(" ")[0] || "Facilitator");

//         const res = await fetch(`${API}/journeys/facilitator/${user.id}`, { headers: HEADERS });
//         const data = await res.json();
//         if (data.success) {
//           // Client-side ownership guard: only render journeys that explicitly
//           // belong to the authenticated facilitator (defence-in-depth against
//           // stale KV index entries that the backend may still be cleaning up).
//           const owned = (data.journeys as Journey[]).filter(j => {
//             const ok = j.facilitatorId === user.id;
//             if (!ok) console.warn(`[dashboard] ignoring journey "${j.title}" (facilitatorId=${j.facilitatorId}, expected ${user.id})`);
//             return ok;
//           });
//           console.log(`[dashboard] auth.uid=${user.id} total_returned=${data.journeys.length} owned=${owned.length}`);
//           setJourneys(owned);
//         }
//       } catch (e) {
//         console.error("Failed to load journeys:", e);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   const getNextSession = (sessions: SessionEntry[]) =>
//     sessions.find(s => s.status === "in_progress") ||
//     sessions.find(s => s.status === "available");

//   const activeJourneys = journeys.filter(j => j.status !== "completed");
//   const completedJourneys = journeys.filter(j => j.status === "completed");

//   return (
//     <DashboardLayout role="facilitator">
//       <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
//         {/* Header */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
//           <h1 className="mb-2" style={{ fontFamily: "Playfair Display, serif" }}>Welcome back, {userName}</h1>
//           <p className="text-muted-foreground">Manage your Zest Journeys and guide participants through each session</p>
//         </motion.div>

//         {/* Stats row */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
//           className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
//           {[
//             { label: "Total Journeys",    value: loading ? "—" : journeys.length,          color: "#4A1C5C" },
//             { label: "Active",            value: loading ? "—" : activeJourneys.length,    color: "#3D6D6C" },
//             { label: "Participants",      value: loading ? "—" : journeys.reduce((n, j) => n + (j.participants?.length || 0), 0), color: "#D4A843" },
//             { label: "Completed",         value: loading ? "—" : completedJourneys.length, color: "#AA5D53" },
//           ].map(stat => (
//             <Card key={stat.label} className="p-4 sm:p-5">
//               <p className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</p>
//               <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
//             </Card>
//           ))}
//         </motion.div>

//         {/* CTA */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-8">
//           <Card className="p-5 sm:p-7 bg-gradient-to-r from-[#4A1C5C] to-[#3D6D6C] text-white">
//             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//               <div>
//                 <h2 className="text-white mb-1" style={{ fontFamily: "Playfair Display, serif" }}>Start a new Zest Journey</h2>
//                 <p className="text-white/80 text-sm">Create a 4-session journey and open Session 1 with your participant</p>
//               </div>
//               <Button onClick={() => navigate("/facilitator/journey/create")}
//                 className="bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810] shadow-lg w-full sm:w-auto flex-shrink-0">
//                 <Plus className="w-4 h-4 mr-2" /> Create Journey
//               </Button>
//             </div>
//           </Card>
//         </motion.div>

//         {/* Journey list */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
//           <div className="flex items-center justify-between mb-4">
//             <h3 style={{ color: "#3D6D6C" }}>Your Journeys</h3>
//             <Button variant="ghost" size="sm" onClick={() => navigate("/facilitator/journeys")} className="text-[#4A1C5C]">
//               View All <ArrowRight className="w-4 h-4 ml-1" />
//             </Button>
//           </div>

//           {loading ? (
//             <Card className="p-12 flex items-center justify-center">
//               <Loader2 className="w-6 h-6 animate-spin text-[#4A1C5C]" />
//             </Card>
//           ) : journeys.length === 0 ? (
//             <Card className="p-12 text-center">
//               <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
//               <h4 className="text-foreground mb-2 font-semibold">No journeys yet</h4>
//               <p className="text-sm text-muted-foreground mb-4">Create your first Zest Journey to get started</p>
//               <Button onClick={() => navigate("/facilitator/journey/create")} className="bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810]">
//                 <Plus className="w-4 h-4 mr-2" /> Create Journey
//               </Button>
//             </Card>
//           ) : (
//             <div className="space-y-4">
//               {journeys.map((journey, i) => {
//                 const sessions: SessionEntry[] = journey.sessions || [];
//                 const completedCount = sessions.filter(s => s.status === "completed").length;
//                 const progressPct = Math.round((completedCount / 4) * 100);
//                 const next = getNextSession(sessions);
//                 const nextMeta = next ? SESSION_META.find(m => m.number === next.number) : null;

//                 return (
//                   <motion.div key={journey.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
//                     className="bg-white rounded-xl border border-border p-4 sm:p-5 hover:shadow-md hover:border-[#4A1C5C]/20 transition-all">
//                     <div className="flex flex-col sm:flex-row sm:items-start gap-4">
//                       {/* Journey info */}
//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-center gap-2 flex-wrap mb-1">
//                           <h4 className="font-semibold text-foreground">{journey.title}</h4>
//                           <Badge className={journey.status === "completed" ? "bg-[#3D6D6C] text-white" : "bg-[#D4A843]/20 text-[#A07820]"}>
//                             {journey.status === "completed" ? "Complete" : "Active"}
//                           </Badge>
//                         </div>

//                         {/* Participant */}
//                         {journey.participantEmail ? (
//                           <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
//                             <Users className="w-3 h-3" /> {journey.participantEmail}
//                             {(journey.participants?.length || 0) > 1 && ` +${journey.participants.length - 1} more`}
//                           </p>
//                         ) : (
//                           <p className="text-xs text-[#AA5D53] mb-3">No participant linked</p>
//                         )}

//                         {/* Session pips */}
//                         <div className="flex items-center gap-3">
//                           {SESSION_META.map(meta => {
//                             const entry = sessions.find(s => s.number === meta.number);
//                             const status: SessionStatus = entry?.status || "locked";
//                             return (
//                               <div key={meta.number} className="flex items-center gap-1">
//                                 <SessionPip status={status} color={meta.color} />
//                                 <span className="text-[10px] text-muted-foreground hidden sm:inline">S{meta.number}</span>
//                               </div>
//                             );
//                           })}
//                           <span className="text-xs text-muted-foreground ml-1">{progressPct}%</span>
//                         </div>

//                         {/* Progress bar */}
//                         <div className="w-full bg-[#EBE2D6] rounded-full h-1 mt-2 max-w-xs">
//                           <div className="bg-[#4A1C5C] h-1 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
//                         </div>
//                       </div>

//                       {/* Actions */}
//                       <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
//                         <Button size="sm" variant="outline" onClick={() => navigate(`/facilitator/journey/${journey.id}`)} className="flex-1 sm:flex-none">
//                           Manage
//                         </Button>
//                         {next && (
//                           <Button size="sm"
//                             className="flex-1 sm:flex-none text-white"
//                             style={{ backgroundColor: nextMeta?.color || "#4A1C5C" }}
//                             onClick={() => navigate(`/facilitator/session/${next.id}/board`)}>
//                             {next.status === "in_progress"
//                               ? <><RotateCcw className="w-3.5 h-3.5 mr-1" /> Resume S{next.number}</>
//                               : <><Play className="w-3.5 h-3.5 mr-1" /> Start S{next.number}</>
//                             }
//                           </Button>
//                         )}
//                         {!next && journey.status === "completed" && (
//                           <Button size="sm" variant="outline" className="flex-1 sm:flex-none text-[#3D6D6C] border-[#3D6D6C]"
//                             onClick={() => navigate(`/facilitator/journey/${journey.id}`)}>
//                             <Eye className="w-3.5 h-3.5 mr-1" /> Review
//                           </Button>
//                         )}
//                       </div>
//                     </div>
//                   </motion.div>
//                 );
//               })}
//             </div>
//           )}
//         </motion.div>
//       </div>
//     </DashboardLayout>
//   );
// }


import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";

import DashboardLayout from "../../components/DashboardLayout";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";

import {
  Plus,
  Users,
  FolderOpen,
  Play,
  Eye,
  Loader2,
  ArrowRight,
  CheckCircle,
  RotateCcw,
  Trash2,
  X,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  Clock,
} from "lucide-react";

import {
  motion,
  AnimatePresence,
} from "motion/react";

import { createClient } from "../../../utils/supabase/client";
import { projectId } from "../../../utils/supabase/info";

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────

const API =
  `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;

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

interface SessionProgress {
  sessionId: string;
  sessionNumber: number;
  currentStep: number;
  totalSteps: number;
  percentage: number;
  hasData: boolean;
  completed: boolean;
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
  sessionId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION METADATA
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_META = [
  {
    number: 1,
    title: "Identity Discovery",
    color: "#4A1C5C",
    totalSteps: 7,
  },
  {
    number: 2,
    title: "Identities In Reality",
    color: "#3D6D6C",
    totalSteps: 9,
  },
  {
    number: 3,
    title: "Future Self Exploration",
    color: "#D4A843",
    totalSteps: 4,
  },
  {
    number: 4,
    title: "Integration & Next Steps",
    color: "#AA5D53",
    totalSteps: 7,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SESSION PIP
// ─────────────────────────────────────────────────────────────────────────────

function SessionPip({
  status,
  color,
}: {
  status: SessionStatus;
  color: string;
}) {
  if (status === "completed") {
    return (
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <CheckCircle className="w-3 h-3 text-white" />
      </div>
    );
  }

  if (status === "in_progress") {
    return (
      <div
        className="w-5 h-5 rounded-full border-2 animate-pulse"
        style={{
          borderColor: color,
          backgroundColor: `${color}30`,
        }}
      />
    );
  }

  if (status === "available") {
    return (
      <div
        className="w-5 h-5 rounded-full border-2"
        style={{
          borderColor: color,
        }}
      />
    );
  }

  return (
    <div className="w-5 h-5 rounded-full border border-gray-200 bg-gray-50" />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZE SESSION
// ─────────────────────────────────────────────────────────────────────────────

function normalizeSession(raw: any): SessionEntry | null {
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
      : "available";

  return {
    id: raw.id,
    number,
    status,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZE JOURNEY
// ─────────────────────────────────────────────────────────────────────────────

function normalizeJourney(raw: any): Journey | null {
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

  // Backward compatibility
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

    sessionId:
      typeof raw.sessionId === "string"
        ? raw.sessionId
        : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION PROGRESS CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

function calculateSessionProgress(
  sessionNumber: number,
  boardState: any
): SessionProgress {
  const meta =
    SESSION_META.find(
      (item) => item.number === sessionNumber
    ) || SESSION_META[0];

  if (
    !boardState ||
    typeof boardState !== "object" ||
    Object.keys(boardState).length === 0
  ) {
    return {
      sessionId: "",
      sessionNumber,
      currentStep: 0,
      totalSteps: meta.totalSteps,
      percentage: 0,
      hasData: false,
      completed: false,
    };
  }

  const currentStep =
    typeof boardState.currentStep === "number"
      ? boardState.currentStep
      : 0;

  const totalSteps = meta.totalSteps;

  /*
   * A session is considered meaningfully started when:
   * - currentStep > 1
   * OR
   * - any step contains participant data.
   */

  let hasData = currentStep > 1;

  Object.keys(boardState).forEach((key) => {
    if (key === "currentStep") return;

    const value = boardState[key];

    if (
      value &&
      typeof value === "object" &&
      Object.keys(value).length > 0
    ) {
      hasData = true;
    }
  });

  const isCompleted =
    boardState.completed === true ||
    boardState.journeyCompleted === true ||
    currentStep >= totalSteps;

  const percentage = isCompleted
    ? 100
    : Math.min(
        100,
        Math.round(
          (Math.max(currentStep, 1) / totalSteps) * 100
        )
      );

  return {
    sessionId: "",
    sessionNumber,
    currentStep: isCompleted ? totalSteps : currentStep,
    totalSteps,
    percentage: hasData || isCompleted
      ? percentage
      : 0,
    hasData: hasData || isCompleted,
    completed: isCompleted,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

export default function FacilitatorDashboard() {
  const navigate = useNavigate();

  const [journeys, setJourneys] =
    useState<Journey[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [userName, setUserName] =
    useState("Facilitator");

  const [userId, setUserId] =
    useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<Journey | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  /*
   * Stores participant board progress.
   *
   * {
   *   [sessionId]: SessionProgress
   * }
   */
  const [sessionProgress, setSessionProgress] =
    useState<Record<string, SessionProgress>>({});

  // ───────────────────────────────────────────────────────────────────────────
  // AUTH HEADERS
  // ───────────────────────────────────────────────────────────────────────────

  const getAuthHeaders = async () => {
    const supabase = createClient();

    const {
      data: {
        session: authSession,
      },
      error: authError,
    } = await supabase.auth.getSession();

    if (
      authError ||
      !authSession?.access_token
    ) {
      throw new Error("AUTH_REQUIRED");
    }

    return {
      headers: {
        "Content-Type": "application/json",
        Authorization:
          `Bearer ${authSession.access_token}`,
      },
      user: authSession.user,
    };
  };

  // ───────────────────────────────────────────────────────────────────────────
  // LOAD PARTICIPANT BOARD PROGRESS
  // ───────────────────────────────────────────────────────────────────────────

  const loadSessionProgress = async (
    journeysToLoad: Journey[]
  ) => {
    const progressMap: Record<
      string,
      SessionProgress
    > = {};

    const { headers } = await getAuthHeaders();

    /*
     * Fetch every session board.
     *
     * This is intentionally independent of the
     * session status. A facilitator should be able
     * to inspect participant progress even while
     * the session is marked available/in_progress.
     */
    const requests: Promise<void>[] = [];

    journeysToLoad.forEach((journey) => {
      journey.sessions.forEach((session) => {
        requests.push(
          (async () => {
            try {
              const response = await fetch(
                `${API}/sessions/${session.id}/board`,
                {
                  method: "GET",
                  headers,
                  cache: "no-store",
                }
              );

              if (!response.ok) {
                return;
              }

              const data =
                await response.json();

              const state =
                data?.state || null;

              const progress =
                calculateSessionProgress(
                  session.number,
                  state
                );

              progress.sessionId =
                session.id;

              /*
               * Trust explicit session completion
               * as well as the board's current step.
               */
              if (
                session.status === "completed" ||
                progress.completed
              ) {
                progress.completed = true;
                progress.percentage = 100;
                progress.currentStep = progress.totalSteps;
                progress.hasData = true;
              }

              progressMap[
                session.id
              ] = progress;
            } catch (error) {
              console.warn(
                `[facilitator-dashboard] Could not load progress for session ${session.id}`,
                error
              );
            }
          })()
        );
      });
    });

    await Promise.all(requests);

    setSessionProgress(progressMap);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // LOAD JOURNEYS
  // ───────────────────────────────────────────────────────────────────────────

  const loadJourneys = useCallback(
    async (
      showRefreshLoader = false
    ) => {
      try {
        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const {
          headers,
          user,
        } = await getAuthHeaders();

        if (!user) {
          navigate(
            "/facilitator/login",
            { replace: true }
          );
          return;
        }

        setUserId(user.id);

        setUserName(
          user.user_metadata?.name
            ?.split(" ")[0] ||
            "Facilitator"
        );

        // ─────────────────────────────────────
        // GET FACILITATOR JOURNEYS
        // ─────────────────────────────────────

        const response =
          await fetch(
            `${API}/journeys/facilitator/${user.id}`,
            {
              method: "GET",
              headers,
              cache: "no-store",
            }
          );

        let data: any = null;

        try {
          data = await response.json();
        } catch (jsonError) {
          console.error(
            "[facilitator-dashboard] Failed to parse API response:",
            jsonError
          );
        }

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          navigate(
            "/facilitator/login",
            { replace: true }
          );
          return;
        }

        if (response.status === 404) {
          setJourneys([]);
          setSessionProgress({});
          return;
        }

        if (!response.ok) {
          console.error(
            "[facilitator-dashboard] Failed to load journeys:",
            {
              status:
                response.status,
              data,
            }
          );

          setJourneys([]);
          return;
        }

        if (!data?.success) {
          console.error(
            "[facilitator-dashboard] API error:",
            data?.error
          );

          setJourneys([]);
          return;
        }

        // ─────────────────────────────────────
        // NORMALIZE
        // ─────────────────────────────────────

        const returnedJourneys =
          Array.isArray(data.journeys)
            ? data.journeys
            : [];

        const normalizedJourneys =
          returnedJourneys
            .map(normalizeJourney)
            .filter(
              (
                journey: Journey | null
              ): journey is Journey =>
                journey !== null
            )
            .filter(
              (journey: Journey) => {
                if (
                  journey.facilitatorId &&
                  journey.facilitatorId !==
                    user.id
                ) {
                  console.warn(
                    `[facilitator-dashboard] Ignoring journey "${journey.title}" because it does not belong to the current facilitator.`
                  );

                  return false;
                }

                return true;
              }
            );

        console.log(
          `[facilitator-dashboard] auth.uid=${user.id} total_returned=${returnedJourneys.length} normalized=${normalizedJourneys.length}`
        );

        setJourneys(
          normalizedJourneys
        );

        // ─────────────────────────────────────
        // LOAD PARTICIPANT PROGRESS
        // ─────────────────────────────────────

        await loadSessionProgress(
          normalizedJourneys
        );
      } catch (error: any) {
        console.error(
          "[facilitator-dashboard] Failed to load journeys:",
          error
        );

        if (
          error?.message ===
          "AUTH_REQUIRED"
        ) {
          navigate(
            "/facilitator/login",
            { replace: true }
          );
        }

        setJourneys([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  // ───────────────────────────────────────────────────────────────────────────
  // INITIAL LOAD
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadJourneys();
  }, [loadJourneys]);

  // ───────────────────────────────────────────────────────────────────────────
  // OPEN SESSION
  // ───────────────────────────────────────────────────────────────────────────

  const openSession = async (
    session: SessionEntry
  ) => {
    /*
     * TEST MODE:
     *
     * There is intentionally NO 7-day check here.
     *
     * The facilitator can open any of the four
     * sessions while testing the journey.
     */

    try {
      const {
        headers,
      } = await getAuthHeaders();

      if (session.status === "available") {
        const response = await fetch(
          `${API}/sessions/${session.id}/status`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({ status: "in_progress" }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(data?.error || "Unable to start session.");
        }
      }
    } catch (error) {
      console.warn(
        "[facilitator-dashboard] Could not refresh session status:",
        error
      );
    }

    navigate(
      `/facilitator/session/${session.id}/board`
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // JOURNEY FILTERS
  // ───────────────────────────────────────────────────────────────────────────

  const activeJourneys =
    journeys.filter(
      (journey) =>
        journey.status !==
        "completed"
    );

  const completedJourneys =
    journeys.filter(
      (journey) =>
        journey.status ===
        "completed"
    );

  const totalParticipants =
    journeys.reduce(
      (
        total,
        journey
      ) =>
        total +
        (journey.participants?.length ||
          0),
      0
    );

  // ───────────────────────────────────────────────────────────────────────────
  // DELETE JOURNEY
  // ───────────────────────────────────────────────────────────────────────────

  const requestDeleteJourney = (
    journey: Journey
  ) => {
    setDeleteTarget(journey);
  };

  const cancelDelete = () => {
    if (deleting) return;

    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (
      !deleteTarget ||
      !userId ||
      deleting
    ) {
      return;
    }

    setDeleting(true);

    try {
      const {
        headers,
      } = await getAuthHeaders();

      const response =
        await fetch(
          `${API}/journeys/${deleteTarget.id}`,
          {
            method: "DELETE",
            headers,
            body: JSON.stringify({
              facilitatorId:
                userId,
            }),
          }
        );

      let data: any = null;

      try {
        data =
          await response.json();
      } catch {
        // ignore
      }

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        window.alert(
          "Your login session has expired. Please sign in again."
        );

        navigate(
          "/facilitator/login",
          { replace: true }
        );

        return;
      }

      if (
        !response.ok ||
        !data?.success
      ) {
        window.alert(
          data?.error ||
            "Failed to delete the journey."
        );

        return;
      }

      setJourneys(
        (current) =>
          current.filter(
            (journey) =>
              journey.id !==
              deleteTarget.id
          )
      );

      setDeleteTarget(null);
    } catch (error) {
      console.error(
        "[facilitator-dashboard] Delete journey error:",
        error
      );

      window.alert(
        "Something went wrong while deleting the journey."
      );
    } finally {
      setDeleting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout role="facilitator">

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* HEADER */}

        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mb-8"
        >
          <div className="flex items-start justify-between gap-4">

            <div>
              <h1
                className="mb-2"
                style={{
                  fontFamily:
                    "Playfair Display, serif",
                }}
              >
                Welcome back,{" "}
                {userName}
              </h1>

              <p className="text-muted-foreground">
                Manage your Zest Journeys
                and guide participants
                through each session
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                loadJourneys(true)
              }
              disabled={
                loading ||
                refreshing
              }
              className="flex-shrink-0"
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
        </motion.div>

        {/* TEST MODE NOTICE */}

        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mb-6"
        >
          <div className="rounded-xl border border-[#D4A843]/40 bg-[#D4A843]/10 px-4 py-3 flex items-start gap-3">

            <Clock className="w-5 h-5 text-[#A07820] flex-shrink-0 mt-0.5" />

            <div>
              <p className="text-sm font-semibold text-[#7A5A12]">
                4-Session Testing Mode
              </p>

              <p className="text-xs text-[#7A5A12]/80 mt-0.5">
                All four sessions can be opened
                during testing. There is no
                7-day waiting period.
              </p>
            </div>

          </div>
        </motion.div>

        {/* STATS */}

        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.1,
          }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8"
        >
          {[
            {
              label: "Total Journeys",
              value: loading
                ? "—"
                : journeys.length,
              color: "#4A1C5C",
            },
            {
              label: "Active",
              value: loading
                ? "—"
                : activeJourneys.length,
              color: "#3D6D6C",
            },
            {
              label: "Participants",
              value: loading
                ? "—"
                : totalParticipants,
              color: "#D4A843",
            },
            {
              label: "Completed",
              value: loading
                ? "—"
                : completedJourneys.length,
              color: "#AA5D53",
            },
          ].map(
            (stat) => (
              <Card
                key={stat.label}
                className="p-4 sm:p-5"
              >
                <p
                  className="text-2xl sm:text-3xl font-bold mb-1"
                  style={{
                    color:
                      stat.color,
                  }}
                >
                  {stat.value}
                </p>

                <p className="text-xs sm:text-sm text-muted-foreground">
                  {stat.label}
                </p>
              </Card>
            )
          )}
        </motion.div>

        {/* CTA */}

        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.15,
          }}
          className="mb-8"
        >
          <Card className="p-5 sm:p-7 bg-gradient-to-r from-[#4A1C5C] to-[#3D6D6C] text-white">

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

              <div>
                <h2
                  className="text-white mb-1"
                  style={{
                    fontFamily:
                      "Playfair Display, serif",
                  }}
                >
                  Start a new Zest Journey
                </h2>

                <p className="text-white/80 text-sm">
                  Create a 4-session
                  journey and test
                  the complete journey
                  flow.
                </p>
              </div>

              <Button
                onClick={() =>
                  navigate(
                    "/facilitator/journey/create"
                  )
                }
                className="bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810] shadow-lg w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Journey
              </Button>

            </div>

          </Card>
        </motion.div>

        {/* JOURNEYS */}

        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.2,
          }}
        >

          <div className="flex items-center justify-between mb-4">

            <h3
              style={{
                color: "#3D6D6C",
              }}
            >
              Your Journeys
            </h3>

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                navigate(
                  "/facilitator/journeys"
                )
              }
              className="text-[#4A1C5C]"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>

          </div>

          {loading ? (
            <Card className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#4A1C5C]" />
            </Card>
          ) : journeys.length === 0 ? (

            <Card className="p-12 text-center">

              <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />

              <h4 className="text-foreground mb-2 font-semibold">
                No journeys yet
              </h4>

              <p className="text-sm text-muted-foreground mb-4">
                Create your first
                Zest Journey to get
                started
              </p>

              <Button
                onClick={() =>
                  navigate(
                    "/facilitator/journey/create"
                  )
                }
                className="bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Journey
              </Button>

            </Card>

          ) : (

            <div className="space-y-4">

              {journeys.map(
                (
                  journey,
                  index
                ) => {

                  const sessions =
                    journey.sessions ||
                    [];

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
                        (completedCount /
                          4) *
                          100
                      )
                    );

                  return (
                    <motion.div
                      key={
                        journey.id
                      }
                      initial={{
                        opacity: 0,
                        x: -16,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      transition={{
                        delay:
                          0.05 *
                          index,
                      }}
                      className="bg-white rounded-xl border border-border p-4 sm:p-5 hover:shadow-md hover:border-[#4A1C5C]/20 transition-all"
                    >

                      {/* JOURNEY HEADER */}

                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                        <div className="flex-1 min-w-0">

                          <div className="flex items-center gap-2 flex-wrap mb-1">

                            <h4 className="font-semibold text-foreground">
                              {
                                journey.title
                              }
                            </h4>

                            <Badge
                              className={
                                journey.status ===
                                "completed"
                                  ? "bg-[#3D6D6C] text-white"
                                  : "bg-[#D4A843]/20 text-[#A07820]"
                              }
                            >
                              {journey.status ===
                              "completed"
                                ? "Complete"
                                : "Active"}
                            </Badge>

                          </div>

                          {journey.participantEmail ? (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                              <Users className="w-3 h-3" />

                              {
                                journey.participantEmail
                              }

                              {(journey.participants
                                ?.length ||
                                0) > 1 &&
                                ` +${
                                  journey
                                    .participants
                                    .length -
                                  1
                                } more`}
                            </p>
                          ) : (
                            <p className="text-xs text-[#AA5D53] mb-3">
                              No participant linked
                            </p>
                          )}

                          {/* SESSION PIPS */}

                          <div className="flex items-center gap-3">

                            {SESSION_META.map(
                              (
                                meta
                              ) => {

                                const entry =
                                  sessions.find(
                                    (
                                      session
                                    ) =>
                                      session.number ===
                                      meta.number
                                  );

                                const status: SessionStatus =
                                  entry?.status ||
                                  "available";

                                return (
                                  <div
                                    key={
                                      meta.number
                                    }
                                    className="flex items-center gap-1"
                                  >

                                    <SessionPip
                                      status={
                                        status
                                      }
                                      color={
                                        meta.color
                                      }
                                    />

                                    <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                      S
                                      {
                                        meta.number
                                      }
                                    </span>

                                  </div>
                                );
                              }
                            )}

                            <span className="text-xs text-muted-foreground ml-1">
                              {
                                progressPct
                              }
                              %
                            </span>

                          </div>

                          {/* JOURNEY PROGRESS */}

                          <div className="w-full bg-[#EBE2D6] rounded-full h-1 mt-2 max-w-xs">

                            <div
                              className="bg-[#4A1C5C] h-1 rounded-full transition-all"
                              style={{
                                width:
                                  `${progressPct}%`,
                              }}
                            />

                          </div>

                        </div>

                        {/* ACTIONS */}

                        <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(
                                `/facilitator/journey/${journey.id}`
                              )
                            }
                          >
                            Manage
                          </Button>

                        </div>

                      </div>

                      {/* ─────────────────────────────────────────────────────
                          PARTICIPANT PROGRESS
                      ───────────────────────────────────────────────────── */}

                      <div className="mt-5 pt-5 border-t border-border">

                        <div className="flex items-center justify-between mb-3">

                          <div className="flex items-center gap-2">

                            <UserCheck className="w-4 h-4 text-[#3D6D6C]" />

                            <h5 className="text-sm font-semibold text-[#3D6D6C]">
                              Participant Progress
                            </h5>

                          </div>

                          <span className="text-xs text-muted-foreground">
                            {sessions.filter(
                              (s) =>
                                sessionProgress[
                                  s.id
                                ]?.hasData
                            ).length}
                            /4 sessions started
                          </span>

                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

                          {SESSION_META.map(
                            (meta) => {

                              const session =
                                sessions.find(
                                  (s) =>
                                    s.number ===
                                    meta.number
                                );

                              /*
                               * If the backend did not
                               * return a session object,
                               * still render the session
                               * so testing can expose
                               * the missing backend
                               * session.
                               */

                              if (!session) {
                                return (
                                  <div
                                    key={
                                      meta.number
                                    }
                                    className="rounded-xl border border-dashed border-gray-200 p-3 opacity-60"
                                  >

                                    <div className="flex items-center justify-between mb-2">

                                      <span className="text-xs font-semibold">
                                        Session{" "}
                                        {
                                          meta.number
                                        }
                                      </span>

                                      <span className="text-[10px] text-muted-foreground">
                                        Not found
                                      </span>

                                    </div>

                                  </div>
                                );
                              }

                              const progress =
                                sessionProgress[
                                  session.id
                                ];

                              const completed =
                                session.status ===
                                  "completed" ||
                                (progress?.completed ?? false);

                              const percentage =
                                completed
                                  ? 100
                                  : progress
                                  ?.percentage ||
                                0;

                              const currentStep =
                                completed
                                  ? meta.totalSteps
                                  : progress
                                  ?.currentStep ||
                                0;

                              const hasData =
                                completed ||
                                (progress
                                  ?.hasData ||
                                false);

                              return (
                                <div
                                  key={
                                    session.id
                                  }
                                  className="rounded-xl border border-border bg-[#EBE2D6]/30 p-3 hover:border-[#4A1C5C]/30 transition-all"
                                >

                                  {/* SESSION TITLE */}

                                  <div className="flex items-center justify-between gap-2 mb-2">

                                    <div className="flex items-center gap-2">

                                      <SessionPip
                                        status={
                                          completed
                                            ? "completed"
                                            : hasData
                                            ? "in_progress"
                                            : "available"
                                        }
                                        color={
                                          meta.color
                                        }
                                      />

                                      <div>

                                        <p className="text-xs font-semibold text-foreground">
                                          Session{" "}
                                          {
                                            meta.number
                                          }
                                        </p>

                                        <p className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                                          {
                                            meta.title
                                          }
                                        </p>

                                      </div>

                                    </div>

                                    <span
                                      className="text-xs font-bold"
                                      style={{
                                        color:
                                          meta.color,
                                      }}
                                    >
                                      {
                                        percentage
                                      }%
                                    </span>

                                  </div>

                                  {/* PROGRESS BAR */}

                                  <div className="w-full h-1.5 bg-white rounded-full overflow-hidden mb-2">

                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{
                                        width:
                                          `${percentage}%`,
                                        backgroundColor:
                                          meta.color,
                                      }}
                                    />

                                  </div>

                                  {/* CURRENT STEP */}

                                  <div className="flex items-center justify-between mb-3">

                                    {hasData ? (
                                      <span className="text-[10px] text-muted-foreground">
                                        {completed
                                          ? "Completed"
                                          : `Step ${currentStep}/${meta.totalSteps}`}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-muted-foreground italic">
                                        Not started
                                      </span>
                                    )}

                                  </div>

                                  {/* OPEN SESSION */}

                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      openSession(
                                        session
                                      )
                                    }
                                    className="w-full text-white text-xs"
                                    style={{
                                      backgroundColor:
                                        meta.color,
                                    }}
                                  >

                                    {hasData ? (
                                      <>
                                        <Eye className="w-3 h-3 mr-1.5" />

                                        View S
                                        {
                                          meta.number
                                        }

                                        Progress
                                      </>
                                    ) : (
                                      <>
                                        <Play className="w-3 h-3 mr-1.5" />

                                        Open S
                                        {
                                          meta.number
                                        }
                                      </>
                                    )}

                                  </Button>

                                </div>
                              );
                            }
                          )}

                        </div>

                        {/* EXPLANATION */}

                        <div className="mt-3 px-3 py-2 rounded-lg bg-[#4A1C5C]/5">

                          <p className="text-[11px] text-muted-foreground">

                            <strong className="text-[#4A1C5C]">
                              Facilitator view:
                            </strong>{" "}
                            Progress is loaded from
                            each participant's saved
                            session board. Open any
                            session to review the
                            participant's current state.

                          </p>

                        </div>

                      </div>

                    </motion.div>
                  );
                }
              )}

            </div>
          )}

        </motion.div>
      </div>

      {/* DELETE MODAL */}

      <AnimatePresence>

        {deleteTarget && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >

            {/* BACKDROP */}

            <div
              className="absolute inset-0 bg-[#2C1810]/55 backdrop-blur-sm"
              onClick={
                deleting
                  ? undefined
                  : cancelDelete
              }
            />

            {/* MODAL */}

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.94,
                y: 12,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.94,
                y: 12,
              }}
              transition={{
                duration: 0.2,
              }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#EBE2D6]"
            >

              <div className="h-1.5 bg-gradient-to-r from-[#AA5D53] to-[#D4A843]" />

              <div className="p-6 sm:p-7">

                {/* CLOSE */}

                <button
                  type="button"
                  onClick={
                    deleting
                      ? undefined
                      : cancelDelete
                  }
                  disabled={
                    deleting
                  }
                  className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* ICON */}

                <div className="w-12 h-12 rounded-full bg-[#AA5D53]/10 flex items-center justify-center mb-5">

                  <AlertTriangle className="w-6 h-6 text-[#AA5D53]" />

                </div>

                {/* HEADING */}

                <h2
                  className="text-xl sm:text-2xl font-semibold text-[#3A1C2B] mb-2"
                  style={{
                    fontFamily:
                      "Playfair Display, serif",
                  }}
                >
                  Delete this journey?
                </h2>

                {/* JOURNEY */}

                <div className="bg-[#EBE2D6]/55 border border-[#EBE2D6] rounded-xl px-4 py-3 mb-4">

                  <p className="text-xs text-muted-foreground mb-1">
                    Journey
                  </p>

                  <p className="font-semibold text-[#4A1C5C] truncate">
                    {
                      deleteTarget.title
                    }
                  </p>

                </div>

                {/* WARNING */}

                <p className="text-sm leading-relaxed text-gray-600 mb-2">
                  This will permanently
                  delete the journey,
                  all four sessions,
                  session boards, and
                  participant links.
                </p>

                <p className="text-sm font-medium text-[#AA5D53] mb-6">
                  This action cannot be
                  undone.
                </p>

                {/* ACTIONS */}

                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">

                  <Button
                    type="button"
                    variant="outline"
                    onClick={
                      cancelDelete
                    }
                    disabled={
                      deleting
                    }
                    className="w-full sm:w-auto rounded-xl border-gray-200"
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    onClick={
                      confirmDelete
                    }
                    disabled={
                      deleting
                    }
                    className="w-full sm:w-auto rounded-xl bg-[#AA5D53] hover:bg-[#934D45] text-white shadow-sm"
                  >

                    {deleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Journey
                      </>
                    )}

                  </Button>

                </div>

              </div>

            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

    </DashboardLayout>
  );
}