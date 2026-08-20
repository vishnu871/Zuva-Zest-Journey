// /**
//  * SessionRouter — determines which board to render based on session number.
//  * Fetches minimal session metadata, coerces the session number to a number,
//  * then mounts the correct board component. Session 4 renders Session4Board —
//  * there is no "Coming Soon" fallback.
//  */
// import { useState, useEffect } from "react";
// import { useParams, useLocation, useNavigate } from "react-router";
// import { Loader2, Lock } from "lucide-react";
// import { projectId, publicAnonKey } from "../../../utils/supabase/info";
// import Session1Board from "./Session1Board";
// import Session2Board from "./Session2Board";
// import Session3Board from "./Session3Board";
// import Session4Board from "./Session4Board";

// const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;
// const HEADERS = { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` };

// export default function SessionRouter() {
//   const { sessionId } = useParams<{ sessionId: string }>();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const isParticipant = location.pathname.startsWith("/participant");
//   const dashboardPath = isParticipant ? "/participant/dashboard" : "/facilitator/dashboard";

//   const [sessionNumber, setSessionNumber] = useState<number | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!sessionId) return;

//     (async () => {
//       try {
//         const res = await fetch(`${API}/sessions/${sessionId}`, { headers: HEADERS });
//         const data = await res.json();

//         if (!res.ok || !data.success) {
//           setError(data.error || "Session not found.");
//           return;
//         }

//         const { session } = data;

//         // Participants cannot access locked sessions
//         if (isParticipant && session.status === "locked") {
//           setError("This session is locked. Complete the previous session first.");
//           return;
//         }

//         // Coerce to number — handles both numeric 4 and string "4"
//         const num = Number(session.sessionNumber);
//         // Default to 1 only if genuinely missing, not if it's 0 (shouldn't happen)
//         setSessionNumber(num > 0 ? num : 1);

//         // Mark in_progress on first open
//         if (session.status === "available") {
//           fetch(`${API}/sessions/${sessionId}/status`, {
//             method: "PUT",
//             headers: HEADERS,
//             body: JSON.stringify({ status: "in_progress" }),
//           }).catch(() => {});
//         }
//       } catch {
//         setError("Failed to load session. Please refresh.");
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [sessionId, isParticipant]);

//   // ── Loading ──

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[#EBE2D6] flex items-center justify-center">
//         <div className="text-center space-y-3">
//           <Loader2 className="w-8 h-8 animate-spin text-[#4A1C5C] mx-auto" />
//           <p className="text-sm text-muted-foreground">Loading session…</p>
//         </div>
//       </div>
//     );
//   }

//   // ── Error (locked / not found) ──

//   if (error) {
//     return (
//       <div className="min-h-screen bg-[#EBE2D6] flex items-center justify-center p-4">
//         <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-border space-y-4">
//           <div className="w-12 h-12 rounded-full bg-[#AA5D53]/10 flex items-center justify-center mx-auto">
//             <Lock className="w-5 h-5 text-[#AA5D53]" />
//           </div>
//           <h3 className="font-semibold text-foreground" style={{ fontFamily: "Playfair Display, serif" }}>
//             {error}
//           </h3>
//           <button
//             onClick={() => navigate(dashboardPath)}
//             className="px-6 py-2 bg-[#4A1C5C] text-white rounded-xl text-sm font-medium hover:bg-[#3A1C4C] transition-colors"
//           >
//             Return to Dashboard
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // ── Route to the correct board ──
//   // Number() coercion means "4", 4, and 4.0 all match case 4.

//   switch (sessionNumber) {
//     case 1:
//       return <Session1Board />;
//     case 2:
//       return <Session2Board />;
//     case 3:
//       return <Session3Board />;
//     case 4:
//       return <Session4Board />;
//     default:
//       // Unknown session number — redirect rather than show a dead screen
//       return (
//         <div className="min-h-screen bg-[#EBE2D6] flex items-center justify-center p-4">
//           <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-border space-y-4">
//             <p className="text-sm text-muted-foreground">
//               Unrecognised session ({sessionNumber}). Please return to the dashboard.
//             </p>
//             <button
//               onClick={() => navigate(dashboardPath)}
//               className="px-6 py-2 bg-[#4A1C5C] text-white rounded-xl text-sm font-medium hover:bg-[#3A1C4C] transition-colors"
//             >
//               Return to Dashboard
//             </button>
//           </div>
//         </div>
//       );
//   }
// }
/**
 * SessionRouter
 *
 * Determines which board to render based on session number.
 *
 * Session access rules:
 * - Locked sessions cannot be opened by participants.
 * - Only a facilitator can move an available session to "in_progress".
 * - Participants can open a session only after the facilitator has enabled it.
 * - Participants never change session status simply by opening a session.
 * - All API requests use the authenticated Supabase access token.
 * - Session 1–4 are routed to their corresponding board components.
 */

import { useState, useEffect } from "react";
import {
  useParams,
  useLocation,
  useNavigate,
} from "react-router";

import { Loader2, Lock } from "lucide-react";

import { createClient } from "../../../utils/supabase/client";
import { projectId } from "../../../utils/supabase/info";

import Session1Board from "./Session1Board";
import Session2Board from "./Session2Board";
import Session3Board from "./Session3Board";
import Session4Board from "./Session4Board";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;

interface SessionData {
  id: string;
  sessionNumber: number | string;
  status:
    | "locked"
    | "available"
    | "in_progress"
    | "completed"
    | string;
}

export default function SessionRouter() {
  const { sessionId } = useParams<{
    sessionId: string;
  }>();

  const location = useLocation();
  const navigate = useNavigate();

  const isParticipant =
    location.pathname.startsWith("/participant");

  const isFacilitator =
    location.pathname.startsWith("/facilitator");

  const dashboardPath = isParticipant
    ? "/participant/dashboard"
    : "/facilitator/dashboard";

  const [sessionNumber, setSessionNumber] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Session ID is missing.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadSession = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        /*
         * Get the current authenticated session.
         *
         * Supabase's autoRefreshToken/persistSession
         * configuration is handled by client.tsx.
         */
        const {
          data: { session: authSession },
          error: authError,
        } = await supabase.auth.getSession();

        /*
         * If the session is missing, attempt one explicit
         * refresh before treating the user as logged out.
         *
         * This helps avoid intermittent "session expired"
         * errors when the access token has just expired.
         */
        let activeSession = authSession;

        if (
          authError ||
          !activeSession?.access_token
        ) {
          const {
            data: {
              session: refreshedSession,
            },
            error: refreshError,
          } = await supabase.auth.refreshSession();

          if (
            refreshError ||
            !refreshedSession?.access_token
          ) {
            if (!cancelled) {
              setError(
                "Your session has expired. Please sign in again."
              );
            }

            return;
          }

          activeSession = refreshedSession;
        }

        const accessToken =
          activeSession.access_token;

        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        };

        /*
         * Load the session.
         */
        const response = await fetch(
          `${API}/sessions/${sessionId}`,
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
            "[SessionRouter] Failed to parse session response:",
            jsonError
          );
        }

        /*
         * Authentication failure.
         *
         * Do not immediately destroy the user's navigation state.
         * Give Supabase a chance to refresh the token first.
         */
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          const {
            data: {
              session: refreshedSession,
            },
            error: refreshError,
          } = await supabase.auth.refreshSession();

          if (
            !refreshError &&
            refreshedSession?.access_token
          ) {
            const retryResponse = await fetch(
              `${API}/sessions/${sessionId}`,
              {
                method: "GET",
                headers: {
                  "Content-Type":
                    "application/json",
                  Authorization:
                    `Bearer ${refreshedSession.access_token}`,
                },
                cache: "no-store",
              }
            );

            let retryData: any = null;

            try {
              retryData =
                await retryResponse.json();
            } catch (retryJsonError) {
              console.error(
                "[SessionRouter] Failed to parse retry response:",
                retryJsonError
              );
            }

            if (
              retryResponse.ok &&
              retryData?.success
            ) {
              data = retryData;
            } else {
              if (!cancelled) {
                setError(
                  "Your session has expired. Please sign in again."
                );
              }

              return;
            }
          } else {
            if (!cancelled) {
              setError(
                "Your session has expired. Please sign in again."
              );
            }

            return;
          }
        }

        if (
          !data?.success
        ) {
          if (!cancelled) {
            setError(
              data?.error ||
                "Session not found."
            );
          }

          return;
        }

        const session =
          data.session as SessionData;

        const number = Number(
          session.sessionNumber
        );

        if (
          !Number.isInteger(number) ||
          number < 1 ||
          number > 4
        ) {
          if (!cancelled) {
            setError(
              `Unrecognised session (${session.sessionNumber}).`
            );
          }

          return;
        }

        /*
         * ─────────────────────────────────────────
         * PARTICIPANT ACCESS CONTROL
         * ─────────────────────────────────────────
         *
         * Participants cannot enter locked sessions.
         *
         * IMPORTANT:
         *
         * Completing Session 1 does NOT unlock Session 2.
         *
         * The facilitator must explicitly unlock Session 2.
         */
        if (
          isParticipant &&
          session.status === "locked"
        ) {
          if (!cancelled) {
            setError(
              "This session is locked. Your facilitator must enable it before you can begin."
            );
          }

          return;
        }

        /*
         * ─────────────────────────────────────────
         * COMPLETED SESSION
         * ─────────────────────────────────────────
         *
         * Completed sessions can still be opened for
         * review.
         *
         * We DO NOT change their status here.
         */
        if (
          session.status === "completed"
        ) {
          if (!cancelled) {
            setSessionNumber(number);
          }

          return;
        }

        /*
         * ─────────────────────────────────────────
         * FACILITATOR START
         * ─────────────────────────────────────────
         *
         * A facilitator can start an AVAILABLE
         * session.
         *
         * This changes:
         *
         * available → in_progress
         *
         * It does NOT:
         *
         * completed → available
         *
         * and it does NOT unlock the next session.
         */
        if (
          isFacilitator &&
          session.status === "available"
        ) {
          try {
            const statusResponse =
              await fetch(
                `${API}/sessions/${sessionId}/status`,
                {
                  method: "PUT",
                  headers,
                  body: JSON.stringify({
                    status: "in_progress",
                  }),
                }
              );

            let statusData: any = null;

            try {
              statusData =
                await statusResponse.json();
            } catch (statusJsonError) {
              console.error(
                "[SessionRouter] Failed to parse status response:",
                statusJsonError
              );
            }

            /*
             * If the backend rejects the status update
             * because of authentication, try once more
             * with a refreshed token.
             */
            if (
              statusResponse.status === 401 ||
              statusResponse.status === 403
            ) {
              const {
                data: {
                  session: refreshedSession,
                },
                error: refreshError,
              } =
                await supabase.auth.refreshSession();

              if (
                refreshError ||
                !refreshedSession?.access_token
              ) {
                if (!cancelled) {
                  setError(
                    "Your session has expired. Please sign in again."
                  );
                }

                return;
              }

              const retryStatusResponse =
                await fetch(
                  `${API}/sessions/${sessionId}/status`,
                  {
                    method: "PUT",
                    headers: {
                      "Content-Type":
                        "application/json",
                      Authorization:
                        `Bearer ${refreshedSession.access_token}`,
                    },
                    body: JSON.stringify({
                      status:
                        "in_progress",
                    }),
                  }
                );

              let retryStatusData: any =
                null;

              try {
                retryStatusData =
                  await retryStatusResponse.json();
              } catch (retryStatusJsonError) {
                console.error(
                  "[SessionRouter] Failed to parse retry status response:",
                  retryStatusJsonError
                );
              }

              if (
                !retryStatusResponse.ok ||
                !retryStatusData?.success
              ) {
                if (!cancelled) {
                  setError(
                    retryStatusData?.error ||
                      "You could not start this session."
                  );
                }

                return;
              }
            } else if (
              !statusResponse.ok ||
              !statusData?.success
            ) {
              if (!cancelled) {
                setError(
                  statusData?.error ||
                    "You could not start this session."
                );
              }

              return;
            }
          } catch (statusError) {
            console.error(
              "[SessionRouter] Failed to start facilitator session:",
              statusError
            );

            if (!cancelled) {
              setError(
                "Unable to start this session. Please try again."
              );
            }

            return;
          }
        }

        /*
         * ─────────────────────────────────────────
         * ROUTE TO BOARD
         * ─────────────────────────────────────────
         */
        if (!cancelled) {
          setSessionNumber(number);
        }
      } catch (requestError) {
        console.error(
          "[SessionRouter] Failed to load session:",
          requestError
        );

        if (!cancelled) {
          setError(
            "Failed to load session. Please refresh."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [
    sessionId,
    isParticipant,
    isFacilitator,
  ]);

  /*
   * ─────────────────────────────────────────────
   * LOADING
   * ─────────────────────────────────────────────
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EBE2D6] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#4A1C5C] mx-auto" />

          <p className="text-sm text-muted-foreground">
            Loading session…
          </p>
        </div>
      </div>
    );
  }

  /*
   * ─────────────────────────────────────────────
   * ERROR / LOCKED SESSION
   * ─────────────────────────────────────────────
   */

  if (error) {
    return (
      <div className="min-h-screen bg-[#EBE2D6] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-border space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#AA5D53]/10 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5 text-[#AA5D53]" />
          </div>

          <h3
            className="font-semibold text-foreground"
            style={{
              fontFamily:
                "Playfair Display, serif",
            }}
          >
            {error}
          </h3>

          <button
            onClick={() =>
              navigate(dashboardPath)
            }
            className="px-6 py-2 bg-[#4A1C5C] text-white rounded-xl text-sm font-medium hover:bg-[#3A1C4C] transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /*
   * ─────────────────────────────────────────────
   * SAFETY CHECK
   * ─────────────────────────────────────────────
   */

  if (sessionNumber === null) {
    return (
      <div className="min-h-screen bg-[#EBE2D6] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-border space-y-4">
          <p className="text-sm text-muted-foreground">
            Unable to determine the
            session. Please return to
            the dashboard.
          </p>

          <button
            onClick={() =>
              navigate(dashboardPath)
            }
            className="px-6 py-2 bg-[#4A1C5C] text-white rounded-xl text-sm font-medium hover:bg-[#3A1C4C] transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /*
   * ─────────────────────────────────────────────
   * ROUTE TO SESSION BOARD
   * ─────────────────────────────────────────────
   */

  switch (sessionNumber) {
    case 1:
      return <Session1Board />;

    case 2:
      return <Session2Board />;

    case 3:
      return <Session3Board />;

    case 4:
      return <Session4Board />;

    default:
      return (
        <div className="min-h-screen bg-[#EBE2D6] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-border space-y-4">
            <p className="text-sm text-muted-foreground">
              Unrecognised session (
              {sessionNumber}
              ). Please return to
              the dashboard.
            </p>

            <button
              onClick={() =>
                navigate(dashboardPath)
              }
              className="px-6 py-2 bg-[#4A1C5C] text-white rounded-xl text-sm font-medium hover:bg-[#3A1C4C] transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
  }
}