// import { useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router";
// import DashboardLayout from "../../components/DashboardLayout";
// import { Card } from "../../components/ui/card";
// import { Button } from "../../components/ui/button";
// import { Badge } from "../../components/ui/badge";
// import { Input } from "../../components/ui/input";
// import { ArrowLeft, Search, CheckCircle, Users, Loader2, FileText } from "lucide-react";
// import { motion } from "motion/react";
// import { createClient } from "../../../utils/supabase/client";
// import { projectId, publicAnonKey } from "../../../utils/supabase/info";

// const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;
// const HEADERS = { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` };

// const SESSION_NAMES: Record<number, string> = {
//   1: "Identity Discovery",
//   2: "Identities In Reality",
//   3: "Experiment Design",
//   4: "What I Tried",
// };

// interface CompletedSession {
//   sessionId: string;
//   sessionNumber: number;
//   journeyTitle: string;
//   journeyId: string;
//   participantCount: number;
// }

// export default function SessionHistory() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [sessions, setSessions] = useState<CompletedSession[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState("");

//   const role = location.pathname.startsWith("/participant") ? "participant" : "facilitator";
//   const dashboardPath = role === "facilitator" ? "/facilitator/dashboard" : "/participant/dashboard";

//   useEffect(() => {
//     (async () => {
//       try {
//         const supabase = createClient();
//         const { data: { user } } = await supabase.auth.getUser();
//         if (!user) { navigate(dashboardPath); return; }

//         let res: Response;
//         if (role === "facilitator") {
//           res = await fetch(`${API}/journeys/facilitator/${user.id}`, { headers: HEADERS });
//         } else {
//           res = await fetch(`${API}/journeys/participant/${encodeURIComponent(user.email || "")}`, { headers: HEADERS });
//         }
//         const data = await res.json();
//         if (!data.success) return;

//         // Extract completed sessions from every journey
//         const completed: CompletedSession[] = [];
//         for (const journey of data.journeys as any[]) {
//           for (const s of (journey.sessions || []) as any[]) {
//             if (s.status === "completed") {
//               completed.push({
//                 sessionId: s.id,
//                 sessionNumber: s.number,
//                 journeyTitle: journey.title,
//                 journeyId: journey.id,
//                 participantCount: journey.participants?.length || 0,
//               });
//             }
//           }
//         }
//         // Most recent first (higher session numbers last in a journey, but later journeys first)
//         setSessions(completed.reverse());
//       } catch (e) {
//         console.error("Failed to load session history:", e);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [role]);

//   const filtered = sessions.filter(s =>
//     s.journeyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     SESSION_NAMES[s.sessionNumber]?.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   return (
//     <DashboardLayout role={role}>
//       <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
//         {/* Header */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
//           <Button variant="ghost" onClick={() => navigate(dashboardPath)} className="mb-4 -ml-2">
//             <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
//           </Button>
//           <h1 className="mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
//             {role === "facilitator" ? "Reports" : "Session History"}
//           </h1>
//           <p className="text-muted-foreground">
//             {role === "facilitator"
//               ? "Completed sessions across all your journeys"
//               : "Sessions you have completed"}
//           </p>
//         </motion.div>

//         {/* Search + stats */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
//           <Card className="p-5">
//             <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
//               <div className="flex-1 relative">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
//                 <Input
//                   placeholder="Search by session or journey name..."
//                   value={searchQuery}
//                   onChange={e => setSearchQuery(e.target.value)}
//                   className="pl-10 h-12 w-full"
//                 />
//               </div>
//               {!loading && (
//                 <div className="flex gap-6 justify-around lg:justify-start flex-shrink-0">
//                   <div className="text-center">
//                     <p className="text-2xl font-bold text-[#4A1C5C]">{sessions.length}</p>
//                     <p className="text-sm text-muted-foreground">Completed</p>
//                   </div>
//                   {role === "facilitator" && (
//                     <div className="text-center">
//                       <p className="text-2xl font-bold text-[#3D6D6C]">
//                         {new Set(sessions.map(s => s.journeyId)).size}
//                       </p>
//                       <p className="text-sm text-muted-foreground">Journeys</p>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//           </Card>
//         </motion.div>

//         {/* Session list */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
//           <Card className="p-5 sm:p-6">
//             <h3 className="mb-5" style={{ color: "#3D6D6C" }}>
//               {loading ? "Loadingâ€¦" : `Completed Sessions (${filtered.length})`}
//             </h3>

//             {loading ? (
//               <div className="flex items-center justify-center py-12">
//                 <Loader2 className="w-6 h-6 animate-spin text-[#4A1C5C]" />
//               </div>

//             ) : filtered.length === 0 ? (
//               <div className="text-center py-14">
//                 <div className="inline-flex p-5 rounded-full bg-[#EBE2D6] mb-4">
//                   <FileText className="w-10 h-10 text-[#4A1C5C] opacity-30" />
//                 </div>
//                 <h4 className="font-semibold text-foreground mb-2">
//                   {searchQuery ? "No sessions match your search" : "No completed sessions yet"}
//                 </h4>
//                 <p className="text-sm text-muted-foreground max-w-xs mx-auto">
//                   {searchQuery
//                     ? "Try a different search term."
//                     : "Completed sessions will appear here once participants finish their journey sessions."}
//                 </p>
//               </div>

//             ) : (
//               <div className="space-y-4">
//                 {filtered.map((session, index) => (
//                   <motion.div
//                     key={`${session.journeyId}-${session.sessionNumber}`}
//                     initial={{ opacity: 0, x: -16 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: 0.03 * index }}
//                     onClick={() => navigate(`/${role}/session/${session.sessionId}/board`)}
//                     className="p-5 border border-border rounded-xl hover:border-[#4A1C5C]/30 hover:shadow-md transition-all cursor-pointer"
//                   >
//                     <div className="flex items-start justify-between gap-4">
//                       <div className="min-w-0">
//                         <div className="flex items-center gap-2 mb-1.5 flex-wrap">
//                           <Badge className="bg-[#3D6D6C] text-white flex-shrink-0">Completed</Badge>
//                           <span className="text-xs font-semibold text-[#4A1C5C] bg-[#4A1C5C]/10 px-2 py-0.5 rounded-full flex-shrink-0">
//                             Session {session.sessionNumber}
//                           </span>
//                         </div>
//                         <h4 className="font-semibold text-foreground mb-0.5">
//                           {SESSION_NAMES[session.sessionNumber] || `Session ${session.sessionNumber}`}
//                         </h4>
//                         <p className="text-sm text-muted-foreground truncate">{session.journeyTitle}</p>
//                       </div>
//                       <CheckCircle className="w-5 h-5 text-[#3D6D6C] flex-shrink-0 mt-0.5" />
//                     </div>
//                     {role === "facilitator" && session.participantCount > 0 && (
//                       <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
//                         <Users className="w-4 h-4 text-[#3D6D6C]" />
//                         <span>{session.participantCount} participant{session.participantCount !== 1 ? "s" : ""}</span>
//                       </div>
//                     )}
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


import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import DashboardLayout from "../../components/DashboardLayout";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import {
  ArrowLeft,
  Search,
  CheckCircle,
  Users,
  Loader2,
  FileText,
  Download,
  Eye,
  Printer,
  X,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { createClient } from "../../../utils/supabase/client";
import { getAuthHeaders } from "../../../utils/supabase/api";
import {
  projectId,
} from "../../../utils/supabase/info";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;

const SESSION_NAMES: Record<number, string> = {
  1: "Identity Discovery",
  2: "Identities In Reality",
  3: "Future Self Exploration",
  4: "Integration & Next Steps",
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

  const [sessions, setSessions] = useState<
    CompletedSession[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [downloadingId, setDownloadingId] =
    useState<string | null>(null);

  const [viewingReport, setViewingReport] =
    useState<any | null>(null);

  const [loadingReportId, setLoadingReportId] =
    useState<string | null>(null);

  const role = location.pathname.startsWith(
    "/participant"
  )
    ? "participant"
    : "facilitator";

  const dashboardPath =
    role === "facilitator"
      ? "/facilitator/dashboard"
      : "/participant/dashboard";

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate(dashboardPath);
          return;
        }

        let res: Response;
        const headers = await getAuthHeaders();

        if (role === "facilitator") {
          res = await fetch(
            `${API}/journeys/facilitator/${user.id}`,
            {
              headers,
            }
          );
        } else {
          res = await fetch(
            `${API}/journeys/participant/${encodeURIComponent(
              user.email || ""
            )}`,
            {
              headers,
            }
          );
        }

        const data = await res.json();

        if (!data.success) {
          return;
        }

        const completed: CompletedSession[] =
          [];

        for (
          const journey of data.journeys as any[]
        ) {
          for (
            const session of (journey.sessions ||
              []) as any[]
          ) {
            if (
              session.status === "completed"
            ) {
              completed.push({
                sessionId: session.id,
                sessionNumber: session.number,
                journeyTitle: journey.title,
                journeyId: journey.id,
                participantCount:
                  journey.participants?.length ||
                  0,
              });
            }
          }
        }

        setSessions(completed.reverse());
      } catch (e) {
        console.error(
          "Failed to load session history:",
          e
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [role, navigate, dashboardPath]);

  const downloadReport = async (
    session: CompletedSession,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    try {
      setDownloadingId(session.sessionId);

      const response = await fetch(
        `${API}/sessions/${session.sessionId}/report`,
        {
          method: "GET",
          headers: await getAuthHeaders(),
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Failed to generate report.";

        try {
          const errorData =
            await response.json();

          errorMessage =
            errorData?.error ||
            errorMessage;
        } catch {
          // Ignore JSON parsing errors.
        }

        throw new Error(errorMessage);
      }

      const blob =
        await response.blob();

      if (
        !blob ||
        blob.size === 0
      ) {
        throw new Error(
          "The generated report is empty."
        );
      }

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `zest-journey-session-${session.sessionNumber}-report.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "Report download failed:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to download the session report. Please try again."
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const viewReport = async (
    session: CompletedSession,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    try {
      setLoadingReportId(session.sessionId);

      const response = await fetch(
        `${API}/sessions/${session.sessionId}/report?format=json`,
        {
          method: "GET",
          headers: await getAuthHeaders(),
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to load report preview.";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.error || errorMessage;
        } catch {
          // Ignore
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data?.report) {
        throw new Error("Report details not found.");
      }

      setViewingReport({
        ...data.report,
        sessionId: session.sessionId,
        sessionNumber: session.sessionNumber,
      });
    } catch (error) {
      console.error("View report failed:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Unable to load the report preview. Please use the Download Report button."
      );
    } finally {
      setLoadingReportId(null);
    }
  };

  const filtered = sessions.filter(
    (session) =>
      session.journeyTitle
        .toLowerCase()
        .includes(
          searchQuery.toLowerCase()
        ) ||
      SESSION_NAMES[
        session.sessionNumber
      ]
        ?.toLowerCase()
        .includes(
          searchQuery.toLowerCase()
        )
  );

  return (
    <DashboardLayout role={role}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
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
          <Button
            variant="ghost"
            onClick={() =>
              navigate(dashboardPath)
            }
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1
            className="mb-2"
            style={{
              fontFamily:
                "Playfair Display, serif",
            }}
          >
            {role === "facilitator"
              ? "Reports"
              : "Session History"}
          </h1>

          <p className="text-muted-foreground">
            {role === "facilitator"
              ? "Completed sessions across all your journeys"
              : "Sessions you have completed"}
          </p>
        </motion.div>

        {/* Search + stats */}
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
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

                <Input
                  placeholder="Search by session or journey name..."
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(
                      e.target.value
                    )
                  }
                  className="pl-10 h-12 w-full"
                />
              </div>

              {!loading && (
                <div className="flex gap-6 justify-around lg:justify-start flex-shrink-0">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#4A1C5C]">
                      {sessions.length}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Completed
                    </p>
                  </div>

                  {role ===
                    "facilitator" && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#3D6D6C]">
                        {
                          new Set(
                            sessions.map(
                              (session) =>
                                session.journeyId
                            )
                          ).size
                        }
                      </p>

                      <p className="text-sm text-muted-foreground">
                        Journeys
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Session list */}
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
                ? "Loading..."
                : `Completed Sessions (${filtered.length})`}
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#4A1C5C]" />
              </div>
            ) : filtered.length ===
              0 ? (
              <div className="text-center py-14">
                <div className="inline-flex p-5 rounded-full bg-[#EBE2D6] mb-4">
                  <FileText className="w-10 h-10 text-[#4A1C5C] opacity-30" />
                </div>

                <h4 className="font-semibold text-foreground mb-2">
                  {searchQuery
                    ? "No sessions match your search"
                    : "No completed sessions yet"}
                </h4>

                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {searchQuery
                    ? "Try a different search term."
                    : "Completed sessions will appear here once participants finish their journey sessions."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map(
                  (
                    session,
                    index
                  ) => (
                    <motion.div
                      key={`${session.journeyId}-${session.sessionNumber}`}
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
                      onClick={() =>
                        navigate(
                          `/${role}/session/${session.sessionId}/board`
                        )
                      }
                      className="p-5 border border-border rounded-xl hover:border-[#4A1C5C]/30 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <Badge className="bg-[#3D6D6C] text-white flex-shrink-0">
                              Completed
                            </Badge>

                            <span className="text-xs font-semibold text-[#4A1C5C] bg-[#4A1C5C]/10 px-2 py-0.5 rounded-full flex-shrink-0">
                              Session{" "}
                              {
                                session.sessionNumber
                              }
                            </span>
                          </div>

                          <h4 className="font-semibold text-foreground mb-0.5">
                            {SESSION_NAMES[
                              session
                                .sessionNumber
                            ] ||
                              `Session ${session.sessionNumber}`}
                          </h4>

                          <p className="text-sm text-muted-foreground truncate">
                            {
                              session.journeyTitle
                            }
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(event) => viewReport(session, event)}
                            disabled={loadingReportId === session.sessionId}
                            className="border-[#3D6D6C]/30 text-[#3D6D6C] hover:bg-[#3D6D6C]/10"
                          >
                            {loadingReportId === session.sessionId ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Eye className="w-4 h-4 mr-2" />
                            )}
                            View Report
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(event) => downloadReport(session, event)}
                            disabled={downloadingId === session.sessionId}
                            className="border-[#4A1C5C]/20 text-[#4A1C5C] hover:bg-[#4A1C5C]/5"
                          >
                            {downloadingId === session.sessionId ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 mr-2" />
                            )}
                            {downloadingId === session.sessionId ? "Preparing..." : "Download PDF"}
                          </Button>

                          <CheckCircle className="w-5 h-5 text-[#3D6D6C]" />
                        </div>
                      </div>

                      {role === "facilitator" && session.participantCount > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
                          <Users className="w-4 h-4 text-[#3D6D6C]" />
                          <span>
                            {session.participantCount} participant{session.participantCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* â”€â”€ Structured Report Preview Modal â€” Sticky-Note Board Style â”€â”€ */}
        <AnimatePresence>
          {viewingReport && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-sm"
              onClick={() => setViewingReport(null)}
            >
              <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
                style={{ background: "#FDFBF7" }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* â”€â”€ Modal Header (pinboard top-bar) â”€â”€ */}
                <div
                  className="text-white flex items-start justify-between gap-4 px-5 sm:px-7 py-4 sm:py-5 flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #4A1C5C 0%, #3D1A50 60%, #2E1040 100%)",
                    borderBottom: "4px solid #D4A843",
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-[#D4A843] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#2C1810] text-[10px] font-black">Z</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4A843]">
                        Zuva Life Â· Zest Journey
                      </span>
                    </div>
                    <h2
                      className="text-xl sm:text-2xl font-bold text-white leading-tight"
                      style={{ fontFamily: "Playfair Display, serif" }}
                    >
                      Session {viewingReport.sessionNumber}: {viewingReport.sessionTitle}
                    </h2>
                    <p className="text-xs text-white/70 mt-0.5 truncate">{viewingReport.journeyTitle}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.print()}
                      className="bg-white/10 hover:bg-white/20 text-white text-xs border border-white/25 backdrop-blur-sm"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1.5" />
                      <span className="hidden sm:inline">Print</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) =>
                        downloadReport(
                          {
                            sessionId: viewingReport.sessionId,
                            sessionNumber: viewingReport.sessionNumber,
                            journeyTitle: viewingReport.journeyTitle,
                            journeyId: "",
                            participantCount: 1,
                          },
                          e
                        )
                      }
                      disabled={downloadingId === viewingReport.sessionId}
                      className="bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810] text-xs font-bold shadow-lg"
                    >
                      {downloadingId === viewingReport.sessionId ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      <span className="hidden sm:inline">Download PDF</span>
                      <span className="sm:hidden">PDF</span>
                    </Button>
                    <button
                      onClick={() => setViewingReport(null)}
                      className="p-1.5 rounded-lg hover:bg-white/15 text-white/60 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* â”€â”€ Modal Body â€” Corkboard / Pinboard â”€â”€ */}
                <div
                  className="flex-1 overflow-y-auto"
                  style={{
                    background: `
                      radial-gradient(circle at 20% 20%, rgba(74,28,92,0.04) 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(61,109,108,0.04) 0%, transparent 50%),
                      #F5F0EA
                    `,
                  }}
                >
                  <div className="p-4 sm:p-6 space-y-6">

                    {/* â”€â”€ Overview Pinned Card â”€â”€ */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className="relative"
                    >
                      {/* Pin decoration */}
                      <div className="absolute -top-2.5 left-6 z-10 w-5 h-5 rounded-full bg-[#D4A843] shadow-md border-2 border-[#C49835] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
                      </div>
                      <div
                        className="rounded-2xl p-4 sm:p-5 border border-[#D4A843]/30 shadow-md"
                        style={{
                          background: "linear-gradient(135deg, #FFFDE7 0%, #FFF9C4 100%)",
                          boxShadow: "0 4px 20px rgba(212,168,67,0.15), 0 2px 8px rgba(0,0,0,0.08)",
                        }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-[#D4A843]" />
                          <span className="text-xs font-bold text-[#8A6A1D] uppercase tracking-wider">Session Overview</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { label: "Participant", value: viewingReport.participant },
                            { label: "Status", value: viewingReport.status?.toUpperCase() },
                            { label: "Journey", value: viewingReport.journeyTitle },
                            { label: "Completed", value: viewingReport.completedDate || viewingReport.generatedDate },
                          ].map((item) => (
                            <div key={item.label} className="bg-white/70 rounded-xl p-2.5 border border-[#D4A843]/20">
                              <p className="text-[10px] font-bold text-[#8A6A1D] uppercase tracking-wide mb-0.5">{item.label}</p>
                              <p className="text-xs font-semibold text-[#2C1810] leading-snug break-words">{item.value}</p>
                            </div>
                          ))}
                        </div>
                        {/* Folded corner */}
                        <div
                          className="absolute bottom-0 right-0 w-8 h-8"
                          style={{
                            background: "linear-gradient(135deg, transparent 50%, rgba(212,168,67,0.25) 50%)",
                            borderBottomRightRadius: "1rem",
                          }}
                        />
                      </div>
                    </motion.div>

                    {/* â”€â”€ Sections â”€â”€ */}
                    {viewingReport.sections && viewingReport.sections.length > 0 ? (
                      viewingReport.sections.map((sec: any, sIdx: number) => {
                        const themeMap: Record<string, { pin: string; zoneBg: string; zoneHeader: string; headerColor: string; noteColors: string[] }> = {
                          purple: {
                            pin: "#4A1C5C",
                            zoneBg: "rgba(74,28,92,0.04)",
                            zoneHeader: "linear-gradient(135deg, #4A1C5C, #5A2C6C)",
                            headerColor: "#FFFFFF",
                            noteColors: ["#FFF176", "#CCFF90", "#FFCCBC", "#B3E5FC", "#E1BEE7"],
                          },
                          teal: {
                            pin: "#3D6D6C",
                            zoneBg: "rgba(61,109,108,0.05)",
                            zoneHeader: "linear-gradient(135deg, #3D6D6C, #4D7D7C)",
                            headerColor: "#FFFFFF",
                            noteColors: ["#B3E5FC", "#CCFF90", "#FFF176", "#E1BEE7", "#FFCCBC"],
                          },
                          gold: {
                            pin: "#C49835",
                            zoneBg: "rgba(212,168,67,0.06)",
                            zoneHeader: "linear-gradient(135deg, #D4A843, #C49835)",
                            headerColor: "#2C1810",
                            noteColors: ["#FFF176", "#FFCCBC", "#CCFF90", "#E1BEE7", "#B3E5FC"],
                          },
                          rust: {
                            pin: "#AA5D53",
                            zoneBg: "rgba(170,93,83,0.05)",
                            zoneHeader: "linear-gradient(135deg, #AA5D53, #BA6D63)",
                            headerColor: "#FFFFFF",
                            noteColors: ["#FFCCBC", "#FFF176", "#E1BEE7", "#CCFF90", "#B3E5FC"],
                          },
                        };
                        const t = themeMap[sec.color] || themeMap.purple;

                        // Separate callouts from other items
                        const callouts = sec.items.filter((i: any) => i.type === "callout");
                        const nonCallouts = sec.items.filter((i: any) => i.type !== "callout");

                        return (
                          <motion.div
                            key={sIdx}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08 + sIdx * 0.06 }}
                            className="relative"
                          >
                            {/* Section pin */}
                            <div
                              className="absolute -top-2.5 left-6 z-10 w-5 h-5 rounded-full shadow-md border-2 flex items-center justify-center"
                              style={{ background: t.pin, borderColor: `${t.pin}99` }}
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
                            </div>

                            {/* Zone container */}
                            <div
                              className="rounded-2xl border overflow-hidden shadow-sm"
                              style={{
                                background: `radial-gradient(ellipse at top left, ${t.zoneBg} 0%, transparent 60%), #FAFAF8`,
                                borderColor: `${t.pin}25`,
                                boxShadow: `0 4px 16px ${t.pin}12, 0 1px 4px rgba(0,0,0,0.06)`,
                              }}
                            >
                              {/* Zone header */}
                              <div
                                className="px-5 py-3 flex items-center justify-between"
                                style={{ background: t.zoneHeader, color: t.headerColor }}
                              >
                                <h4 className="text-sm font-bold tracking-wide uppercase" style={{ color: t.headerColor }}>{sec.title}</h4>
                                <span className="text-[10px] font-medium" style={{ color: t.headerColor, opacity: 0.85 }}>
                                  {sec.items.length} item{sec.items.length !== 1 ? "s" : ""}
                                </span>
                              </div>

                              <div className="p-4 sm:p-5 space-y-4">
                                {/* Callout sticky notes (large featured) */}
                                {callouts.map((item: any, iIdx: number) => (
                                  <motion.div
                                    key={`callout-${iIdx}`}
                                    initial={{ rotate: -1, scale: 0.98 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    className="relative rounded-2xl p-4 sm:p-5 shadow-lg"
                                    style={{
                                      background: "linear-gradient(135deg, #FFFDE7 0%, #FFF9C4 100%)",
                                      border: "2px solid #D4A843",
                                      boxShadow: "0 6px 24px rgba(212,168,67,0.2), 0 2px 8px rgba(0,0,0,0.08)",
                                    }}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 rounded-full bg-[#D4A843] flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <Sparkles className="w-4 h-4 text-[#2C1810]" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        {item.label && (
                                          <p className="text-[10px] font-bold text-[#8A6A1D] uppercase tracking-widest mb-1.5">
                                            {item.label}
                                          </p>
                                        )}
                                        <p
                                          className="text-base sm:text-lg font-bold text-[#2C1810] leading-snug"
                                          style={{ fontFamily: "Playfair Display, serif" }}
                                        >
                                          {item.text}
                                        </p>
                                      </div>
                                    </div>
                                    {/* Folded corner */}
                                    <div
                                      className="absolute bottom-0 right-0 w-7 h-7"
                                      style={{
                                        background: "linear-gradient(135deg, transparent 50%, rgba(212,168,67,0.35) 50%)",
                                        borderBottomRightRadius: "1rem",
                                      }}
                                    />
                                  </motion.div>
                                ))}

                                {/* Non-callout items as sticky notes grid */}
                                {nonCallouts.length > 0 && (
                                  <div className="flex flex-wrap gap-3">
                                    {nonCallouts.map((item: any, iIdx: number) => {
                                      const noteColor = t.noteColors[iIdx % t.noteColors.length];
                                      const rotations = [-2, 1, -1, 2, 0, -1.5, 1.5];
                                      const rot = rotations[iIdx % rotations.length];

                                      if (item.type === "keyvalue") {
                                        return (
                                          <motion.div
                                            key={iIdx}
                                            initial={{ opacity: 0, scale: 0.92, rotate: rot }}
                                            animate={{ opacity: 1, scale: 1, rotate: rot }}
                                            whileHover={{ scale: 1.03, rotate: 0, zIndex: 10 }}
                                            transition={{ delay: iIdx * 0.03 }}
                                            className="relative flex-shrink-0 rounded-lg p-3 cursor-default"
                                            style={{
                                              backgroundColor: noteColor,
                                              width: 180,
                                              minHeight: 80,
                                              boxShadow: "0 4px 14px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
                                              transform: `rotate(${rot}deg)`,
                                            }}
                                          >
                                            {item.label && (
                                              <p
                                                className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
                                                style={{ color: t.pin }}
                                              >
                                                {item.label}
                                              </p>
                                            )}
                                            <p className="text-xs font-semibold text-[#2C1810] leading-snug break-words">
                                              {item.text}
                                            </p>
                                            {/* Folded corner */}
                                            <div
                                              className="absolute bottom-0 right-0 w-5 h-5"
                                              style={{
                                                background: "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.07) 50%)",
                                                borderBottomRightRadius: "0.375rem",
                                              }}
                                            />
                                          </motion.div>
                                        );
                                      }

                                      // Default bullet â†’ sticky note
                                      return (
                                        <motion.div
                                          key={iIdx}
                                          initial={{ opacity: 0, scale: 0.9, rotate: rot }}
                                          animate={{ opacity: 1, scale: 1, rotate: rot }}
                                          whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
                                          transition={{ delay: iIdx * 0.03 }}
                                          className="relative flex-shrink-0 rounded-lg p-3 cursor-default"
                                          style={{
                                            backgroundColor: noteColor,
                                            width: 140,
                                            minHeight: 100,
                                            boxShadow: "0 4px 14px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
                                            transform: `rotate(${rot}deg)`,
                                          }}
                                        >
                                          {item.label && (
                                            <p
                                              className="text-[9px] font-black uppercase tracking-widest mb-1"
                                              style={{ color: t.pin }}
                                            >
                                              {item.label}
                                            </p>
                                          )}
                                          <p className="text-xs font-medium text-[#2C1810] leading-snug break-words">
                                            {item.text}
                                          </p>
                                          {/* Folded corner */}
                                          <div
                                            className="absolute bottom-0 right-0 w-4 h-4"
                                            style={{
                                              background: "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.08) 50%)",
                                              borderBottomRightRadius: "0.375rem",
                                            }}
                                          />
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center py-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#EBE2D6] flex items-center justify-center mb-4">
                          <FileText className="w-8 h-8 text-[#4A1C5C] opacity-30" />
                        </div>
                        <p className="text-muted-foreground text-sm">No responses recorded for this session.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* â”€â”€ Modal Footer â”€â”€ */}
                <div
                  className="px-5 sm:px-7 py-3 flex items-center justify-between text-xs text-muted-foreground flex-shrink-0"
                  style={{ background: "#F0EBE3", borderTop: "1px solid #E5DDD5" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#4A1C5C] flex items-center justify-center">
                      <span className="text-white text-[7px] font-black">Z</span>
                    </div>
                    <span>Zuva Life Â· Zest Journey | Confidential &amp; Personal</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setViewingReport(null)} className="text-xs">
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DashboardLayout>
    );
  }
