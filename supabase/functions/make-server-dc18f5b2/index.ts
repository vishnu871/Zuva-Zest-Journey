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
  authMetadataRole?: unknown;
  databaseUserId?: string;
  databaseRole?: unknown;
}

type AuthResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; response: any };

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

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
    } else {
      role =
        "participant";
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

      // Diagnostic context for protected authorization paths. These values
      // are derived server-side; no client-provided identity is trusted.
      authMetadataRole:
        metadataRole,

      databaseUserId:
        typeof userData?.id === "string"
          ? userData.id
          : undefined,

      databaseRole:
        kvRole,
    };
  } catch (error) {
    console.error(
      "[auth] Failed to authenticate:",
      error
    );

    return null;
  }
}

async function requireAuth(c: any): Promise<AuthResult> {
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
): Promise<AuthResult> {
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

async function ensureFacilitatorJourneyIndex(
  journey: any
) {
  if (!journey || !journey.id) return;

  if (journey.facilitatorId) {
    const key = `facilitator:${journey.facilitatorId}:journeys`;
    const ids: string[] = (await kv.get(key)) || [];
    if (!ids.includes(journey.id)) {
      ids.push(journey.id);
      await kv.set(key, ids);
    }
  }

  const email = normalizeEmail(journey.facilitatorEmail);
  if (email) {
    const emailKey = `facilitator_email:${email}:journeys`;
    const emailIds: string[] = (await kv.get(emailKey)) || [];
    if (!emailIds.includes(journey.id)) {
      emailIds.push(journey.id);
      await kv.set(emailKey, emailIds);
    }
  }
}

async function saveJourney(
  journey: any
) {
  await kv.set(
    `journey:${journey.id}`,
    journey
  );
  await ensureFacilitatorJourneyIndex(journey);
  await ensureParticipantJourneyIndex(journey);
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

async function saveWithRetry(
  label: string,
  operation: () => Promise<void>
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await operation();
      return;
    } catch (error) {
      lastError = error;
      console.error(
        `[persistence] ${label} failed (attempt ${attempt}/2)`,
        error
      );
    }
  }

  throw lastError;
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

function isFacilitatorForJourney(
  journey: any,
  user: AuthenticatedUser
) {
  const ownsById =
    typeof journey?.facilitatorId === "string" &&
    journey.facilitatorId === user.id;

  const ownsByEmail =
    Boolean(user.email) &&
    normalizeEmail(journey?.facilitatorEmail) ===
      normalizeEmail(user.email);

  if (ownsByEmail && !journey?.facilitatorId && typeof user.id === "string") {
    journey.facilitatorId = user.id;
  }

  return ownsById || ownsByEmail;
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

  if (!normalized) {
    return false;
  }

  if (
    normalizeEmail(
      journey?.participantEmail
    ) === normalized
  ) {
    return true;
  }

  const participants =
    Array.isArray(
      journey?.participants
    )
      ? journey.participants
      : [];

  const linked =
    participants.some(
      (participant: any) => {
        const participantEmail =
          typeof participant === "string"
            ? participant
            : (participant?.email || "");
        return (
          normalizeEmail(
            participantEmail
          ) === normalized
        );
      }
    );

  if (linked) {
    return true;
  }

  try {
    const raw = JSON.stringify(journey?.participants || []) + " " + String(journey?.participantEmail || "");
    if (raw.toLowerCase().includes(normalized)) {
      return true;
    }
  } catch {}

  return false;
}

function getParticipantRecord(
  journey: any,
  email: string
) {
  const normalized =
    normalizeEmail(email);

  const participant =
    (
      journey?.participants || []
    ).find(
      (item: any) => {
        const itemEmail =
          typeof item === "string"
            ? item
            : (item?.email || "");
        return (
          normalizeEmail(
            itemEmail
          ) === normalized
        );
      }
    );

  return participant || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICIPANT INDEX
// ─────────────────────────────────────────────────────────────────────────────

async function ensureParticipantJourneyIndex(
  journey: any
) {
  if (!journey || !journey.id) return;

  const emails =
    new Set<string>();

  if (journey.participantEmail) {
    const e = normalizeEmail(journey.participantEmail);
    if (e) emails.add(e);
  }

  for (
    const participant of
    journey.participants || []
  ) {
    const email =
      normalizeEmail(
        typeof participant === "string"
          ? participant
          : participant?.email
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
        session.availableAt = null;
        changed = true;
      }

      if (
        sessionItem.status !==
        session.status ||
        sessionItem.completedAt !==
        session.completedAt ||
        sessionItem.availableAt !==
        session.availableAt
      ) {
        sessionItem.status =
          session.status;
        sessionItem.completedAt =
          session.completedAt;
        sessionItem.availableAt =
          session.availableAt;
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
      "available" ||
    session.status ===
      "in_progress" ||
    session.status ===
      "completed"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// PDF GENERATOR & STRUCTURED SESSION REPORT
// ─────────────────────────────────────────────────────────────────────────────

function pdfEscape(value: string): string {
  if (!value) return "";
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, (ch) => {
      if (ch === "—" || ch === "–") return " - ";
      if (ch === "•") return "*";
      if (ch === "’" || ch === "‘") return "'";
      if (ch === "“" || ch === "”") return '"';
      if (ch === "…") return "...";
      if (ch === "·") return "-";
      if (ch === "✓") return "[x]";
      return "";
    });
}

function wrapPdfText(text: string, maxChars = 75): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!word) continue;
    if ((current + " " + word).trim().length <= maxChars) {
      current = (current + " " + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface ReportItem {
  type: "bullet" | "callout" | "keyvalue" | "text";
  label?: string;
  text: string;
}

interface ReportSection {
  title: string;
  color: "purple" | "teal" | "gold" | "rust";
  items: ReportItem[];
}

interface StructuredReportData {
  journeyTitle: string;
  sessionNumber: number;
  sessionTitle: string;
  participant: string;
  status: string;
  completedDate: string;
  generatedDate: string;
  sections: ReportSection[];
  filename: string;
}

const ALL_CARDS_MAP: Record<string, { label: string; desc?: string }> = {
  // Identity Cards (Session 1 Step 1 & Step 4)
  friend: { label: "Friend / Companion", desc: "Connection, loyalty & shared life" },
  athlete: { label: "Athlete / Active", desc: "Vitality, movement & physical discipline" },
  professional: { label: "Professional", desc: "Career, craft & domain mastery" },
  mentor: { label: "Mentor / Guide", desc: "Guidance, wisdom & developing others" },
  creative: { label: "Creative Soul", desc: "Art, ideas & authentic self-expression" },
  activist: { label: "Activist", desc: "Justice, purpose & driving positive change" },
  philanthropist: { label: "Philanthropist", desc: "Generosity, legacy & giving back" },
  parent: { label: "Parent / Grandparent", desc: "Nurturing family & lineage" },
  community_leader: { label: "Community Leader", desc: "Civic impact & community service" },
  explorer: { label: "Explorer / Adventurer", desc: "Curiosity, discovery & new horizons" },
  entrepreneur: { label: "Entrepreneur", desc: "Building ventures & innovation" },
  caregiver: { label: "Caregiver / Nurturer", desc: "Support, healing & caring presence" },
  spiritual: { label: "Spiritual Seeker", desc: "Faith, inner life & deeper meaning" },
  learner: { label: "Lifelong Learner", desc: "Knowledge, skills & personal growth" },
  artist: { label: "Artist / Creator", desc: "Creation, aesthetics & artistic voice" },
  nature: { label: "Nature Lover", desc: "Ecology, outdoors & connection to earth" },

  // Role Cards (Session 1 Step 4, 5, 6)
  venture_builder: { label: "Learning / Venture Builder", desc: "Designing & launching initiatives" },
  volunteer: { label: "Volunteer", desc: "Hands-on community contribution" },
  advisor: { label: "Strategic Advisor", desc: "Providing high-level counsel & guidance" },
  mentor_role: { label: "Mentor", desc: "Nurturing and developing emerging talent" },
  board_member: { label: "Board Member", desc: "Governance, strategy & fiduciary leadership" },
  executive_coach: { label: "Executive Coach", desc: "Facilitating leadership breakthroughs" },
  author: { label: "Author / Writer", desc: "Sharing insights & thought leadership" },
  consultant: { label: "Independent Consultant", desc: "Solving complex organizational challenges" },
  social_entrepreneur: { label: "Social Entrepreneur", desc: "Mission-driven innovation & impact" },
  speaker: { label: "Speaker / Facilitator", desc: "Inspiring, teaching & engaging groups" },
  visiting_faculty: { label: "Visiting Faculty", desc: "Academic teaching & thought leadership" },

  // Chapters (Book of Life)
  childhood: { label: "Childhood & Early Roots", desc: "Formative upbringing & foundation" },
  education: { label: "Education & Formative Learning", desc: "Early schooling & skill-building" },
  early_career: { label: "Early Career Foundations", desc: "First professional milestones" },
  leadership: { label: "Leadership & Growth", desc: "Taking on leadership & responsibility" },
  personal_crossroads: { label: "Personal Crossroads & Pivots", desc: "Significant transitions & turning points" },
  peak_achievement: { label: "Peak Professional Achievement", desc: "Major milestones & accomplishments" },
  pause_reflection: { label: "Sabbatical & Pause", desc: "Time away & deep reflection" },
  reinvention: { label: "Reinvention & Next Horizon", desc: "Stepping into future chapters" },
};

function getCardInfo(id: string): { label: string; desc: string } {
  if (ALL_CARDS_MAP[id]) {
    return {
      label: ALL_CARDS_MAP[id].label,
      desc: ALL_CARDS_MAP[id].desc || "",
    };
  }
  return {
    label: id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    desc: "",
  };
}

function parseSession1Report(board: any): ReportSection[] {
  const sections: ReportSection[] = [];

  // Step 1: Book of Life
  const rawCards = board?.step1?.selectedCards || [];
  const chapters = Array.isArray(rawCards)
    ? rawCards.map((id: string) => {
        const info = getCardInfo(id);
        return info.desc ? `${info.label} (${info.desc})` : info.label;
      })
    : [];

  if (chapters.length > 0) {
    sections.push({
      title: "Step 1: Book of Life — Life Chapters",
      color: "purple",
      items: chapters.map((ch) => ({ type: "bullet", text: ch })),
    });
  }

  // Step 2: Exit Bin
  const exitNotes = Array.isArray(board?.step2?.exitNotes)
    ? board.step2.exitNotes
        .map((n: any) => (typeof n === "string" ? n : n?.text))
        .filter(Boolean)
    : [];

  if (exitNotes.length > 0) {
    sections.push({
      title: "Step 2: Exit Bin — What I Am Letting Go",
      color: "rust",
      items: exitNotes.map((note: string) => ({ type: "bullet", text: note })),
    });
  }

  // Step 3: Discovery Landscape
  const discNotes = Array.isArray(board?.step3?.stickyNotes)
    ? board.step3.stickyNotes
        .map((n: any) => ({
          text: typeof n === "string" ? n : n?.text,
          zone: n?.zone || n?.category,
        }))
        .filter((n: any) => Boolean(n.text))
    : [];

  if (discNotes.length > 0) {
    sections.push({
      title: "Step 3: Discovery Landscape — Forward Pull",
      color: "teal",
      items: discNotes.map((n: any) => ({
        type: "bullet",
        label: n.zone ? n.zone.toUpperCase() : undefined,
        text: n.text,
      })),
    });
  }

  // Step 4: Deck of Recognition
  const selectedRoles = Array.isArray(board?.step4?.selectedRoles) ? board.step4.selectedRoles : [];
  if (selectedRoles.length > 0) {
    sections.push({
      title: "Step 4: Deck of Recognition — Chosen Identities",
      color: "purple",
      items: selectedRoles.map((rId: string) => {
        const info = getCardInfo(rId);
        return {
          type: "bullet",
          label: info.label,
          text: info.desc ? `— ${info.desc}` : "",
        };
      }),
    });
  }

  // Step 5: Dinner Table
  const roleNotes = board?.step5?.roleNotes || {};
  const tableEntries: { label: string; text: string }[] = [];
  Object.entries(roleNotes).forEach(([roleId, notes]: [string, any]) => {
    const rName = getCardInfo(roleId).label;
    if (Array.isArray(notes)) {
      notes.forEach((note: any) => {
        const text = typeof note === "string" ? note : note?.text;
        if (text) tableEntries.push({ label: rName, text });
      });
    }
  });

  if (tableEntries.length > 0) {
    sections.push({
      title: "Step 5: Dinner Table — Identity Conversations",
      color: "gold",
      items: tableEntries.map((entry) => ({
        type: "bullet",
        label: entry.label,
        text: entry.text,
      })),
    });
  }

  // Step 6: Grounding vs Draining
  const roleZones = board?.step6?.roleZones || {};
  const groundingRoles: string[] = [];
  const drainingRoles: string[] = [];
  Object.entries(roleZones).forEach(([roleId, zone]: [string, any]) => {
    const rName = getCardInfo(roleId).label;
    if (zone === "grounding") groundingRoles.push(rName);
    else if (zone === "draining") drainingRoles.push(rName);
  });

  if (groundingRoles.length > 0 || drainingRoles.length > 0) {
    const zoneItems: ReportItem[] = [];
    if (groundingRoles.length > 0) {
      zoneItems.push({
        type: "keyvalue",
        label: "GROUNDING (Energizing)",
        text: groundingRoles.join(", "),
      });
    }
    if (drainingRoles.length > 0) {
      zoneItems.push({
        type: "keyvalue",
        label: "DRAINING (Depleting)",
        text: drainingRoles.join(", "),
      });
    }
    sections.push({
      title: "Step 6: Grounding vs Draining Energy Map",
      color: "teal",
      items: zoneItems,
    });
  }

  // Step 7: Recognition Word
  const recWords = Array.isArray(board?.step7?.recognitionWords) ? board.step7.recognitionWords : [];
  const wordItems = recWords
    .map((item: any) => {
      if (typeof item === "string") return item;
      const word = item?.word || item?.text || "";
      const role = item?.roleName || (item?.roleId ? getCardInfo(item.roleId).label : "");
      return word ? `${word}${role ? ` (${role})` : ""}` : "";
    })
    .filter(Boolean);

  if (wordItems.length > 0) {
    sections.push({
      title: "Step 7: Recognition Word — Unifying Anchor",
      color: "gold",
      items: wordItems.map((w: string) => ({
        type: "callout",
        label: "Anchor Recognition Word",
        text: w,
      })),
    });
  }

  return sections;
}

function parseSession2Report(board: any): ReportSection[] {
  const sections: ReportSection[] = [];

  const s1Notes = Array.isArray(board?.step1?.notes)
    ? board.step1.notes.map((n: any) => (typeof n === "string" ? n : n?.text)).filter(Boolean)
    : [];
  if (s1Notes.length > 0) {
    sections.push({
      title: "Step 1: Re-Entry Reflections",
      color: "teal",
      items: s1Notes.map((text: string) => ({ type: "bullet", text })),
    });
  }

  const selectedIds = Array.isArray(board?.step2?.selectedIdentities) ? board.step2.selectedIdentities : [];
  if (selectedIds.length > 0) {
    sections.push({
      title: "Step 2: Selected Identities to Explore",
      color: "purple",
      items: selectedIds.map((id: string) => ({
        type: "bullet",
        text: id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      })),
    });
  }

  const idANotes = Array.isArray(board?.step3?.notes)
    ? board.step3.notes.map((n: any) => (typeof n === "string" ? n : n?.text)).filter(Boolean)
    : [];
  const idALevel = board?.step4?.level;
  const gridA = board?.step5 || {};
  const idAItems: ReportItem[] = [];
  if (idANotes.length > 0) {
    idAItems.push({ type: "keyvalue", label: "Bridge (What draws you in)", text: idANotes.join("; ") });
  }
  if (idALevel !== null && idALevel !== undefined) {
    idAItems.push({ type: "keyvalue", label: "Energy Thermometer", text: `Level ${idALevel} / 10` });
  }
  if (gridA.assets?.length || gridA.customAssets?.length) {
    const assets = [...(gridA.assets || []), ...(gridA.customAssets || [])];
    idAItems.push({ type: "keyvalue", label: "Assets & Strengths", text: assets.join(", ") });
  }
  if (gridA.actions?.length) {
    idAItems.push({ type: "keyvalue", label: "Concrete Actions", text: gridA.actions.map((a: any) => typeof a === "string" ? a : a.text).join(", ") });
  }
  if (gridA.challenges?.length) {
    idAItems.push({ type: "keyvalue", label: "Real Challenges", text: gridA.challenges.map((c: any) => typeof c === "string" ? c : c.text).join(", ") });
  }
  if (idAItems.length > 0) {
    sections.push({
      title: "Identity A: Life Reality Exploration",
      color: "teal",
      items: idAItems,
    });
  }

  const idBNotes = Array.isArray(board?.step6?.notes)
    ? board.step6.notes.map((n: any) => (typeof n === "string" ? n : n?.text)).filter(Boolean)
    : [];
  const idBLevel = board?.step7?.level;
  const gridB = board?.step8 || {};
  const idBItems: ReportItem[] = [];
  if (idBNotes.length > 0) {
    idBItems.push({ type: "keyvalue", label: "Bridge (What draws you in)", text: idBNotes.join("; ") });
  }
  if (idBLevel !== null && idBLevel !== undefined) {
    idBItems.push({ type: "keyvalue", label: "Energy Thermometer", text: `Level ${idBLevel} / 10` });
  }
  if (gridB.assets?.length || gridB.customAssets?.length) {
    const assets = [...(gridB.assets || []), ...(gridB.customAssets || [])];
    idBItems.push({ type: "keyvalue", label: "Assets & Strengths", text: assets.join(", ") });
  }
  if (gridB.actions?.length) {
    idBItems.push({ type: "keyvalue", label: "Concrete Actions", text: gridB.actions.map((a: any) => typeof a === "string" ? a : a.text).join(", ") });
  }
  if (gridB.challenges?.length) {
    idBItems.push({ type: "keyvalue", label: "Real Challenges", text: gridB.challenges.map((c: any) => typeof c === "string" ? c : c.text).join(", ") });
  }
  if (idBItems.length > 0) {
    sections.push({
      title: "Identity B: Life Reality Exploration",
      color: "teal",
      items: idBItems,
    });
  }

  const aligned = board?.step9?.selectedAligned;
  const alignNotes = Array.isArray(board?.step9?.notes)
    ? board.step9.notes.map((n: any) => (typeof n === "string" ? n : n?.text)).filter(Boolean)
    : [];
  if (aligned || alignNotes.length > 0) {
    const items: ReportItem[] = [];
    if (aligned) {
      items.push({ type: "callout", label: "Primary Aligned Identity", text: String(aligned) });
    }
    if (alignNotes.length > 0) {
      items.push({ type: "bullet", label: "Reflection", text: alignNotes.join("; ") });
    }
    sections.push({
      title: "Step 9: Alignment Reflection & Choice",
      color: "gold",
      items,
    });
  }

  return sections;
}

function parseSession3Report(board: any): ReportSection[] {
  const sections: ReportSection[] = [];

  const s1Notes = Array.isArray(board?.step1?.notes)
    ? board.step1.notes.map((n: any) => (typeof n === "string" ? n : n?.text)).filter(Boolean)
    : [];
  if (board?.step1?.anchorIdentityOverride || s1Notes.length > 0 || board?.step1?.response) {
    const items: ReportItem[] = [];
    if (board?.step1?.anchorIdentityOverride) {
      items.push({ type: "keyvalue", label: "Confirmed Anchor Identity", text: String(board.step1.anchorIdentityOverride) });
    }
    if (board?.step1?.response) {
      items.push({ type: "keyvalue", label: "Initial Sense", text: String(board.step1.response) });
    }
    s1Notes.forEach((text: string) => items.push({ type: "bullet", text }));
    sections.push({
      title: "Step 1: Anchor Identity Recalibration",
      color: "gold",
      items,
    });
  }

  const s2 = board?.step2 || {};
  const expItems: ReportItem[] = [];
  const extractTexts = (arr: any[]) =>
    Array.isArray(arr) ? arr.map((n) => (typeof n === "string" ? n : n?.text)).filter(Boolean) : [];
  const observe = extractTexts(s2.observe);
  const converse = extractTexts(s2.converse);
  const act = extractTexts(s2.act);

  if (observe.length > 0) expItems.push({ type: "keyvalue", label: "OBSERVE (Low Stakes)", text: observe.join("; ") });
  if (converse.length > 0) expItems.push({ type: "keyvalue", label: "CONVERSE (Medium Stakes)", text: converse.join("; ") });
  if (act.length > 0) expItems.push({ type: "keyvalue", label: "ACT (High Stakes)", text: act.join("; ") });

  if (expItems.length > 0) {
    sections.push({
      title: "Step 2: Experiment Design (Low-Risk Prototypes)",
      color: "teal",
      items: expItems,
    });
  }

  const s3 = board?.step3 || {};
  const s3Notes = Array.isArray(s3.additionalNotes)
    ? s3.additionalNotes.map((n: any) => (typeof n === "string" ? n : n?.text)).filter(Boolean)
    : [];
  if (s3Notes.length > 0 || (s3.challengeMappings && Object.keys(s3.challengeMappings).length > 0)) {
    const items: ReportItem[] = [];
    if (s3.challengeMappings) {
      Object.entries(s3.challengeMappings).forEach(([k, v]: [string, any]) => {
        if (v) items.push({ type: "keyvalue", label: k, text: String(v) });
      });
    }
    s3Notes.forEach((text: string) => items.push({ type: "bullet", text }));
    sections.push({
      title: "Step 3: Friction Mapping & Anticipated Challenges",
      color: "rust",
      items,
    });
  }

  const s4 = board?.step4 || {};
  const s4Notes = Array.isArray(s4.notes)
    ? s4.notes.map((n: any) => (typeof n === "string" ? n : n?.text)).filter(Boolean)
    : [];
  if (s4.commitmentDate || s4Notes.length > 0) {
    const items: ReportItem[] = [];
    if (s4.commitmentDate) {
      items.push({ type: "callout", label: "Target Commitment Date", text: String(s4.commitmentDate) });
    }
    if (s4.numberOfActions) {
      items.push({ type: "keyvalue", label: "Committed Actions", text: `${s4.numberOfActions} action(s)` });
    }
    s4Notes.forEach((text: string) => items.push({ type: "bullet", text }));
    sections.push({
      title: "Step 4: First Step Commitment & Action Plan",
      color: "purple",
      items,
    });
  }

  return sections;
}

function parseSession4Report(board: any): ReportSection[] {
  const sections: ReportSection[] = [];

  const s1Notes = Array.isArray(board?.step1?.notes)
    ? board.step1.notes.map((n: any) => (typeof n === "string" ? n : n?.text)).filter(Boolean)
    : [];
  if (s1Notes.length > 0) {
    sections.push({
      title: "Step 1: Real-World Experience (What I Tried)",
      color: "teal",
      items: s1Notes.map((text: string) => ({ type: "bullet", text })),
    });
  }

  const s2 = board?.step2 || {};
  const s2Items: ReportItem[] = [];
  const getArray = (arr: any) =>
    Array.isArray(arr) ? arr.map((n) => (typeof n === "string" ? n : n?.text)).filter(Boolean).join(", ") : "";
  if (getArray(s2.easy)) s2Items.push({ type: "keyvalue", label: "What felt easy & natural", text: getArray(s2.easy) });
  if (getArray(s2.requiredEffort)) s2Items.push({ type: "keyvalue", label: "What required effort", text: getArray(s2.requiredEffort) });
  if (getArray(s2.postponed)) s2Items.push({ type: "keyvalue", label: "What was postponed", text: getArray(s2.postponed) });
  if (getArray(s2.surprised)) s2Items.push({ type: "keyvalue", label: "What surprised me", text: getArray(s2.surprised) });
  if (s2Items.length > 0) {
    sections.push({
      title: "Step 2: Experiment Debrief & Learnings",
      color: "purple",
      items: s2Items,
    });
  }

  const s3 = board?.step3 || {};
  const s3Items: ReportItem[] = [];
  if (s3.energy) s3Items.push({ type: "keyvalue", label: "What gives me energy", text: String(s3.energy) });
  if (s3.avoid) s3Items.push({ type: "keyvalue", label: "What I must avoid", text: String(s3.avoid) });
  if (s3.strengths) s3Items.push({ type: "keyvalue", label: "My unique strengths", text: String(s3.strengths) });
  if (s3.surprisedMost) s3Items.push({ type: "keyvalue", label: "What surprised me most", text: String(s3.surprisedMost) });
  if (s3.moreTrueNow) s3Items.push({ type: "keyvalue", label: "What feels most true now", text: String(s3.moreTrueNow) });
  if (s3Items.length > 0) {
    sections.push({
      title: "Step 3: Core Realizations (Who I Am)",
      color: "gold",
      items: s3Items,
    });
  }

  const s4 = board?.step4 || {};
  const s4Items: ReportItem[] = [];
  if (s4.noLongerTryingToProve) s4Items.push({ type: "keyvalue", label: "No longer trying to prove", text: String(s4.noLongerTryingToProve) });
  if (s4.expectationsReleasing) s4Items.push({ type: "keyvalue", label: "Expectations releasing", text: String(s4.expectationsReleasing) });
  if (s4.notPursuing) s4Items.push({ type: "keyvalue", label: "Paths not pursuing", text: String(s4.notPursuing) });
  if (s4.permissionToStop) s4Items.push({ type: "keyvalue", label: "Permission to stop", text: String(s4.permissionToStop) });
  if (s4Items.length > 0) {
    sections.push({
      title: "Step 4: Intentional Release (Letting Go)",
      color: "rust",
      items: s4Items,
    });
  }

  const s5 = board?.step5?.nextChapter;
  if (Array.isArray(s5) && s5.length > 0) {
    sections.push({
      title: "Step 5: My Next Chapter Declaration",
      color: "purple",
      items: s5.map((c: any) => ({ type: "bullet", text: typeof c === "string" ? c : c?.text || "" })),
    });
  }

  const s6 = board?.step6 || {};
  const s6Items: ReportItem[] = [];
  if (getArray(s6.first30)) s6Items.push({ type: "keyvalue", label: "First 30 Days", text: getArray(s6.first30) });
  if (getArray(s6.second30)) s6Items.push({ type: "keyvalue", label: "Days 31-60", text: getArray(s6.second30) });
  if (getArray(s6.third30)) s6Items.push({ type: "keyvalue", label: "Days 61-90", text: getArray(s6.third30) });
  if (s6Items.length > 0) {
    sections.push({
      title: "Step 6: The Next 90 Days Roadmap",
      color: "teal",
      items: s6Items,
    });
  }

  if (board?.step7?.finalReflection) {
    sections.push({
      title: "Step 7: Final Reflection",
      color: "gold",
      items: [{ type: "callout", label: "What feels clearer to me now", text: String(board.step7.finalReflection) }],
    });
  }

  return sections;
}

function parseGenericReport(board: any): ReportSection[] {
  const sections: ReportSection[] = [];
  if (!board || typeof board !== "object") return sections;

  Object.entries(board).forEach(([key, val]: [string, any]) => {
    if (key === "currentStep" || key === "updatedAt" || key === "journeyCompleted") return;
    const title = key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const items: ReportItem[] = [];

    if (Array.isArray(val)) {
      val.forEach((item) => {
        const text = typeof item === "string" ? item : item?.text || JSON.stringify(item);
        if (text) items.push({ type: "bullet", text });
      });
    } else if (typeof val === "object" && val !== null) {
      Object.entries(val).forEach(([k, v]: [string, any]) => {
        if (Array.isArray(v)) {
          const t = v.map((x) => (typeof x === "string" ? x : x?.text || "")).filter(Boolean).join(", ");
          if (t) items.push({ type: "keyvalue", label: k.replace(/_/g, " "), text: t });
        } else if (v !== null && v !== undefined && typeof v !== "object") {
          items.push({ type: "keyvalue", label: k.replace(/_/g, " "), text: String(v) });
        }
      });
    } else if (val) {
      items.push({ type: "text", text: String(val) });
    }

    if (items.length > 0) {
      sections.push({ title, color: "purple", items });
    }
  });

  return sections;
}

function createPdf(reportOrLines: any): Uint8Array {
  // Backward compatibility: If an array of plain string lines was passed
  const report: StructuredReportData = typeof reportOrLines === "object" && "sections" in reportOrLines
    ? reportOrLines
    : {
        journeyTitle: "Zest Journey",
        sessionNumber: 1,
        sessionTitle: "Session Report",
        participant: "Participant",
        status: "Completed",
        completedDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        generatedDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        sections: [
          {
            title: "Session Responses",
            color: "purple",
            items: (Array.isArray(reportOrLines) ? reportOrLines : []).map((l: string) => ({ type: "bullet", text: l })),
          },
        ],
        filename: "session-report.pdf",
      };

  const PAGE_WIDTH = 595;
  const PAGE_HEIGHT = 842;
  const MARGIN_LEFT = 40;
  const CONTENT_WIDTH = 515;
  const BOTTOM_MARGIN = 55;

  const colorCodes = {
    purple: "0.290 0.110 0.361",
    teal: "0.239 0.427 0.424",
    gold: "0.831 0.659 0.263",
    rust: "0.667 0.365 0.325",
    dark: "0.173 0.094 0.063",
    muted: "0.450 0.420 0.400",
    bgWarm: "0.969 0.949 0.933",
    borderLight: "0.850 0.820 0.780",
    white: "1.000 1.000 1.000",
  };

  const pagesStreams: string[] = [];
  let currentStream = "";
  let curY = 842;
  let pageIndex = 0;

  const startNewPage = () => {
    if (currentStream.length > 0) {
      pagesStreams.push(currentStream);
    }
    pageIndex++;
    currentStream = "";

    if (pageIndex === 1) {
      // Top banner
      currentStream += `${colorCodes.purple} rg 0 765 ${PAGE_WIDTH} 77 re f\n`;
      currentStream += `${colorCodes.gold} rg 0 761 ${PAGE_WIDTH} 4 re f\n`;

      currentStream += `BT /F2 20 Tf 1 1 1 rg ${MARGIN_LEFT} 802 Td (${pdfEscape("ZUVA LIFE")}) Tj ET\n`;
      currentStream += `BT /F1 10 Tf 0.96 0.90 0.98 rg ${MARGIN_LEFT} 780 Td (${pdfEscape("ZEST JOURNEY  |  SESSION REPORT")}) Tj ET\n`;

      // Session Overview Card
      const cardHeight = 72;
      const cardY = 675;
      currentStream += `${colorCodes.bgWarm} rg ${MARGIN_LEFT} ${cardY} ${CONTENT_WIDTH} ${cardHeight} re f\n`;
      currentStream += `${colorCodes.borderLight} RG 1 w ${MARGIN_LEFT} ${cardY} ${CONTENT_WIDTH} ${cardHeight} re S\n`;

      // Card Content
      currentStream += `BT /F2 13 Tf ${colorCodes.purple} rg ${MARGIN_LEFT + 15} ${cardY + 50} Td (${pdfEscape(
        `Session ${report.sessionNumber}: ${report.sessionTitle}`
      )}) Tj ET\n`;

      currentStream += `BT /F2 9.5 Tf ${colorCodes.teal} rg ${MARGIN_LEFT + 15} ${cardY + 30} Td (${pdfEscape(
        "Journey: "
      )}) Tj /F1 9.5 Tf ${colorCodes.dark} rg (${pdfEscape(report.journeyTitle)}) Tj ET\n`;

      currentStream += `BT /F2 9.5 Tf ${colorCodes.teal} rg ${MARGIN_LEFT + 15} ${cardY + 14} Td (${pdfEscape(
        "Participant: "
      )}) Tj /F1 9.5 Tf ${colorCodes.dark} rg (${pdfEscape(report.participant)}) Tj ET\n`;

      // Right Column
      currentStream += `BT /F2 9.5 Tf ${colorCodes.teal} rg 350 ${cardY + 30} Td (${pdfEscape(
        "Status: "
      )}) Tj /F2 9.5 Tf ${colorCodes.teal} rg (${pdfEscape(report.status.toUpperCase())}) Tj ET\n`;

      currentStream += `BT /F2 9.5 Tf ${colorCodes.teal} rg 350 ${cardY + 14} Td (${pdfEscape(
        "Completed: "
      )}) Tj /F1 9.5 Tf ${colorCodes.dark} rg (${pdfEscape(report.completedDate || report.generatedDate)}) Tj ET\n`;

      curY = cardY - 24;
    } else {
      // Running header
      currentStream += `${colorCodes.purple} rg 0 812 ${PAGE_WIDTH} 30 re f\n`;
      currentStream += `${colorCodes.gold} rg 0 808 ${PAGE_WIDTH} 4 re f\n`;
      currentStream += `BT /F2 9.5 Tf 1 1 1 rg ${MARGIN_LEFT} 820 Td (${pdfEscape(
        `Zuva Life  -  Zest Journey  -  Session ${report.sessionNumber}: ${report.sessionTitle}`
      )}) Tj ET\n`;

      curY = 780;
    }
  };

  startNewPage();

  if (report.sections.length === 0) {
    currentStream += `BT /F3 11 Tf ${colorCodes.muted} rg ${MARGIN_LEFT} ${curY} Td (${pdfEscape(
      "No session responses were recorded for this session."
    )}) Tj ET\n`;
    curY -= 30;
  } else {
    for (const section of report.sections) {
      if (curY < BOTTOM_MARGIN + 70) {
        startNewPage();
      }

      const secColor = colorCodes[section.color] || colorCodes.purple;

      // Section Header Banner Pill
      currentStream += `${secColor} rg ${MARGIN_LEFT} ${curY - 18} ${CONTENT_WIDTH} 22 re f\n`;
      currentStream += `BT /F2 10.5 Tf 1 1 1 rg ${MARGIN_LEFT + 10} ${curY - 5} Td (${pdfEscape(
        section.title.toUpperCase()
      )}) Tj ET\n`;
      curY -= 30;

      for (const item of section.items) {
        if (item.type === "callout") {
          const wrapped = wrapPdfText(item.text, 68);
          const boxH = Math.max(36, 20 + wrapped.length * 14);

          if (curY - boxH < BOTTOM_MARGIN) {
            startNewPage();
          }

          currentStream += `${colorCodes.bgWarm} rg ${MARGIN_LEFT} ${curY - boxH} ${CONTENT_WIDTH} ${boxH} re f\n`;
          currentStream += `${colorCodes.gold} RG 1.5 w ${MARGIN_LEFT} ${curY - boxH} ${CONTENT_WIDTH} ${boxH} re S\n`;

          if (item.label) {
            currentStream += `BT /F2 9.5 Tf ${colorCodes.purple} rg ${MARGIN_LEFT + 12} ${curY - 14} Td (${pdfEscape(
              item.label.toUpperCase() + ":"
            )}) Tj ET\n`;
          }

          let textY = item.label ? curY - 28 : curY - 16;
          for (const line of wrapped) {
            currentStream += `BT /F2 12 Tf ${colorCodes.dark} rg ${MARGIN_LEFT + 12} ${textY} Td (${pdfEscape(
              line
            )}) Tj ET\n`;
            textY -= 14;
          }

          curY -= boxH + 12;
        } else if (item.type === "keyvalue") {
          const labelPart = item.label ? `${item.label}: ` : "";
          const fullText = `${labelPart}${item.text}`;
          const wrapped = wrapPdfText(fullText, 78);

          if (curY - wrapped.length * 13 < BOTTOM_MARGIN) {
            startNewPage();
          }

          let first = true;
          for (const line of wrapped) {
            if (first && item.label) {
              currentStream += `BT /F2 9.5 Tf ${secColor} rg ${MARGIN_LEFT + 10} ${curY} Td (${pdfEscape(
                item.label + ": "
              )}) Tj /F1 9.5 Tf ${colorCodes.dark} rg (${pdfEscape(
                line.slice(item.label.length + 2)
              )}) Tj ET\n`;
            } else {
              currentStream += `BT /F1 9.5 Tf ${colorCodes.dark} rg ${MARGIN_LEFT + 10} ${curY} Td (${pdfEscape(
                line
              )}) Tj ET\n`;
            }
            curY -= 13;
            first = false;
          }
          curY -= 4;
        } else {
          // Bullet or standard item
          const prefix = "*  ";
          const labelPrefix = item.label ? `[${item.label}] ` : "";
          const full = `${labelPrefix}${item.text}`;
          const wrapped = wrapPdfText(full, 75);

          if (curY - wrapped.length * 13 < BOTTOM_MARGIN) {
            startNewPage();
          }

          let isFirst = true;
          for (const line of wrapped) {
            if (isFirst) {
              currentStream += `BT /F2 10 Tf ${secColor} rg ${MARGIN_LEFT + 8} ${curY} Td (${pdfEscape(
                prefix
              )}) Tj `;
              if (item.label) {
                currentStream += `/F2 9.5 Tf ${secColor} rg (${pdfEscape(labelPrefix)}) Tj /F1 9.5 Tf ${
                  colorCodes.dark
                } rg (${pdfEscape(line.slice(labelPrefix.length))}) Tj ET\n`;
              } else {
                currentStream += `/F1 9.5 Tf ${colorCodes.dark} rg (${pdfEscape(line)}) Tj ET\n`;
              }
            } else {
              currentStream += `BT /F1 9.5 Tf ${colorCodes.dark} rg ${MARGIN_LEFT + 22} ${curY} Td (${pdfEscape(
                line
              )}) Tj ET\n`;
            }
            curY -= 13;
            isFirst = false;
          }
          curY -= 3;
        }
      }

      curY -= 10;
    }
  }

  if (currentStream.length > 0) {
    pagesStreams.push(currentStream);
  }

  const totalPages = pagesStreams.length;

  // Add footers with totalPages
  const finalPageStreams = pagesStreams.map((stream, idx) => {
    let s = stream;
    s += `${colorCodes.borderLight} RG 0.5 w ${MARGIN_LEFT} 38 m ${PAGE_WIDTH - MARGIN_LEFT} 38 l S\n`;
    s += `BT /F1 8 Tf ${colorCodes.muted} rg ${MARGIN_LEFT} 26 Td (${pdfEscape(
      "Zuva Life  *  Zest Journey  *  Confidential & Personal"
    )}) Tj ET\n`;
    s += `BT /F1 8 Tf ${colorCodes.muted} rg 485 26 Td (${pdfEscape(`Page ${idx + 1} of ${totalPages}`)}) Tj ET\n`;
    return s;
  });

  // Assemble PDF Objects
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");

  const fontHelvetica = 3;
  const fontHelveticaBold = 4;
  const fontHelveticaOblique = 5;
  const firstPageObj = 6;

  const pageObjNumbers: number[] = [];
  finalPageStreams.forEach((_, index) => {
    pageObjNumbers.push(firstPageObj + index * 2);
  });

  const kids = pageObjNumbers.map((n) => `${n} 0 R`).join(" ");
  objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${totalPages} >>`);

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>");

  finalPageStreams.forEach((stream, pIdx) => {
    const pageObjNum = firstPageObj + pIdx * 2;
    const contentObjNum = pageObjNum + 1;

    objects[pageObjNum - 1] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontHelvetica} 0 R /F2 ${fontHelveticaBold} 0 R /F3 ${fontHelveticaOblique} 0 R >> >> /Contents ${contentObjNum} 0 R >>`;

    objects[contentObjNum - 1] =
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  objects.forEach((obj, idx) => {
    offsets.push(pdf.length);
    pdf += `${idx + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
  }
  return btoa(binary);
}

async function buildSessionReport(
  session: any,
  journey: any,
  board: any,
  participantEmail?: string
) {
  const sessionNumber = Number(session.sessionNumber) || 1;
  const sessionName = SESSION_NAMES[sessionNumber] || `Session ${sessionNumber}`;
  const participant = participantEmail || journey.participants?.[0]?.email || journey.participantEmail || "Participant";

  let sections: ReportSection[] = [];
  if (sessionNumber === 1) {
    sections = parseSession1Report(board);
  } else if (sessionNumber === 2) {
    sections = parseSession2Report(board);
  } else if (sessionNumber === 3) {
    sections = parseSession3Report(board);
  } else if (sessionNumber === 4) {
    sections = parseSession4Report(board);
  } else {
    sections = parseGenericReport(board);
  }

  const completedDate = session.completedAt
    ? new Date(session.completedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  const generatedDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const structured: StructuredReportData = {
    journeyTitle: journey.title || "Zest Journey",
    sessionNumber,
    sessionTitle: sessionName,
    participant,
    status: session.status || "Completed",
    completedDate,
    generatedDate,
    sections,
    filename: `zest-journey-session-${sessionNumber}-report.pdf`,
  };

  // Plain text lines representation for fallback/inspection
  const lines: string[] = [
    "ZEST JOURNEY - SESSION REPORT",
    `Journey: ${structured.journeyTitle}`,
    `Session ${sessionNumber}: ${sessionName}`,
    `Participant: ${participant}`,
    `Status: ${structured.status}`,
    "",
  ];

  sections.forEach((sec) => {
    lines.push(`--- ${sec.title} ---`);
    sec.items.forEach((item) => {
      if (item.label) lines.push(`${item.label}: ${item.text}`);
      else lines.push(`- ${item.text}`);
    });
    lines.push("");
  });

  return {
    ...structured,
    lines,
    sessionName,
    participant,
    filename: structured.filename,
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
        await requireAuth(c);

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
        await requireAuth(c);

      if (!auth.ok) {
        return auth.response;
      }

      const userEmail = normalizeEmail(auth.user.email);
      const facilitatorKey = `facilitator:${auth.user.id}:journeys`;
      const emailKey = userEmail ? `facilitator_email:${userEmail}:journeys` : null;

      const journeyEntries =
        await kv.getEntriesByPrefix(
          "journey:"
        );

      const matchedJourneysMap = new Map<string, any>();

      for (const entry of journeyEntries) {
        const journey = entry.value;
        if (!journey || !journey.id) continue;

        if (isFacilitatorForJourney(journey, auth.user)) {
          if (!journey.facilitatorId) {
            journey.facilitatorId = auth.user.id;
          }
          matchedJourneysMap.set(journey.id, journey);
        }
      }

      // Also check indexed IDs
      const indexedIds: string[] = Array.from(
        new Set([
          ...((await kv.get(facilitatorKey)) || []),
          ...(emailKey ? (await kv.get(emailKey)) || [] : []),
        ])
      );

      for (const id of indexedIds) {
        if (!matchedJourneysMap.has(id)) {
          const j = await getJourney(id);
          if (j && isFacilitatorForJourney(j, auth.user)) {
            if (!j.facilitatorId) {
              j.facilitatorId = auth.user.id;
            }
            matchedJourneysMap.set(id, j);
          }
        }
      }

      const journeys: any[] = [];

      for (let [_, journey] of matchedJourneysMap.entries()) {
        journey = await ensureJourneySessions(journey);
        journeys.push(journey);
      }

      const validIds = Array.from(matchedJourneysMap.keys());
      await kv.set(facilitatorKey, validIds);
      if (emailKey) {
        await kv.set(emailKey, validIds);
      }

      return c.json({
        success: true,
        journeys: journeys.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
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
        await requireAuth(c);

      if (!auth.ok) {
        return auth.response;
      }

      const emailParam =
        decodeURIComponent(
          c.req.param(
            "email"
          ) || ""
        )
          .trim()
          .toLowerCase();

      const userEmail =
        normalizeEmail(
          auth.user.email
        );

      // A participant may only read the journeys linked to the email in the
      // access token.  Do not merge a URL-provided email here: apart from
      // being an authorization issue, doing so lets an old browser URL keep
      // a stale participant index alive in the response.
      if (!userEmail || emailParam !== userEmail) {
        return c.json(
          { error: "The requested participant email does not match the authenticated user." },
          403
        );
      }

      const emailsToMatch = [userEmail];

      console.log(
        `[journeys/participant] auth.user.id=${auth.user.id} auth.user.email=${auth.user.email} emailParam=${emailParam} emailsToMatch=${JSON.stringify(emailsToMatch)}`
      );

      if (emailsToMatch.length === 0) {
        console.log("[journeys/participant] No emails to match, returning empty.");
        return c.json({
          success: true,
          journeys: [],
        });
      }

      const journeyEntries =
        await kv.getEntriesByPrefix(
          "journey:"
        );

      console.log(
        `[journeys/participant] Found ${journeyEntries.length} total journey entries in KV`
      );

      const matchedJourneysMap = new Map<string, any>();

      for (const entry of journeyEntries) {
        const journey = entry.value;
        if (!journey || !journey.id) continue;

        const isLinked = emailsToMatch.some(e => isParticipantLinked(journey, e));

        console.log(
          `[journeys/participant] Journey ${journey.id} "${journey.title || "untitled"}" ` +
          `participantEmail=${journey.participantEmail || "NONE"} ` +
          `participants=${JSON.stringify((journey.participants || []).map((p: any) => typeof p === "string" ? p : p?.email))} ` +
          `isLinked=${isLinked}`
        );

        if (isLinked) {
          matchedJourneysMap.set(journey.id, journey);
        }
      }

      // Also check indexes for each email
      for (const email of emailsToMatch) {
        const key = `participant_email:${email}:journeys`;
        const indexedIds: string[] = (await kv.get(key)) || [];

        console.log(
          `[journeys/participant] Index ${key} = ${JSON.stringify(indexedIds)}`
        );

        for (const id of indexedIds) {
          if (!matchedJourneysMap.has(id)) {
            const j = await getJourney(id);
            // Indexes are a cache, never an authorization source.  A stale
            // index must be removed rather than resurrecting a journey for a
            // participant who is no longer linked to it.
            if (j && isParticipantLinked(j, email)) {
              matchedJourneysMap.set(id, j);
              console.log(
                `[journeys/participant] Added verified journey ${id} from index`
              );
            } else {
              console.warn(
                `[journeys/participant] Ignoring stale index entry ${id} for ${email}`
              );
            }
          }
        }
      }

      console.log(
        `[journeys/participant] Total matched journeys: ${matchedJourneysMap.size}`
      );

      const journeys: any[] = [];

      for (let [_, journey] of matchedJourneysMap.entries()) {
        journey = await ensureJourneySessions(journey);
        journeys.push(journey);
      }

      // Update indexes: store existing matched journey IDs
      for (const email of emailsToMatch) {
        const key = `participant_email:${email}:journeys`;
        await kv.set(key, Array.from(matchedJourneysMap.keys()));
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
// DEBUG — PARTICIPANT JOURNEY LOOKUP
// ─────────────────────────────────────────────────────────────────────────────

app.get(
  `${P}/debug/participant/:email`,
  async c => {
    try {
      const auth = await requireAuth(c);
      if (!auth.ok) return auth.response;

      const emailParam = decodeURIComponent(
        c.req.param("email") || ""
      ).trim().toLowerCase();

      const userEmail = normalizeEmail(auth.user.email);

      const emailsToCheck = Array.from(
        new Set([userEmail, emailParam].filter(Boolean))
      );

      // Check indexes
      const indexes: Record<string, any> = {};
      for (const email of emailsToCheck) {
        const key = `participant_email:${email}:journeys`;
        indexes[key] = await kv.get(key);
      }

      // Check all journeys
      const journeyEntries = await kv.getEntriesByPrefix("journey:");
      const allJourneys = journeyEntries.map((e: any) => ({
        key: e.key,
        id: e.value?.id,
        title: e.value?.title,
        participantEmail: e.value?.participantEmail,
        participants: e.value?.participants,
        facilitatorId: e.value?.facilitatorId,
        facilitatorEmail: e.value?.facilitatorEmail,
      }));

      // Check which journeys match
      const matched = allJourneys.filter((j: any) =>
        emailsToCheck.some(e => {
          const pe = normalizeEmail(j.participantEmail);
          if (pe === e) return true;
          const participants = Array.isArray(j.participants) ? j.participants : [];
          return participants.some((p: any) => {
            const pEmail = typeof p === "string" ? p : (p?.email || "");
            return normalizeEmail(pEmail) === e;
          });
        })
      );

      return c.json({
        success: true,
        debug: {
          authUser: {
            id: auth.user.id,
            email: auth.user.email,
            role: auth.user.role,
          },
          emailsToCheck,
          indexes,
          totalJourneysInKV: journeyEntries.length,
          allJourneys,
          matchedJourneys: matched,
        },
      });
    } catch (error) {
      return c.json({ success: false, error: String(error) }, 500);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PARTICIPANT — PURGE STALE JOURNEY REFERENCES
// Called automatically when participant dashboard loads to clean up deleted
// journeys that were not properly removed from the participant's index.
// ─────────────────────────────────────────────────────────────────────────────

app.post(
  `${P}/participant/purge-stale-journeys`,
  async c => {
    try {
      const auth = await requireAuth(c);
      if (!auth.ok) return auth.response;

      const userEmail = normalizeEmail(auth.user.email);
      if (!userEmail) {
        return c.json({ success: true, purged: 0, message: "No email." });
      }

      // ── Step 1: Build the set of ALL journey IDs that facilitators still own ──
      // A journey is "alive" if it appears in at least one facilitator:*:journeys index.
      const facilitatorEntries = await kv.getEntriesByPrefix("facilitator:");
      const facilitatorOwnedIds = new Set<string>();
      for (const entry of facilitatorEntries) {
        if (Array.isArray(entry.value)) {
          for (const id of entry.value) {
            if (typeof id === "string") facilitatorOwnedIds.add(id);
          }
        }
      }

      // ── Step 2: Scan ALL journey:* records ──
      const journeyEntries = await kv.getEntriesByPrefix("journey:");
      const orphanedJourneyKeys: string[] = [];
      const validIdsForParticipant = new Set<string>();

      for (const entry of journeyEntries) {
        const j = entry.value;
        if (!j || !j.id) continue;

        // A journey is orphaned if NO facilitator owns it in their index
        // AND the journey's own facilitatorId has no index entry for it.
        const isOrphaned = !facilitatorOwnedIds.has(j.id);

        if (isOrphaned) {
          // Double-check: look up the facilitator's index directly by facilitatorId
          let stillOwned = false;
          if (j.facilitatorId) {
            const fKey = `facilitator:${j.facilitatorId}:journeys`;
            const fIds: string[] = (await kv.get(fKey)) || [];
            if (fIds.includes(j.id)) {
              stillOwned = true;
              facilitatorOwnedIds.add(j.id);
            }
          }
          if (j.facilitatorEmail) {
            const feKey = `facilitator_email:${normalizeEmail(j.facilitatorEmail)}:journeys`;
            const feIds: string[] = (await kv.get(feKey)) || [];
            if (feIds.includes(j.id)) {
              stillOwned = true;
              facilitatorOwnedIds.add(j.id);
            }
          }

          if (!stillOwned) {
            // Journey is a ghost — delete it
            orphanedJourneyKeys.push(entry.key);
            console.log(
              `[purge-stale] Orphaned journey detected: key=${entry.key} id=${j.id} title="${j.title}"`
            );
            continue;
          }
        }

        // Journey is valid — check if this participant is linked
        if (isParticipantLinked(j, userEmail)) {
          validIdsForParticipant.add(j.id);
        }
      }

      // ── Step 3: Delete orphaned journey records and their sessions/boards ──
      for (const key of orphanedJourneyKeys) {
        const journeyId = key.replace("journey:", "");
        // Try to load it once more to get session IDs for cleanup
        const ghost = await kv.get(key);
        if (ghost) {
          const sessions: any[] = ghost.sessions || [];
          if (sessions.length === 0 && ghost.sessionId) {
            sessions.push({ id: ghost.sessionId });
          }
          for (const s of sessions) {
            if (s?.id) {
              // Delete boards
              const boards = await kv.getEntriesByPrefix(`board:${s.id}`);
              if (boards.length > 0) {
                await kv.mdel(boards.map((b: any) => b.key));
              }
              // Delete session
              await kv.del(`session:${s.id}`).catch(() => {});
            }
          }
        }
        await kv.del(key);

        // Clean all participant indexes that reference this orphaned ID
        const allParticipantKeys = await kv.getEntriesByPrefix("participant_email:");
        for (const pEntry of allParticipantKeys) {
          if (Array.isArray(pEntry.value) && pEntry.value.includes(journeyId)) {
            await kv.set(
              pEntry.key,
              pEntry.value.filter((id: string) => id !== journeyId)
            );
          }
        }
      }

      // ── Step 4: Clean participant index for this email ──
      const indexKey = `participant_email:${userEmail}:journeys`;
      const indexedIds: string[] = (await kv.get(indexKey)) || [];
      const cleanedIndexIds = indexedIds.filter(id => validIdsForParticipant.has(id));

      if (cleanedIndexIds.length !== indexedIds.length) {
        await kv.set(indexKey, cleanedIndexIds);
        console.log(
          `[purge-stale] Cleaned index for ${userEmail}: removed ${indexedIds.length - cleanedIndexIds.length} stale IDs`
        );
      }

      return c.json({
        success: true,
        orphanedJourneysDeleted: orphanedJourneyKeys.length,
        indexCleaned: indexedIds.length - cleanedIndexIds.length,
        validJourneyCount: validIdsForParticipant.size,
      });
    } catch (error) {
      console.error("[purge-stale]", error);
      return c.json({ success: false, error: String(error) }, 500);
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
        isFacilitatorForJourney(journey, auth.user);

      const isParticipant =
        auth.user.email
          ? isParticipantLinked(
              journey,
              auth.user.email
            )
          : false;

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
        await requireAuth(c);

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

      const facilitatorAccess =
        auth.user.role === "facilitator" ||
        isFacilitatorForJourney(journey, auth.user);

      if (!facilitatorAccess) {
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

      if (auth.user.email) {
        const emailFacilitatorKey =
          `facilitator_email:${normalizeEmail(auth.user.email)}:journeys`;
        const emailJourneys: string[] =
          (await kv.get(emailFacilitatorKey)) || [];
        await kv.set(
          emailFacilitatorKey,
          emailJourneys.filter(id => id !== journeyId)
        );
      }

      if (
        journey.facilitatorId &&
        journey.facilitatorId !== auth.user.id
      ) {
        const ownerKey =
          `facilitator:${journey.facilitatorId}:journeys`;
        const ownerJourneys: string[] =
          (await kv.get(ownerKey)) || [];
        await kv.set(
          ownerKey,
          ownerJourneys.filter(id => id !== journeyId)
        );
      }

      const participantEmails =
        new Set<string>();

      if (
        journey.participantEmail
      ) {
        const pe = normalizeEmail(journey.participantEmail);
        if (pe) participantEmails.add(pe);
      }

      for (
        const participant of
        journey.participants || []
      ) {
        const email =
          normalizeEmail(
            typeof participant === "string"
              ? participant
              : participant?.email
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

      // Also clean any participant index that holds this journeyId
      const allParticipantKeys =
        await kv.getEntriesByPrefix("participant_email:");
      for (const entry of allParticipantKeys) {
        if (
          Array.isArray(entry.value) &&
          entry.value.includes(journeyId)
        ) {
          await kv.set(
            entry.key,
            entry.value.filter((id: string) => id !== journeyId)
          );
        }
      }

      await kv.del(
        `journey:${journeyId}`
      );

      // A successful response must mean the record that drives both
      // dashboards is no longer readable.  Supabase's DELETE can complete
      // without returning affected rows, so verify the post-condition.
      if (await getJourney(journeyId)) {
        throw new Error(
          `Journey ${journeyId} still exists after deletion.`
        );
      }

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
        await requireAuth(c);

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

      const facilitatorAccess =
        isFacilitatorForJourney(journey, auth.user);

      console.log(
        `[journeys/link] facilitatorAccess=${facilitatorAccess} ` +
        `auth.user.id=${auth.user.id} auth.user.email=${auth.user.email} auth.user.role=${auth.user.role} ` +
        `journey.facilitatorId=${journey.facilitatorId} journey.facilitatorEmail=${journey.facilitatorEmail}`
      );

      if (!facilitatorAccess) {
        return c.json(
          {
            success: false,
            error:
              "You can only modify your own journeys. Make sure you are logged in as the facilitator who created this journey.",
            debug: {
              authUserId: auth.user.id,
              authUserEmail: auth.user.email,
              authUserRole: auth.user.role,
              journeyFacilitatorId: journey.facilitatorId,
              journeyFacilitatorEmail: journey.facilitatorEmail,
            },
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
          (participant: any) => {
            const pEmail =
              typeof participant === "string"
                ? participant
                : (participant?.email || "");
            return (
              normalizeEmail(pEmail) === email
            );
          }
        );

      if (!alreadyLinked) {
        journey.participants.push({
          email,
          linkedAt: new Date().toISOString(),
        });
      }

      if (
        !journey.participantEmail ||
        normalizeEmail(journey.participantEmail) === ""
      ) {
        journey.participantEmail = email;
      }

      await saveJourney(journey);
      await ensureParticipantJourneyIndex(journey);

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

      console.log(
        `[journeys/link] FINAL STATE: journey.participantEmail=${journey.participantEmail} journey.participants=${JSON.stringify(journey.participants?.map((p: any) => typeof p === "string" ? p : p?.email))} indexKey=${participantKey} indexedIds=${JSON.stringify(verifiedIndex)}`
      );

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
// REPAIR — REBUILD ALL PARTICIPANT INDEXES
// ─────────────────────────────────────────────────────────────────────────────

app.post(
  `${P}/repair/indexes`,
  async c => {
    try {
      const auth = await requireAuth(c);
      if (!auth.ok) return auth.response;

      // Scan all journeys and rebuild participant_email indexes
      const journeyEntries = await kv.getEntriesByPrefix("journey:");
      const emailMap = new Map<string, Set<string>>();

      let totalJourneys = 0;
      let journeysWithParticipants = 0;

      for (const entry of journeyEntries) {
        const journey = entry.value;
        if (!journey || !journey.id) continue;
        totalJourneys++;

        const emailsForJourney = new Set<string>();

        // Collect from participantEmail
        const pe = normalizeEmail(journey.participantEmail);
        if (pe) emailsForJourney.add(pe);

        // Collect from participants array
        if (Array.isArray(journey.participants)) {
          for (const p of journey.participants) {
            const pEmail = normalizeEmail(
              typeof p === "string" ? p : (p?.email || "")
            );
            if (pEmail) emailsForJourney.add(pEmail);
          }
        }

        if (emailsForJourney.size > 0) {
          journeysWithParticipants++;
          for (const email of emailsForJourney) {
            if (!emailMap.has(email)) emailMap.set(email, new Set());
            emailMap.get(email)!.add(journey.id);
          }
        }

        console.log(
          `[repair/indexes] journey ${journey.id} "${journey.title}" → emails: ${JSON.stringify(Array.from(emailsForJourney))}`
        );
      }

      // Write rebuilt indexes
      for (const [email, journeyIds] of emailMap.entries()) {
        const key = `participant_email:${email}:journeys`;
        const ids = Array.from(journeyIds);
        await kv.set(key, ids);
        console.log(`[repair/indexes] Wrote ${key} = ${JSON.stringify(ids)}`);
      }

      return c.json({
        success: true,
        totalJourneys,
        journeysWithParticipants,
        indexesBuilt: Object.fromEntries(
          Array.from(emailMap.entries()).map(([email, ids]) => [
            email,
            Array.from(ids),
          ])
        ),
      });
    } catch (error) {
      console.error("[repair/indexes]", error);
      return c.json({ success: false, error: String(error) }, 500);
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

      let session =
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

      session = await getSession(id);

      if (!session) {
        return c.json(
          {
            error:
              "Session not found.",
          },
          404
        );
      }

      const facilitatorAccess =
        isFacilitatorForJourney(journey, auth.user);

      const participantAccess =
        auth.user.role ===
          "participant" &&
        !facilitatorAccess &&
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
        !facilitatorAccess &&
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
        Number(session.sessionNumber) > 1
      ) {
        const participantId =
          !facilitatorAccess && auth.user.role === "participant"
            ? auth.user.id
            : await getLinkedParticipantId(journey);

        if (participantId) {
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
                  participantId,
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
        isFacilitatorForJourney(journey, auth.user);

      const participantAccess =
        auth.user.role ===
          "participant" &&
        !facilitatorAccess &&
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
        !facilitatorAccess &&
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
        !facilitatorAccess &&
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
        isFacilitatorForJourney(journey, auth.user);

      const participantAccess =
        auth.user.role ===
          "participant" &&
        !facilitatorAccess &&
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
        !facilitatorAccess &&
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
        !facilitatorAccess &&
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

      const facilitatorAccess =
        isFacilitatorForJourney(journey, auth.user);

      const assignmentMatchesAuthenticatedUser =
        typeof journey.facilitatorId === "string" &&
        journey.facilitatorId === auth.user.id;

      const finalFacilitatorAuthorization =
        auth.user.role === "facilitator" &&
        assignmentMatchesAuthenticatedUser;

      console.log(
        "[sessions/status] Authorization identity check",
        {
          // 1. Authenticated Supabase auth.users.id, obtained by verifying
          //    the Bearer token with supabase.auth.getUser(token).
          authenticatedUserId: auth.user.id,
          authenticatedRole: auth.user.role,
          authenticatedMetadataRole: auth.user.authMetadataRole ?? null,

          // 2. Requested session ID.
          authenticatedEmail: auth.user.email,
          sessionId,

          // 3. Session records currently do not persist a facilitator ID;
          //    ownership is persisted on the parent journey. Log both so a
          //    future schema change cannot silently alter this conclusion.
          sessionFacilitatorId: session.facilitatorId ?? null,
          journeySessionFacilitatorId:
            journeySession.facilitatorId ?? null,
          journeyFacilitatorId: journey.facilitatorId ?? null,
          journeyFacilitatorEmail: journey.facilitatorEmail ?? null,

          // 4. The only profile/user record read by this function is the
          //    server-side KV record user:<auth.users.id>.
          databaseUserRecordId: auth.user.databaseUserId ?? null,
          databaseUserRecordRole: auth.user.databaseRole ?? null,

          // 5. Both the legacy helper result (which may allow email) and the
          //    strict authorization result used for owner operations.
          assignmentMatchesAuthenticatedUser,
          facilitatorAccess,
          finalFacilitatorAuthorization,
        }
      );

      const currentStatus:
        SessionStatus =
        session.status;

      // ─────────────────────────────────────
      // PARTICIPANT
      // ─────────────────────────────────────

      if (
        auth.user.role ===
          "participant" &&
        !facilitatorAccess
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
          status !== "in_progress" &&
          status !== "completed" &&
          status !== currentStatus
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

        if (status === "completed") {
          session.status = "completed";
          session.completedAt = session.completedAt || now;
          session.updatedAt = now;

          journeySession.status = "completed";
          journeySession.completedAt = journeySession.completedAt || now;
          journeySession.updatedAt = now;
        } else if (status === "in_progress") {
          session.status = "in_progress";
          session.startedAt = session.startedAt || now;
          session.updatedAt = now;

          journeySession.status = "in_progress";
          journeySession.startedAt = journeySession.startedAt || now;
          journeySession.updatedAt = now;
        }

        await saveSession(
          session
        );

        await saveJourney(
          journey
        );

        await ensureParticipantJourneyIndex(
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

      if (!facilitatorAccess) {
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

          session.availableAt = null;
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

        // The facilitator must explicitly enable the next session.
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

            nextSession.availableAt = null;

            try {
              const nextSessionRecord =
                await getSession(
                  nextSession.id
                );

              if (
                nextSessionRecord
              ) {
                nextSessionRecord.status =
                  "locked";

                nextSessionRecord.availableAt = null;

                nextSessionRecord.updatedAt =
                  now;

                await saveWithRetry(
                  `next session ${nextSessionRecord.id}`,
                  () => saveSession(nextSessionRecord)
                );
              }
            } catch (nextSessionError) {
              console.error(
                "[sessions/status] Could not synchronize next session after completion",
                {
                  sessionId,
                  nextSessionId: nextSession.id,
                  facilitatorId: auth.user.id,
                  error: nextSessionError,
                }
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
          await saveWithRetry(
            `completed session ${sessionId}`,
            () => saveSession(session)
          );

          completionStage = "journey";
          await saveWithRetry(
            `completed journey ${session.journeyId}`,
            () => saveJourney(journey)
          );
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
              typeof participantUserId === "string"
            ) {
              board =
                (await getParticipantBoard(
                  sessionId,
                  participantUserId as string,
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
                report
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
        await requireAuth(c);

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

      const facilitatorAccess =
        isFacilitatorForJourney(journey, auth.user);

      if (!facilitatorAccess) {
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

        target.availableAt = null;
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

        session.availableAt = null;

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

      if (
        c.req.query("format") === "json" ||
        c.req.header("accept")?.includes("application/json")
      ) {
        return c.json({
          success: true,
          report,
        });
      }

      const pdf =
        createPdf(
          report
        );

      return new Response(
        pdf.slice().buffer as ArrayBuffer,
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
            report
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
              report
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
