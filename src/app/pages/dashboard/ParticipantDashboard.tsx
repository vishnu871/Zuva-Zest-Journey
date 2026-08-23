// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router";
// import DashboardLayout from "../../components/DashboardLayout";
// import { Card } from "../../components/ui/card";
// import { Button } from "../../components/ui/button";
// import { Badge } from "../../components/ui/badge";
// import {
//   Play, Eye, Loader2, FolderOpen, Lock, CheckCircle, Clock, RotateCcw,
// } from "lucide-react";
// import { motion } from "motion/react";
// import { createClient } from "../../../utils/supabase/client";
// import { projectId, publicAnonKey } from "../../../utils/supabase/info";

// const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;
// const HEADERS = { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` };

// type SessionStatus = "locked" | "available" | "in_progress" | "completed";

// interface SessionEntry { id: string; number: number; status: SessionStatus; }
// interface Journey {
//   id: string;
//   title: string;
//   description: string;
//   facilitatorEmail: string;
//   sessions: SessionEntry[];
//   status: string;
// }

// const SESSION_META = [
//   { number: 1, title: "Identity Discovery", color: "#4A1C5C", steps: 7 },
//   { number: 2, title: "Identities In Reality", color: "#3D6D6C", steps: 9 },
//   { number: 3, title: "Future Self Exploration", color: "#D4A843", steps: 8 },
//   { number: 4, title: "Integration & Next Steps", color: "#AA5D53", steps: 6 },
// ];

// function StatusBadge({ status }: { status: SessionStatus }) {
//   const CONFIGS: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
//     locked:      { label: "Locked",      cls: "bg-gray-100 text-gray-500 border border-gray-200",            icon: <Lock className="w-3 h-3" /> },
//     available:   { label: "Available",   cls: "bg-[#D4A843]/15 text-[#A07820] border border-[#D4A843]/40",  icon: <Play className="w-3 h-3" /> },
//     in_progress: { label: "In Progress", cls: "bg-[#3D6D6C]/15 text-[#3D6D6C] border border-[#3D6D6C]/40", icon: <Clock className="w-3 h-3" /> },
//     completed:   { label: "Completed",   cls: "bg-[#4A1C5C]/15 text-[#4A1C5C] border border-[#4A1C5C]/40", icon: <CheckCircle className="w-3 h-3" /> },
//   };
//   const cfg = CONFIGS[status] ?? CONFIGS.locked;
//   return (
//     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
//       {cfg.icon} {cfg.label}
//     </span>
//   );
// }

// export default function ParticipantDashboard() {
//   const navigate = useNavigate();
//   const [journeys, setJourneys] = useState<Journey[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [userName, setUserName] = useState("");
//   const [userEmail, setUserEmail] = useState("");

//   useEffect(() => {
//     (async () => {
//       try {
//         const supabase = createClient();
//         const { data: { user } } = await supabase.auth.getUser();
//         if (!user) { navigate("/participant/login"); return; }

//         setUserName(user.user_metadata?.name?.split(" ")[0] || "there");
//         setUserEmail(user.email || "");

//         if (!user.email) return;
//         const res = await fetch(`${API}/journeys/participant/${encodeURIComponent(user.email)}`, { headers: HEADERS });
//         const data = await res.json();
//         if (data.success) setJourneys(data.journeys);
//       } catch (e) {
//         console.error("Failed to load journeys:", e);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   const openSession = (journeyId: string, session: SessionEntry) => {
//     if (session.status === "locked") return;
//     navigate(`/participant/session/${session.id}/board`);
//   };

//   return (
//     <DashboardLayout role="participant">
//       <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
//         {/* Header */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
//           <h1 className="mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
//             Welcome, {userName}
//           </h1>
//           <p className="text-muted-foreground">Your Zest Journey — track your progress across all four sessions</p>
//         </motion.div>

//         {/* Journeys */}
//         {loading ? (
//           <Card className="p-12 flex items-center justify-center">
//             <Loader2 className="w-6 h-6 animate-spin text-[#4A1C5C]" />
//           </Card>
//         ) : journeys.length === 0 ? (
//           <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
//             <Card className="p-10 text-center">
//               <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
//               <h4 className="text-foreground mb-2 font-semibold">No journeys assigned yet</h4>
//               <p className="text-sm text-muted-foreground max-w-sm mx-auto">
//                 Your facilitator will link you using your email:{" "}
//                 <span className="font-medium text-foreground">{userEmail}</span>
//               </p>
//               <p className="text-xs text-muted-foreground mt-3">
//                 Once linked, your journey appears here automatically.
//               </p>
//             </Card>

//             {/* How it works */}
//             <Card className="mt-6 p-6 bg-[#EBE2D6]/50">
//               <h4 className="font-semibold mb-4" style={{ color: "#3D6D6C" }}>Your Zest Journey — four sessions</h4>
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                 {SESSION_META.map((s, i) => (
//                   <div key={s.number} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-border">
//                     <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ backgroundColor: s.color }}>
//                       {s.number}
//                     </div>
//                     <div>
//                       <p className="text-sm font-semibold text-foreground">Session {s.number}</p>
//                       <p className="text-xs text-muted-foreground">{s.title}</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </Card>
//           </motion.div>
//         ) : (
//           <div className="space-y-6">
//             {journeys.map((journey, ji) => {
//               const sessions: SessionEntry[] = journey.sessions || [];
//               const completedCount = sessions.filter(s => s.status === "completed").length;
//               const progressPct = Math.round((completedCount / 4) * 100);
//               const nextAvailable = sessions.find(s => s.status === "available" || s.status === "in_progress");

//               return (
//                 <motion.div key={journey.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ji * 0.1 }}>
//                   {/* Journey header */}
//                   <div className="mb-4">
//                     <div className="flex items-start justify-between gap-3 flex-wrap">
//                       <div>
//                         <h2 className="text-lg font-semibold" style={{ fontFamily: "Playfair Display, serif" }}>{journey.title}</h2>
//                         {journey.description && <p className="text-sm text-muted-foreground mt-0.5">{journey.description}</p>}
//                       </div>
//                       <Badge className={journey.status === "completed" ? "bg-[#3D6D6C] text-white" : "bg-[#D4A843] text-[#2C1810]"}>
//                         {journey.status === "completed" ? "Journey Complete" : "Active"}
//                       </Badge>
//                     </div>

//                     {/* Progress bar */}
//                     <div className="mt-3">
//                       <div className="flex items-center justify-between mb-1.5">
//                         <span className="text-xs text-muted-foreground">{completedCount} of 4 sessions complete</span>
//                         <span className="text-xs font-semibold text-[#4A1C5C]">{progressPct}%</span>
//                       </div>
//                       <div className="w-full bg-[#EBE2D6] rounded-full h-2">
//                         <motion.div className="bg-[#4A1C5C] h-2 rounded-full" initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.6 }} />
//                       </div>
//                     </div>
//                   </div>

//                   {/* Continue prompt */}
//                   {nextAvailable && (
//                     <div className="mb-4 p-4 bg-gradient-to-r from-[#4A1C5C]/8 to-[#3D6D6C]/8 rounded-xl border border-[#4A1C5C]/15">
//                       <div className="flex items-center justify-between gap-3 flex-wrap">
//                         <div>
//                           <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
//                             {nextAvailable.status === "in_progress" ? "Continue where you left off" : "Next up"}
//                           </p>
//                           <p className="font-semibold text-foreground">
//                             Session {nextAvailable.number} — {SESSION_META.find(m => m.number === nextAvailable.number)?.title}
//                           </p>
//                         </div>
//                         <button
//                           onClick={() => openSession(journey.id, nextAvailable)}
//                           className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#4A1C5C] text-white hover:bg-[#3A1C4C] transition-colors shadow-sm flex-shrink-0"
//                         >
//                           {nextAvailable.status === "in_progress" ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
//                           {nextAvailable.status === "in_progress" ? "Resume Session" : "Start Session"}
//                         </button>
//                       </div>
//                     </div>
//                   )}

//                   {/* Session cards */}
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                     {SESSION_META.map((meta, i) => {
//                       const entry = sessions.find(s => s.number === meta.number);
//                       const status: SessionStatus = entry?.status || "locked";
//                       const isLocked = status === "locked";
//                       const isActive = status === "available" || status === "in_progress";

//                       return (
//                         <motion.div
//                           key={meta.number}
//                           initial={{ opacity: 0, y: 10 }}
//                           animate={{ opacity: 1, y: 0 }}
//                           transition={{ delay: 0.1 + i * 0.06 }}
//                           onClick={() => entry && !isLocked && openSession(journey.id, entry)}
//                           className={`
//                             relative p-4 rounded-xl border-2 transition-all
//                             ${isLocked ? "border-border bg-white/50 opacity-60 cursor-not-allowed" : "border-border bg-white"}
//                             ${isActive ? "hover:shadow-md hover:border-[#4A1C5C]/40 cursor-pointer" : ""}
//                             ${status === "completed" ? "hover:shadow-sm cursor-pointer" : ""}
//                           `}
//                           style={!isLocked ? { borderColor: `${meta.color}25` } : {}}
//                         >
//                           <div className="flex items-start justify-between gap-2 mb-2">
//                             <div className="flex items-center gap-2">
//                               <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
//                                 style={{ backgroundColor: isLocked ? "#9CA3AF" : meta.color }}>
//                                 {isLocked ? <Lock className="w-3 h-3" /> : meta.number}
//                               </div>
//                               <div>
//                                 <p className="text-xs text-muted-foreground">Session {meta.number}</p>
//                                 <p className="font-semibold text-sm text-foreground leading-tight">{meta.title}</p>
//                               </div>
//                             </div>
//                             <StatusBadge status={status} />
//                           </div>

//                           {isLocked && (
//                             <p className="text-xs text-muted-foreground mt-2">Complete Session {meta.number - 1} to unlock</p>
//                           )}
//                           {status === "completed" && (
//                             <div className="flex items-center gap-1 text-xs text-[#4A1C5C] mt-2">
//                               <CheckCircle className="w-3 h-3" /> Tap to review
//                             </div>
//                           )}
//                           {isActive && (
//                             <div className="flex items-center gap-1 text-xs mt-2" style={{ color: meta.color }}>
//                               {status === "in_progress" ? <RotateCcw className="w-3 h-3" /> : <Play className="w-3 h-3" />}
//                               {status === "in_progress" ? "Resume" : "Tap to start"}
//                             </div>
//                           )}
//                         </motion.div>
//                       );
//                     })}
//                   </div>
//                 </motion.div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </DashboardLayout>
//   );
// }


import React, {
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router";

import DashboardLayout from "../../components/DashboardLayout";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";

import {
  Play,
  Eye,
  Loader2,
  FolderOpen,
  Lock,
  CheckCircle,
  Clock,
  RotateCcw,
  RefreshCw,
} from "lucide-react";

import { motion } from "motion/react";

import { createClient } from "../../../utils/supabase/client";
import { projectId } from "../../../utils/supabase/info";

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────

const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;

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

interface ParticipantEntry {
  email: string;
  linkedAt?: string;
}

interface Journey {
  id: string;
  title: string;
  description: string;
  facilitatorEmail: string;
  facilitatorId?: string;
  participantEmail?: string | null;
  participants?: ParticipantEntry[];
  sessions: SessionEntry[];
  status: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION METADATA
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_META = [
  {
    number: 1,
    title: "Identity Discovery",
    color: "#4A1C5C",
    steps: 7,
  },
  {
    number: 2,
    title: "Identities In Reality",
    color: "#3D6D6C",
    steps: 9,
  },
  {
    number: 3,
    title: "Future Self Exploration",
    color: "#D4A843",
    steps: 4,
  },
  {
    number: 4,
    title: "Integration & Next Steps",
    color: "#AA5D53",
    steps: 7,
  },
];

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
        "bg-gray-100 text-gray-500 border border-gray-200",
      icon: (
        <Lock className="w-3 h-3" />
      ),
    },

    available: {
      label: "Available",
      cls:
        "bg-[#D4A843]/15 text-[#A07820] border border-[#D4A843]/40",
      icon: (
        <Play className="w-3 h-3" />
      ),
    },

    in_progress: {
      label: "In Progress",
      cls:
        "bg-[#3D6D6C]/15 text-[#3D6D6C] border border-[#3D6D6C]/40",
      icon: (
        <Clock className="w-3 h-3" />
      ),
    },

    completed: {
      label: "Completed",
      cls:
        "bg-[#4A1C5C]/15 text-[#4A1C5C] border border-[#4A1C5C]/40",
      icon: (
        <CheckCircle className="w-3 h-3" />
      ),
    },
  };

  const cfg =
    CONFIGS[status] ??
    CONFIGS.locked;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZE SESSION
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

  const number =
    Number(raw.number);

  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > 4
  ) {
    return null;
  }

  const allowedStatuses: SessionStatus[] =
    [
      "locked",
      "available",
      "in_progress",
      "completed",
    ];

  const status: SessionStatus =
    allowedStatuses.includes(
      raw.status
    )
      ? raw.status
      : "locked";

  return {
    id: raw.id,
    number,
    status,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZE JOURNEY
// ─────────────────────────────────────────────────────────────────────────────

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

  const rawSessions =
    Array.isArray(
      raw.sessions
    )
      ? raw.sessions
      : [];

  const normalizedSessions =
    rawSessions
      .map(normalizeSession)
      .filter(
        (
          session: SessionEntry | null
        ): session is SessionEntry =>
          session !== null
      );

  const sessions: SessionEntry[] =
    [];

  // Keep one session per session number.
  for (
    let number = 1;
    number <= 4;
    number++
  ) {
    const existing =
      normalizedSessions.find(
        (session: SessionEntry) =>
          session.number ===
          number
      );

    if (existing) {
      sessions.push(
        existing
      );
    }
  }

  let participants: ParticipantEntry[] =
    [];

  if (
    Array.isArray(
      raw.participants
    )
  ) {
    participants =
      raw.participants
        .filter(
          (participant: any) =>
            participant &&
            typeof participant.email ===
              "string" &&
            participant.email.trim()
        )
        .map(
          (participant: any) => ({
            email:
              participant.email
                .trim()
                .toLowerCase(),

            linkedAt:
              typeof participant.linkedAt ===
              "string"
                ? participant.linkedAt
                : "",
          })
        );
  }

  // Backward compatibility.
  if (
    participants.length === 0 &&
    typeof raw.participantEmail ===
      "string" &&
    raw.participantEmail.trim()
  ) {
    participants = [
      {
        email:
          raw.participantEmail
            .trim()
            .toLowerCase(),

        linkedAt:
          typeof raw.createdAt ===
          "string"
            ? raw.createdAt
            : "",
      },
    ];
  }

  return {
    id: raw.id,

    title: raw.title,

    description:
      typeof raw.description ===
      "string"
        ? raw.description
        : "",

    facilitatorEmail:
      typeof raw.facilitatorEmail ===
      "string"
        ? raw.facilitatorEmail
        : "",

    facilitatorId:
      typeof raw.facilitatorId ===
      "string"
        ? raw.facilitatorId
        : undefined,

    participantEmail:
      typeof raw.participantEmail ===
      "string"
        ? raw.participantEmail
            .trim()
            .toLowerCase()
        : participants[0]
            ?.email || null,

    participants,

    sessions,

    status:
      typeof raw.status ===
      "string"
        ? raw.status
        : "active",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICIPANT DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

export default function ParticipantDashboard() {
  const navigate =
    useNavigate();

  const [journeys, setJourneys] =
    useState<Journey[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [userName, setUserName] =
    useState("there");

  const [userEmail, setUserEmail] =
    useState("");

  // ───────────────────────────────────────────────────────────────────────────
  // LOAD JOURNEYS
  // ───────────────────────────────────────────────────────────────────────────

  const loadJourneys =
    useCallback(
      async (
        showRefreshLoader = false
      ) => {
        try {
          if (
            showRefreshLoader
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          const supabase =
            createClient();

          // ───────────────────────────────────────────────────────────────────
          // GET CURRENT AUTHENTICATED SESSION
          // ───────────────────────────────────────────────────────────────────

          const {
            data: {
              session,
            },
            error:
              sessionError,
          } =
            await supabase.auth.getSession();

          if (
            sessionError ||
            !session?.user ||
            !session.access_token
          ) {
            console.error(
              "[participant-dashboard] Authentication error:",
              sessionError
            );

            setJourneys(
              []
            );

            navigate(
              "/participant/login",
              {
                replace: true,
              }
            );

            return;
          }

          const user =
            session.user;

          // ───────────────────────────────────────────────────────────────────
          // USER INFORMATION
          // ───────────────────────────────────────────────────────────────────

          const email =
            user.email
              ?.trim()
              .toLowerCase() ||
            "";

          const firstName =
            user.user_metadata
              ?.name
              ?.split(" ")[0] ||
            "there";

          setUserName(
            firstName
          );

          setUserEmail(
            email
          );

          if (!email) {
            console.error(
              "[participant-dashboard] Authenticated user has no email."
            );

            setJourneys(
              []
            );

            return;
          }

          // ───────────────────────────────────────────────────────────────────
          // AUTHENTICATED REQUEST
          //
          // IMPORTANT:
          // Use the participant's real access token.
          // Do NOT use publicAnonKey.
          // ───────────────────────────────────────────────────────────────────

          const headers: HeadersInit =
            {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            };

          const url =
            `${API}/journeys/participant/${encodeURIComponent(
              email
            )}`;

          console.log(
            `[participant-dashboard] Loading journeys for ${email}`
          );

          const response =
            await fetch(
              url,
              {
                method:
                  "GET",

                headers,

                cache:
                  "no-store",
              }
            );

          let data: any =
            null;

          try {
            data =
              await response.json();
          } catch (
            jsonError
          ) {
            console.error(
              "[participant-dashboard] Failed to parse API response:",
              jsonError
            );
          }

          // ───────────────────────────────────────────────────────────────────
          // AUTH FAILURE
          // ───────────────────────────────────────────────────────────────────

          if (
            response.status ===
            401
          ) {
            console.error(
              "[participant-dashboard] API authentication failed:",
              data
            );

            setJourneys(
              []
            );

            navigate(
              "/participant/login",
              {
                replace: true,
              }
            );

            return;
          }

          if (
            response.status ===
            403
          ) {
            console.error(
              "[participant-dashboard] API access denied:",
              data
            );

            return;
          }

          // ───────────────────────────────────────────────────────────────────
          // NO JOURNEYS
          // ───────────────────────────────────────────────────────────────────

          if (
            response.status ===
            404
          ) {
            console.log(
              "[participant-dashboard] No participant journeys found."
            );

            setJourneys(
              []
            );

            return;
          }

          // ───────────────────────────────────────────────────────────────────
          // OTHER API FAILURE
          // ───────────────────────────────────────────────────────────────────

          if (
            !response.ok
          ) {
            console.error(
              "[participant-dashboard] Failed to load journeys:",
              {
                status:
                  response.status,
                data,
              }
            );

            setJourneys(
              []
            );

            return;
          }

          if (
            !data?.success
          ) {
            console.error(
              "[participant-dashboard] API error:",
              data?.error
            );

            setJourneys(
              []
            );

            return;
          }

          // ───────────────────────────────────────────────────────────────────
          // NORMALIZE JOURNEYS
          // ───────────────────────────────────────────────────────────────────

          const returnedJourneys =
            Array.isArray(
              data.journeys
            )
              ? data.journeys
              : [];

          const normalizedJourneys =
            returnedJourneys
              .map(
                normalizeJourney
              )
              .filter(
                (
                  journey: Journey | null
                ): journey is Journey =>
                  journey !==
                  null
              );

          console.log(
            `[participant-dashboard] email=${email} journeys=${normalizedJourneys.length}`
          );

          console.log(
            "[participant-dashboard] journeys:",
            normalizedJourneys
          );

          setJourneys(
            normalizedJourneys
          );
        } catch (
          error
        ) {
          console.error(
            "[participant-dashboard] Failed to load journeys:",
            error
          );

          setJourneys(
            []
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
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

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void loadJourneys(true);
      }
    };

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener(
        "visibilitychange",
        refreshWhenVisible
      );
    };
  }, [loadJourneys]);

  // ───────────────────────────────────────────────────────────────────────────
  // OPEN SESSION
  // ───────────────────────────────────────────────────────────────────────────

  const openSession =
    (
      journeyId: string,
      session: SessionEntry
    ) => {
      void journeyId;

      if (
        !session ||
        !session.id
      ) {
        console.error(
          "[participant-dashboard] Invalid session:",
          session
        );

        return;
      }

      if (
        session.status ===
        "locked"
      ) {
        return;
      }

      navigate(
        `/participant/session/${session.id}/board`
      );
    };

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout role="participant">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* HEADER */}
        {/* ─────────────────────────────────────────────────────────────────── */}

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
                Welcome,{" "}
                {userName}
              </h1>

              <p className="text-muted-foreground">
                Your Zest Journey —
                track your progress
                across all four
                sessions
              </p>
            </div>

            {/* Refresh */}

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                loadJourneys(
                  true
                )
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

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* LOADING */}
        {/* ─────────────────────────────────────────────────────────────────── */}

        {loading ? (
          <Card className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#4A1C5C]" />
          </Card>

        ) : journeys.length ===
          0 ? (

          /* ───────────────────────────────────────────────────────────────── */
          /* EMPTY STATE */
          /* ───────────────────────────────────────────────────────────────── */

          <motion.div
            initial={{
              opacity: 0,
              y: 16,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
          >
            <Card className="p-10 text-center">

              <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />

              <h4 className="text-foreground mb-2 font-semibold">
                No journeys assigned yet
              </h4>

              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Your facilitator
                will link you using
                your email:
              </p>

              <p className="font-medium text-foreground text-sm mt-1 break-all">
                {userEmail ||
                  "your participant email"}
              </p>

              <p className="text-xs text-muted-foreground mt-3">
                Once linked, your
                journey will appear
                here automatically.
              </p>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  loadJourneys(
                    true
                  )
                }
                disabled={
                  refreshing
                }
                className="mt-5"
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}

                Check Again
              </Button>
            </Card>

            {/* How it works */}

            <Card className="mt-6 p-6 bg-[#EBE2E6]/50">
              <h4
                className="font-semibold mb-4"
                style={{
                  color:
                    "#3D6D6C",
                }}
              >
                Your Zest Journey —
                four sessions
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SESSION_META.map(
                  (session) => (
                    <div
                      key={
                        session.number
                      }
                      className="flex items-start gap-3 p-3 bg-white rounded-xl border border-border"
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                        style={{
                          backgroundColor:
                            session.color,
                        }}
                      >
                        {
                          session.number
                        }
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Session{" "}
                          {
                            session.number
                          }
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {
                            session.title
                          }
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </Card>
          </motion.div>

        ) : (

          /* ───────────────────────────────────────────────────────────────── */
          /* JOURNEYS */
          /* ───────────────────────────────────────────────────────────────── */

          <div className="space-y-6">

            {journeys.map(
              (
                journey,
                journeyIndex
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

                const nextAvailable =
                  sessions.find(
                    (session) =>
                      session.status ===
                        "in_progress" ||
                      session.status ===
                        "available"
                  );

                return (
                  <motion.div
                    key={
                      journey.id
                    }
                    initial={{
                      opacity: 0,
                      y: 16,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        journeyIndex *
                        0.1,
                    }}
                  >

                    {/* Journey header */}

                    <div className="mb-4">

                      <div className="flex items-start justify-between gap-3 flex-wrap">

                        <div className="min-w-0">
                          <h2
                            className="text-lg font-semibold truncate"
                            style={{
                              fontFamily:
                                "Playfair Display, serif",
                            }}
                          >
                            {
                              journey.title
                            }
                          </h2>

                          {journey.description && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {
                                journey.description
                              }
                            </p>
                          )}
                        </div>

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
                            : "Active"}
                        </Badge>
                      </div>

                      {/* Progress */}

                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-muted-foreground">
                            {
                              completedCount
                            }{" "}
                            of 4 sessions
                            complete
                          </span>

                          <span className="text-xs font-semibold text-[#4A1C5C]">
                            {
                              progressPct
                            }
                            %
                          </span>
                        </div>

                        <div className="w-full bg-[#EBE2D6] rounded-full h-2">
                          <motion.div
                            className="bg-[#4A1C5C] h-2 rounded-full"
                            initial={{
                              width: 0,
                            }}
                            animate={{
                              width: `${progressPct}%`,
                            }}
                            transition={{
                              duration:
                                0.6,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {completedCount > 0 && (
                      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-[#D4A843]/35 bg-[#F7F3EE] p-4 shadow-sm">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#4A1C5C] text-[#D4A843]">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#4A1C5C]" style={{ fontFamily: "Playfair Display, serif" }}>
                            Session {sessions.find((session) => session.status === "completed")?.number} Complete
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            Your reflections and work have been saved. You can review this session or continue when the next one becomes available.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ─────────────────────────────────────────────────────── */}
                    {/* CONTINUE PROMPT */}
                    {/* ─────────────────────────────────────────────────────── */}

                    {nextAvailable && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-[#4A1C5C]/8 to-[#3D6D6C]/8 rounded-xl border border-[#4A1C5C]/15">

                        <div className="flex items-center justify-between gap-3 flex-wrap">

                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
                              {nextAvailable.status ===
                              "in_progress"
                                ? "Continue where you left off"
                                : "Next up"}
                            </p>

                            <p className="font-semibold text-foreground">
                              Session{" "}
                              {
                                nextAvailable.number
                              }{" "}
                              —{" "}
                              {
                                SESSION_META.find(
                                  (
                                    meta
                                  ) =>
                                    meta.number ===
                                    nextAvailable.number
                                )
                                  ?.title
                              }
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              openSession(
                                journey.id,
                                nextAvailable
                              )
                            }
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#4A1C5C] text-white hover:bg-[#3A1C4C] transition-colors shadow-sm flex-shrink-0"
                          >
                            {nextAvailable.status ===
                            "in_progress" ? (
                              <RotateCcw className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}

                            {nextAvailable.status ===
                            "in_progress"
                              ? "Resume Session"
                              : "Start Session"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ─────────────────────────────────────────────────────── */}
                    {/* SESSION CARDS */}
                    {/* ─────────────────────────────────────────────────────── */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                      {SESSION_META.map(
                        (
                          meta,
                          sessionIndex
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
                            "locked";

                          const isLocked =
                            status ===
                            "locked";

                          const isActive =
                            status ===
                              "available" ||
                            status ===
                              "in_progress";

                          return (
                            <motion.div
                              key={
                                meta.number
                              }
                              initial={{
                                opacity: 0,
                                y: 10,
                              }}
                              animate={{
                                opacity: 1,
                                y: 0,
                              }}
                              transition={{
                                delay:
                                  0.1 +
                                  sessionIndex *
                                    0.06,
                              }}
                              onClick={() => {
                                if (
                                  entry &&
                                  !isLocked
                                ) {
                                  openSession(
                                    journey.id,
                                    entry
                                  );
                                }
                              }}
                              className={`
                                relative p-4 rounded-xl border-2 transition-all
                                ${
                                  isLocked
                                    ? "border-border bg-white/50 opacity-60 cursor-not-allowed"
                                    : "border-border bg-white"
                                }
                                ${
                                  isActive
                                    ? "hover:shadow-md hover:border-[#4A1C5C]/40 cursor-pointer"
                                    : ""
                                }
                                ${
                                  status ===
                                  "completed"
                                    ? "hover:shadow-sm cursor-pointer"
                                    : ""
                                }
                              `}
                              style={
                                !isLocked
                                  ? {
                                      borderColor:
                                        `${meta.color}25`,
                                    }
                                  : {}
                              }
                            >

                              {/* Session heading */}

                              <div className="flex items-start justify-between gap-2 mb-2">

                                <div className="flex items-center gap-2 min-w-0">

                                  <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                                    style={{
                                      backgroundColor:
                                        isLocked
                                          ? "#9CA3AF"
                                          : meta.color,
                                    }}
                                  >
                                    {isLocked ? (
                                      <Lock className="w-3 h-3" />
                                    ) : (
                                      meta.number
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">
                                      Session{" "}
                                      {
                                        meta.number
                                      }
                                    </p>

                                    <p className="font-semibold text-sm text-foreground leading-tight truncate">
                                      {
                                        meta.title
                                      }
                                    </p>
                                  </div>
                                </div>

                                <StatusBadge
                                  status={
                                    status
                                  }
                                />
                              </div>

                              {/* Locked */}

                              {isLocked && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  {meta.number ===
                                  1
                                    ? "Waiting for your facilitator to open this session"
                                    : `Complete Session ${
                                        meta.number -
                                        1
                                      } to unlock`}
                                </p>
                              )}

                              {/* Completed */}

                              {status ===
                                "completed" && (
                                <div className="flex items-center gap-1 text-xs text-[#4A1C5C] mt-2">
                                  <CheckCircle className="w-3 h-3" />

                                  <Eye className="w-3 h-3" />

                                  Tap to review
                                </div>
                              )}

                              {/* Active */}

                              {isActive && (
                                <div
                                  className="flex items-center gap-1 text-xs mt-2"
                                  style={{
                                    color:
                                      meta.color,
                                  }}
                                >
                                  {status ===
                                  "in_progress" ? (
                                    <RotateCcw className="w-3 h-3" />
                                  ) : (
                                    <Play className="w-3 h-3" />
                                  )}

                                  {status ===
                                  "in_progress"
                                    ? "Resume"
                                    : "Tap to start"}
                                </div>
                              )}
                            </motion.div>
                          );
                        }
                      )}
                    </div>
                  </motion.div>
                );
              }
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}