// import { Hono } from "npm:hono";
// import { cors } from "npm:hono/cors";
// import { logger } from "npm:hono/logger";
// import { createClient } from "npm:@supabase/supabase-js";
// import * as kv from "./kv_store.tsx";

// const app = new Hono();
// app.use("*", logger(console.log));
// app.use("/*", cors({
//   origin: "*",
//   allowHeaders: ["Content-Type", "Authorization"],
//   allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   exposeHeaders: ["Content-Length"],
//   maxAge: 600,
// }));

// const P = "/make-server-dc18f5b2";

// // ─── Health ───────────────────────────────────────────────────────────────────

// app.get(`${P}/health`, (c) => c.json({ status: "ok", ts: new Date().toISOString() }));

// // ─── Auth ─────────────────────────────────────────────────────────────────────

// app.post(`${P}/auth/signup`, async (c) => {
//   try {
//     const { email, password, fullName, role } = await c.req.json();
//     if (!email || !password || !fullName || !role) return c.json({ error: "Missing required fields" }, 400);
//     const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
//     const { data, error } = await supabase.auth.admin.createUser({
//       email, password, user_metadata: { name: fullName, role }, email_confirm: true,
//     });
//     if (error) return c.json({ error: error.message }, 400);
//     await kv.set(`user:${data.user.id}`, { id: data.user.id, email, fullName, role, createdAt: new Date().toISOString() });
//     return c.json({ success: true, user: { id: data.user.id, email: data.user.email, fullName, role } });
//   } catch (e) { return c.json({ error: String(e) }, 500); }
// });

// app.post(`${P}/auth/verify-role`, async (c) => {
//   try {
//     const accessToken = c.req.header("Authorization")?.split(" ")[1];
//     if (!accessToken) return c.json({ error: "No access token" }, 401);
//     const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
//     const { data: { user }, error } = await supabase.auth.getUser(accessToken);
//     if (error || !user) return c.json({ error: "Invalid token" }, 401);
//     const userData = await kv.get(`user:${user.id}`);
//     const role = userData?.role || user.user_metadata?.role;
//     return c.json({ success: true, user: { id: user.id, email: user.email, fullName: userData?.fullName || user.user_metadata?.name, role } });
//   } catch (e) { return c.json({ error: String(e) }, 500); }
// });

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// const EMPTY_S1_BOARD = {
//   currentStep: 1,
//   step1: { selectedCards: [] },
//   step2: { exitNotes: [] },
//   step3: { stickyNotes: [] },
//   step4: { selectedRoles: [] },
//   step5: { roleNotes: {} },
//   step6: { roleZones: {} },
//   step7: { recognitionWords: [] },
// };

// const EMPTY_S2_BOARD = { currentStep: 1 };

// // Migrate old journey (single sessionId) to new 4-session format
// async function ensureJourneySessions(journey: any) {
//   if (journey.sessions && journey.sessions.length === 4) return journey;

//   // Old format — create sessions 2-4
//   const s1Id = journey.sessionId;
//   const s2Id = crypto.randomUUID();
//   const s3Id = crypto.randomUUID();
//   const s4Id = crypto.randomUUID();

//   // Get session 1 status
//   const s1 = await kv.get(`session:${s1Id}`);
//   const s1Status = s1?.status || "available";

//   journey.sessions = [
//     { id: s1Id, number: 1, status: s1Status },
//     { id: s2Id, number: 2, status: s1Status === "completed" ? "available" : "locked" },
//     { id: s3Id, number: 3, status: "locked" },
//     { id: s4Id, number: 4, status: "locked" },
//   ];

//   // Create the new session KV records and empty boards
//   for (const sess of journey.sessions.slice(1)) {
//     const existing = await kv.get(`session:${sess.id}`);
//     if (!existing) {
//       await kv.set(`session:${sess.id}`, {
//         id: sess.id, journeyId: journey.id, sessionNumber: sess.number,
//         status: sess.status, currentStep: 1, createdAt: new Date().toISOString(),
//       });
//       await kv.set(`board:${sess.id}`, EMPTY_S2_BOARD);
//     }
//   }

//   await kv.set(`journey:${journey.id}`, journey);
//   return journey;
// }

// // ─── Journeys ─────────────────────────────────────────────────────────────────

// app.post(`${P}/journeys`, async (c) => {
//   try {
//     const { title, description, facilitatorId, facilitatorEmail } = await c.req.json();
//     if (!title || !facilitatorId) return c.json({ error: "Missing required fields" }, 400);

//     const journeyId = crypto.randomUUID();
//     const s1Id = crypto.randomUUID();
//     const s2Id = crypto.randomUUID();
//     const s3Id = crypto.randomUUID();
//     const s4Id = crypto.randomUUID();

//     const journey = {
//       id: journeyId, title, description: description || "",
//       facilitatorId, facilitatorEmail: facilitatorEmail || "",
//       participantEmail: null, participants: [],
//       status: "active",
//       sessionId: s1Id, // backward compat pointer to session 1
//       sessions: [
//         { id: s1Id, number: 1, status: "available" },
//         { id: s2Id, number: 2, status: "locked" },
//         { id: s3Id, number: 3, status: "locked" },
//         { id: s4Id, number: 4, status: "locked" },
//       ],
//       createdAt: new Date().toISOString(),
//     };

//     await kv.set(`journey:${journeyId}`, journey);

//     // Create session records
//     for (const s of journey.sessions) {
//       await kv.set(`session:${s.id}`, {
//         id: s.id, journeyId, sessionNumber: s.number, status: s.status,
//         currentStep: 1, createdAt: new Date().toISOString(),
//       });
//       await kv.set(`board:${s.id}`, s.number === 1 ? EMPTY_S1_BOARD : EMPTY_S2_BOARD);
//     }

//     const facilitatorJourneys: string[] = (await kv.get(`facilitator:${facilitatorId}:journeys`)) || [];
//     if (!facilitatorJourneys.includes(journeyId)) {
//       facilitatorJourneys.push(journeyId);
//       await kv.set(`facilitator:${facilitatorId}:journeys`, facilitatorJourneys);
//     }

//     return c.json({ success: true, journey, sessionId: s1Id });
//   } catch (e) { return c.json({ error: String(e) }, 500); }
// });

// app.get(`${P}/journeys/facilitator/:userId`, async (c) => {
//   try {
//     const userId = c.req.param("userId");
//     const journeyIds: string[] = (await kv.get(`facilitator:${userId}:journeys`)) || [];

//     console.log(`[facilitator-journeys] userId=${userId} indexedCount=${journeyIds.length}`);

//     const journeys = [];
//     for (const id of journeyIds) {
//       let j = await kv.get(`journey:${id}`);
//       if (!j) {
//         console.log(`[facilitator-journeys] journey ${id} missing from KV — skipping`);
//         continue;
//       }

//       // Ownership check: the KV index may contain stale IDs from other facilitators
//       // or migrated test data. The facilitatorId field is the authoritative source.
//       if (j.facilitatorId !== userId) {
//         console.log(`[facilitator-journeys] REJECT journey ${id}: facilitatorId=${j.facilitatorId} !== requestedUserId=${userId}`);
//         continue;
//       }

//       j = await ensureJourneySessions(j);
//       journeys.push(j);
//     }

//     console.log(`[facilitator-journeys] returning ${journeys.length} owned journeys for userId=${userId}`);
//     return c.json({ success: true, journeys: journeys.reverse() });
//   } catch (e) { return c.json({ error: String(e) }, 500); }
// });

// app.get(`${P}/journeys/participant/:email`, async (c) => {
//   try {
//     const email = decodeURIComponent(c.req.param("email"));
//     const journeyIds: string[] = (await kv.get(`participant_email:${email}:journeys`)) || [];

//     console.log(`[participant-journeys] email=${email} indexedCount=${journeyIds.length}`);

//     const journeys = [];
//     for (const id of journeyIds) {
//       let j = await kv.get(`journey:${id}`);
//       if (!j) {
//         console.log(`[participant-journeys] journey ${id} missing from KV — skipping`);
//         continue;
//       }

//       // Verify this participant is actually linked to the journey
//       const isLinked = (j.participants || []).some((p: any) => p.email === email) || j.participantEmail === email;
//       if (!isLinked) {
//         console.log(`[participant-journeys] REJECT journey ${id}: ${email} not in participants list`);
//         continue;
//       }

//       j = await ensureJourneySessions(j);
//       journeys.push(j);
//     }

//     console.log(`[participant-journeys] returning ${journeys.length} linked journeys for ${email}`);
//     return c.json({ success: true, journeys: journeys.reverse() });
//   } catch (e) { return c.json({ error: String(e) }, 500); }
// });

// app.get(`${P}/journeys/:id`, async (c) => {
//   try {
//     let j = await kv.get(`journey:${c.req.param("id")}`);
//     if (!j) return c.json({ error: "Journey not found" }, 404);
//     j = await ensureJourneySessions(j);
//     return c.json({ success: true, journey: j });
//   } catch (e) { return c.json({ error: String(e) }, 500); }
// });

// app.post(`${P}/journeys/:id/link`, async (c) => {
//   try {
//     const journeyId = c.req.param("id");
//     const { participantEmail } = await c.req.json();
//     if (!participantEmail) return c.json({ error: "Participant email required" }, 400);
//     let journey = await kv.get(`journey:${journeyId}`);
//     if (!journey) return c.json({ error: "Journey not found" }, 404);
//     journey = await ensureJourneySessions(journey);
//     const email = participantEmail.trim().toLowerCase();
//     if (!journey.participants) journey.participants = [];
//     if (journey.participants.some((p: any) => p.email === email))
//       return c.json({ error: `${email} is already linked to this journey` }, 400);
//     journey.participants.push({ email, linkedAt: new Date().toISOString() });
//     journey.participantEmail = email;
//     await kv.set(`journey:${journeyId}`, journey);
//     const pj: string[] = (await kv.get(`participant_email:${email}:journeys`)) || [];
//     if (!pj.includes(journeyId)) { pj.push(journeyId); await kv.set(`participant_email:${email}:journeys`, pj); }
//     return c.json({ success: true, journey });
//   } catch (e) { return c.json({ error: String(e) }, 500); }
// });

// // ─── Sessions ─────────────────────────────────────────────────────────────────

// app.get(`${P}/sessions/:id`, async (c) => {
//   try {
//     const id = c.req.param("id");
//     const session = await kv.get(`session:${id}`);
//     if (!session) return c.json({ error: "Session not found" }, 404);

//     let journey = await kv.get(`journey:${session.journeyId}`);
//     if (journey) journey = await ensureJourneySessions(journey);

//     // Include previous session board states for data carry-forward
//     const previousBoards: Record<number, any> = {};
//     if (journey?.sessions && session.sessionNumber > 1) {
//       for (const s of journey.sessions) {
//         if (s.number < session.sessionNumber) {
//           const board = await kv.get(`board:${s.id}`);
//           if (board) previousBoards[s.number] = board;
//         }
//       }
//     }

//     return c.json({ success: true, session, journey, previousBoards });
//   } catch (e) { return c.json({ error: String(e) }, 500); }
// });

// app.get(`${P}/sessions/:id/board`, async (c) => {
//   try {
//     const id = c.req.param("id");
//     const state = await kv.get(`board:${id}`);
//     const session = await kv.get(`session:${id}`);
//     const defaultBoard = session?.sessionNumber === 1 ? EMPTY_S1_BOARD : EMPTY_S2_BOARD;
//     return c.json({ success: true, state: state || defaultBoard });
//   } catch (e) { return c.json({ error: String(e) }, 500); }
// });

// app.put(`${P}/sessions/:id/board`, async (c) => {
//   try {
//     const id = c.req.param("id");
//     const { state } = await c.req.json();
//     await kv.set(`board:${id}`, { ...state, updatedAt: new Date().toISOString() });
//     if (state.currentStep) {
//       const session = await kv.get(`session:${id}`);
//       if (session) {
//         session.currentStep = state.currentStep;
//         session.updatedAt = new Date().toISOString();
//         await kv.set(`session:${id}`, session);
//       }
//     }
//     return c.json({ success: true });
//   } catch (e) { return c.json({ error: String(e) }, 500); }
// });

// app.put(`${P}/sessions/:id/status`, async (c) => {
//   try {
//     const sessionId = c.req.param("id");
//     const { status } = await c.req.json();
//     const session = await kv.get(`session:${sessionId}`);
//     if (!session) return c.json({ error: "Session not found" }, 404);

//     session.status = status;
//     session.updatedAt = new Date().toISOString();
//     await kv.set(`session:${sessionId}`, session);

//     let journey = await kv.get(`journey:${session.journeyId}`);
//     if (journey) {
//       journey = await ensureJourneySessions(journey);

//       // Update the matching session entry in journey.sessions
//       const idx = journey.sessions.findIndex((s: any) => s.id === sessionId);
//       if (idx !== -1) {
//         journey.sessions[idx].status = status;

//         if (status === "completed") {
//           // Unlock the next session
//           if (idx + 1 < journey.sessions.length) {
//             // Only unlock if it's currently locked (don't downgrade)
//             if (journey.sessions[idx + 1].status === "locked") {
//               journey.sessions[idx + 1].status = "available";
//               // Update the next session's KV record too
//               const nextSession = await kv.get(`session:${journey.sessions[idx + 1].id}`);
//               if (nextSession) {
//                 nextSession.status = "available";
//                 await kv.set(`session:${journey.sessions[idx + 1].id}`, nextSession);
//               }
//             }
//           }
//           // If last session completed, mark journey done
//           if (idx === 3) {
//             journey.status = "completed";
//           }
//         }
//       }

//       await kv.set(`journey:${session.journeyId}`, journey);
//       return c.json({ success: true, journey });
//     }

//     return c.json({ success: true });
//   } catch (e) { return c.json({ error: String(e) }, 500); }
// });

// Deno.serve(app.fetch);

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use("*", logger(console.log));

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Cleanup-Token",
    ],
    allowMethods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

const P = "/make-server-dc18f5b2";

// ─────────────────────────────────────────────────────────────────────────────
// ENVIRONMENT
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ?? "";

const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const RESEND_API_KEY =
  Deno.env.get("RESEND_API_KEY") ?? "";

const EMAIL_FROM =
  Deno.env.get("EMAIL_FROM") ??
  "Zuva Life <onboarding@resend.dev>";

const APP_URL =
  Deno.env.get("APP_URL") ??
  "http://localhost:5173";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type SessionStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "completed";

type UserRole =
  | "facilitator"
  | "participant";

interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: UserRole;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_WAIT_DAYS = 7;

const SESSION_NAMES: Record<number, string> = {
  1: "Identity Discovery",
  2: "Identities In Reality",
  3: "Future Self Exploration",
  4: "Integration & Next Steps",
};

const SESSION_NUMBERS = [1, 2, 3, 4];

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE CLIENTS
// ─────────────────────────────────────────────────────────────────────────────

function getAdminClient() {
  return createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  );
}

function getUserClient() {
  return createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATION
// ─────────────────────────────────────────────────────────────────────────────

async function getAuthenticatedUser(
  c: any
): Promise<AuthenticatedUser | null> {
  try {
    // ─────────────────────────────────────
    // READ AUTHORIZATION HEADER
    // ─────────────────────────────────────

    const authorization =
      c.req.header("Authorization") ?? "";

    if (
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      console.warn(
        "[auth] Missing Bearer token"
      );

      return null;
    }

    const token =
      authorization
        .slice(7)
        .trim();

    if (!token) {
      console.warn(
        "[auth] Empty Bearer token"
      );

      return null;
    }

    // ─────────────────────────────────────
    // VERIFY SUPABASE JWT
    // ─────────────────────────────────────

    const supabase =
      getUserClient();

    const {
      data: {
        user,
      },
      error,
    } =
      await supabase.auth.getUser(
        token
      );

    if (
      error ||
      !user
    ) {
      console.warn(
        "[auth] Invalid/expired access token:",
        error?.message
      );

      return null;
    }

    // ─────────────────────────────────────
    // LOAD SERVER-SIDE USER RECORD
    // ─────────────────────────────────────

    const userData =
      await kv.get(
        `user:${user.id}`
      );

    // ─────────────────────────────────────
    // RESOLVE ROLE
    //
    // IMPORTANT:
    //
    // Existing users may have an outdated
    // role stored in KV.
    //
    // Supabase user metadata is used first
    // when it contains a valid application role.
    //
    // KV remains the fallback for older users
    // whose metadata does not contain a role.
    // ─────────────────────────────────────

    const metadataRole =
      user.user_metadata?.role;

    const kvRole =
      userData?.role;

    let role: UserRole | undefined;

    if (
      metadataRole ===
        "facilitator" ||
      metadataRole ===
        "participant"
    ) {
      role =
        metadataRole;
    } else if (
      kvRole ===
        "facilitator" ||
      kvRole ===
        "participant"
    ) {
      role =
        kvRole;
    }

    // ─────────────────────────────────────
    // ROLE VALIDATION
    // ─────────────────────────────────────

    if (
      role !==
        "facilitator" &&
      role !==
        "participant"
    ) {
      console.warn(
        `[auth] User ${user.id} has no valid application role.`,
        {
          metadataRole,
          kvRole,
        }
      );

      return null;
    }

    // ─────────────────────────────────────
    // REPAIR STALE KV USER RECORD
    //
    // If Supabase metadata has the correct role
    // but KV contains an old role, synchronize KV.
    // ─────────────────────────────────────

    if (
      userData &&
      userData.role !== role
    ) {
      await kv.set(
        `user:${user.id}`,
        {
          ...userData,

          id:
            user.id,

          email:
            user.email ||
            userData.email ||
            "",

          role,

          fullName:
            userData.fullName ||
            user.user_metadata?.name ||
            user.email ||
            "",

          updatedAt:
            new Date().toISOString(),
        }
      );

      console.log(
        `[auth] Repaired stale role for ${user.id}: ${userData.role} → ${role}`
      );
    }

    // ─────────────────────────────────────
    // CREATE AUTHENTICATED USER
    // ─────────────────────────────────────

    return {
      id:
        user.id,

      email:
        user.email,

      role,
    };
  } catch (error) {
    console.error(
      "[auth] Failed to authenticate:",
      error
    );

    return null;
  }
}

async function requireAuth(c: any) {
  const user =
    await getAuthenticatedUser(c);

  if (!user) {
    return {
      ok: false,
      response: c.json(
        {
          success: false,
          error:
            "Authentication required.",
          code:
            "AUTHENTICATION_REQUIRED",
        },
        401
      ),
    };
  }

  return {
    ok: true,
    user,
  };
}

async function requireRole(
  c: any,
  role: UserRole
) {
  const auth =
    await requireAuth(c);

  if (!auth.ok) {
    return auth;
  }

  if (auth.user.role !== role) {
    return {
      ok: false,
      response: c.json(
        {
          success: false,
          error:
            "You do not have permission to perform this action.",
        },
        403
      ),
    };
  }

  return auth;
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function normalizeEmail(
  email: any
) {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

function normalizeSessionNumber(
  value: any
) {
  const number = Number(value);

  return Number.isInteger(number) &&
    number >= 1 &&
    number <= 4
    ? number
    : null;
}

function addDays(
  date: string | Date,
  days: number
) {
  const result = new Date(date);

  result.setDate(
    result.getDate() + days
  );

  return result.toISOString();
}

function getSessionAvailabilityDate(
  completedAt: string
) {
  return addDays(
    completedAt,
    SESSION_WAIT_DAYS
  );
}

function isDateAvailable(
  availableAt?: string | null
) {
  if (!availableAt) {
    return true;
  }

  return new Date() >=
    new Date(availableAt);
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL
// ─────────────────────────────────────────────────────────────────────────────

function escapeHtml(value: any) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function emailLayout(content: string) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>

<body style="
margin:0;
padding:0;
background:#EBE2D6;
font-family:Arial,Helvetica,sans-serif;
color:#2C1810;
">

<table width="100%" cellpadding="0" cellspacing="0"
style="background:#EBE2D6;">

<tr>
<td align="center" style="padding:40px 16px;">

<table width="100%" cellpadding="0" cellspacing="0"
style="
max-width:600px;
background:#ffffff;
border-radius:20px;
overflow:hidden;
">

<tr>
<td style="
background:#4A1C5C;
padding:28px 32px;
color:#ffffff;
">

<div style="font-size:24px;font-weight:bold;">
Zuva Life
</div>

<div style="margin-top:5px;font-size:14px;opacity:.85;">
Zest Journey
</div>

</td>
</tr>

<tr>
<td style="padding:36px 32px;">
${content}
</td>
</tr>

<tr>
<td style="
padding:24px 32px;
background:#F7F3EE;
color:#6B625D;
font-size:12px;
text-align:center;
">

© ${new Date().getFullYear()} Zuva Life
<br>
Zest Journey

</td>
</tr>

</table>

</td>
</tr>

</table>

</body>
</html>
`;
}

async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string;
    content_type?: string;
  }>;
}) {
  if (!RESEND_API_KEY) {
    console.error(
      "[email] RESEND_API_KEY is not configured."
    );

    return {
      success: false,
      error:
        "RESEND_API_KEY is not configured.",
    };
  }

  try {
    const payload: Record<string, any> = {
      from: EMAIL_FROM,
      to: [to],
      subject,
      html,
    };

    if (
      attachments &&
      attachments.length > 0
    ) {
      payload.attachments =
        attachments.map(
          (attachment) => ({
            filename:
              attachment.filename,
            content:
              attachment.content,
            content_type:
              attachment.content_type ||
              "application/pdf",
          })
        );
    }

    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${RESEND_API_KEY}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result =
      await response.json();

    if (!response.ok) {
      console.error(
        "[email] Resend rejected email:",
        result
      );

      return {
        success: false,
        error:
          result?.message ||
          result?.name ||
          "Resend rejected the email.",
      };
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error(
      "[email] Email request failed:",
      error
    );

    return {
      success: false,
      error: String(error),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BOARD DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_S1_BOARD = {
  currentStep: 1,
  step1: { selectedCards: [] },
  step2: { exitNotes: [] },
  step3: { stickyNotes: [] },
  step4: { selectedRoles: [] },
  step5: { roleNotes: {} },
  step6: { roleZones: {} },
  step7: { recognitionWords: [] },
};

const EMPTY_S2_BOARD = {
  currentStep: 1,
};

const EMPTY_S3_BOARD = {
  currentStep: 1,
};

const EMPTY_S4_BOARD = {
  currentStep: 1,
};

function getEmptyBoard(
  sessionNumber: number
) {
  switch (sessionNumber) {
    case 1:
      return {
        ...EMPTY_S1_BOARD,
        step1: {
          selectedCards: [],
        },
        step2: {
          exitNotes: [],
        },
        step3: {
          stickyNotes: [],
        },
        step4: {
          selectedRoles: [],
        },
        step5: {
          roleNotes: {},
        },
        step6: {
          roleZones: {},
        },
        step7: {
          recognitionWords: [],
        },
      };

    case 2:
      return {
        ...EMPTY_S2_BOARD,
      };

    case 3:
      return {
        ...EMPTY_S3_BOARD,
      };

    case 4:
      return {
        ...EMPTY_S4_BOARD,
      };

    default:
      return {};
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// JOURNEY / SESSION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function getJourney(
  journeyId: string
) {
  return await kv.get(
    `journey:${journeyId}`
  );
}

async function saveJourney(
  journey: any
) {
  await kv.set(
    `journey:${journey.id}`,
    journey
  );
}

async function getSession(
  sessionId: string
) {
  return await kv.get(
    `session:${sessionId}`
  );
}

async function saveSession(
  session: any
) {
  await kv.set(
    `session:${session.id}`,
    session
  );
}

function getSessionFromJourney(
  journey: any,
  sessionId: string
) {
  return (
    journey.sessions || []
  ).find(
    (s: any) =>
      s.id === sessionId
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICIPANT BOARD STORAGE
// ─────────────────────────────────────────────────────────────────────────────

function getParticipantBoardKey(
  sessionId: string,
  participantId: string
) {
  return `board:${sessionId}:${participantId}`;
}

function getLegacyBoardKey(
  sessionId: string
) {
  return `board:${sessionId}`;
}

/*
 * Participant-specific boards are now the source of truth.
 *
 * The legacy board is only used as a fallback for older
 * data that was saved before participant-specific boards
 * were introduced.
 */
async function getParticipantBoard(
  sessionId: string,
  participantId: string,
  sessionNumber: number
) {
  const participantBoard =
    await kv.get(
      getParticipantBoardKey(
        sessionId,
        participantId
      )
    );

  if (participantBoard) {
    return participantBoard;
  }

  const legacyBoard =
    await kv.get(
      getLegacyBoardKey(sessionId)
    );

  if (legacyBoard) {
    return legacyBoard;
  }

  return getEmptyBoard(
    sessionNumber
  );
}

async function saveParticipantBoard(
  sessionId: string,
  participantId: string,
  state: any
) {
  await kv.set(
    getParticipantBoardKey(
      sessionId,
      participantId
    ),
    {
      ...state,
      updatedAt:
        new Date().toISOString(),
    }
  );
}

async function getLinkedParticipantId(
  journey: any
) {
  const participantEmail = normalizeEmail(
    journey.participantEmail ||
      journey.participants?.[0]?.email
  );

  if (!participantEmail) {
    return null;
  }

  const userEntries = await kv.getEntriesByPrefix("user:");

  const participant = userEntries.find(
    (entry: any) =>
      entry.value?.role === "participant" &&
      normalizeEmail(entry.value?.email) === participantEmail
  );

  return participant?.value?.id ||
    participant?.key?.replace("user:", "") ||
    null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICIPANT LINK CHECK
// ─────────────────────────────────────────────────────────────────────────────

function isParticipantLinked(
  journey: any,
  email: string
) {
  const normalized =
    normalizeEmail(email);

  const participants =
    Array.isArray(
      journey.participants
    )
      ? journey.participants
      : [];

  const linked =
    participants.some(
      (participant: any) =>
        normalizeEmail(
          participant?.email
        ) === normalized
    );

  if (linked) {
    return true;
  }

  return (
    normalizeEmail(
      journey.participantEmail
    ) === normalized
  );
}

function getParticipantRecord(
  journey: any,
  email: string
) {
  const normalized =
    normalizeEmail(email);

  const participant =
    (
      journey.participants || []
    ).find(
      (item: any) =>
        normalizeEmail(
          item?.email
        ) === normalized
    );

  return participant || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICIPANT INDEX
// ─────────────────────────────────────────────────────────────────────────────

async function ensureParticipantJourneyIndex(
  journey: any
) {
  const emails =
    new Set<string>();

  if (journey.participantEmail) {
    emails.add(
      normalizeEmail(
        journey.participantEmail
      )
    );
  }

  for (
    const participant of
    journey.participants || []
  ) {
    const email =
      normalizeEmail(
        participant?.email
      );

    if (email) {
      emails.add(email);
    }
  }

  for (const email of emails) {
    const key =
      `participant_email:${email}:journeys`;

    const ids: string[] =
      (await kv.get(key)) || [];

    if (
      !ids.includes(
        journey.id
      )
    ) {
      ids.push(
        journey.id
      );

      await kv.set(
        key,
        ids
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION MIGRATION
// ─────────────────────────────────────────────────────────────────────────────

async function ensureJourneySessions(
  journey: any
) {
  /*
   * Existing four-session journeys still need their
   * session records upgraded with timing fields.
   */

  if (
    journey.sessions &&
    Array.isArray(journey.sessions) &&
    journey.sessions.length === 4
  ) {
    let changed = false;

    for (
      const sessionItem of
      journey.sessions
    ) {
      const session =
        await getSession(
          sessionItem.id
        );

      if (!session) {
        continue;
      }

      if (
        session.startedAt ===
        undefined
      ) {
        session.startedAt =
          null;
        changed = true;
      }

      if (
        session.completedAt ===
        undefined
      ) {
        session.completedAt =
          null;
        changed = true;
      }

      if (
        session.availableAt ===
        undefined
      ) {
        /*
         * Existing sessions are kept compatible.
         *
         * If a previous session has a known completedAt,
         * derive the seven-day availability date.
         */
        const sessionNumber =
          Number(
            session.sessionNumber
          );

        if (
          sessionNumber > 1
        ) {
          const previous =
            journey.sessions.find(
              (item: any) =>
                Number(
                  item.number
                ) ===
                sessionNumber - 1
            );

          if (
            previous?.completedAt
          ) {
            session.availableAt =
              getSessionAvailabilityDate(
                previous.completedAt
              );
          } else {
            session.availableAt =
              null;
          }
        } else {
          session.availableAt =
            null;
        }

        changed = true;
      }

      if (changed) {
        session.updatedAt =
          new Date().toISOString();

        await saveSession(
          session
        );
      }
    }

    if (changed) {
      await saveJourney(
        journey
      );
    }

    await ensureParticipantJourneyIndex(
      journey
    );

    return journey;
  }

  const oldSessionId =
    journey.sessionId;

  if (!oldSessionId) {
    await ensureParticipantJourneyIndex(
      journey
    );

    return journey;
  }

  const oldSession =
    await kv.get(
      `session:${oldSessionId}`
    );

  const oldStatus:
    SessionStatus =
    oldSession?.status ||
    "available";

  const oldCompletedAt =
    oldSession?.completedAt ||
    null;

  const sessionIds = {
    1: oldSessionId,
    2: crypto.randomUUID(),
    3: crypto.randomUUID(),
    4: crypto.randomUUID(),
  };

  const sessions =
    SESSION_NUMBERS.map(
      (number) => ({
        id:
          sessionIds[
            number as
              1 |
              2 |
              3 |
              4
          ],
        number,
        status:
          number === 1
            ? oldStatus
            : "locked" as SessionStatus,

        completedAt:
          number === 1
            ? oldCompletedAt
            : null,

        availableAt:
          number === 1
            ? null
            : null,
      })
    );

  /*
   * If the old Session 1 was already completed,
   * Session 2 is scheduled seven days later.
   */
  if (
    oldCompletedAt
  ) {
    const session2 =
      sessions.find(
        (item) =>
          item.number === 2
      );

    if (session2) {
      session2.availableAt =
        getSessionAvailabilityDate(
          oldCompletedAt
        );
    }
  }

  journey.sessions =
    sessions;

  for (
    const session of sessions
  ) {
    const existing =
      await kv.get(
        `session:${session.id}`
      );

    if (!existing) {
      await kv.set(
        `session:${session.id}`,
        {
          id:
            session.id,

          journeyId:
            journey.id,

          sessionNumber:
            session.number,

          status:
            session.status,

          currentStep:
            1,

          createdAt:
            new Date().toISOString(),

          startedAt:
            null,

          completedAt:
            session.completedAt ||
            null,

          availableAt:
            session.availableAt ||
            null,
        }
      );

      await kv.set(
        `board:${session.id}`,
        getEmptyBoard(
          session.number
        )
      );
    } else {
      let changed =
        false;

      if (
        existing.startedAt ===
        undefined
      ) {
        existing.startedAt =
          null;
        changed = true;
      }

      if (
        existing.completedAt ===
        undefined
      ) {
        existing.completedAt =
          session.completedAt ||
          null;
        changed = true;
      }

      if (
        existing.availableAt ===
        undefined
      ) {
        existing.availableAt =
          session.availableAt ||
          null;
        changed = true;
      }

      if (changed) {
        existing.updatedAt =
          new Date().toISOString();

        await saveSession(
          existing
        );
      }
    }
  }

  await saveJourney(
    journey
  );

  await ensureParticipantJourneyIndex(
    journey
  );

  return journey;
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION ACCESS
// ─────────────────────────────────────────────────────────────────────────────

function canOpenSession(
  session: any,
  role?: UserRole
) {
  if (!session) {
    return false;
  }

  if (
    role === "facilitator"
  ) {
    return true;
  }

  return (
    session.status ===
      "in_progress" ||
    session.status ===
      "completed"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF
// ─────────────────────────────────────────────────────────────────────────────

function pdfEscape(
  value: string
) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function flattenBoard(
  value: any,
  prefix = ""
): string[] {
  const lines: string[] = [];

  if (
    value === null ||
    value === undefined
  ) {
    return lines;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    lines.push(
      prefix
        ? `${prefix}: ${String(value)}`
        : String(value)
    );

    return lines;
  }

  if (Array.isArray(value)) {
    value.forEach(
      (item, index) => {
        if (
          typeof item === "string" ||
          typeof item === "number" ||
          typeof item === "boolean"
        ) {
          lines.push(
            `${
              prefix ||
              "Item"
            } ${index + 1}: ${String(item)}`
          );
        } else {
          lines.push(
            `${
              prefix ||
              "Item"
            } ${index + 1}`
          );

          lines.push(
            ...flattenBoard(
              item
            )
          );
        }
      }
    );

    return lines;
  }

  if (
    typeof value === "object"
  ) {
    Object.entries(value).forEach(
      ([key, child]) => {
        if (
          key === "updatedAt" ||
          key === "currentStep"
        ) {
          return;
        }

        const label =
          prefix
            ? `${prefix} — ${key}`
            : key;

        if (
          child !== null &&
          typeof child === "object"
        ) {
          lines.push(label);

          lines.push(
            ...flattenBoard(
              child
            )
          );
        } else {
          lines.push(
            `${label}: ${String(child)}`
          );
        }
      }
    );
  }

  return lines;
}

function createPdf(
  lines: string[]
): Uint8Array {
  const PAGE_WIDTH = 595;
  const PAGE_HEIGHT = 842;
  const marginX = 48;
  const topY = 790;
  const lineHeight = 16;

  const linesPerPage =
    Math.floor(
      (topY - 55) /
        lineHeight
    );

  const pages: string[][] = [];

  for (
    let i = 0;
    i < lines.length;
    i += linesPerPage
  ) {
    pages.push(
      lines.slice(
        i,
        i + linesPerPage
      )
    );
  }

  if (
    pages.length === 0
  ) {
    pages.push([]);
  }

  const objects: string[] = [];

  objects.push(
    "<< /Type /Catalog /Pages 2 0 R >>"
  );

  const pageObjectNumbers: number[] = [];

  const fontObjectNumber = 3;
  const firstPageObject = 4;

  pages.forEach(
    (_, index) => {
      pageObjectNumbers.push(
        firstPageObject +
          index * 2
      );
    }
  );

  const kids =
    pageObjectNumbers
      .map(
        number =>
          `${number} 0 R`
      )
      .join(" ");

  objects.push(
    `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`
  );

  objects.push(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  );

  pages.forEach(
    (pageLines, pageIndex) => {
      const pageObject =
        firstPageObject +
        pageIndex * 2;

      const contentObject =
        pageObject + 1;

      objects[
        pageObject - 1
      ] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObject} 0 R >>`;

      let stream = "BT\n";

      stream +=
        "/F1 11 Tf\n";

      stream +=
        `${marginX} ${topY} Td\n`;

      for (
        const line of pageLines
      ) {
        const safe =
          line
            .replace(
              /[^\x20-\x7E]/g,
              ""
            )
            .slice(0, 105);

        stream +=
          `(${pdfEscape(safe)}) Tj\n`;

        stream +=
          `0 -${lineHeight} Td\n`;
      }

      stream += "ET";

      objects[
        contentObject - 1
      ] =
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    }
  );

  let pdf =
    "%PDF-1.4\n";

  const offsets: number[] =
    [0];

  objects.forEach(
    (object, index) => {
      offsets.push(
        pdf.length
      );

      pdf +=
        `${index + 1} 0 obj\n`;

      pdf +=
        `${object}\n`;

      pdf +=
        "endobj\n";
    }
  );

  const xrefOffset =
    pdf.length;

  pdf +=
    `xref\n0 ${
      objects.length + 1
    }\n`;

  pdf +=
    "0000000000 65535 f \n";

  for (
    let i = 1;
    i < offsets.length;
    i++
  ) {
    pdf +=
      `${String(
        offsets[i]
      ).padStart(
        10,
        "0"
      )} 00000 n \n`;
  }

  pdf +=
    `trailer\n<< /Size ${
      objects.length + 1
    } /Root 1 0 R >>\n`;

  pdf +=
    `startxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(
    pdf
  );
}

function uint8ToBase64(
  bytes: Uint8Array
) {
  let binary = "";

  const chunkSize =
    0x8000;

  for (
    let i = 0;
    i < bytes.length;
    i += chunkSize
  ) {
    binary +=
      String.fromCharCode(
        ...bytes.subarray(
          i,
          Math.min(
            i + chunkSize,
            bytes.length
          )
        )
      );
  }

  return btoa(binary);
}

async function buildSessionReport(
  session: any,
  journey: any,
  board: any,
  participantEmail?: string
) {
  const sessionNumber =
    Number(
      session.sessionNumber
    );

  const sessionName =
    SESSION_NAMES[
      sessionNumber
    ] ||
    `Session ${sessionNumber}`;

  const participant =
    participantEmail ||
    journey.participants?.[0]
      ?.email ||
    journey.participantEmail ||
    "Participant";

  const lines: string[] =
    [];

  lines.push(
    "ZEST JOURNEY"
  );

  lines.push(
    "SESSION REPORT"
  );

  lines.push("");

  lines.push(
    `Journey: ${journey.title}`
  );

  lines.push(
    `Session ${sessionNumber}: ${sessionName}`
  );

  lines.push(
    `Participant: ${participant}`
  );

  lines.push(
    `Status: ${session.status}`
  );

  if (
    session.completedAt
  ) {
    lines.push(
      `Completed: ${new Date(
        session.completedAt
      ).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      )}`
    );
  }

  lines.push(
    `Generated: ${new Date().toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    )}`
  );

  lines.push("");

  lines.push(
    "SESSION REFLECTIONS"
  );

  lines.push(
    "----------------------------------------"
  );

  const boardLines =
    flattenBoard(board);

  if (
    boardLines.length === 0
  ) {
    lines.push(
      "No session responses have been recorded."
    );
  } else {
    lines.push(
      ...boardLines
    );
  }

  lines.push("");

  lines.push(
    "Zuva Life"
  );

  lines.push(
    "Zest Journey"
  );

  return {
    lines,
    sessionName,
    participant,
    filename:
      `zest-journey-session-${sessionNumber}-report.pdf`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH
// ─────────────────────────────────────────────────────────────────────────────

app.get(
  `${P}/health`,
  c =>
    c.json({
      status: "ok",
      ts:
        new Date().toISOString(),
    })
);

// ─────────────────────────────────────────────────────────────────────────────
// AUTH — SIGNUP
// ─────────────────────────────────────────────────────────────────────────────

app.post(
  `${P}/auth/signup`,
  async c => {
    try {
      const {
        email,
        password,
        fullName,
        role,
      } =
        await c.req.json();

      if (
        !email ||
        !password ||
        !fullName ||
        !role
      ) {
        return c.json(
          {
            error:
              "Missing required fields.",
          },
          400
        );
      }

      if (
        ![
          "facilitator",
          "participant",
        ].includes(role)
      ) {
        return c.json(
          {
            error:
              "Invalid role.",
          },
          400
        );
      }

      const normalizedEmail =
        normalizeEmail(email);

      const supabase =
        getAdminClient();

      const {
        data,
        error,
      } =
        await supabase.auth.admin.createUser(
          {
            email:
              normalizedEmail,

            password,

            user_metadata: {
              name:
                fullName.trim(),
              role,
            },

            email_confirm:
              true,
          }
        );

      if (error) {
        return c.json(
          {
            error:
              error.message,
          },
          400
        );
      }

      await kv.set(
        `user:${data.user.id}`,
        {
          id:
            data.user.id,

          email:
            normalizedEmail,

          fullName:
            fullName.trim(),

          role,

          createdAt:
            new Date().toISOString(),
        }
      );

      const firstName =
        fullName
          .trim()
          .split(" ")[0] ||
        "there";

      const welcomeEmail =
        await sendEmail({
          to:
            normalizedEmail,

          subject:
            "Welcome to Zest Journey",

          html:
            emailLayout(`
              <h1 style="margin:0 0 16px;color:#4A1C5C;font-size:28px;">
                Welcome, ${escapeHtml(firstName)}!
              </h1>

              <p style="font-size:16px;line-height:1.7;">
                Thank you for creating your Zest Journey account.
              </p>

              <p style="font-size:16px;line-height:1.7;">
                Your account is now ready. You can sign in and begin exploring your journey.
              </p>

              <div style="margin:28px 0;text-align:center;">
                <a href="${APP_URL}"
                  style="
                  display:inline-block;
                  background:#4A1C5C;
                  color:#ffffff;
                  text-decoration:none;
                  padding:14px 24px;
                  border-radius:10px;
                  font-weight:bold;
                  ">
                  Open Zest Journey
                </a>
              </div>

              <p style="margin-top:28px;">
                Warmly,<br>
                <strong>Zuva Life</strong>
              </p>
            `),
        });

      return c.json({
        success: true,

        emailSent:
          welcomeEmail.success,

        emailError:
          welcomeEmail.success
            ? undefined
            : welcomeEmail.error,

        user: {
          id:
            data.user.id,

          email:
            data.user.email,

          fullName:
            fullName.trim(),

          role,
        },
      });
    } catch (error) {
      console.error(
        "[signup]",
        error
      );

      return c.json(
        {
          error:
            String(error),
        },
        500
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// AUTH — VERIFY ROLE
// ─────────────────────────────────────────────────────────────────────────────

app.post(
  `${P}/auth/verify-role`,
  async c => {
    const auth =
      await requireAuth(c);

    if (!auth.ok) {
      return auth.response;
    }

    const user =
      auth.user;

    const userData =
      await kv.get(
        `user:${user.id}`
      );

    return c.json({
      success: true,

      user: {
        id:
          user.id,

        email:
          user.email,

        fullName:
          userData?.fullName ||
          user.email,

        role:
          userData?.role ||
          user.role,
      },
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// JOURNEYS — CREATE
// ─────────────────────────────────────────────────────────────────────────────

app.post(
  `${P}/journeys`,
  async c => {
    try {
      const auth =
        await requireRole(
          c,
          "facilitator"
        );

      if (!auth.ok) {
        return auth.response;
      }

      const {
        title,
        description,
        facilitatorId,
        facilitatorEmail,
        sessionNumber,
      } =
        await c.req.json();

      if (!title) {
        return c.json(
          {
            error:
              "Journey title is required.",
          },
          400
        );
      }

      const startingSessionNumber =
        normalizeSessionNumber(
          sessionNumber
        ) || 1;

      const authenticatedFacilitatorId =
        auth.user.id;

      if (
        facilitatorId &&
        facilitatorId !==
          authenticatedFacilitatorId
      ) {
        return c.json(
          {
            error:
              "Facilitator identity does not match the authenticated user.",
          },
          403
        );
      }

      const journeyId =
        crypto.randomUUID();

      const sessionIds = {
        1:
          crypto.randomUUID(),

        2:
          crypto.randomUUID(),

        3:
          crypto.randomUUID(),

        4:
          crypto.randomUUID(),
      };

      const now =
        new Date().toISOString();

      const sessions =
        SESSION_NUMBERS.map(
          number => ({
            id:
              sessionIds[
                number as
                  1 |
                  2 |
                  3 |
                  4
              ],

            number,

            status:
              number ===
              startingSessionNumber
                ? "available" as SessionStatus
                : "locked" as SessionStatus,

            startedAt:
              null,

            completedAt:
              null,

            availableAt:
              number ===
              startingSessionNumber
                ? null
                : null,
          })
        );

      const journey = {
        id:
          journeyId,

        title:
          title.trim(),

        description:
          description?.trim() ||
          "",

        facilitatorId:
          authenticatedFacilitatorId,

        facilitatorEmail:
          facilitatorEmail ||
          auth.user.email ||
          "",

        participantEmail:
          null,

        participants:
          [],

        status:
          "active",

        sessionId:
          sessionIds[
            startingSessionNumber as
              1 |
              2 |
              3 |
              4
          ],

        startingSessionNumber,

        sessions,

        createdAt:
          now,
      };

      await saveJourney(
        journey
      );

      for (
        const session of sessions
      ) {
        await kv.set(
          `session:${session.id}`,
          {
            id:
              session.id,

            journeyId,

            sessionNumber:
              session.number,

            status:
              session.status,

            currentStep:
              1,

            createdAt:
              now,

            startedAt:
              null,

            completedAt:
              session.completedAt,

            availableAt:
              session.availableAt,
          }
        );

        await kv.set(
          `board:${session.id}`,
          getEmptyBoard(
            session.number
          )
        );
      }

      const facilitatorKey =
        `facilitator:${authenticatedFacilitatorId}:journeys`;

      const facilitatorJourneys: string[] =
        (await kv.get(
          facilitatorKey
        )) || [];

      if (
        !facilitatorJourneys.includes(
          journeyId
        )
      ) {
        facilitatorJourneys.push(
          journeyId
        );

        await kv.set(
          facilitatorKey,
          facilitatorJourneys
        );
      }

      const startingSession =
        sessions.find(
          session =>
            session.number ===
            startingSessionNumber
        );

      return c.json({
        success: true,

        journey,

        sessionId:
          startingSession?.id ||
          null,

        session: {
          id:
            startingSession?.id ||
            null,

          number:
            startingSessionNumber,

          label:
            `Session ${startingSessionNumber}`,

          name:
            SESSION_NAMES[
              startingSessionNumber
            ],

          status:
            "available",

          availableAt:
            startingSession?.availableAt ||
            null,
        },
      });
    } catch (error) {
      console.error(
        "[journeys/create]",
        error
      );

      return c.json(
        {
          success: false,
          error:
            String(error),
        },
        500
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// JOURNEYS — FACILITATOR
// ─────────────────────────────────────────────────────────────────────────────

app.get(
  `${P}/journeys/facilitator/:userId`,
  async c => {
    try {
      const auth =
        await requireRole(
          c,
          "facilitator"
        );

      if (!auth.ok) {
        return auth.response;
      }

      const requestedUserId =
        c.req.param(
          "userId"
        );

      if (
        requestedUserId !==
        auth.user.id
      ) {
        return c.json(
          {
            success: false,
            error:
              "You can only view your own journeys.",
          },
          403
        );
      }

      const key =
        `facilitator:${auth.user.id}:journeys`;

      const journeyIds: string[] =
        (await kv.get(key)) ||
        [];

      const journeys: any[] =
        [];

      const validIds: string[] =
        [];

      for (
        const id of journeyIds
      ) {
        let journey =
          await getJourney(id);

        if (!journey) {
          continue;
        }

        if (
          journey.facilitatorId !==
          auth.user.id
        ) {
          continue;
        }

        journey =
          await ensureJourneySessions(
            journey
          );

        journeys.push(
          journey
        );

        validIds.push(id);
      }

      if (
        validIds.length !==
        journeyIds.length
      ) {
        await kv.set(
          key,
          validIds
        );
      }

      return c.json({
        success: true,

        journeys:
          journeys.sort(
            (a, b) =>
              new Date(
                b.createdAt || 0
              ).getTime() -
              new Date(
                a.createdAt || 0
              ).getTime()
          ),
      });
    } catch (error) {
      console.error(
        "[journeys/facilitator]",
        error
      );

      return c.json(
        {
          success: false,
          error:
            String(error),
        },
        500
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// JOURNEYS — PARTICIPANT
// ─────────────────────────────────────────────────────────────────────────────

app.get(
  `${P}/journeys/participant/:email`,
  async c => {
    try {
      const auth =
        await requireRole(
          c,
          "participant"
        );

      if (!auth.ok) {
        return auth.response;
      }

      const requestedEmail =
        decodeURIComponent(
          c.req.param(
            "email"
          )
        )
          .trim()
          .toLowerCase();

      const authenticatedEmail =
        normalizeEmail(
          auth.user.email
        );

      if (
        requestedEmail !==
        authenticatedEmail
      ) {
        return c.json(
          {
            success: false,
            error:
              "You can only view journeys assigned to your own account.",
          },
          403
        );
      }

      const key =
        `participant_email:${authenticatedEmail}:journeys`;

      let journeyIds: string[] =
        (await kv.get(key)) ||
        [];

      const journeyEntries =
        await kv.getEntriesByPrefix(
          "journey:"
        );

      const indexed =
        new Set(
          journeyIds
        );

      for (
        const entry of
        journeyEntries
      ) {
        const journey =
          entry.value;

        if (!journey) {
          continue;
        }

        if (
          isParticipantLinked(
            journey,
            authenticatedEmail
          )
        ) {
          if (
            !indexed.has(
              journey.id
            )
          ) {
            journeyIds.push(
              journey.id
            );

            indexed.add(
              journey.id
            );
          }
        }
      }

      await kv.set(
        key,
        journeyIds
      );

      const journeys: any[] =
        [];

      const validIds: string[] =
        [];

      for (
        const id of journeyIds
      ) {
        let journey =
          await getJourney(id);

        if (!journey) {
          continue;
        }

        if (
          !isParticipantLinked(
            journey,
            authenticatedEmail
          )
        ) {
          continue;
        }

        journey =
          await ensureJourneySessions(
            journey
          );

        journeys.push(
          journey
        );

        validIds.push(id);
      }

      await kv.set(
        key,
        validIds
      );

      return c.json({
        success: true,

        journeys:
          journeys.sort(
            (a, b) =>
              new Date(
                b.createdAt || 0
              ).getTime() -
              new Date(
                a.createdAt || 0
              ).getTime()
          ),
      });
    } catch (error) {
      console.error(
        "[journeys/participant]",
        error
      );

      return c.json(
        {
          success: false,
          error:
            String(error),
        },
        500
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// JOURNEYS — GET SINGLE
// ─────────────────────────────────────────────────────────────────────────────

app.get(
  `${P}/journeys/:id`,
  async c => {
    try {
      const auth =
        await requireAuth(c);

      if (!auth.ok) {
        return auth.response;
      }

      const journeyId =
        c.req.param("id");

      let journey =
        await getJourney(
          journeyId
        );

      if (!journey) {
        return c.json(
          {
            error:
              "Journey not found.",
          },
          404
        );
      }

      const isOwner =
        auth.user.role ===
          "facilitator" &&
        journey.facilitatorId ===
          auth.user.id;

      const isParticipant =
        auth.user.role ===
          "participant" &&
        isParticipantLinked(
          journey,
          auth.user.email || ""
        );

      if (
        !isOwner &&
        !isParticipant
      ) {
        return c.json(
          {
            error:
              "You do not have access to this journey.",
          },
          403
        );
      }

      journey =
        await ensureJourneySessions(
          journey
        );

      return c.json({
        success: true,
        journey,
      });
    } catch (error) {
      console.error(
        "[journeys/get]",
        error
      );

      return c.json(
        {
          success: false,
          error:
            String(error),
        },
        500
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// JOURNEYS — DELETE
// ─────────────────────────────────────────────────────────────────────────────

app.delete(
  `${P}/journeys/:id`,
  async c => {
    try {
      const auth =
        await requireRole(
          c,
          "facilitator"
        );

      if (!auth.ok) {
        return auth.response;
      }

      const journeyId =
        c.req.param("id");

      const journey =
        await getJourney(
          journeyId
        );

      if (!journey) {
        return c.json(
          {
            error:
              "Journey not found.",
          },
          404
        );
      }

      if (
        journey.facilitatorId !==
        auth.user.id
      ) {
        return c.json(
          {
            error:
              "You can only delete your own journeys.",
          },
          403
        );
      }

      let sessions =
        journey.sessions || [];

      if (
        sessions.length === 0 &&
        journey.sessionId
      ) {
        sessions = [
          {
            id:
              journey.sessionId,
            number: 1,
          },
        ];
      }

      const sessionIds =
        sessions
          .map(
            (session: any) =>
              session.id
          )
          .filter(Boolean);

      let deletedBoards = 0;
      let deletedSessions = 0;

      /*
       * Delete every participant-specific board for
       * every session, plus the legacy board.
       */
      for (
        const sessionId of
        sessionIds
      ) {
        const boardEntries =
          await kv.getEntriesByPrefix(
            `board:${sessionId}`
          );

        if (
          boardEntries.length > 0
        ) {
          await kv.mdel(
            boardEntries.map(
              entry =>
                entry.key
            )
          );

          deletedBoards +=
            boardEntries.length;
        }

        if (
          await kv.get(
            `session:${sessionId}`
          )
        ) {
          await kv.del(
            `session:${sessionId}`
          );

          deletedSessions++;
        }
      }

      const facilitatorKey =
        `facilitator:${auth.user.id}:journeys`;

      const facilitatorJourneys: string[] =
        (await kv.get(
          facilitatorKey
        )) || [];

      await kv.set(
        facilitatorKey,
        facilitatorJourneys.filter(
          id =>
            id !== journeyId
        )
      );

      const participantEmails =
        new Set<string>();

      if (
        journey.participantEmail
      ) {
        participantEmails.add(
          normalizeEmail(
            journey.participantEmail
          )
        );
      }

      for (
        const participant of
        journey.participants || []
      ) {
        const email =
          normalizeEmail(
            participant?.email
          );

        if (email) {
          participantEmails.add(
            email
          );
        }
      }

      for (
        const email of
        participantEmails
      ) {
        const participantKey =
          `participant_email:${email}:journeys`;

        const participantJourneys: string[] =
          (await kv.get(
            participantKey
          )) || [];

        await kv.set(
          participantKey,
          participantJourneys.filter(
            id =>
              id !== journeyId
          )
        );
      }

      await kv.del(
        `journey:${journeyId}`
      );

      return c.json({
        success: true,

        deleted: {
          journey: 1,

          sessions:
            deletedSessions,

          boards:
            deletedBoards,
        },
      });
    } catch (error) {
      console.error(
        "[journeys/delete]",
        error
      );

      return c.json(
        {
          success: false,
          error:
            String(error),
        },
        500
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// JOURNEYS — LINK PARTICIPANT
// ─────────────────────────────────────────────────────────────────────────────

app.post(
  `${P}/journeys/:id/link`,
  async c => {
    try {
      const auth =
        await requireRole(
          c,
          "facilitator"
        );

      if (!auth.ok) {
        return auth.response;
      }

      const journeyId =
        c.req.param("id");

      const {
        participantEmail,
      } =
        await c.req.json();

      if (
        !participantEmail
      ) {
        return c.json(
          {
            error:
              "Participant email required.",
          },
          400
        );
      }

      let journey =
        await getJourney(
          journeyId
        );

      if (!journey) {
        return c.json(
          {
            error:
              "Journey not found.",
          },
          404
        );
      }

      if (
        journey.facilitatorId !==
        auth.user.id
      ) {
        return c.json(
          {
            error:
              "You can only modify your own journeys.",
          },
          403
        );
      }

      journey =
        await ensureJourneySessions(
          journey
        );

      const email =
        normalizeEmail(
          participantEmail
        );

      if (!email) {
        return c.json(
          {
            error:
              "Participant email required.",
          },
          400
        );
      }

      if (
        !Array.isArray(
          journey.participants
        )
      ) {
        journey.participants =
          [];
      }

      const alreadyLinked =
        journey.participants.some(
          (participant: any) =>
            normalizeEmail(
              participant?.email
            ) === email
        );

      if (
        alreadyLinked
      ) {
        return c.json(
          {
            error:
              `${email} is already linked to this journey.`,
          },
          400
        );
      }

      journey.participants.push({
        email,

        linkedAt:
          new Date().toISOString(),
      });

      if (
        !journey.participantEmail
      ) {
        journey.participantEmail =
          email;
      }

      await saveJourney(
        journey
      );

      const participantKey =
        `participant_email:${email}:journeys`;

      const participantJourneys: string[] =
        (await kv.get(
          participantKey
        )) || [];

      if (
        !participantJourneys.includes(
          journeyId
        )
      ) {
        participantJourneys.push(
          journeyId
        );
      }

      await kv.set(
        participantKey,
        participantJourneys
      );

      const verifiedIndex: string[] =
        (await kv.get(
          participantKey
        )) || [];

      console.log(
        `[journeys/link] linked ${email} to ${journeyId}; index contains journey=${verifiedIndex.includes(
          journeyId
        )}`
      );

      const invitationEmail =
        await sendEmail({
          to: email,

          subject:
            "You've been invited to a Zest Journey",

          html:
            emailLayout(`
              <h1 style="
                margin:0 0 16px;
                color:#4A1C5C;
                font-size:28px;
              ">
                You're invited to a Zest Journey
              </h1>

              <p style="
                font-size:16px;
                line-height:1.7;
              ">
                You have been invited to join a Zest Journey with Zuva Life.
              </p>

              <div style="
                background:#F7F3EE;
                border:1px solid #EBE2E6;
                border-radius:14px;
                padding:20px;
                margin:24px 0;
              ">

                <div style="
                  font-size:12px;
                  color:#6B625D;
                  margin-bottom:6px;
                ">
                  JOURNEY
                </div>

                <div style="
                  font-size:20px;
                  font-weight:bold;
                  color:#4A1C5C;
                ">
                  ${escapeHtml(
                    journey.title
                  )}
                </div>

                ${
                  journey.description
                    ? `
                      <p style="
                        margin:10px 0 0;
                        color:#6B625D;
                        line-height:1.6;
                      ">
                        ${escapeHtml(
                          journey.description
                        )}
                      </p>
                    `
                    : ""
                }

              </div>

              <p style="
                font-size:16px;
                line-height:1.7;
              ">
                Your journey is now available in your participant dashboard.
              </p>

              <div style="
                margin:28px 0;
                text-align:center;
              ">

                <a
                  href="${APP_URL}/participant/dashboard"
                  style="
                    display:inline-block;
                    background:#4A1C5C;
                    color:#ffffff;
                    text-decoration:none;
                    padding:14px 24px;
                    border-radius:10px;
                    font-weight:bold;
                  "
                >
                  Open My Journey
                </a>

              </div>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#6B625D;
              ">
                Warmly,<br>
                <strong>Zuva Life</strong>
              </p>
            `),
        });

      return c.json({
        success: true,

        emailSent:
          invitationEmail.success,

        emailError:
          invitationEmail.success
            ? undefined
            : invitationEmail.error,

        journey,
      });
    } catch (error) {
      console.error(
        "[journeys/link]",
        error
      );

      return c.json(
        {
          success: false,
          error:
            String(error),
        },
        500
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS — GET
// ─────────────────────────────────────────────────────────────────────────────

app.get(
  `${P}/sessions/:id`,
  async c => {
    try {
      const auth =
        await requireAuth(c);

      if (!auth.ok) {
        return auth.response;
      }

      const id =
        c.req.param("id");

      const session =
        await getSession(id);

      if (!session) {
        return c.json(
          {
            error:
              "Session not found.",
          },
          404
        );
      }

      let journey =
        await getJourney(
          session.journeyId
        );

      if (!journey) {
        return c.json(
          {
            error:
              "Journey not found.",
          },
          404
        );
      }

      journey =
        await ensureJourneySessions(
          journey
        );

      const facilitatorAccess =
        auth.user.role ===
          "facilitator" &&
        journey.facilitatorId ===
          auth.user.id;

      const participantAccess =
        auth.user.role ===
          "participant" &&
        isParticipantLinked(
          journey,
          auth.user.email || ""
        );

      if (
        !facilitatorAccess &&
        !participantAccess
      ) {
        return c.json(
          {
            error:
              "You do not have access to this session.",
          },
          403
        );
      }

      if (
        auth.user.role ===
          "participant" &&
        !canOpenSession(
          session,
          "participant"
        )
      ) {
        return c.json(
          {
            success: false,
            error:
              "This session is locked. The facilitator must enable it before you can start it.",
            code:
              "SESSION_LOCKED",
          },
          403
        );
      }

      const previousBoards: Record<
        number,
        any
      > = {};

      /*
       * Previous boards are participant-specific.
       */
      if (
        session.sessionNumber > 1 &&
        auth.user.role ===
          "participant"
      ) {
        for (
          const sessionItem of
          journey.sessions || []
        ) {
          if (
            Number(
              sessionItem.number
            ) <
            Number(
              session.sessionNumber
            )
          ) {
            const board =
              await getParticipantBoard(
                sessionItem.id,
                auth.user.id,
                Number(
                  sessionItem.number
                )
              );

            if (board) {
              previousBoards[
                Number(
                  sessionItem.number
                )
              ] = board;
            }
          }
        }
      }

      return c.json({
        success: true,

        session,

        journey,

        previousBoards,
      });
    } catch (error) {
      console.error(
        "[sessions/get]",
        error
      );

      return c.json(
        {
          error:
            String(error),
        },
        500
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS — GET BOARD
// ─────────────────────────────────────────────────────────────────────────────

app.get(
  `${P}/sessions/:id/board`,
  async c => {
    try {
      const auth =
        await requireAuth(c);

      if (!auth.ok) {
        return auth.response;
      }

      const id =
        c.req.param("id");

      const session =
        await getSession(id);

      if (!session) {
        return c.json(
          {
            error:
              "Session not found.",
          },
          404
        );
      }

      const journey =
        await getJourney(
          session.journeyId
        );

      if (!journey) {
        return c.json(
          {
            error:
              "Journey not found.",
          },
          404
        );
      }

      const facilitatorAccess =
        auth.user.role ===
          "facilitator" &&
        journey.facilitatorId ===
          auth.user.id;

      const participantAccess =
        auth.user.role ===
          "participant" &&
        isParticipantLinked(
          journey,
          auth.user.email || ""
        );

      if (
        !facilitatorAccess &&
        !participantAccess
      ) {
        return c.json(
          {
            error:
              "You do not have access to this board.",
          },
          403
        );
      }

      if (
        auth.user.role ===
          "participant" &&
        !canOpenSession(
          session,
          "participant"
        )
      ) {
        return c.json(
          {
            error:
              "This session is locked.",
            code:
              "SESSION_LOCKED",
          },
          403
        );
      }

      const participantId =
        auth.user.role === "participant"
          ? auth.user.id
          : await getLinkedParticipantId(journey);

      let state = participantId
        ? await getParticipantBoard(
            id,
            participantId,
            Number(session.sessionNumber)
          )
        : await kv.get(getLegacyBoardKey(id));

      if (!state) {
        state = getEmptyBoard(Number(session.sessionNumber));
      }

      return c.json({
        success: true,

        state:
          state ||
          getEmptyBoard(
            Number(
              session.sessionNumber
            )
          ),
      });
    } catch (error) {
      console.error(
        "[sessions/board/get]",
        error
      );

      return c.json(
        {
          error:
            String(error),
        },
        500
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS — SAVE BOARD
// ─────────────────────────────────────────────────────────────────────────────

app.put(
  `${P}/sessions/:id/board`,
  async c => {
    try {
      const auth =
        await requireAuth(c);

      if (!auth.ok) {
        return auth.response;
      }

      const id =
        c.req.param("id");

      const session =
        await getSession(id);

      if (!session) {
        return c.json(
          {
            error:
              "Session not found.",
          },
          404
        );
      }

      const journey =
        await getJourney(
          session.journeyId
        );

      if (!journey) {
        return c.json(
          {
            error:
              "Journey not found.",
          },
          404
        );
      }

      const facilitatorAccess =
        auth.user.role ===
          "facilitator" &&
        journey.facilitatorId ===
          auth.user.id;

      const participantAccess =
        auth.user.role ===
          "participant" &&
        isParticipantLinked(
          journey,
          auth.user.email || ""
        );

      if (
        !facilitatorAccess &&
        !participantAccess
      ) {
        return c.json(
          {
            error:
              "You do not have permission to edit this board.",
          },
          403
        );
      }

      if (
        auth.user.role ===
          "participant" &&
        !canOpenSession(
          session,
          "participant"
        )
      ) {
        return c.json(
          {
            error:
              "This session is locked.",
            code:
              "SESSION_LOCKED",
          },
          403
        );
      }

      const { state } =
        await c.req.json();

      if (!state) {
        return c.json(
          {
            error:
              "Board state is required.",
          },
          400
        );
      }

      const participantId =
        auth.user.role === "participant"
          ? auth.user.id
          : await getLinkedParticipantId(journey);

      if (participantId) {
        await saveParticipantBoard(id, participantId, state);
      } else {
        await kv.set(getLegacyBoardKey(id), {
          ...state,
          updatedAt: new Date().toISOString(),
        });
      }

      return c.json({
        success: true,
      });
    } catch (error) {
      console.error(
        "[sessions/board/save]",
        error
      );

      return c.json(
        {
          error:
            String(error),
        },
        500
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS — STATUS
// ─────────────────────────────────────────────────────────────────────────────

app.put(
  `${P}/sessions/:id/status`,
  async c => {
    try {
      const auth =
        await requireAuth(c);

      if (!auth.ok) {
        return auth.response;
      }

      const sessionId =
        c.req.param("id");

      const { status } =
        await c.req.json();

      const session =
        await getSession(
          sessionId
        );

      if (!session) {
        return c.json(
          {
            error:
              "Session not found.",
          },
          404
        );
      }

      let journey =
        await getJourney(
          session.journeyId
        );

      if (!journey) {
        return c.json(
          {
            error:
              "Journey not found.",
          },
          404
        );
      }

      journey =
        await ensureJourneySessions(
          journey
        );

      const journeySession =
        getSessionFromJourney(
          journey,
          sessionId
        );

      if (!journeySession) {
        return c.json(
          {
            error:
              "Session is not part of this journey.",
          },
          400
        );
      }

      const currentStatus:
        SessionStatus =
        session.status;

      // ─────────────────────────────────────
      // PARTICIPANT
      // ─────────────────────────────────────

      if (
        auth.user.role ===
        "participant"
      ) {
        if (
          !isParticipantLinked(
            journey,
            auth.user.email || ""
          )
        ) {
          return c.json(
            {
              error:
                "You are not linked to this journey.",
            },
            403
          );
        }

        if (
          currentStatus ===
          "locked"
        ) {
          return c.json(
            {
              success: false,
              error:
                "This session is locked. The facilitator must enable it first.",
              code:
                "SESSION_LOCKED",
            },
            403
          );
        }

        if (
          status ===
          "completed"
        ) {
          return c.json(
            {
              success: false,
              error:
                "Only the facilitator can complete or end a session.",
              code:
                "FACILITATOR_ONLY",
            },
            403
          );
        }

        if (
          status !==
            "in_progress" &&
          status !==
            currentStatus
        ) {
          return c.json(
            {
              success: false,
              error:
                "Participants cannot change this session status.",
            },
            403
          );
        }

        const now =
          new Date().toISOString();

        session.status =
          "in_progress";

        session.startedAt =
          session.startedAt ||
          now;

        session.updatedAt =
          now;

        await saveSession(
          session
        );

        journeySession.status =
          "in_progress";

        journeySession.startedAt =
          journeySession.startedAt ||
          now;

        journeySession.updatedAt =
          now;

        await saveJourney(
          journey
        );

        return c.json({
          success: true,
          journey,
          session,
        });
      }

      // ─────────────────────────────────────
      // FACILITATOR
      // ─────────────────────────────────────

      if (
        auth.user.role !==
        "facilitator"
      ) {
        return c.json(
          {
            error:
              "Invalid user role.",
          },
          403
        );
      }

      if (
        journey.facilitatorId !==
        auth.user.id
      ) {
        return c.json(
          {
            error:
              "You can only manage your own journeys.",
          },
          403
        );
      }

      const requestedStatus:
        SessionStatus =
        status;

      if (
        ![
          "available",
          "in_progress",
          "completed",
          "locked",
        ].includes(
          requestedStatus
        )
      ) {
        return c.json(
          {
            error:
              "Invalid session status.",
          },
          400
        );
      }

      // ─────────────────────────────────────
      // ENABLE
      // ─────────────────────────────────────

      if (
        requestedStatus ===
        "available"
      ) {
        const sessionNumber =
          Number(
            session.sessionNumber
          );

        if (
          sessionNumber > 1
        ) {
          const previousSession =
            (
              journey.sessions ||
              []
            ).find(
              (item: any) =>
                Number(
                  item.number
                ) ===
                sessionNumber - 1
            );

          if (
            !previousSession ||
            previousSession.status !==
              "completed"
          ) {
            return c.json(
              {
                success: false,
                error:
                  `Session ${sessionNumber - 1} must be completed before Session ${sessionNumber} can be enabled.`,
                code:
                  "PREVIOUS_SESSION_NOT_COMPLETED",
              },
              400
            );
          }

          /*
           * Enforce the seven-day waiting period.
           */
          if (
            !previousSession.completedAt
          ) {
            return c.json(
              {
                success: false,
                error:
                  `Session ${sessionNumber - 1} is completed but has no completion timestamp. Session ${sessionNumber} cannot be enabled safely.`,
                code:
                  "PREVIOUS_SESSION_COMPLETION_TIME_MISSING",
              },
              400
            );
          }

          const availableAt =
            previousSession.availableAt ||
            getSessionAvailabilityDate(
              previousSession.completedAt
            );

          if (
            !isDateAvailable(
              availableAt
            )
          ) {
            return c.json(
              {
                success: false,

                error:
                  `Session ${sessionNumber} cannot be enabled yet. It becomes available after the required ${SESSION_WAIT_DAYS}-day waiting period.`,

                code:
                  "SESSION_WAIT_PERIOD",

                availableAt,
              },
              400
            );
          }

          session.availableAt =
            availableAt;
        }

        const now =
          new Date().toISOString();

        session.status =
          "available";

        session.updatedAt =
          now;

        journeySession.status =
          "available";

        journeySession.updatedAt =
          now;

        await saveSession(
          session
        );

        await saveJourney(
          journey
        );

        return c.json({
          success: true,
          journey,
          session,
        });
      }

      // ─────────────────────────────────────
      // START
      // ─────────────────────────────────────

      if (
        requestedStatus ===
        "in_progress"
      ) {
        if (
          session.status ===
          "locked"
        ) {
          return c.json(
            {
              success: false,
              error:
                "Session is locked. Enable it before starting.",
              code:
                "SESSION_LOCKED",
            },
            403
          );
        }

        const now =
          new Date().toISOString();

        session.status =
          "in_progress";

        session.startedAt =
          session.startedAt ||
          now;

        session.updatedAt =
          now;

        journeySession.status =
          "in_progress";

        journeySession.startedAt =
          journeySession.startedAt ||
          now;

        journeySession.updatedAt =
          now;

        await saveSession(
          session
        );

        await saveJourney(
          journey
        );

        return c.json({
          success: true,
          journey,
          session,
        });
      }

      // ─────────────────────────────────────
      // COMPLETE
      // ─────────────────────────────────────

      if (
        requestedStatus ===
        "completed"
      ) {
        console.log(
          `[sessions/status] Completing session ${sessionId} for facilitator ${auth.user.id}`
        );

        if (
          session.status ===
          "locked"
        ) {
          return c.json(
            {
              success: false,
              error:
                "A locked session cannot be completed.",
            },
            403
          );
        }

        const now =
          new Date().toISOString();

        session.status =
          "completed";

        session.completedAt =
          session.completedAt ||
          now;

        session.updatedAt =
          now;

        journeySession.status =
          "completed";

        journeySession.completedAt =
          session.completedAt;

        journeySession.updatedAt =
          now;

        const sessionNumber =
          Number(
            session.sessionNumber
          );

        /*
         * DO NOT automatically unlock the next session.
         *
         * Instead, schedule it seven days after this
         * session was completed.
         */
        if (
          sessionNumber < 4
        ) {
          const nextSession =
            (
              journey.sessions ||
              []
            ).find(
              (item: any) =>
                Number(
                  item.number
                ) ===
                sessionNumber + 1
            );

          if (
            nextSession
          ) {
            nextSession.status =
              "locked";

            nextSession.availableAt =
              getSessionAvailabilityDate(
                session.completedAt
              );

            const nextSessionRecord =
              await getSession(
                nextSession.id
              );

            if (
              nextSessionRecord
            ) {
              nextSessionRecord.status =
                "locked";

              nextSessionRecord.availableAt =
                nextSession.availableAt;

              nextSessionRecord.updatedAt =
                now;

              await saveSession(
                nextSessionRecord
              );
            }
          }

          journey.status =
            "active";
        } else {
          journey.status =
            "completed";
        }

        let completionStage = "session";

        try {
          await saveSession(session);

          completionStage = "journey";
          await saveJourney(journey);
        } catch (persistenceError) {
          console.error(
            "[sessions/status] Completion persistence failed",
            {
              sessionId,
              facilitatorId: auth.user.id,
              journeyId: session.journeyId,
              stage: completionStage,
              error: persistenceError,
            }
          );

          return c.json(
            {
              success: false,
              error: "The session could not be saved as completed.",
              code: "SESSION_COMPLETION_PERSISTENCE_FAILED",
            },
            500
          );
        }

        const [persistedSession, persistedJourney] =
          await Promise.all([
            getSession(sessionId),
            getJourney(session.journeyId),
          ]);

        if (
          !persistedSession ||
          persistedSession.status !== "completed" ||
          !persistedJourney ||
          getSessionFromJourney(persistedJourney, sessionId)?.status !==
            "completed"
        ) {
          console.error(
            "[sessions/status] Completion verification failed",
            {
              sessionId,
              facilitatorId: auth.user.id,
              journeyId: session.journeyId,
              persistedSessionStatus: persistedSession?.status,
              persistedJourneySessionStatus:
                getSessionFromJourney(persistedJourney, sessionId)?.status,
            }
          );

          return c.json(
            {
              success: false,
              error: "The session could not be confirmed as completed.",
              code: "SESSION_COMPLETION_NOT_PERSISTED",
            },
            500
          );
        }

        /*
         * Completion is authoritative once the session and journey are
         * persisted. Report delivery is intentionally handled separately
         * by the report endpoint so an email provider failure cannot turn a
         * successful completion into a failed request.
         */
        return c.json({
          success: true,
          journey,
          session: persistedSession,
          reportEmail: {
            sent: false,
            results: [],
          },
        });

        // ─────────────────────────────────
        // REPORT EMAIL
        // ─────────────────────────────────

        let reportEmailResult:
          any = null;

        /*
         * Session completion from the facilitator
         * emails the participant(s).
         *
         * Each participant gets their own board/report.
         */
        const participantEmails =
          new Set<string>();

        if (
          journey.participantEmail
        ) {
          participantEmails.add(
            normalizeEmail(
              journey.participantEmail
            )
          );
        }

        for (
          const participant of
          journey.participants ||
          []
        ) {
          const email =
            normalizeEmail(
              participant?.email
            );

          if (email) {
            participantEmails.add(
              email
            );
          }
        }

        const emailResults: any[] =
          [];

        for (
          const participantEmail of
          participantEmails
        ) {
          try {
            /*
             * Find the participant's actual Supabase
             * user ID so the report uses that participant's
             * isolated board.
             */
            const participantEntries =
              await kv.getEntriesByPrefix(
                "user:"
              );

            let participantUserId:
              string | null =
              null;

            for (
              const entry of
              participantEntries
            ) {
              if (
                normalizeEmail(
                  entry.value?.email
                ) ===
                participantEmail &&
                entry.value?.role ===
                  "participant"
              ) {
                participantUserId =
                  entry.value?.id ||
                  entry.key.replace(
                    "user:",
                    ""
                  );

                break;
              }
            }

            let board =
              {};

            if (
              participantUserId
            ) {
              board =
                (await getParticipantBoard(
                  sessionId,
                  participantUserId,
                  sessionNumber
                )) || {};
            } else {
              /*
               * If the participant has not created a user
               * account yet, fall back to the legacy board.
               */
              board =
                (await kv.get(
                  getLegacyBoardKey(
                    sessionId
                  )
                )) || {};
            }

            const report =
              await buildSessionReport(
                session,
                journey,
                board,
                participantEmail
              );

            const pdf =
              createPdf(
                report.lines
              );

            const base64 =
              uint8ToBase64(
                pdf
              );

            const result =
              await sendEmail({
                to:
                  participantEmail,

                subject:
                  `Your Zest Journey Session ${session.sessionNumber} Report`,

                html:
                  emailLayout(`
                    <h1 style="
                      margin:0 0 16px;
                      color:#4A1C5C;
                      font-size:28px;
                    ">
                      Your session is complete
                    </h1>

                    <p style="
                      font-size:16px;
                      line-height:1.7;
                    ">
                      Congratulations on completing
                      <strong>
                        Session ${session.sessionNumber}
                        —
                        ${escapeHtml(
                          report.sessionName
                        )}
                      </strong>.
                    </p>

                    <p style="
                      font-size:16px;
                      line-height:1.7;
                    ">
                      Your personal session report is attached to this email.
                    </p>

                    <p style="margin-top:28px;">
                      Warmly,<br>
                      <strong>Zuva Life</strong>
                    </p>
                  `),

                attachments: [
                  {
                    filename:
                      report.filename,

                    content:
                      base64,

                    content_type:
                      "application/pdf",
                  },
                ],
              });

            emailResults.push({
              email:
                participantEmail,

              sent:
                Boolean(
                  result.success
                ),

              error:
                result.success
                  ? null
                  : result.error,
            });
          } catch (
            emailError
          ) {
            emailResults.push({
              email:
                participantEmail,

              sent:
                false,

              error:
                String(
                  emailError
                ),
            });
          }
        }

        reportEmailResult =
          emailResults;

        return c.json({
          success: true,

          journey,

          session,

          reportEmail: {
            sent:
              emailResults.some(
                item =>
                  item.sent
              ),

            results:
              reportEmailResult,
          },
        });
      }

      // ─────────────────────────────────────
      // LOCK
      // ─────────────────────────────────────

      if (
        requestedStatus ===
        "locked"
      ) {
        if (
          session.status ===
          "completed"
        ) {
          return c.json(
            {
              success: false,
              error:
                "A completed session cannot be locked again.",
            },
            400
          );
        }

        const now =
          new Date().toISOString();

        session.status =
          "locked";

        session.updatedAt =
          now;

        journeySession.status =
          "locked";

        journeySession.updatedAt =
          now;

        await saveSession(
          session
        );

        await saveJourney(
          journey
        );

        return c.json({
          success: true,
          journey,
          session,
        });
      }

      return c.json(
        {
          success: false,
          error:
            "Unsupported session status operation.",
        },
        400
      );
    } catch (error) {
      console.error(
        "[sessions/status] Completion request failed:",
        error
      );

      return c.json(
        {
          success: false,
          error:
            String(error),
        },
        500
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// FACILITATOR ENABLE NEXT SESSION
// ─────────────────────────────────────────────────────────────────────────────

app.post(
  `${P}/journeys/:journeyId/sessions/:sessionNumber/enable`,
  async c => {
    try {
      const auth =
        await requireRole(
          c,
          "facilitator"
        );

      if (!auth.ok) {
        return auth.response;
      }

      const journeyId =
        c.req.param(
          "journeyId"
        );

      const sessionNumber =
        normalizeSessionNumber(
          c.req.param(
            "sessionNumber"
          )
        );

      if (!sessionNumber) {
        return c.json(
          {
            error:
              "Invalid session number.",
          },
          400
        );
      }

      let journey =
        await getJourney(
          journeyId
        );

      if (!journey) {
        return c.json(
          {
            error:
              "Journey not found.",
          },
          404
        );
      }

      if (
        journey.facilitatorId !==
        auth.user.id
      ) {
        return c.json(
          {
            error:
              "You can only manage your own journeys.",
          },
          403
        );
      }

      journey =
        await ensureJourneySessions(
          journey
        );

      const target =
        journey.sessions.find(
          (s: any) =>
            Number(
              s.number
            ) ===
            sessionNumber
        );

      if (!target) {
        return c.json(
          {
            error:
              "Session not found.",
          },
          404
        );
      }

      if (
        target.status ===
        "completed"
      ) {
        return c.json(
          {
            error:
              "This session is already completed.",
          },
          400
        );
      }

      /*
       * Session 1 does not need a previous session.
       */
      if (
        sessionNumber > 1
      ) {
        const previous =
          journey.sessions.find(
            (s: any) =>
              Number(
                s.number
              ) ===
              sessionNumber - 1
          );

        if (
          !previous ||
          previous.status !==
            "completed"
        ) {
          return c.json(
            {
              success: false,
              error:
                `Session ${sessionNumber - 1} must be completed before Session ${sessionNumber} can be enabled.`,
              code:
                "PREVIOUS_SESSION_NOT_COMPLETED",
            },
            400
          );
        }

        if (
          !previous.completedAt
        ) {
          return c.json(
            {
              success: false,
              error:
                `Session ${sessionNumber - 1} does not have a completion timestamp.`,
              code:
                "PREVIOUS_SESSION_COMPLETION_TIME_MISSING",
            },
            400
          );
        }

        const availableAt =
          previous.availableAt ||
          getSessionAvailabilityDate(
            previous.completedAt
          );

        if (
          !isDateAvailable(
            availableAt
          )
        ) {
          return c.json(
            {
              success: false,

              error:
                `Session ${sessionNumber} is not available yet. The seven-day waiting period ends on ${new Date(
                  availableAt
                ).toISOString()}.`,

              code:
                "SESSION_WAIT_PERIOD",

              availableAt,
            },
            400
          );
        }

        target.availableAt =
          availableAt;
      }

      const now =
        new Date().toISOString();

      target.status =
        "available";

      const session =
        await getSession(
          target.id
        );

      if (session) {
        session.status =
          "available";

        session.availableAt =
          target.availableAt ||
          session.availableAt ||
          now;

        session.updatedAt =
          now;

        await saveSession(
          session
        );
      }

      await saveJourney(
        journey
      );

      return c.json({
        success: true,

        journey,

        session:
          session ||
          target,
      });
    } catch (error) {
      console.error(
        "[sessions/enable]",
        error
      );

      return c.json(
        {
          success: false,
          error:
            String(error),
        },
        500
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// REPORT — DOWNLOAD
// ─────────────────────────────────────────────────────────────────────────────

app.get(
  `${P}/sessions/:id/report`,
  async c => {
    try {
      const auth =
        await requireAuth(c);

      if (!auth.ok) {
        return auth.response;
      }

      const sessionId =
        c.req.param("id");

      const session =
        await getSession(
          sessionId
        );

      if (!session) {
        return c.json(
          {
            error:
              "Session not found.",
          },
          404
        );
      }

      const journey =
        await getJourney(
          session.journeyId
        );

      if (!journey) {
        return c.json(
          {
            error:
              "Journey not found.",
          },
          404
        );
      }

      const allowed =
        (
          auth.user.role ===
            "facilitator" &&
          journey.facilitatorId ===
            auth.user.id
        ) ||
        (
          auth.user.role ===
            "participant" &&
          isParticipantLinked(
            journey,
            auth.user.email || ""
          )
        );

      if (!allowed) {
        return c.json(
          {
            error:
              "You do not have access to this report.",
          },
          403
        );
      }

      if (
        session.status !==
        "completed"
      ) {
        return c.json(
          {
            error:
              "Reports are only available for completed sessions.",
          },
          400
        );
      }

      let board =
        {};

      let participantEmail:
        string | undefined;

      if (
        auth.user.role ===
        "participant"
      ) {
        participantEmail =
          normalizeEmail(
            auth.user.email || ""
          );

        board =
          (await getParticipantBoard(
            sessionId,
            auth.user.id,
            Number(
              session.sessionNumber
            )
          )) || {};
      } else {
        board =
          (await kv.get(
            getLegacyBoardKey(
              sessionId
            )
          )) || {};
      }

      const report =
        await buildSessionReport(
          session,
          journey,
          board,
          participantEmail
        );

      const pdf =
        createPdf(
          report.lines
        );

      return new Response(
        pdf,
        {
          status: 200,

          headers: {
            "Content-Type":
              "application/pdf",

            "Content-Disposition":
              `attachment; filename="${report.filename}"`,

            "Cache-Control":
              "no-store",
          },
        }
      );
    } catch (error) {
      console.error(
        "[report/download]",
        error
      );

      return c.json(
        {
          error:
            String(error),
        },
        500
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// REPORT — EMAIL
// ─────────────────────────────────────────────────────────────────────────────

app.post(
  `${P}/sessions/:id/report/email`,
  async c => {
    try {
      const auth =
        await requireAuth(c);

      if (!auth.ok) {
        return auth.response;
      }

      const sessionId =
        c.req.param("id");

      const session =
        await getSession(
          sessionId
        );

      if (!session) {
        return c.json(
          {
            error:
              "Session not found.",
          },
          404
        );
      }

      const journey =
        await getJourney(
          session.journeyId
        );

      if (!journey) {
        return c.json(
          {
            error:
              "Journey not found.",
          },
          404
        );
      }

      const allowed =
        (
          auth.user.role ===
            "facilitator" &&
          journey.facilitatorId ===
            auth.user.id
        ) ||
        (
          auth.user.role ===
            "participant" &&
          isParticipantLinked(
            journey,
            auth.user.email || ""
          )
        );

      if (!allowed) {
        return c.json(
          {
            error:
              "You do not have access to this report.",
          },
          403
        );
      }

      if (
        session.status !==
        "completed"
      ) {
        return c.json(
          {
            error:
              "Only completed sessions can be emailed.",
          },
          400
        );
      }

      /*
       * Participant:
       * send only their own report.
       *
       * Facilitator:
       * retain existing behavior of emailing the
       * linked participants.
       */
      if (
        auth.user.role ===
        "participant"
      ) {
        const participantEmail =
          normalizeEmail(
            auth.user.email || ""
          );

        const board =
          (await getParticipantBoard(
            sessionId,
            auth.user.id,
            Number(
              session.sessionNumber
            )
          )) || {};

        const report =
          await buildSessionReport(
            session,
            journey,
            board,
            participantEmail
          );

        const pdf =
          createPdf(
            report.lines
          );

        const base64 =
          uint8ToBase64(
            pdf
          );

        const result =
          await sendEmail({
            to:
              participantEmail,

            subject:
              `Your Zest Journey Session ${session.sessionNumber} Report`,

            html:
              emailLayout(`
                <h1 style="
                  margin:0 0 16px;
                  color:#4A1C5C;
                  font-size:28px;
                ">
                  Your session report is ready
                </h1>

                <p style="
                  font-size:16px;
                  line-height:1.7;
                ">
                  Your completed
                  <strong>
                    Session ${session.sessionNumber}
                    —
                    ${escapeHtml(
                      report.sessionName
                    )}
                  </strong>
                  report is ready.
                </p>

                <p style="
                  font-size:16px;
                  line-height:1.7;
                ">
                  We've attached your session report as a PDF.
                </p>

                <p style="
                  font-size:15px;
                  color:#6B625D;
                ">
                  Warmly,<br>
                  <strong>Zuva Life</strong>
                </p>
              `),

            attachments: [
              {
                filename:
                  report.filename,

                content:
                  base64,

                content_type:
                  "application/pdf",
              },
            ],
          });

        if (!result.success) {
          return c.json(
            {
              success: false,
              error:
                result.error ||
                "Failed to send report email.",

              email:
                participantEmail,
            },
            500
          );
        }

        return c.json({
          success: true,

          message:
            "Session report emailed successfully.",

          email:
            participantEmail,
        });
      }

      /*
       * Facilitator request.
       *
       * If participantEmail is supplied in the body,
       * email only that participant.
       *
       * Otherwise email all linked participants.
       */
      const body =
        await c.req.json().catch(
          () => ({})
        );

      const requestedParticipantEmail =
        normalizeEmail(
          body?.participantEmail
        );

      const participantEmails =
        new Set<string>();

      if (
        requestedParticipantEmail
      ) {
        if (
          !isParticipantLinked(
            journey,
            requestedParticipantEmail
          )
        ) {
          return c.json(
            {
              error:
                "The requested participant is not linked to this journey.",
            },
            403
          );
        }

        participantEmails.add(
          requestedParticipantEmail
        );
      } else {
        if (
          journey.participantEmail
        ) {
          participantEmails.add(
            normalizeEmail(
              journey.participantEmail
            )
          );
        }

        for (
          const participant of
          journey.participants ||
          []
        ) {
          const email =
            normalizeEmail(
              participant?.email
            );

          if (email) {
            participantEmails.add(
              email
            );
          }
        }
      }

      if (
        participantEmails.size ===
        0
      ) {
        return c.json(
          {
            error:
              "No participant email found.",
          },
          400
        );
      }

      const results: any[] =
        [];

      /*
       * Resolve each participant's user ID so the
       * correct participant-specific board is used.
       */
      const participantEntries =
        await kv.getEntriesByPrefix(
          "user:"
        );

      for (
        const participantEmail of
        participantEmails
      ) {
        try {
          let participantUserId:
            string | null =
            null;

          for (
            const entry of
            participantEntries
          ) {
            if (
              normalizeEmail(
                entry.value?.email
              ) ===
                participantEmail &&
              entry.value?.role ===
                "participant"
            ) {
              participantUserId =
                entry.value?.id ||
                entry.key.replace(
                  "user:",
                  ""
                );

              break;
            }
          }

          let board =
            {};

          if (
            participantUserId
          ) {
            board =
              (await getParticipantBoard(
                sessionId,
                participantUserId,
                Number(
                  session.sessionNumber
                )
              )) || {};
          } else {
            board =
              (await kv.get(
                getLegacyBoardKey(
                  sessionId
                )
              )) || {};
          }

          const report =
            await buildSessionReport(
              session,
              journey,
              board,
              participantEmail
            );

          const pdf =
            createPdf(
              report.lines
            );

          const base64 =
            uint8ToBase64(
              pdf
            );

          const result =
            await sendEmail({
              to:
                participantEmail,

              subject:
                `Your Zest Journey Session ${session.sessionNumber} Report`,

              html:
                emailLayout(`
                  <h1 style="
                    margin:0 0 16px;
                    color:#4A1C5C;
                    font-size:28px;
                  ">
                    Your session report is ready
                  </h1>

                  <p style="
                    font-size:16px;
                    line-height:1.7;
                  ">
                    Your completed
                    <strong>
                      Session ${session.sessionNumber}
                      —
                      ${escapeHtml(
                        report.sessionName
                      )}
                    </strong>
                    report is ready.
                  </p>

                  <p style="
                    font-size:16px;
                    line-height:1.7;
                  ">
                    We've attached your session report as a PDF.
                  </p>

                  <p style="
                    font-size:15px;
                    color:#6B625D;
                  ">
                    Warmly,<br>
                    <strong>Zuva Life</strong>
                  </p>
                `),

              attachments: [
                {
                  filename:
                    report.filename,

                  content:
                    base64,

                  content_type:
                    "application/pdf",
                },
              ],
            });

          results.push({
            email:
              participantEmail,

            sent:
              Boolean(
                result.success
              ),

            error:
              result.success
                ? null
                : result.error,
          });
        } catch (
          error
        ) {
          results.push({
            email:
              participantEmail,

            sent:
              false,

            error:
              String(error),
          });
        }
      }

      return c.json({
        success:
          results.some(
            result =>
              result.sent
          ),

        message:
          "Session report email processing completed.",

        results,
      });
    } catch (error) {
      console.error(
        "[report/email]",
        error
      );

      return c.json(
        {
          success: false,
          error:
            String(error),
        },
        500
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — CLEANUP TEST DATA
// ─────────────────────────────────────────────────────────────────────────────

app.delete(
  `${P}/admin/cleanup-test-data`,
  async c => {
    try {
      const cleanupToken =
        Deno.env.get(
          "CLEANUP_TOKEN"
        );

      const providedToken =
        c.req.header(
          "X-Cleanup-Token"
        ) ?? "";

      if (
        !cleanupToken ||
        !providedToken ||
        providedToken !==
          cleanupToken
      ) {
        return c.json(
          {
            error:
              "Unauthorized.",
          },
          401
        );
      }

      const journeyEntries =
        await kv.getEntriesByPrefix(
          "journey:"
        );

      const sessionEntries =
        await kv.getEntriesByPrefix(
          "session:"
        );

      const boardEntries =
        await kv.getEntriesByPrefix(
          "board:"
        );

      const facilitatorEntries =
        await kv.getEntriesByPrefix(
          "facilitator:"
        );

      const participantEntries =
        await kv.getEntriesByPrefix(
          "participant_email:"
        );

      const deleteIfAny =
        async (
          entries: any[]
        ) => {
          const keys =
            entries.map(
              entry =>
                entry.key
            );

          if (
            keys.length > 0
          ) {
            await kv.mdel(
              keys
            );
          }

          return keys.length;
        };

      const deleted = {
        journeys:
          await deleteIfAny(
            journeyEntries
          ),

        sessions:
          await deleteIfAny(
            sessionEntries
          ),

        boards:
          await deleteIfAny(
            boardEntries
          ),

        facilitatorIndexes:
          await deleteIfAny(
            facilitatorEntries
          ),

        participantIndexes:
          await deleteIfAny(
            participantEntries
          ),
      };

      return c.json({
        success: true,
        deleted,
      });
    } catch (error) {
      console.error(
        "[cleanup]",
        error
      );

      return c.json(
        {
          success: false,
          error:
            String(error),
        },
        500
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(
  app.fetch
);