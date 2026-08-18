// import { useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router";
// import DashboardLayout from "../../components/DashboardLayout";
// import { Card } from "../../components/ui/card";
// import { Button } from "../../components/ui/button";
// import { Badge } from "../../components/ui/badge";
// import {
//   ArrowLeft, Calendar, FolderOpen, Users, Play, Eye, RotateCcw,
//   Loader2, CheckCircle, Lock, Clock, Plus,
// } from "lucide-react";
// import { motion } from "motion/react";
// import { createClient } from "@/utils/supabase/client";
// import { projectId, publicAnonKey } from "@/utils/supabase/info";

// const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;
// const HEADERS = { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` };

// type SessionStatus = "locked" | "available" | "in_progress" | "completed";

// interface SessionEntry { id: string; number: number; status: SessionStatus; }

// interface Journey {
//   id: string;
//   title: string;
//   description: string;
//   facilitatorId: string;
//   participantEmail: string | null;
//   participants: { email: string; linkedAt: string }[];
//   sessions: SessionEntry[];
//   status: string;
//   createdAt: string;
// }

// const SESSION_NAMES = [
//   "Identity Discovery",
//   "Identities In Reality",
//   "Experiment Design",
//   "What I Tried",
// ];

// const SESSION_COLORS: Record<SessionStatus, string> = {
//   locked:      "#9CA3AF",
//   available:   "#D4A843",
//   in_progress: "#3D6D6C",
//   completed:   "#4A1C5C",
// };

// function StatusBadge({ status }: { status: SessionStatus }) {
//   const labels: Record<SessionStatus, string> = {
//     locked: "Locked", available: "Available", in_progress: "In Progress", completed: "Completed",
//   };
//   const icons: Record<SessionStatus, React.ReactNode> = {
//     locked:      <Lock className="w-3 h-3" />,
//     available:   <Clock className="w-3 h-3" />,
//     in_progress: <Play className="w-3 h-3" />,
//     completed:   <CheckCircle className="w-3 h-3" />,
//   };
//   const color = SESSION_COLORS[status];
//   return (
//     <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
//       style={{ borderColor: `${color}40`, color, backgroundColor: `${color}10` }}>
//       {icons[status]} {labels[status]}
//     </span>
//   );
// }

// export default function UpcomingSessions() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const role = location.pathname.startsWith("/participant") ? "participant" : "facilitator";
//   const dashboardPath = role === "facilitator" ? "/facilitator/dashboard" : "/participant/dashboard";
//   const isParticipant = role === "participant";

//   const [journeys, setJourneys] = useState<Journey[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [userName, setUserName] = useState("");
//   const [userEmail, setUserEmail] = useState("");

//   useEffect(() => {
//     (async () => {
//       try {
//         const supabase = createClient();
//         const { data: { user } } = await supabase.auth.getUser();
//         if (!user) { navigate(isParticipant ? "/participant/login" : "/facilitator/login"); return; }

//         setUserName(user.user_metadata?.name?.split(" ")[0] || "");
//         setUserEmail(user.email || "");

//         let res;
//         if (isParticipant) {
//           res = await fetch(`${API}/journeys/participant/${encodeURIComponent(user.email || "")}`, { headers: HEADERS });
//         } else {
//           res = await fetch(`${API}/journeys/facilitator/${user.id}`, { headers: HEADERS });
//         }

//         const data = await res.json();
//         if (data.success) setJourneys(data.journeys);
//       } catch (e) {
//         console.error("Failed to load journeys:", e);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [isParticipant]);

//   const openSession = (session: SessionEntry) => {
//     const prefix = isParticipant ? "/participant" : "/facilitator";
//     navigate(`${prefix}/session/${session.id}/board`);
//   };

//   // Flatten journeys into session rows for display
//   const sessionRows = journeys.flatMap(journey =>
//     (journey.sessions || []).map(sess => ({ journey, session: sess }))
//   );

//   // Stats
//   const activeCount = sessionRows.filter(r => r.session.status === "in_progress").length;
//   const availableCount = sessionRows.filter(r => r.session.status === "available").length;
//   const completedCount = sessionRows.filter(r => r.session.status === "completed").length;

//   return (
//     <DashboardLayout role={role}>
//       <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
//         {/* Header */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
//           <Button variant="ghost" onClick={() => navigate(dashboardPath)} className="mb-4 -ml-2">
//             <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
//           </Button>
//           <h1 className="mb-2" style={{ fontFamily: "Playfair Display, serif" }}>Sessions</h1>
//           <p className="text-muted-foreground">
//             {isParticipant ? "Your journey sessions" : "All sessions across your journeys"}
//           </p>
//         </motion.div>

//         {/* Stats */}
//         {!loading && journeys.length > 0 && (
//           <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
//             className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
//             {[
//               { label: "Total Sessions",  value: sessionRows.length,  color: "#4A1C5C" },
//               { label: "In Progress",     value: activeCount,          color: "#3D6D6C" },
//               { label: "Available",       value: availableCount,       color: "#D4A843" },
//               { label: "Completed",       value: completedCount,       color: "#AA5D53" },
//             ].map(s => (
//               <Card key={s.label} className="p-4 sm:p-5">
//                 <p className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</p>
//                 <p className="text-xs sm:text-sm text-muted-foreground">{s.label}</p>
//               </Card>
//             ))}
//           </motion.div>
//         )}

//         {/* Session list */}
//         {loading ? (
//           <Card className="p-12 flex items-center justify-center">
//             <Loader2 className="w-6 h-6 animate-spin text-[#4A1C5C]" />
//           </Card>
//         ) : journeys.length === 0 ? (
//           <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
//             <Card className="p-12 text-center">
//               <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-25" />
//               <h4 className="font-semibold text-foreground mb-2">No sessions available yet</h4>
//               <p className="text-sm text-muted-foreground mb-6">
//                 {isParticipant
//                   ? "Your facilitator hasn't linked you to a journey yet."
//                   : "Create a journey to generate sessions automatically."}
//               </p>
//               {!isParticipant && (
//                 <Button onClick={() => navigate("/facilitator/journey/create")}
//                   className="bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810]">
//                   <Plus className="w-4 h-4 mr-2" /> Create Journey
//                 </Button>
//               )}
//             </Card>
//           </motion.div>
//         ) : (
//           <div className="space-y-4">
//             {journeys.map((journey, ji) => {
//               const sessions = journey.sessions || [];
//               const completedSessions = sessions.filter(s => s.status === "completed").length;

//               return (
//                 <motion.div key={journey.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ji * 0.07 }}>
//                   {/* Journey header */}
//                   <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
//                     <div className="flex items-center gap-2">
//                       <FolderOpen className="w-4 h-4 text-[#4A1C5C]" />
//                       <span className="font-semibold text-foreground">{journey.title}</span>
//                       <Badge className={journey.status === "completed" ? "bg-[#3D6D6C] text-white" : "bg-[#D4A843]/20 text-[#A07820]"}>
//                         {journey.status === "completed" ? "Complete" : "Active"}
//                       </Badge>
//                     </div>
//                     {journey.participantEmail && (
//                       <span className="text-xs text-muted-foreground flex items-center gap-1">
//                         <Users className="w-3.5 h-3.5" />
//                         {journey.participantEmail}
//                         {(journey.participants?.length || 0) > 1 && ` +${journey.participants.length - 1}`}
//                       </span>
//                     )}
//                   </div>

//                   {/* Session cards */}
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
//                     {sessions.map((sess, si) => {
//                       const name = SESSION_NAMES[sess.number - 1] || `Session ${sess.number}`;
//                       const color = SESSION_COLORS[sess.status];
//                       const isLocked = sess.status === "locked";
//                       const canOpen = !isLocked;

//                       return (
//                         <div key={sess.id}
//                           className={`bg-white rounded-xl border-2 p-4 transition-all ${canOpen && !isParticipant ? "hover:shadow-md cursor-pointer" : ""} ${isParticipant && canOpen ? "hover:shadow-md cursor-pointer" : ""}`}
//                           style={{ borderColor: isLocked ? "#E5E7EB" : `${color}25` }}
//                           onClick={() => canOpen ? openSession(sess) : undefined}
//                         >
//                           <div className="flex items-start justify-between gap-2 mb-3">
//                             <div className="flex items-center gap-2 min-w-0">
//                               <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
//                                 style={{ backgroundColor: isLocked ? "#9CA3AF" : color }}>
//                                 {sess.number}
//                               </div>
//                               <div className="min-w-0">
//                                 <p className="text-xs text-muted-foreground">Session {sess.number}</p>
//                                 <p className="font-semibold text-sm text-foreground leading-tight truncate">{name}</p>
//                               </div>
//                             </div>
//                             <StatusBadge status={sess.status} />
//                           </div>

//                           {/* Action */}
//                           {canOpen && (
//                             <button
//                               onClick={e => { e.stopPropagation(); openSession(sess); }}
//                               className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
//                               style={{ backgroundColor: color }}
//                             >
//                               {sess.status === "completed"
//                                 ? <><Eye className="w-3.5 h-3.5" /> Review Board</>
//                                 : sess.status === "in_progress"
//                                 ? <><RotateCcw className="w-3.5 h-3.5" /> Resume Session</>
//                                 : <><Play className="w-3.5 h-3.5" /> {isParticipant ? "Join Session" : "Start Session"}</>
//                               }
//                             </button>
//                           )}

//                           {isLocked && (
//                             <div className="flex items-center justify-center gap-1.5 py-2 text-xs text-gray-400">
//                               <Lock className="w-3 h-3" /> Locked
//                             </div>
//                           )}
//                         </div>
//                       );
//                     })}
//                   </div>

//                   {/* Progress bar */}
//                   <div className="flex items-center gap-2 px-1">
//                     <div className="flex-1 bg-[#EBE2D6] rounded-full h-1.5">
//                       <div className="bg-[#4A1C5C] h-1.5 rounded-full transition-all"
//                         style={{ width: `${Math.round((completedSessions / 4) * 100)}%` }} />
//                     </div>
//                     <span className="text-xs text-muted-foreground flex-shrink-0">{completedSessions}/4 complete</span>
//                   </div>

//                   {/* Divider between journeys */}
//                   {ji < journeys.length - 1 && <div className="border-t border-border mt-5" />}
//                 </motion.div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </DashboardLayout>
//   );
// }


import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";

import DashboardLayout from "../../components/DashboardLayout";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";

import {
  ArrowLeft,
  Calendar,
  FolderOpen,
  Users,
  Play,
  Eye,
  RotateCcw,
  Loader2,
  CheckCircle,
  Lock,
  Clock,
  Plus,
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
  facilitatorId?: string;
  facilitatorEmail?: string;
  participantEmail?: string | null;
  participants?: ParticipantEntry[];
  sessions: SessionEntry[];
  status: string;
  createdAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION NAMES
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_NAMES = [
  "Identity Discovery",
  "Identities In Reality",
  "Future Self Exploration",
  "Integration & Next Steps",
];

// ─────────────────────────────────────────────────────────────────────────────
// SESSION COLORS
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_COLORS: Record<
  SessionStatus,
  string
> = {
  locked: "#9CA3AF",
  available: "#D4A843",
  in_progress: "#3D6D6C",
  completed: "#4A1C5C",
};

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({
  status,
}: {
  status: SessionStatus;
}) {
  const labels: Record<
    SessionStatus,
    string
  > = {
    locked: "Locked",
    available: "Available",
    in_progress: "In Progress",
    completed: "Completed",
  };

  const icons: Record<
    SessionStatus,
    React.ReactNode
  > = {
    locked: (
      <Lock className="w-3 h-3" />
    ),
    available: (
      <Clock className="w-3 h-3" />
    ),
    in_progress: (
      <Play className="w-3 h-3" />
    ),
    completed: (
      <CheckCircle className="w-3 h-3" />
    ),
  };

  const color =
    SESSION_COLORS[status] ||
    SESSION_COLORS.locked;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
      style={{
        borderColor: `${color}40`,
        color,
        backgroundColor: `${color}10`,
      }}
    >
      {icons[status]}
      {labels[status]}
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

  const statuses: SessionStatus[] =
    [
      "locked",
      "available",
      "in_progress",
      "completed",
    ];

  const status: SessionStatus =
    statuses.includes(
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

  const sessions =
    rawSessions
      .map(normalizeSession)
      .filter(
        (
          session: SessionEntry | null
        ): session is SessionEntry =>
          session !== null
      );

  const uniqueSessions: SessionEntry[] =
    [];

  for (
    let number = 1;
    number <= 4;
    number++
  ) {
    const session =
      sessions.find(
        (item: SessionEntry) =>
          item.number ===
          number
      );

    if (session) {
      uniqueSessions.push(
        session
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

  // Backward compatibility for older journey records.
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

    facilitatorId:
      typeof raw.facilitatorId ===
      "string"
        ? raw.facilitatorId
        : undefined,

    facilitatorEmail:
      typeof raw.facilitatorEmail ===
      "string"
        ? raw.facilitatorEmail
        : "",

    participantEmail:
      typeof raw.participantEmail ===
      "string"
        ? raw.participantEmail
            .trim()
            .toLowerCase()
        : participants[0]
            ?.email || null,

    participants,

    sessions:
      uniqueSessions,

    status:
      typeof raw.status ===
      "string"
        ? raw.status
        : "active",

    createdAt:
      typeof raw.createdAt ===
      "string"
        ? raw.createdAt
        : "",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

export default function UpcomingSessions() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const isParticipant =
    location.pathname.startsWith(
      "/participant"
    );

  const role =
    isParticipant
      ? "participant"
      : "facilitator";

  const dashboardPath =
    isParticipant
      ? "/participant/dashboard"
      : "/facilitator/dashboard";

  const [journeys, setJourneys] =
    useState<Journey[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [userName, setUserName] =
    useState("");

  const [userEmail, setUserEmail] =
    useState("");

  // ───────────────────────────────────────────────────────────────────────────
  // LOAD JOURNEYS
  // ───────────────────────────────────────────────────────────────────────────

  const loadJourneys =
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

        // ─────────────────────────────────────────────────────────────────────
        // GET AUTHENTICATED SESSION
        // ─────────────────────────────────────────────────────────────────────

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
            "[upcoming-sessions] Authentication error:",
            sessionError
          );

          setJourneys(
            []
          );

          navigate(
            isParticipant
              ? "/participant/login"
              : "/facilitator/login",
            {
              replace: true,
            }
          );

          return;
        }

        const user =
          session.user;

        const email =
          user.email
            ?.trim()
            .toLowerCase() ||
          "";

        setUserName(
          user.user_metadata
            ?.name
            ?.split(" ")[0] ||
            ""
        );

        setUserEmail(
          email
        );

        // ─────────────────────────────────────────────────────────────────────
        // AUTHENTICATED HEADERS
        // ─────────────────────────────────────────────────────────────────────

        const headers: HeadersInit =
          {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${session.access_token}`,
          };

        let endpoint = "";

        if (
          isParticipant
        ) {
          if (!email) {
            setJourneys(
              []
            );
            return;
          }

          endpoint =
            `${API}/journeys/participant/${encodeURIComponent(
              email
            )}`;
        } else {
          endpoint =
            `${API}/journeys/facilitator/${user.id}`;
        }

        console.log(
          `[upcoming-sessions] Loading ${role} journeys:`,
          endpoint
        );

        // ─────────────────────────────────────────────────────────────────────
        // FETCH
        // ─────────────────────────────────────────────────────────────────────

        const response =
          await fetch(
            endpoint,
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
            "[upcoming-sessions] Failed to parse response:",
            jsonError
          );
        }

        // ─────────────────────────────────────────────────────────────────────
        // AUTH FAILURE
        // ─────────────────────────────────────────────────────────────────────

        if (
          response.status ===
            401 ||
          response.status ===
            403
        ) {
          console.error(
            "[upcoming-sessions] API authentication failed:",
            data
          );

          setJourneys(
            []
          );

          navigate(
            isParticipant
              ? "/participant/login"
              : "/facilitator/login",
            {
              replace: true,
            }
          );

          return;
        }

        // ─────────────────────────────────────────────────────────────────────
        // NO JOURNEYS
        // ─────────────────────────────────────────────────────────────────────

        if (
          response.status ===
          404
        ) {
          console.log(
            "[upcoming-sessions] No journeys found."
          );

          setJourneys(
            []
          );

          return;
        }

        if (
          !response.ok
        ) {
          console.error(
            "[upcoming-sessions] Request failed:",
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
            "[upcoming-sessions] API error:",
            data?.error
          );

          setJourneys(
            []
          );

          return;
        }

        // ─────────────────────────────────────────────────────────────────────
        // NORMALIZE
        // ─────────────────────────────────────────────────────────────────────

        const returnedJourneys =
          Array.isArray(
            data.journeys
          )
            ? data.journeys
            : [];

        let normalizedJourneys: Journey[] =
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

        // Facilitator-side defensive ownership check.
        if (
          !isParticipant
        ) {
          normalizedJourneys =
            normalizedJourneys.filter(
              (
                journey: Journey
              ) =>
                !journey.facilitatorId ||
                journey.facilitatorId ===
                  user.id
            );
        }

        console.log(
          `[upcoming-sessions] role=${role} user=${email} journeys=${normalizedJourneys.length}`
        );

        setJourneys(
          normalizedJourneys
        );
      } catch (
        error
      ) {
        console.error(
          "[upcoming-sessions] Failed to load journeys:",
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
    };

  // ───────────────────────────────────────────────────────────────────────────
  // INITIAL LOAD
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadJourneys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isParticipant,
  ]);

  // ───────────────────────────────────────────────────────────────────────────
  // OPEN SESSION
  // ───────────────────────────────────────────────────────────────────────────

  const openSession =
    (
      session: SessionEntry
    ) => {
      if (
        !session ||
        !session.id
      ) {
        return;
      }

      if (
        session.status ===
        "locked"
      ) {
        return;
      }

      const prefix =
        isParticipant
          ? "/participant"
          : "/facilitator";

      navigate(
        `${prefix}/session/${session.id}/board`
      );
    };

  // ───────────────────────────────────────────────────────────────────────────
  // FLATTEN SESSION ROWS
  // ───────────────────────────────────────────────────────────────────────────

  const sessionRows =
    journeys.flatMap(
      (journey) =>
        (
          journey.sessions ||
          []
        ).map(
          (session) => ({
            journey,
            session,
          })
        )
    );

  // ───────────────────────────────────────────────────────────────────────────
  // STATS
  // ───────────────────────────────────────────────────────────────────────────

  const activeCount =
    sessionRows.filter(
      ({
        session,
      }) =>
        session.status ===
        "in_progress"
    ).length;

  const availableCount =
    sessionRows.filter(
      ({
        session,
      }) =>
        session.status ===
        "available"
    ).length;

  const completedCount =
    sessionRows.filter(
      ({
        session,
      }) =>
        session.status ===
        "completed"
    ).length;

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout
      role={role}
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">

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
          <Button
            variant="ghost"
            onClick={() =>
              navigate(
                dashboardPath
              )
            }
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-start justify-between gap-4">

            <div>
              <h1
                className="mb-2"
                style={{
                  fontFamily:
                    "Playfair Display, serif",
                }}
              >
                Sessions
              </h1>

              <p className="text-muted-foreground">
                {isParticipant
                  ? "Your journey sessions"
                  : "All sessions across your journeys"}
              </p>

              {userEmail && (
                <p className="text-xs text-muted-foreground mt-1">
                  {userName
                    ? `${userName} · `
                    : ""}
                  {userEmail}
                </p>
              )}
            </div>

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
        {/* STATS */}
        {/* ─────────────────────────────────────────────────────────────────── */}

        {!loading &&
          journeys.length >
            0 && (
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
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8"
            >
              {[
                {
                  label:
                    "Total Sessions",
                  value:
                    sessionRows.length,
                  color:
                    "#4A1C5C",
                },
                {
                  label:
                    "In Progress",
                  value:
                    activeCount,
                  color:
                    "#3D6D6C",
                },
                {
                  label:
                    "Available",
                  value:
                    availableCount,
                  color:
                    "#D4A843",
                },
                {
                  label:
                    "Completed",
                  value:
                    completedCount,
                  color:
                    "#AA5D53",
                },
              ].map(
                (stat) => (
                  <Card
                    key={
                      stat.label
                    }
                    className="p-4 sm:p-5"
                  >
                    <p
                      className="text-2xl font-bold mb-1"
                      style={{
                        color:
                          stat.color,
                      }}
                    >
                      {
                        stat.value
                      }
                    </p>

                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {
                        stat.label
                      }
                    </p>
                  </Card>
                )
              )}
            </motion.div>
          )}

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
          /* EMPTY */
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
            <Card className="p-12 text-center">

              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-25" />

              <h4 className="font-semibold text-foreground mb-2">
                No sessions available yet
              </h4>

              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {isParticipant
                  ? "Your facilitator hasn't linked you to a journey yet, or no sessions are available."
                  : "Create a journey to generate its four sessions automatically."}
              </p>

              {isParticipant ? (
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
                >
                  {refreshing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}

                  Check Again
                </Button>
              ) : (
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
              )}
            </Card>
          </motion.div>

        ) : (

          /* ───────────────────────────────────────────────────────────────── */
          /* JOURNEYS */
          /* ───────────────────────────────────────────────────────────────── */

          <div className="space-y-4">

            {journeys.map(
              (
                journey,
                journeyIndex
              ) => {
                const sessions =
                  journey.sessions ||
                  [];

                const completedSessions =
                  sessions.filter(
                    (session) =>
                      session.status ===
                      "completed"
                  ).length;

                const progress =
                  Math.min(
                    100,
                    Math.round(
                      (completedSessions /
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
                      y: 16,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        journeyIndex *
                        0.07,
                    }}
                  >

                    {/* Journey header */}

                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">

                      <div className="flex items-center gap-2 min-w-0">

                        <FolderOpen className="w-4 h-4 text-[#4A1C5C] flex-shrink-0" />

                        <span className="font-semibold text-foreground truncate">
                          {
                            journey.title
                          }
                        </span>

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

                      {/* Participant information for facilitator */}

                      {!isParticipant &&
                        journey.participants &&
                        journey.participants.length >
                          0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />

                            {
                              journey
                                .participants[0]
                                .email
                            }

                            {journey
                              .participants
                              .length >
                              1 &&
                              ` +${
                                journey
                                  .participants
                                  .length -
                                1
                              }`}
                          </span>
                        )}

                      {/* Participant's facilitator */}

                      {isParticipant &&
                        journey.facilitatorEmail && (
                          <span className="text-xs text-muted-foreground">
                            Facilitator:{" "}
                            {
                              journey.facilitatorEmail
                            }
                          </span>
                        )}
                    </div>

                    {/* Session cards */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">

                      {[
                        1,
                        2,
                        3,
                        4,
                      ].map(
                        (
                          number
                        ) => {
                          const sess =
                            sessions.find(
                              (
                                session
                              ) =>
                                session.number ===
                                number
                            );

                          const status: SessionStatus =
                            sess?.status ||
                            "locked";

                          const color =
                            SESSION_COLORS[
                              status
                            ];

                          const name =
                            SESSION_NAMES[
                              number -
                                1
                            ];

                          const isLocked =
                            status ===
                            "locked";

                          const canOpen =
                            !!sess &&
                            !isLocked;

                          return (
                            <div
                              key={
                                number
                              }
                              className={`
                                bg-white rounded-xl border-2 p-4 transition-all
                                ${
                                  canOpen
                                    ? "hover:shadow-md cursor-pointer"
                                    : ""
                                }
                              `}
                              style={{
                                borderColor:
                                  isLocked
                                    ? "#E5E7EB"
                                    : `${color}25`,
                              }}
                              onClick={() => {
                                if (
                                  canOpen &&
                                  sess
                                ) {
                                  openSession(
                                    sess
                                  );
                                }
                              }}
                            >

                              {/* Heading */}

                              <div className="flex items-start justify-between gap-2 mb-3">

                                <div className="flex items-center gap-2 min-w-0">

                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                    style={{
                                      backgroundColor:
                                        isLocked
                                          ? "#9CA3AF"
                                          : color,
                                    }}
                                  >
                                    {isLocked ? (
                                      <Lock className="w-3.5 h-3.5" />
                                    ) : (
                                      number
                                    )}
                                  </div>

                                  <div className="min-w-0">

                                    <p className="text-xs text-muted-foreground">
                                      Session{" "}
                                      {
                                        number
                                      }
                                    </p>

                                    <p className="font-semibold text-sm text-foreground leading-tight truncate">
                                      {
                                        name
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

                              {/* Action */}

                              {canOpen &&
                                sess && (
                                  <button
                                    type="button"
                                    onClick={(
                                      event
                                    ) => {
                                      event.stopPropagation();

                                      openSession(
                                        sess
                                      );
                                    }}
                                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                                    style={{
                                      backgroundColor:
                                        color,
                                    }}
                                  >
                                    {status ===
                                    "completed" ? (
                                      <>
                                        <Eye className="w-3.5 h-3.5" />
                                        Review Board
                                      </>
                                    ) : status ===
                                      "in_progress" ? (
                                      <>
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Resume Session
                                      </>
                                    ) : (
                                      <>
                                        <Play className="w-3.5 h-3.5" />
                                        {isParticipant
                                          ? "Join Session"
                                          : `Start Session ${number}`}
                                      </>
                                    )}
                                  </button>
                                )}

                              {/* Locked */}

                              {isLocked && (
                                <div className="flex items-center justify-center gap-1.5 py-2 text-xs text-gray-400">
                                  <Lock className="w-3 h-3" />

                                  {number ===
                                  1
                                    ? "Waiting to open"
                                    : `Complete Session ${
                                        number -
                                        1
                                      } first`}
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>

                    {/* Progress */}

                    <div className="flex items-center gap-2 px-1">

                      <div className="flex-1 bg-[#EBE2D6] rounded-full h-1.5">

                        <div
                          className="bg-[#4A1C5C] h-1.5 rounded-full transition-all"
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>

                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {
                          completedSessions
                        }
                        /4 complete
                      </span>
                    </div>

                    {journeyIndex <
                      journeys.length -
                        1 && (
                      <div className="border-t border-border mt-5" />
                    )}
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