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
//               {loading ? "Loading…" : `Completed Sessions (${filtered.length})`}
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

        {/* ── Structured Report Preview Modal ── */}
        <AnimatePresence>
          {viewingReport && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-sm"
              onClick={() => setViewingReport(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }}
                transition={{ duration: 0.2 }}
                className="bg-[#FDFBF7] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#EBE2D6] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="bg-[#4A1C5C] text-white p-5 sm:p-6 border-b-4 border-[#D4A843] flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4A843]">
                      Zuva Life · Zest Journey
                    </span>
                    <h2
                      className="text-xl sm:text-2xl font-bold mt-1 text-white"
                      style={{ fontFamily: "Playfair Display, serif" }}
                    >
                      Session {viewingReport.sessionNumber}: {viewingReport.sessionTitle}
                    </h2>
                    <p className="text-xs text-white/80 mt-0.5">{viewingReport.journeyTitle}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.print()}
                      className="bg-white/10 hover:bg-white/20 text-white text-xs border border-white/20"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1.5" />
                      Print
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
                      className="bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810] text-xs font-semibold"
                    >
                      {downloadingId === viewingReport.sessionId ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Download PDF
                    </Button>

                    <button
                      onClick={() => setViewingReport(null)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors ml-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-[#FDFBF7]">
                  {/* Overview Card */}
                  <div className="bg-[#F7F3EE] rounded-xl p-4 border border-[#EBE2D6] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#3D6D6C] font-semibold block mb-0.5">Participant:</span>
                      <span className="text-foreground font-medium">{viewingReport.participant}</span>
                    </div>
                    <div>
                      <span className="text-[#3D6D6C] font-semibold block mb-0.5">Status:</span>
                      <Badge className="bg-[#3D6D6C] text-white text-[10px] px-2 py-0.5">
                        {viewingReport.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-[#3D6D6C] font-semibold block mb-0.5">Journey:</span>
                      <span className="text-foreground">{viewingReport.journeyTitle}</span>
                    </div>
                    <div>
                      <span className="text-[#3D6D6C] font-semibold block mb-0.5">Date Completed:</span>
                      <span className="text-foreground">{viewingReport.completedDate || viewingReport.generatedDate}</span>
                    </div>
                  </div>

                  {/* Sections */}
                  {viewingReport.sections && viewingReport.sections.length > 0 ? (
                    viewingReport.sections.map((sec: any, sIdx: number) => {
                      const colorMap: Record<string, { headerBg: string; textCol: string; borderCol: string }> = {
                        purple: { headerBg: "bg-[#4A1C5C]", textCol: "text-[#4A1C5C]", borderCol: "border-[#4A1C5C]/20" },
                        teal: { headerBg: "bg-[#3D6D6C]", textCol: "text-[#3D6D6C]", borderCol: "border-[#3D6D6C]/20" },
                        gold: { headerBg: "bg-[#D4A843]", textCol: "text-[#8A6A1D]", borderCol: "border-[#D4A843]/30" },
                        rust: { headerBg: "bg-[#AA5D53]", textCol: "text-[#AA5D53]", borderCol: "border-[#AA5D53]/20" },
                      };
                      const theme = colorMap[sec.color] || colorMap.purple;

                      return (
                        <div
                          key={sIdx}
                          className="bg-white rounded-xl border border-border overflow-hidden shadow-sm hover:border-[#4A1C5C]/30 transition-all"
                        >
                          <div className={`${theme.headerBg} text-white px-4 py-2.5 flex items-center justify-between`}>
                            <h4 className="text-xs sm:text-sm font-semibold tracking-wide uppercase">
                              {sec.title}
                            </h4>
                          </div>

                          <div className="p-4 sm:p-5 space-y-3">
                            {sec.items.map((item: any, iIdx: number) => {
                              if (item.type === "callout") {
                                return (
                                  <div
                                    key={iIdx}
                                    className="p-4 rounded-xl bg-[#F7F3EE] border-2 border-[#D4A843] shadow-sm flex items-start gap-3"
                                  >
                                    <Sparkles className="w-5 h-5 text-[#D4A843] flex-shrink-0 mt-0.5" />
                                    <div>
                                      {item.label && (
                                        <p className="text-[11px] font-bold text-[#4A1C5C] uppercase tracking-wider mb-1">
                                          {item.label}
                                        </p>
                                      )}
                                      <p className="text-base font-bold text-[#2C1810]">
                                        {item.text}
                                      </p>
                                    </div>
                                  </div>
                                );
                              }

                              if (item.type === "keyvalue") {
                                return (
                                  <div
                                    key={iIdx}
                                    className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 pb-2 border-b border-border/50 last:border-b-0 last:pb-0"
                                  >
                                    {item.label && (
                                      <span className="text-xs font-semibold text-[#3D6D6C] sm:w-44 flex-shrink-0">
                                        {item.label}:
                                      </span>
                                    )}
                                    <span className="text-xs sm:text-sm text-foreground flex-1">
                                      {item.text}
                                    </span>
                                  </div>
                                );
                              }

                              return (
                                <div key={iIdx} className="flex items-start gap-2.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#4A1C5C] mt-2 flex-shrink-0" />
                                  <div className="text-xs sm:text-sm text-foreground">
                                    {item.label && (
                                      <strong className="text-[#4A1C5C] mr-1.5 font-semibold">
                                        {item.label}
                                      </strong>
                                    )}
                                    <span>{item.text}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      No responses recorded for this session.
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-[#F7F3EE] border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>Zuva Life · Zest Journey | Confidential & Personal</span>
                  <Button variant="ghost" size="sm" onClick={() => setViewingReport(null)}>
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