// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router";
// import DashboardLayout from "../../components/DashboardLayout";
// import { Card } from "../../components/ui/card";
// import { Button } from "../../components/ui/button";
// import { Input } from "../../components/ui/input";
// import { Badge } from "../../components/ui/badge";
// import { ArrowLeft, Search, Users, Loader2, ArrowRight } from "lucide-react";
// import { motion } from "motion/react";
// import { createClient } from "../../../utils/supabase/client";
// import { projectId, publicAnonKey } from "../../../utils/supabase/info";

// const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;
// const HEADERS = { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` };

// interface ParticipantRow {
//   email: string;
//   journeyTitle: string;
//   journeyId: string;
//   linkedAt: string;
// }

// export default function ParticipantManagement() {
//   const navigate = useNavigate();
//   const [participants, setParticipants] = useState<ParticipantRow[]>([]);
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
//         if (!data.success) return;

//         // Flatten all participants across all journeys
//         const rows: ParticipantRow[] = [];
//         for (const journey of data.journeys as any[]) {
//           for (const p of (journey.participants || []) as any[]) {
//             // Avoid duplicate email+journey pairs
//             const exists = rows.some(r => r.email === p.email && r.journeyId === journey.id);
//             if (!exists) {
//               rows.push({
//                 email: p.email,
//                 journeyTitle: journey.title,
//                 journeyId: journey.id,
//                 linkedAt: p.linkedAt || journey.createdAt || "",
//               });
//             }
//           }
//         }
//         setParticipants(rows);
//       } catch (e) {
//         console.error("Failed to load participants:", e);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   const filtered = participants.filter(p =>
//     p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     p.journeyTitle.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   // Initials from email (e.g. "john.doe@..." → "JD")
//   const initials = (email: string) =>
//     email.split("@")[0].split(/[._-]/).map(s => s[0]?.toUpperCase() || "").join("").slice(0, 2) || "?";

//   const formatDate = (iso: string) => {
//     if (!iso) return "";
//     try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
//     catch { return ""; }
//   };

//   return (
//     <DashboardLayout role="facilitator">
//       <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
//         {/* Header */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
//           <Button variant="ghost" onClick={() => navigate("/facilitator/dashboard")} className="mb-4 -ml-2">
//             <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
//           </Button>
//           <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
//             <div>
//               <h1 className="mb-2" style={{ fontFamily: "Playfair Display, serif" }}>Participants</h1>
//               <p className="text-muted-foreground">Everyone linked to your journeys</p>
//             </div>
//             <Button
//               onClick={() => navigate("/facilitator/journeys")}
//               className="bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810] w-full sm:w-auto"
//             >
//               <ArrowRight className="w-4 h-4 mr-2" /> Go to Journeys to Invite
//             </Button>
//           </div>
//         </motion.div>

//         {/* Search + stats */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
//           <Card className="p-5">
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
//               <div className="flex-1 relative">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
//                 <Input
//                   placeholder="Search by email or journey..."
//                   value={searchQuery}
//                   onChange={e => setSearchQuery(e.target.value)}
//                   className="pl-10 h-12"
//                 />
//               </div>
//               {!loading && (
//                 <div className="flex gap-6 justify-around sm:justify-start flex-shrink-0">
//                   <div className="text-center">
//                     <p className="text-2xl font-bold text-[#4A1C5C]">{participants.length}</p>
//                     <p className="text-sm text-muted-foreground">Total</p>
//                   </div>
//                   <div className="text-center">
//                     <p className="text-2xl font-bold text-[#3D6D6C]">
//                       {new Set(participants.map(p => p.email)).size}
//                     </p>
//                     <p className="text-sm text-muted-foreground">Unique</p>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </Card>
//         </motion.div>

//         {/* List */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
//           <Card className="p-5 sm:p-6">
//             <h3 className="mb-5" style={{ color: "#3D6D6C" }}>
//               {loading ? "Loading…" : `All Participants (${filtered.length})`}
//             </h3>

//             {loading ? (
//               <div className="flex items-center justify-center py-12">
//                 <Loader2 className="w-6 h-6 animate-spin text-[#4A1C5C]" />
//               </div>

//             ) : filtered.length === 0 ? (
//               <div className="text-center py-14">
//                 <div className="inline-flex p-5 rounded-full bg-[#EBE2D6] mb-4">
//                   <Users className="w-10 h-10 text-[#4A1C5C] opacity-30" />
//                 </div>
//                 <h4 className="font-semibold text-foreground mb-2">
//                   {searchQuery ? "No participants match your search" : "No participants yet"}
//                 </h4>
//                 <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
//                   {searchQuery
//                     ? "Try a different search term."
//                     : "Participants are added by linking them to a journey. Open a journey and use the \"Link Participant\" section."}
//                 </p>
//                 {!searchQuery && (
//                   <Button onClick={() => navigate("/facilitator/journeys")} className="bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810]">
//                     Go to Journeys
//                   </Button>
//                 )}
//               </div>

//             ) : (
//               <div className="space-y-3">
//                 {filtered.map((participant, index) => (
//                   <motion.div
//                     key={`${participant.email}-${participant.journeyId}`}
//                     initial={{ opacity: 0, x: -16 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: 0.03 * index }}
//                     className="flex items-center justify-between p-4 border border-border rounded-xl hover:border-[#4A1C5C]/30 hover:shadow-sm transition-all gap-4"
//                   >
//                     <div className="flex items-center gap-4 min-w-0">
//                       <div className="w-10 h-10 rounded-full bg-[#4A1C5C] flex items-center justify-center flex-shrink-0">
//                         <span className="text-white font-semibold text-sm">{initials(participant.email)}</span>
//                       </div>
//                       <div className="min-w-0">
//                         <p className="font-medium text-foreground truncate">{participant.email}</p>
//                         <p className="text-xs text-muted-foreground truncate">{participant.journeyTitle}</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-3 flex-shrink-0">
//                       {participant.linkedAt && (
//                         <p className="text-xs text-muted-foreground hidden sm:block">{formatDate(participant.linkedAt)}</p>
//                       )}
//                       <Badge className="bg-[#3D6D6C] text-white">Active</Badge>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => navigate(`/facilitator/journey/${participant.journeyId}`)}
//                         className="text-[#4A1C5C] hover:bg-[#4A1C5C]/10"
//                       >
//                         <ArrowRight className="w-4 h-4" />
//                       </Button>
//                     </div>
//                   </motion.div>
//                 ))}
//               </div>
//             )}
//           </Card>
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
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";

import {
  ArrowLeft,
  Search,
  Users,
  Loader2,
  ArrowRight,
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

interface ParticipantRow {
  email: string;
  journeyTitle: string;
  journeyId: string;
  linkedAt: string;
}

interface ParticipantEntry {
  email: string;
  linkedAt?: string;
}

interface Journey {
  id: string;
  title: string;
  description?: string;
  facilitatorId: string;
  participantEmail?: string | null;
  participants?: ParticipantEntry[];
  createdAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATED HEADERS
// ─────────────────────────────────────────────────────────────────────────────
//
// IMPORTANT:
// Do NOT use publicAnonKey for protected facilitator requests.
//
// The backend needs the authenticated facilitator's Supabase JWT.
// ─────────────────────────────────────────────────────────────────────────────

async function getAuthenticatedHeaders(): Promise<HeadersInit> {
  const supabase = createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error(
      "[participant-management] Failed to get Supabase session:",
      error
    );

    throw new Error("AUTHENTICATION_REQUIRED");
  }

  if (!session?.access_token) {
    console.error(
      "[participant-management] No authenticated access token available."
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
// Supports both:
//
// participants: [{ email, linkedAt }]
//
// and older:
//
// participantEmail: "..."
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
        email: participant.email
          .trim()
          .toLowerCase(),

        linkedAt:
          typeof participant.linkedAt === "string"
            ? participant.linkedAt
            : raw.createdAt || "",
      }));
  }

  // Backward compatibility for older journey records.
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
          raw.createdAt || "",
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
        : "",

    participantEmail:
      typeof raw.participantEmail === "string"
        ? raw.participantEmail
            .trim()
            .toLowerCase()
        : participants[0]?.email || null,

    participants,

    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : "",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

export default function ParticipantManagement() {
  const navigate = useNavigate();

  const [participants, setParticipants] =
    useState<ParticipantRow[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  // ───────────────────────────────────────────────────────────────────────────
  // LOAD PARTICIPANTS
  // ───────────────────────────────────────────────────────────────────────────

  const loadParticipants = useCallback(
    async (showRefreshLoader = false) => {
      try {
        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const supabase = createClient();

        // ─────────────────────────────────────────────────────────────────────
        // GET AUTHENTICATED SESSION
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
            "[participant-management] Authentication error:",
            sessionError
          );

          setParticipants([]);

          navigate(
            "/facilitator/login",
            {
              replace: true,
            }
          );

          return;
        }

        const user =
          session.user;

        console.log(
          `[participant-management] Loading participants for facilitator ${user.id}`
        );

        // ─────────────────────────────────────────────────────────────────────
        // AUTHENTICATED REQUEST
        // ─────────────────────────────────────────────────────────────────────

        const headers =
          await getAuthenticatedHeaders();

        const response =
          await fetch(
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
          data =
            await response.json();
        } catch (jsonError) {
          console.error(
            "[participant-management] Failed to parse API response:",
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
            "[participant-management] API authentication failed:",
            data
          );

          setParticipants([]);

          navigate(
            "/facilitator/login",
            {
              replace: true,
            }
          );

          return;
        }

        // ─────────────────────────────────────────────────────────────────────
        // API FAILURE
        // ─────────────────────────────────────────────────────────────────────

        if (!response.ok) {
          console.error(
            "[participant-management] Failed to load journeys:",
            {
              status:
                response.status,
              data,
            }
          );

          setParticipants([]);

          return;
        }

        if (!data?.success) {
          console.error(
            "[participant-management] API error:",
            data?.error
          );

          setParticipants([]);

          return;
        }

        // ─────────────────────────────────────────────────────────────────────
        // NORMALIZE JOURNEYS
        // ─────────────────────────────────────────────────────────────────────

        const returnedJourneys =
          Array.isArray(
            data.journeys
          )
            ? data.journeys
            : [];

        const journeys =
          returnedJourneys
            .map(normalizeJourney)
            .filter(
              (
                journey: Journey | null
              ): journey is Journey =>
                journey !== null
            );

        // ─────────────────────────────────────────────────────────────────────
        // SAFETY FILTER
        // ─────────────────────────────────────────────────────────────────────

        const ownedJourneys =
          journeys.filter(
            (journey: Journey) => {
              const belongsToUser =
                journey.facilitatorId ===
                user.id;

              if (!belongsToUser) {
                console.warn(
                  `[participant-management] Ignoring journey "${journey.title}" because facilitatorId=${journey.facilitatorId} does not match auth.uid=${user.id}`
                );
              }

              return belongsToUser;
            }
          );

        // ─────────────────────────────────────────────────────────────────────
        // FLATTEN PARTICIPANTS
        // ─────────────────────────────────────────────────────────────────────

        const rows: ParticipantRow[] =
          [];

        for (
          const journey of ownedJourneys
        ) {
          const journeyParticipants =
            Array.isArray(
              journey.participants
            )
              ? journey.participants
              : [];

          for (
            const participant of journeyParticipants
          ) {
            const email =
              participant.email
                ?.trim()
                .toLowerCase();

            if (!email) {
              continue;
            }

            // Avoid duplicate email + journey pairs.
            const exists =
              rows.some(
                (row) =>
                  row.email ===
                    email &&
                  row.journeyId ===
                    journey.id
              );

            if (exists) {
              continue;
            }

            rows.push({
              email,

              journeyTitle:
                journey.title,

              journeyId:
                journey.id,

              linkedAt:
                participant.linkedAt ||
                journey.createdAt ||
                "",
            });
          }
        }

        console.log(
          `[participant-management] auth.uid=${user.id} journeys=${ownedJourneys.length} participants=${rows.length}`
        );

        console.log(
          "[participant-management] participant rows:",
          rows
        );

        setParticipants(
          rows
        );
      } catch (error) {
        console.error(
          "[participant-management] Failed to load participants:",
          error
        );

        if (
          error instanceof Error &&
          error.message ===
            "AUTHENTICATION_REQUIRED"
        ) {
          setParticipants([]);

          navigate(
            "/facilitator/login",
            {
              replace: true,
            }
          );

          return;
        }

        setParticipants([]);
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
    loadParticipants();
  }, [loadParticipants]);

  // ───────────────────────────────────────────────────────────────────────────
  // FILTER
  // ───────────────────────────────────────────────────────────────────────────

  const normalizedSearch =
    searchQuery
      .trim()
      .toLowerCase();

  const filtered =
    participants.filter(
      (participant) =>
        participant.email
          .toLowerCase()
          .includes(
            normalizedSearch
          ) ||
        participant.journeyTitle
          .toLowerCase()
          .includes(
            normalizedSearch
          )
    );

  // ───────────────────────────────────────────────────────────────────────────
  // INITIALS
  // ───────────────────────────────────────────────────────────────────────────

  const initials =
    (email: string) => {
      const localPart =
        email.split("@")[0];

      const parts =
        localPart.split(
          /[._-]/
        );

      const result =
        parts
          .map(
            (part) =>
              part[0]
                ?.toUpperCase() ||
              ""
          )
          .join("")
          .slice(0, 2);

      return result || "?";
    };

  // ───────────────────────────────────────────────────────────────────────────
  // DATE FORMAT
  // ───────────────────────────────────────────────────────────────────────────

  const formatDate =
    (iso: string) => {
      if (!iso) {
        return "";
      }

      try {
        return new Date(
          iso
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
        );
      } catch {
        return "";
      }
    };

  // ───────────────────────────────────────────────────────────────────────────
  // UNIQUE PARTICIPANTS
  // ───────────────────────────────────────────────────────────────────────────

  const uniqueParticipantCount =
    new Set(
      participants.map(
        (participant) =>
          participant.email
      )
    ).size;

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
          <Button
            variant="ghost"
            onClick={() =>
              navigate(
                "/facilitator/dashboard"
              )
            }
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1
                className="mb-2"
                style={{
                  fontFamily:
                    "Playfair Display, serif",
                }}
              >
                Participants
              </h1>

              <p className="text-muted-foreground">
                Everyone linked to your
                journeys
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  loadParticipants(
                    true
                  )
                }
                disabled={
                  loading ||
                  refreshing
                }
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
                    "/facilitator/journeys"
                  )
                }
                className="bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810] w-full sm:w-auto"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Go to Journeys to Invite
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* SEARCH + STATS */}
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
          <Card className="p-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">

              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

                <Input
                  placeholder="Search by email or journey..."
                  value={
                    searchQuery
                  }
                  onChange={(e) =>
                    setSearchQuery(
                      e.target.value
                    )
                  }
                  className="pl-10 h-12"
                />
              </div>

              {!loading && (
                <div className="flex gap-6 justify-around sm:justify-start flex-shrink-0">

                  {/* Total */}

                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#4A1C5C]">
                      {
                        participants.length
                      }
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Total
                    </p>
                  </div>

                  {/* Unique */}

                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#3D6D6C]">
                      {
                        uniqueParticipantCount
                      }
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Unique
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* PARTICIPANT LIST */}
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
            delay: 0.2,
          }}
        >
          <Card className="p-5 sm:p-6">

            <h3
              className="mb-5"
              style={{
                color: "#3D6D6C",
              }}
            >
              {loading
                ? "Loading…"
                : `All Participants (${filtered.length})`}
            </h3>

            {/* Loading */}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#4A1C5C]" />
              </div>

            ) : filtered.length === 0 ? (

              /* Empty state */

              <div className="text-center py-14">
                <div className="inline-flex p-5 rounded-full bg-[#EBE2D6] mb-4">
                  <Users className="w-10 h-10 text-[#4A1C5C] opacity-30" />
                </div>

                <h4 className="font-semibold text-foreground mb-2">
                  {searchQuery
                    ? "No participants match your search"
                    : "No participants yet"}
                </h4>

                <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                  {searchQuery
                    ? "Try a different search term."
                    : 'Participants are added by linking them to a journey. Open a journey and use the "Link Participant" section.'}
                </p>

                {!searchQuery && (
                  <Button
                    onClick={() =>
                      navigate(
                        "/facilitator/journeys"
                      )
                    }
                    className="bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810]"
                  >
                    Go to Journeys
                  </Button>
                )}
              </div>

            ) : (

              /* Participant rows */

              <div className="space-y-3">
                {filtered.map(
                  (
                    participant,
                    index
                  ) => (
                    <motion.div
                      key={`${participant.email}-${participant.journeyId}`}
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
                          0.03 *
                          index,
                      }}
                      className="flex items-center justify-between p-4 border border-border rounded-xl hover:border-[#4A1C5C]/30 hover:shadow-sm transition-all gap-4"
                    >

                      {/* Participant info */}

                      <div className="flex items-center gap-4 min-w-0">

                        <div className="w-10 h-10 rounded-full bg-[#4A1C5C] flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-sm">
                            {
                              initials(
                                participant.email
                              )
                            }
                          </span>
                        </div>

                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {
                              participant.email
                            }
                          </p>

                          <p className="text-xs text-muted-foreground truncate">
                            {
                              participant.journeyTitle
                            }
                          </p>
                        </div>
                      </div>

                      {/* Right side */}

                      <div className="flex items-center gap-3 flex-shrink-0">

                        {participant.linkedAt && (
                          <p className="text-xs text-muted-foreground hidden sm:block">
                            {
                              formatDate(
                                participant.linkedAt
                              )
                            }
                          </p>
                        )}

                        <Badge className="bg-[#3D6D6C] text-white">
                          Active
                        </Badge>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/facilitator/journey/${participant.journeyId}`
                            )
                          }
                          className="text-[#4A1C5C] hover:bg-[#4A1C5C]/10"
                          aria-label={`Open ${participant.journeyTitle}`}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )
                )}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}