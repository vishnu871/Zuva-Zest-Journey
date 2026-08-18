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
// HEALTH
// ─────────────────────────────────────────────────────────────────────────────

app.get(`${P}/health`, (c) =>
  c.json({
    status: "ok",
    ts: new Date().toISOString(),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

app.post(`${P}/auth/signup`, async (c) => {
  try {
    const {
      email,
      password,
      fullName,
      role,
    } = await c.req.json();

    if (
      !email ||
      !password ||
      !fullName ||
      !role
    ) {
      return c.json(
        {
          error: "Missing required fields",
        },
        400
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      data,
      error,
    } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name: fullName,
        role,
      },
      email_confirm: true,
    });

    if (error) {
      return c.json(
        {
          error: error.message,
        },
        400
      );
    }

    await kv.set(
      `user:${data.user.id}`,
      {
        id: data.user.id,
        email,
        fullName,
        role,
        createdAt:
          new Date().toISOString(),
      }
    );

    return c.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName,
        role,
      },
    });
  } catch (e) {
    console.error(
      "Signup error:",
      e
    );

    return c.json(
      {
        error: String(e),
      },
      500
    );
  }
});

app.post(`${P}/auth/verify-role`, async (c) => {
  try {
    const accessToken =
      c.req
        .header("Authorization")
        ?.split(" ")[1];

    if (!accessToken) {
      return c.json(
        {
          error: "No access token",
        },
        401
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const {
      data: { user },
      error,
    } =
      await supabase.auth.getUser(
        accessToken
      );

    if (error || !user) {
      return c.json(
        {
          error: "Invalid token",
        },
        401
      );
    }

    const userData =
      await kv.get(
        `user:${user.id}`
      );

    const role =
      userData?.role ||
      user.user_metadata?.role;

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName:
          userData?.fullName ||
          user.user_metadata?.name,
        role,
      },
    });
  } catch (e) {
    console.error(
      "Verify role error:",
      e
    );

    return c.json(
      {
        error: String(e),
      },
      500
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// BOARD DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_S1_BOARD = {
  currentStep: 1,

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

const EMPTY_S2_BOARD = {
  currentStep: 1,
};

// ─────────────────────────────────────────────────────────────────────────────
// JOURNEY SESSION MIGRATION
// ─────────────────────────────────────────────────────────────────────────────

async function ensureJourneySessions(
  journey: any
) {
  if (
    journey.sessions &&
    journey.sessions.length === 4
  ) {
    return journey;
  }

  const s1Id =
    journey.sessionId;

  if (!s1Id) {
    return journey;
  }

  const s2Id =
    crypto.randomUUID();

  const s3Id =
    crypto.randomUUID();

  const s4Id =
    crypto.randomUUID();

  const s1 =
    await kv.get(
      `session:${s1Id}`
    );

  const s1Status =
    s1?.status ||
    "available";

  journey.sessions = [
    {
      id: s1Id,
      number: 1,
      status: s1Status,
    },

    {
      id: s2Id,
      number: 2,
      status:
        s1Status ===
        "completed"
          ? "available"
          : "locked",
    },

    {
      id: s3Id,
      number: 3,
      status: "locked",
    },

    {
      id: s4Id,
      number: 4,
      status: "locked",
    },
  ];

  for (
    const session of
    journey.sessions.slice(1)
  ) {
    const existing =
      await kv.get(
        `session:${session.id}`
      );

    if (!existing) {
      await kv.set(
        `session:${session.id}`,
        {
          id: session.id,

          journeyId:
            journey.id,

          sessionNumber:
            session.number,

          status:
            session.status,

          currentStep: 1,

          createdAt:
            new Date().toISOString(),
        }
      );

      await kv.set(
        `board:${session.id}`,
        EMPTY_S2_BOARD
      );
    }
  }

  await kv.set(
    `journey:${journey.id}`,
    journey
  );

  return journey;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — CLEANUP TEST DATA
// ─────────────────────────────────────────────────────────────────────────────
//
// This endpoint removes:
//   - Journey records
//   - Session records
//   - Session boards
//   - Facilitator journey indexes
//   - Participant journey indexes
//
// It DOES NOT delete Supabase Auth users.
//
// Authentication uses:
//   X-Cleanup-Token
//
// The token is stored in Supabase Edge Function secrets as:
//   CLEANUP_TOKEN
//
// ─────────────────────────────────────────────────────────────────────────────

app.delete(
  `${P}/admin/cleanup-test-data`,
  async (c) => {
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
              "Unauthorized",
          },
          401
        );
      }

      console.log(
        "[cleanup] Starting test data cleanup..."
      );

      // ─────────────────────────────────────────
      // Find all journeys
      // ─────────────────────────────────────────

      const journeyEntries =
        await kv.getEntriesByPrefix(
          "journey:"
        );

      const journeyKeys =
        journeyEntries.map(
          (entry) => entry.key
        );

      console.log(
        `[cleanup] Found ${journeyEntries.length} journeys`
      );

      // ─────────────────────────────────────────
      // Find all sessions
      // ─────────────────────────────────────────

      const sessionEntries =
        await kv.getEntriesByPrefix(
          "session:"
        );

      const sessionKeys =
        sessionEntries.map(
          (entry) => entry.key
        );

      console.log(
        `[cleanup] Found ${sessionEntries.length} sessions`
      );

      // ─────────────────────────────────────────
      // Find all boards
      // ─────────────────────────────────────────

      const boardEntries =
        await kv.getEntriesByPrefix(
          "board:"
        );

      const boardKeys =
        boardEntries.map(
          (entry) => entry.key
        );

      console.log(
        `[cleanup] Found ${boardEntries.length} boards`
      );

      // ─────────────────────────────────────────
      // Find facilitator indexes
      // ─────────────────────────────────────────

      const facilitatorEntries =
        await kv.getEntriesByPrefix(
          "facilitator:"
        );

      const facilitatorKeys =
        facilitatorEntries.map(
          (entry) => entry.key
        );

      console.log(
        `[cleanup] Found ${facilitatorEntries.length} facilitator indexes`
      );

      // ─────────────────────────────────────────
      // Find participant indexes
      // ─────────────────────────────────────────

      const participantEntries =
        await kv.getEntriesByPrefix(
          "participant_email:"
        );

      const participantKeys =
        participantEntries.map(
          (entry) => entry.key
        );

      console.log(
        `[cleanup] Found ${participantEntries.length} participant indexes`
      );

      // ─────────────────────────────────────────
      // Delete journeys
      // ─────────────────────────────────────────

      let deletedJourneys = 0;

      if (
        journeyKeys.length > 0
      ) {
        await kv.mdel(
          journeyKeys
        );

        deletedJourneys =
          journeyKeys.length;
      }

      // ─────────────────────────────────────────
      // Delete sessions
      // ─────────────────────────────────────────

      let deletedSessions = 0;

      if (
        sessionKeys.length > 0
      ) {
        await kv.mdel(
          sessionKeys
        );

        deletedSessions =
          sessionKeys.length;
      }

      // ─────────────────────────────────────────
      // Delete boards
      // ─────────────────────────────────────────

      let deletedBoards = 0;

      if (
        boardKeys.length > 0
      ) {
        await kv.mdel(
          boardKeys
        );

        deletedBoards =
          boardKeys.length;
      }

      // ─────────────────────────────────────────
      // Delete facilitator indexes
      // ─────────────────────────────────────────

      let deletedFacilitatorIndexes =
        0;

      if (
        facilitatorKeys.length >
        0
      ) {
        await kv.mdel(
          facilitatorKeys
        );

        deletedFacilitatorIndexes =
          facilitatorKeys.length;
      }

      // ─────────────────────────────────────────
      // Delete participant indexes
      // ─────────────────────────────────────────

      let deletedParticipantIndexes =
        0;

      if (
        participantKeys.length >
        0
      ) {
        await kv.mdel(
          participantKeys
        );

        deletedParticipantIndexes =
          participantKeys.length;
      }

      console.log(
        "[cleanup] Cleanup completed successfully."
      );

      return c.json({
        success: true,

        deleted: {
          journeys:
            deletedJourneys,

          sessions:
            deletedSessions,

          boards:
            deletedBoards,

          facilitatorIndexes:
            deletedFacilitatorIndexes,

          participantIndexes:
            deletedParticipantIndexes,
        },

        authUsersDeleted: 0,
      });
    } catch (e) {
      console.error(
        "[cleanup] Cleanup error:",
        e
      );

      return c.json(
        {
          success: false,
          error: String(e),
        },
        500
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// JOURNEYS — CREATE
// ─────────────────────────────────────────────────────────────────────────────

app.post(
  `${P}/journeys`,
  async (c) => {
    try {
      const {
        title,
        description,
        facilitatorId,
        facilitatorEmail,
        sessionNumber,
      } = await c.req.json();

      if (
        !title ||
        !facilitatorId
      ) {
        return c.json(
          {
            error:
              "Missing required fields",
          },
          400
        );
      }

      const selectedSessionNumber =
        Number(
          sessionNumber
        ) || 1;

      if (
        !Number.isInteger(
          selectedSessionNumber
        ) ||
        selectedSessionNumber <
          1 ||
        selectedSessionNumber >
          4
      ) {
        return c.json(
          {
            error:
              "Session number must be between 1 and 4",
          },
          400
        );
      }

      const journeyId =
        crypto.randomUUID();

      const sessionIds = {
        1: crypto.randomUUID(),
        2: crypto.randomUUID(),
        3: crypto.randomUUID(),
        4: crypto.randomUUID(),
      };

      const sessions =
        [1, 2, 3, 4].map(
          (number) => ({
            id:
              sessionIds[
                number as
                  | 1
                  | 2
                  | 3
                  | 4
              ],

            number,

            status:
              number ===
              selectedSessionNumber
                ? "available"
                : "locked",
          })
        );

      const selectedSession =
        sessions.find(
          (session) =>
            session.number ===
            selectedSessionNumber
        );

      if (
        !selectedSession
      ) {
        return c.json(
          {
            error:
              "Unable to create selected session",
          },
          500
        );
      }

      const journey = {
        id: journeyId,

        title:
          title.trim(),

        description:
          description?.trim() ||
          "",

        facilitatorId,

        facilitatorEmail:
          facilitatorEmail ||
          "",

        participantEmail:
          null,

        participants: [],

        status: "active",

        sessionId:
          selectedSession.id,

        startingSessionNumber:
          selectedSessionNumber,

        sessions,

        createdAt:
          new Date().toISOString(),
      };

      await kv.set(
        `journey:${journeyId}`,
        journey
      );

      for (
        const session of sessions
      ) {
        await kv.set(
          `session:${session.id}`,
          {
            id: session.id,

            journeyId,

            sessionNumber:
              session.number,

            status:
              session.status,

            currentStep: 1,

            createdAt:
              new Date().toISOString(),
          }
        );

        await kv.set(
          `board:${session.id}`,
          session.number === 1
            ? EMPTY_S1_BOARD
            : EMPTY_S2_BOARD
        );
      }

      const facilitatorJourneys: string[] =
        (await kv.get(
          `facilitator:${facilitatorId}:journeys`
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
          `facilitator:${facilitatorId}:journeys`,
          facilitatorJourneys
        );
      }

      return c.json({
        success: true,

        journey,

        sessionId:
          selectedSession.id,

        session: {
          id:
            selectedSession.id,

          number:
            selectedSession.number,

          label:
            `Session ${selectedSession.number}`,

          status:
            selectedSession.status,
        },
      });
    } catch (e) {
      console.error(
        "Create journey error:",
        e
      );

      return c.json(
        {
          error: String(e),
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
  async (c) => {
    try {
      const userId =
        c.req.param(
          "userId"
        );

      const journeyIds: string[] =
        (await kv.get(
          `facilitator:${userId}:journeys`
        )) || [];

      console.log(
        `[facilitator-journeys] userId=${userId} indexedCount=${journeyIds.length}`
      );

      const journeys = [];

      for (
        const id of journeyIds
      ) {
        let journey =
          await kv.get(
            `journey:${id}`
          );

        if (!journey) {
          console.log(
            `[facilitator-journeys] journey ${id} missing from KV — skipping`
          );

          continue;
        }

        if (
          journey.facilitatorId !==
          userId
        ) {
          console.log(
            `[facilitator-journeys] REJECT journey ${id}`
          );

          continue;
        }

        journey =
          await ensureJourneySessions(
            journey
          );

        journeys.push(
          journey
        );
      }

      return c.json({
        success: true,

        journeys:
          journeys.reverse(),
      });
    } catch (e) {
      return c.json(
        {
          error: String(e),
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
  async (c) => {
    try {
      const email =
        decodeURIComponent(
          c.req.param(
            "email"
          )
        );

      const journeyIds: string[] =
        (await kv.get(
          `participant_email:${email}:journeys`
        )) || [];

      const journeys = [];

      for (
        const id of journeyIds
      ) {
        let journey =
          await kv.get(
            `journey:${id}`
          );

        if (!journey) {
          continue;
        }

        const isLinked =
          (journey.participants ||
            []
          ).some(
            (p: any) =>
              p.email ===
              email
          ) ||
          journey.participantEmail ===
            email;

        if (!isLinked) {
          continue;
        }

        journey =
          await ensureJourneySessions(
            journey
          );

        journeys.push(
          journey
        );
      }

      return c.json({
        success: true,

        journeys:
          journeys.reverse(),
      });
    } catch (e) {
      return c.json(
        {
          error: String(e),
        },
        500
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// JOURNEYS — SINGLE
// ─────────────────────────────────────────────────────────────────────────────

app.get(
  `${P}/journeys/:id`,
  async (c) => {
    try {
      let journey =
        await kv.get(
          `journey:${c.req.param(
            "id"
          )}`
        );

      if (!journey) {
        return c.json(
          {
            error:
              "Journey not found",
          },
          404
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
    } catch (e) {
      return c.json(
        {
          error: String(e),
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
  async (c) => {
    try {
      const journeyId =
        c.req.param("id");

      const {
        participantEmail,
      } = await c.req.json();

      if (
        !participantEmail
      ) {
        return c.json(
          {
            error:
              "Participant email required",
          },
          400
        );
      }

      let journey =
        await kv.get(
          `journey:${journeyId}`
        );

      if (!journey) {
        return c.json(
          {
            error:
              "Journey not found",
          },
          404
        );
      }

      journey =
        await ensureJourneySessions(
          journey
        );

      const email =
        participantEmail
          .trim()
          .toLowerCase();

      if (!journey.participants) {
        journey.participants =
          [];
      }

      if (
        journey.participants.some(
          (p: any) =>
            p.email === email
        )
      ) {
        return c.json(
          {
            error: `${email} is already linked to this journey`,
          },
          400
        );
      }

      journey.participants.push(
        {
          email,

          linkedAt:
            new Date().toISOString(),
        }
      );

      journey.participantEmail =
        email;

      await kv.set(
        `journey:${journeyId}`,
        journey
      );

      const participantJourneys: string[] =
        (await kv.get(
          `participant_email:${email}:journeys`
        )) || [];

      if (
        !participantJourneys.includes(
          journeyId
        )
      ) {
        participantJourneys.push(
          journeyId
        );

        await kv.set(
          `participant_email:${email}:journeys`,
          participantJourneys
        );
      }

      return c.json({
        success: true,
        journey,
      });
    } catch (e) {
      return c.json(
        {
          error: String(e),
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
  async (c) => {
    try {
      const id =
        c.req.param("id");

      const session =
        await kv.get(
          `session:${id}`
        );

      if (!session) {
        return c.json(
          {
            error:
              "Session not found",
          },
          404
        );
      }

      let journey =
        await kv.get(
          `journey:${session.journeyId}`
        );

      if (journey) {
        journey =
          await ensureJourneySessions(
            journey
          );
      }

      const previousBoards: Record<
        number,
        any
      > = {};

      if (
        journey?.sessions &&
        session.sessionNumber >
          1
      ) {
        for (
          const sessionItem of
            journey.sessions
        ) {
          if (
            sessionItem.number <
            session.sessionNumber
          ) {
            const board =
              await kv.get(
                `board:${sessionItem.id}`
              );

            if (board) {
              previousBoards[
                sessionItem.number
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
    } catch (e) {
      return c.json(
        {
          error: String(e),
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
  async (c) => {
    try {
      const id =
        c.req.param("id");

      const state =
        await kv.get(
          `board:${id}`
        );

      const session =
        await kv.get(
          `session:${id}`
        );

      const defaultBoard =
        session?.sessionNumber ===
        1
          ? EMPTY_S1_BOARD
          : EMPTY_S2_BOARD;

      return c.json({
        success: true,

        state:
          state ||
          defaultBoard,
      });
    } catch (e) {
      return c.json(
        {
          error: String(e),
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
  async (c) => {
    try {
      const id =
        c.req.param("id");

      const { state } =
        await c.req.json();

      await kv.set(
        `board:${id}`,
        {
          ...state,

          updatedAt:
            new Date().toISOString(),
        }
      );

      if (
        state.currentStep
      ) {
        const session =
          await kv.get(
            `session:${id}`
          );

        if (session) {
          session.currentStep =
            state.currentStep;

          session.updatedAt =
            new Date().toISOString();

          await kv.set(
            `session:${id}`,
            session
          );
        }
      }

      return c.json({
        success: true,
      });
    } catch (e) {
      return c.json(
        {
          error: String(e),
        },
        500
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS — UPDATE STATUS
// ─────────────────────────────────────────────────────────────────────────────

app.put(
  `${P}/sessions/:id/status`,
  async (c) => {
    try {
      const sessionId =
        c.req.param("id");

      const { status } =
        await c.req.json();

      const session =
        await kv.get(
          `session:${sessionId}`
        );

      if (!session) {
        return c.json(
          {
            error:
              "Session not found",
          },
          404
        );
      }

      session.status =
        status;

      session.updatedAt =
        new Date().toISOString();

      await kv.set(
        `session:${sessionId}`,
        session
      );

      let journey =
        await kv.get(
          `journey:${session.journeyId}`
        );

      if (!journey) {
        return c.json({
          success: true,
        });
      }

      journey =
        await ensureJourneySessions(
          journey
        );

      const index =
        journey.sessions.findIndex(
          (s: any) =>
            s.id === sessionId
        );

      if (index !== -1) {
        journey.sessions[
          index
        ].status = status;

        // When a session is completed,
        // unlock the next session.
        if (
          status === "completed"
        ) {
          if (
            index + 1 <
            journey.sessions.length
          ) {
            const nextSession =
              journey.sessions[
                index + 1
              ];

            if (
              nextSession.status ===
              "locked"
            ) {
              nextSession.status =
                "available";

              const nextSessionRecord =
                await kv.get(
                  `session:${nextSession.id}`
                );

              if (
                nextSessionRecord
              ) {
                nextSessionRecord.status =
                  "available";

                nextSessionRecord.updatedAt =
                  new Date().toISOString();

                await kv.set(
                  `session:${nextSession.id}`,
                  nextSessionRecord
                );
              }
            }
          }

          // Session 4 completed
          if (index === 3) {
            journey.status =
              "completed";
          }
        }
      }

      await kv.set(
        `journey:${session.journeyId}`,
        journey
      );

      return c.json({
        success: true,
        journey,
      });
    } catch (e) {
      return c.json(
        {
          error: String(e),
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