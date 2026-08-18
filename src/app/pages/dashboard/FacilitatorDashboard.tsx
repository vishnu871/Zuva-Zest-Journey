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


import { useState, useEffect } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "../../../utils/supabase/client";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;

const HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${publicAnonKey}`,
};

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

interface Journey {
  id: string;
  title: string;
  description: string;
  facilitatorId: string;
  participantEmail: string | null;
  participants: any[];
  sessions: SessionEntry[];
  status: string;
  sessionId: string;
}

const SESSION_META = [
  {
    number: 1,
    title: "Identity Discovery",
    color: "#4A1C5C",
  },
  {
    number: 2,
    title: "Identities In Reality",
    color: "#3D6D6C",
  },
  {
    number: 3,
    title: "Future Self Exploration",
    color: "#D4A843",
  },
  {
    number: 4,
    title: "Integration & Next Steps",
    color: "#AA5D53",
  },
];

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
        className="w-4 h-4 rounded-full flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <CheckCircle className="w-2.5 h-2.5 text-white" />
      </div>
    );
  }

  if (status === "in_progress") {
    return (
      <div
        className="w-4 h-4 rounded-full border-2 animate-pulse"
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
        className="w-4 h-4 rounded-full border-2"
        style={{ borderColor: color }}
      />
    );
  }

  return (
    <div className="w-4 h-4 rounded-full border border-gray-200 bg-gray-50" />
  );
}

export default function FacilitatorDashboard() {
  const navigate = useNavigate();

  const [journeys, setJourneys] =
    useState<Journey[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [userName, setUserName] =
    useState("Facilitator");

  const [userId, setUserId] =
    useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<Journey | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  useEffect(() => {
    loadJourneys();
  }, []);

  const loadJourneys = async () => {
    try {
      setLoading(true);

      const supabase =
        createClient();

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        navigate(
          "/facilitator/login"
        );
        return;
      }

      setUserId(user.id);

      setUserName(
        user.user_metadata?.name?.split(
          " "
        )[0] || "Facilitator"
      );

      const res =
        await fetch(
          `${API}/journeys/facilitator/${user.id}`,
          {
            headers: HEADERS,
          }
        );

      const data =
        await res.json();

      if (!res.ok) {
        console.error(
          "Failed to load journeys:",
          data
        );
        return;
      }

      if (data.success) {
        const owned =
          (data.journeys as Journey[]).filter(
            (journey) => {
              const belongsToUser =
                journey.facilitatorId ===
                user.id;

              if (!belongsToUser) {
                console.warn(
                  `[dashboard] Ignoring journey "${journey.title}" because it does not belong to the current facilitator.`
                );
              }

              return belongsToUser;
            }
          );

        console.log(
          `[dashboard] auth.uid=${user.id} total_returned=${data.journeys.length} owned=${owned.length}`
        );

        setJourneys(
          owned
        );
      }
    } catch (error) {
      console.error(
        "Failed to load journeys:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const getNextSession = (
    sessions: SessionEntry[]
  ) =>
    sessions.find(
      (session) =>
        session.status ===
        "in_progress"
    ) ||
    sessions.find(
      (session) =>
        session.status ===
        "available"
    );

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
      (total, journey) =>
        total +
        (journey.participants
          ?.length || 0),
      0
    );

  const requestDeleteJourney = (
    journey: Journey
  ) => {
    setDeleteTarget(
      journey
    );
  };

  const cancelDelete = () => {
    if (deleting) return;

    setDeleteTarget(
      null
    );
  };

  const confirmDelete = async () => {
    if (
      !deleteTarget ||
      !userId
    ) {
      return;
    }

    setDeleting(true);

    try {
      const res =
        await fetch(
          `${API}/journeys/${deleteTarget.id}`,
          {
            method: "DELETE",
            headers: HEADERS,
            body: JSON.stringify({
              facilitatorId:
                userId,
            }),
          }
        );

      const data =
        await res.json();

      if (!res.ok || !data.success) {
        console.error(
          "Delete journey failed:",
          data
        );

        window.alert(
          data.error ||
            "Failed to delete the journey."
        );

        return;
      }

      // Remove immediately from UI.
      setJourneys(
        (current) =>
          current.filter(
            (journey) =>
              journey.id !==
              deleteTarget.id
          )
      );

      setDeleteTarget(
        null
      );

      console.log(
        "Journey deleted successfully:",
        data.deleted
      );
    } catch (error) {
      console.error(
        "Delete journey error:",
        error
      );

      window.alert(
        "Something went wrong while deleting the journey."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout role="facilitator">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Header */}
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
        </motion.div>

        {/* Stats */}
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
              label:
                "Total Journeys",
              value: loading
                ? "—"
                : journeys.length,
              color:
                "#4A1C5C",
            },
            {
              label: "Active",
              value: loading
                ? "—"
                : activeJourneys.length,
              color:
                "#3D6D6C",
            },
            {
              label:
                "Participants",
              value: loading
                ? "—"
                : totalParticipants,
              color:
                "#D4A843",
            },
            {
              label:
                "Completed",
              value: loading
                ? "—"
                : completedJourneys.length,
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
                  className="text-2xl sm:text-3xl font-bold mb-1"
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
                  journey and open
                  Session 1 with your
                  participant
                </p>
              </div>

              <Button
                onClick={() =>
                  navigate(
                    "/facilitator/journey/create"
                  )
                }
                className="bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810] shadow-lg w-full sm:w-auto flex-shrink-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Journey
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Journey list */}
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
                color:
                  "#3D6D6C",
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
          ) : journeys.length ===
            0 ? (
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
                    Math.round(
                      (completedCount /
                        4) *
                        100
                    );

                  const next =
                    getNextSession(
                      sessions
                    );

                  const nextMeta =
                    next
                      ? SESSION_META.find(
                          (
                            meta
                          ) =>
                            meta.number ===
                            next.number
                        )
                      : null;

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
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                        {/* Journey information */}
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
                                0) >
                                1 &&
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

                          {/* Session pips */}
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
                                  "locked";

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

                          {/* Progress */}
                          <div className="w-full bg-[#EBE2D6] rounded-full h-1 mt-2 max-w-xs">
                            <div
                              className="bg-[#4A1C5C] h-1 rounded-full transition-all"
                              style={{
                                width: `${progressPct}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(
                                `/facilitator/journey/${journey.id}`
                              )
                            }
                            className="flex-1 sm:flex-none"
                          >
                            Manage
                          </Button>

                          {next && (
                            <Button
                              size="sm"
                              className="flex-1 sm:flex-none text-white"
                              style={{
                                backgroundColor:
                                  nextMeta?.color ||
                                  "#4A1C5C",
                              }}
                              onClick={() =>
                                navigate(
                                  `/facilitator/session/${next.id}/board`
                                )
                              }
                            >
                              {next.status ===
                              "in_progress" ? (
                                <>
                                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                  Resume S
                                  {
                                    next.number
                                  }
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5 mr-1" />
                                  Start S
                                  {
                                    next.number
                                  }
                                </>
                              )}
                            </Button>
                          )}

                          {!next &&
                            journey.status ===
                              "completed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 sm:flex-none text-[#3D6D6C] border-[#3D6D6C]"
                                onClick={() =>
                                  navigate(
                                    `/facilitator/journey/${journey.id}`
                                  )
                                }
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                Review
                              </Button>
                            )}

                          {/* DELETE */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              requestDeleteJourney(
                                journey
                              )
                            }
                            className="flex-1 sm:flex-none text-[#AA5D53] border-[#AA5D53]/30 hover:bg-[#AA5D53]/10 hover:text-[#8F4B43]"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Delete
                          </Button>
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

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* DELETE CONFIRMATION MODAL                                      */}
      {/* ─────────────────────────────────────────────────────────────── */}

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
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-[#2C1810]/55 backdrop-blur-sm"
              onClick={
                deleting
                  ? undefined
                  : cancelDelete
              }
            />

            {/* Modal */}
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
              {/* Top accent */}
              <div className="h-1.5 bg-gradient-to-r from-[#AA5D53] to-[#D4A843]" />

              <div className="p-6 sm:p-7">

                {/* Close */}
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

                {/* Icon */}
                <div className="w-12 h-12 rounded-full bg-[#AA5D53]/10 flex items-center justify-center mb-5">
                  <AlertTriangle className="w-6 h-6 text-[#AA5D53]" />
                </div>

                {/* Heading */}
                <h2
                  className="text-xl sm:text-2xl font-semibold text-[#3A1C2B] mb-2"
                  style={{
                    fontFamily:
                      "Playfair Display, serif",
                  }}
                >
                  Delete this journey?
                </h2>

                {/* Journey title */}
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

                {/* Warning */}
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

                {/* Actions */}
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