// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router";
// import DashboardLayout from "../../components/DashboardLayout";
// import { Card } from "../../components/ui/card";
// import { Button } from "../../components/ui/button";
// import { Badge } from "../../components/ui/badge";
// import { Plus, Search, Users, TrendingUp, ArrowRight, Loader2, FolderOpen } from "lucide-react";
// import { Input } from "../../components/ui/input";
// import { motion } from "motion/react";
// import { createClient } from "../../../utils/supabase/client";
// import { projectId, publicAnonKey } from "../../../utils/supabase/info";

// const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;
// const HEADERS = { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` };

// interface SessionEntry { id: string; number: number; status: string; }
// interface Journey {
//   id: string; title: string; description: string;
//   facilitatorId: string;
//   participants: { email: string; linkedAt: string }[];
//   sessions: SessionEntry[];
//   status: string;
//   participantEmail: string | null;
// }

// export default function Journeys() {
//   const navigate = useNavigate();
//   const [journeys, setJourneys] = useState<Journey[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState("");

//   useEffect(() => {
//     (async () => {
//       try {
//         const supabase = createClient();
//         const { data: { user } } = await supabase.auth.getUser();
//         if (!user) { navigate("/facilitator/login"); return; }
//         const res = await fetch(`${API}/journeys/facilitator/${user.id}`, { headers: HEADERS });
//         const data = await res.json();
//         if (data.success) {
//           const owned = (data.journeys as Journey[]).filter(j => {
//             const ok = j.facilitatorId === user.id;
//             if (!ok) console.warn(`[journeys] ignoring journey "${j.title}" (facilitatorId=${j.facilitatorId}, expected ${user.id})`);
//             return ok;
//           });
//           console.log(`[journeys] auth.uid=${user.id} total_returned=${data.journeys.length} owned=${owned.length}`);
//           setJourneys(owned);
//         }
//       } catch (e) {
//         console.error("Failed to load journeys:", e);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   const filtered = journeys.filter(j =>
//     j.title.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   return (
//     <DashboardLayout role="facilitator">
//       <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
//         {/* Header */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
//           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
//             <div>
//               <h1 className="mb-2" style={{ fontFamily: "Playfair Display, serif" }}>Journeys</h1>
//               <p className="text-muted-foreground">Manage and track all your active journeys</p>
//             </div>
//             <Button
//               onClick={() => navigate("/facilitator/journey/create")}
//               className="bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810] w-full sm:w-auto"
//             >
//               <Plus className="w-4 h-4 mr-2" /> Create Journey
//             </Button>
//           </div>
//         </motion.div>

//         {/* Search */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//             <Input
//               placeholder="Search journeys..."
//               value={searchQuery}
//               onChange={e => setSearchQuery(e.target.value)}
//               className="pl-10 h-12 w-full"
//             />
//           </div>
//         </motion.div>

//         {/* Loading */}
//         {loading ? (
//           <Card className="p-12 flex items-center justify-center">
//             <Loader2 className="w-6 h-6 animate-spin text-[#4A1C5C]" />
//           </Card>

//         ) : filtered.length === 0 ? (
//           /* Empty / no-match state */
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
//             <div className="inline-flex p-6 rounded-full bg-[#EBE2D6] mb-5">
//               <FolderOpen className="w-12 h-12 text-[#4A1C5C] opacity-30" />
//             </div>
//             <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
//               {searchQuery ? "No journeys match your search" : "No journeys yet"}
//             </h2>
//             <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
//               {searchQuery
//                 ? "Try a different search term."
//                 : "Create your first Zest Journey to start guiding participants through transformative experiences."}
//             </p>
//             {!searchQuery && (
//               <Button
//                 onClick={() => navigate("/facilitator/journey/create")}
//                 className="bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810]"
//               >
//                 <Plus className="w-4 h-4 mr-2" /> Create Your First Journey
//               </Button>
//             )}
//           </motion.div>

//         ) : (
//           /* Journey cards */
//           <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
//             {filtered.map((journey, index) => {
//               const sessions = journey.sessions || [];
//               const completedCount = sessions.filter(s => s.status === "completed").length;
//               const progress = Math.round((completedCount / 4) * 100);
//               const participantCount = journey.participants?.length || 0;

//               return (
//                 <motion.div
//                   key={journey.id}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: 0.05 * index }}
//                 >
//                   <Card
//                     className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
//                     onClick={() => navigate(`/facilitator/journey/${journey.id}`)}
//                   >
//                     <div className="mb-4">
//                       <div className="flex items-start justify-between mb-1 gap-2">
//                         <h3 className="font-semibold text-lg leading-snug" style={{ fontFamily: "Playfair Display, serif" }}>
//                           {journey.title}
//                         </h3>
//                         <Badge className={journey.status === "completed" ? "bg-[#3D6D6C] text-white flex-shrink-0" : "bg-[#D4A843]/20 text-[#A07820] flex-shrink-0"}>
//                           {journey.status === "completed" ? "Complete" : "Active"}
//                         </Badge>
//                       </div>
//                       {journey.description && (
//                         <p className="text-xs text-muted-foreground line-clamp-2">{journey.description}</p>
//                       )}
//                     </div>

//                     <div className="space-y-2 mb-4">
//                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                         <Users className="w-4 h-4 flex-shrink-0" />
//                         <span>{participantCount} Participant{participantCount !== 1 ? "s" : ""}</span>
//                       </div>
//                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                         <TrendingUp className="w-4 h-4 flex-shrink-0" />
//                         <span>{completedCount} of 4 sessions complete</span>
//                       </div>
//                     </div>

//                     {/* Progress bar */}
//                     <div className="mb-4">
//                       <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
//                         <span>Completion</span>
//                         <span>{progress}%</span>
//                       </div>
//                       <div className="h-2 bg-muted rounded-full overflow-hidden">
//                         <div className="h-full bg-[#D4A843] transition-all duration-300" style={{ width: `${progress}%` }} />
//                       </div>
//                     </div>

//                     <Button
//                       variant="ghost"
//                       className="w-full justify-between group"
//                       onClick={e => { e.stopPropagation(); navigate(`/facilitator/journey/${journey.id}`); }}
//                     >
//                       View Details
//                       <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
//                     </Button>
//                   </Card>
//                 </motion.div>
//               );
//             })}
//           </div>
//         )}
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
import { Input } from "../../components/ui/input";

import {
  Plus,
  Search,
  Users,
  TrendingUp,
  ArrowRight,
  Loader2,
  FolderOpen,
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
  linkedAt: string;
}

interface Journey {
  id: string;
  title: string;
  description: string;
  facilitatorId: string;
  participantEmail: string | null;
  participants: ParticipantEntry[];
  sessions: SessionEntry[];
  status: string;
  createdAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATED HEADERS
// ─────────────────────────────────────────────────────────────────────────────
//
// IMPORTANT:
// Do NOT use publicAnonKey for protected facilitator requests.
//
// The backend needs the currently authenticated Supabase user's JWT.
// ─────────────────────────────────────────────────────────────────────────────

async function getAuthenticatedHeaders(): Promise<HeadersInit> {
  const supabase = createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error(
      "[journeys] Failed to get Supabase session:",
      error
    );

    throw new Error("AUTHENTICATION_REQUIRED");
  }

  if (!session?.access_token) {
    console.error(
      "[journeys] No authenticated Supabase access token available."
    );

    throw new Error("AUTHENTICATION_REQUIRED");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZE JOURNEY
// ─────────────────────────────────────────────────────────────────────────────
//
// Older journey records may not contain participants/sessions.
// Normalize them before rendering.
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

  let participants: ParticipantEntry[] = [];

  if (Array.isArray(raw.participants)) {
    participants = raw.participants
      .filter(
        (participant: any) =>
          participant &&
          typeof participant.email === "string" &&
          participant.email.trim()
      )
      .map((participant: any) => ({
        email: participant.email.trim().toLowerCase(),
        linkedAt:
          typeof participant.linkedAt === "string"
            ? participant.linkedAt
            : raw.createdAt || "",
      }));
  }

  // Backward compatibility for older journeys that only stored
  // participantEmail.
  if (
    participants.length === 0 &&
    typeof raw.participantEmail === "string" &&
    raw.participantEmail.trim()
  ) {
    participants = [
      {
        email: raw.participantEmail.trim().toLowerCase(),
        linkedAt: raw.createdAt || "",
      },
    ];
  }

  const sessions: SessionEntry[] = Array.isArray(raw.sessions)
    ? raw.sessions
        .filter(
          (session: any) =>
            session &&
            typeof session.id === "string" &&
            typeof session.number === "number"
        )
        .map((session: any) => ({
          id: session.id,
          number: session.number,
          status:
            session.status === "available" ||
            session.status === "in_progress" ||
            session.status === "completed" ||
            session.status === "locked"
              ? session.status
              : "locked",
        }))
    : [];

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
        : "",
    participantEmail:
      typeof raw.participantEmail === "string"
        ? raw.participantEmail.trim().toLowerCase()
        : participants[0]?.email || null,
    participants,
    sessions,
    status:
      typeof raw.status === "string"
        ? raw.status
        : "active",
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : "",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

export default function Journeys() {
  const navigate = useNavigate();

  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ───────────────────────────────────────────────────────────────────────────
  // LOAD JOURNEYS
  // ───────────────────────────────────────────────────────────────────────────

  const loadJourneys = useCallback(
    async (showRefreshLoader = false) => {
      try {
        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const supabase = createClient();

        // ─────────────────────────────────────────────────────────────────────
        // GET AUTHENTICATED USER
        // ─────────────────────────────────────────────────────────────────────

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (
          sessionError ||
          !session?.user ||
          !session.access_token
        ) {
          console.error(
            "[journeys] Authentication error:",
            sessionError
          );

          setJourneys([]);

          navigate("/facilitator/login", {
            replace: true,
          });

          return;
        }

        const user = session.user;

        console.log(
          `[journeys] Loading journeys for facilitator ${user.id}`
        );

        // ─────────────────────────────────────────────────────────────────────
        // AUTHENTICATED REQUEST
        // ─────────────────────────────────────────────────────────────────────

        const headers = await getAuthenticatedHeaders();

        const response = await fetch(
          `${API}/journeys/facilitator/${encodeURIComponent(
            user.id
          )}`,
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
            "[journeys] Failed to parse API response:",
            jsonError
          );
        }

        // ─────────────────────────────────────────────────────────────────────
        // AUTH FAILURE
        // ─────────────────────────────────────────────────────────────────────

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          console.error(
            "[journeys] API authentication failed:",
            data
          );

          setJourneys([]);

          navigate("/facilitator/login", {
            replace: true,
          });

          return;
        }

        // ─────────────────────────────────────────────────────────────────────
        // OTHER API FAILURE
        // ─────────────────────────────────────────────────────────────────────

        if (!response.ok) {
          console.error(
            "[journeys] Failed to load journeys:",
            {
              status: response.status,
              data,
            }
          );

          setJourneys([]);

          return;
        }

        if (!data?.success) {
          console.error(
            "[journeys] API returned an error:",
            data?.error
          );

          setJourneys([]);

          return;
        }

        // ─────────────────────────────────────────────────────────────────────
        // NORMALIZE RESPONSE
        // ─────────────────────────────────────────────────────────────────────

        const returnedJourneys = Array.isArray(data.journeys)
          ? data.journeys
          : [];

        const normalizedJourneys = returnedJourneys
          .map(normalizeJourney)
          .filter(
            (journey: Journey | null): journey is Journey =>
              journey !== null
          );

        // ─────────────────────────────────────────────────────────────────────
        // SAFETY FILTER
        //
        // Only display journeys owned by this facilitator.
        // ─────────────────────────────────────────────────────────────────────

        const ownedJourneys = normalizedJourneys.filter(
          (journey: Journey) => {
            const belongsToUser =
              journey.facilitatorId === user.id;

            if (!belongsToUser) {
              console.warn(
                `[journeys] Ignoring journey "${journey.title}" because facilitatorId=${journey.facilitatorId} does not match auth.uid=${user.id}`
              );
            }

            return belongsToUser;
          }
        );

        console.log(
          `[journeys] auth.uid=${user.id} total_returned=${returnedJourneys.length} valid=${normalizedJourneys.length} owned=${ownedJourneys.length}`
        );

        console.log(
          "[journeys] Final journeys:",
          ownedJourneys
        );

        setJourneys(ownedJourneys);
      } catch (error) {
        console.error(
          "[journeys] Failed to load journeys:",
          error
        );

        if (
          error instanceof Error &&
          error.message === "AUTHENTICATION_REQUIRED"
        ) {
          setJourneys([]);

          navigate("/facilitator/login", {
            replace: true,
          });

          return;
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
  // SEARCH
  // ───────────────────────────────────────────────────────────────────────────

  const normalizedSearch = searchQuery
    .trim()
    .toLowerCase();

  const filtered = journeys.filter((journey) => {
    if (!normalizedSearch) {
      return true;
    }

    const titleMatch = journey.title
      .toLowerCase()
      .includes(normalizedSearch);

    const descriptionMatch = journey.description
      .toLowerCase()
      .includes(normalizedSearch);

    const participantMatch = journey.participants.some(
      (participant) =>
        participant.email
          .toLowerCase()
          .includes(normalizedSearch)
    );

    return (
      titleMatch ||
      descriptionMatch ||
      participantMatch
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout role="facilitator">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1
                className="mb-2"
                style={{
                  fontFamily:
                    "Playfair Display, serif",
                }}
              >
                Journeys
              </h1>

              <p className="text-muted-foreground">
                Manage and track all your active
                journeys
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  loadJourneys(true)
                }
                disabled={loading || refreshing}
                className="w-full sm:w-auto"
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}

                <span className="ml-2">
                  Refresh
                </span>
              </Button>

              <Button
                onClick={() =>
                  navigate(
                    "/facilitator/journey/create"
                  )
                }
                className="bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810] w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Journey
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* SEARCH */}
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
          transition={{
            delay: 0.1,
          }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

            <Input
              placeholder="Search journeys..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
              className="pl-10 h-12 w-full"
            />
          </div>
        </motion.div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* LOADING */}
        {/* ─────────────────────────────────────────────────────────────────── */}

        {loading ? (
          <Card className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#4A1C5C]" />
          </Card>
        ) : filtered.length === 0 ? (

          /* ───────────────────────────────────────────────────────────────── */
          /* EMPTY STATE */
          /* ───────────────────────────────────────────────────────────────── */

          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            className="text-center py-16"
          >
            <div className="inline-flex p-6 rounded-full bg-[#EBE2D6] mb-5">
              <FolderOpen className="w-12 h-12 text-[#4A1C5C] opacity-30" />
            </div>

            <h2
              className="text-2xl font-semibold mb-2"
              style={{
                fontFamily:
                  "Playfair Display, serif",
              }}
            >
              {searchQuery
                ? "No journeys match your search"
                : "No journeys yet"}
            </h2>

            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {searchQuery
                ? "Try a different search term."
                : "Create your first Zest Journey to start guiding participants through transformative experiences."}
            </p>

            {!searchQuery && (
              <Button
                onClick={() =>
                  navigate(
                    "/facilitator/journey/create"
                  )
                }
                className="bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Journey
              </Button>
            )}
          </motion.div>

        ) : (

          /* ───────────────────────────────────────────────────────────────── */
          /* JOURNEY CARDS */
          /* ───────────────────────────────────────────────────────────────── */

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filtered.map(
              (journey, index) => {
                const sessions =
                  journey.sessions || [];

                const completedCount =
                  sessions.filter(
                    (session) =>
                      session.status ===
                      "completed"
                  ).length;

                const progress = Math.round(
                  (completedCount / 4) * 100
                );

                const participantCount =
                  journey.participants?.length ||
                  0;

                return (
                  <motion.div
                    key={journey.id}
                    initial={{
                      opacity: 0,
                      y: 20,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        0.05 * index,
                    }}
                  >
                    <Card
                      className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full"
                      onClick={() =>
                        navigate(
                          `/facilitator/journey/${journey.id}`
                        )
                      }
                    >
                      {/* Journey heading */}

                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-1 gap-2">
                          <h3
                            className="font-semibold text-lg leading-snug"
                            style={{
                              fontFamily:
                                "Playfair Display, serif",
                            }}
                          >
                            {journey.title}
                          </h3>

                          <Badge
                            className={
                              journey.status ===
                              "completed"
                                ? "bg-[#3D6D6C] text-white flex-shrink-0"
                                : "bg-[#D4A843]/20 text-[#A07820] flex-shrink-0"
                            }
                          >
                            {journey.status ===
                            "completed"
                              ? "Complete"
                              : "Active"}
                          </Badge>
                        </div>

                        {journey.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {
                              journey.description
                            }
                          </p>
                        )}
                      </div>

                      {/* Journey stats */}

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4 flex-shrink-0" />

                          <span>
                            {participantCount}{" "}
                            Participant
                            {participantCount !==
                            1
                              ? "s"
                              : ""}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TrendingUp className="w-4 h-4 flex-shrink-0" />

                          <span>
                            {completedCount} of 4
                            sessions complete
                          </span>
                        </div>
                      </div>

                      {/* Participants */}

                      {participantCount > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1.5">
                            {journey.participants
                              .slice(0, 2)
                              .map(
                                (
                                  participant
                                ) => (
                                  <span
                                    key={
                                      participant.email
                                    }
                                    className="text-[11px] px-2 py-1 rounded-full bg-[#3D6D6C]/10 text-[#3D6D6C] truncate max-w-full"
                                  >
                                    {
                                      participant.email
                                    }
                                  </span>
                                )
                              )}

                            {participantCount >
                              2 && (
                              <span className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground">
                                +
                                {participantCount -
                                  2}{" "}
                                more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Progress */}

                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>
                            Completion
                          </span>

                          <span>
                            {progress}%
                          </span>
                        </div>

                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#D4A843] transition-all duration-300"
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* View details */}

                      <Button
                        variant="ghost"
                        className="w-full justify-between group"
                        onClick={(e) => {
                          e.stopPropagation();

                          navigate(
                            `/facilitator/journey/${journey.id}`
                          );
                        }}
                      >
                        View Details

                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Card>
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