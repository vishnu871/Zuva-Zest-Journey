/**
 * SessionRouter — determines which board to render based on session number.
 * Fetches minimal session metadata, coerces the session number to a number,
 * then mounts the correct board component. Session 4 renders Session4Board —
 * there is no "Coming Soon" fallback.
 */
import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { Loader2, Lock } from "lucide-react";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import Session1Board from "./Session1Board";
import Session2Board from "./Session2Board";
import Session3Board from "./Session3Board";
import Session4Board from "./Session4Board";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;
const HEADERS = { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` };

export default function SessionRouter() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isParticipant = location.pathname.startsWith("/participant");
  const dashboardPath = isParticipant ? "/participant/dashboard" : "/facilitator/dashboard";

  const [sessionNumber, setSessionNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    (async () => {
      try {
        const res = await fetch(`${API}/sessions/${sessionId}`, { headers: HEADERS });
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || "Session not found.");
          return;
        }

        const { session } = data;

        // Participants cannot access locked sessions
        if (isParticipant && session.status === "locked") {
          setError("This session is locked. Complete the previous session first.");
          return;
        }

        // Coerce to number — handles both numeric 4 and string "4"
        const num = Number(session.sessionNumber);
        // Default to 1 only if genuinely missing, not if it's 0 (shouldn't happen)
        setSessionNumber(num > 0 ? num : 1);

        // Mark in_progress on first open
        if (session.status === "available") {
          fetch(`${API}/sessions/${sessionId}/status`, {
            method: "PUT",
            headers: HEADERS,
            body: JSON.stringify({ status: "in_progress" }),
          }).catch(() => {});
        }
      } catch {
        setError("Failed to load session. Please refresh.");
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId, isParticipant]);

  // ── Loading ──

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EBE2D6] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#4A1C5C] mx-auto" />
          <p className="text-sm text-muted-foreground">Loading session…</p>
        </div>
      </div>
    );
  }

  // ── Error (locked / not found) ──

  if (error) {
    return (
      <div className="min-h-screen bg-[#EBE2D6] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-border space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#AA5D53]/10 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5 text-[#AA5D53]" />
          </div>
          <h3 className="font-semibold text-foreground" style={{ fontFamily: "Playfair Display, serif" }}>
            {error}
          </h3>
          <button
            onClick={() => navigate(dashboardPath)}
            className="px-6 py-2 bg-[#4A1C5C] text-white rounded-xl text-sm font-medium hover:bg-[#3A1C4C] transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Route to the correct board ──
  // Number() coercion means "4", 4, and 4.0 all match case 4.

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
      // Unknown session number — redirect rather than show a dead screen
      return (
        <div className="min-h-screen bg-[#EBE2D6] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-border space-y-4">
            <p className="text-sm text-muted-foreground">
              Unrecognised session ({sessionNumber}). Please return to the dashboard.
            </p>
            <button
              onClick={() => navigate(dashboardPath)}
              className="px-6 py-2 bg-[#4A1C5C] text-white rounded-xl text-sm font-medium hover:bg-[#3A1C4C] transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
  }
}
