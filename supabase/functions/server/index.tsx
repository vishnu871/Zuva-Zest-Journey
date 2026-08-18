import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();
app.use("*", logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

const P = "/make-server-dc18f5b2";

// ─── Health ───────────────────────────────────────────────────────────────────

app.get(`${P}/health`, (c) => c.json({ status: "ok", ts: new Date().toISOString() }));

// ─── Auth ─────────────────────────────────────────────────────────────────────

app.post(`${P}/auth/signup`, async (c) => {
  try {
    const { email, password, fullName, role } = await c.req.json();
    if (!email || !password || !fullName || !role) return c.json({ error: "Missing required fields" }, 400);
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const { data, error } = await supabase.auth.admin.createUser({
      email, password, user_metadata: { name: fullName, role }, email_confirm: true,
    });
    if (error) return c.json({ error: error.message }, 400);
    await kv.set(`user:${data.user.id}`, { id: data.user.id, email, fullName, role, createdAt: new Date().toISOString() });
    return c.json({ success: true, user: { id: data.user.id, email: data.user.email, fullName, role } });
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.post(`${P}/auth/verify-role`, async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    if (!accessToken) return c.json({ error: "No access token" }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return c.json({ error: "Invalid token" }, 401);
    const userData = await kv.get(`user:${user.id}`);
    const role = userData?.role || user.user_metadata?.role;
    return c.json({ success: true, user: { id: user.id, email: user.email, fullName: userData?.fullName || user.user_metadata?.name, role } });
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const EMPTY_S2_BOARD = { currentStep: 1 };

// Migrate old journey (single sessionId) to new 4-session format
async function ensureJourneySessions(journey: any) {
  if (journey.sessions && journey.sessions.length === 4) return journey;

  // Old format — create sessions 2-4
  const s1Id = journey.sessionId;
  const s2Id = crypto.randomUUID();
  const s3Id = crypto.randomUUID();
  const s4Id = crypto.randomUUID();

  // Get session 1 status
  const s1 = await kv.get(`session:${s1Id}`);
  const s1Status = s1?.status || "available";

  journey.sessions = [
    { id: s1Id, number: 1, status: s1Status },
    { id: s2Id, number: 2, status: s1Status === "completed" ? "available" : "locked" },
    { id: s3Id, number: 3, status: "locked" },
    { id: s4Id, number: 4, status: "locked" },
  ];

  // Create the new session KV records and empty boards
  for (const sess of journey.sessions.slice(1)) {
    const existing = await kv.get(`session:${sess.id}`);
    if (!existing) {
      await kv.set(`session:${sess.id}`, {
        id: sess.id, journeyId: journey.id, sessionNumber: sess.number,
        status: sess.status, currentStep: 1, createdAt: new Date().toISOString(),
      });
      await kv.set(`board:${sess.id}`, EMPTY_S2_BOARD);
    }
  }

  await kv.set(`journey:${journey.id}`, journey);
  return journey;
}

// ─── Journeys ─────────────────────────────────────────────────────────────────

app.post(`${P}/journeys`, async (c) => {
  try {
    const { title, description, facilitatorId, facilitatorEmail } = await c.req.json();
    if (!title || !facilitatorId) return c.json({ error: "Missing required fields" }, 400);

    const journeyId = crypto.randomUUID();
    const s1Id = crypto.randomUUID();
    const s2Id = crypto.randomUUID();
    const s3Id = crypto.randomUUID();
    const s4Id = crypto.randomUUID();

    const journey = {
      id: journeyId, title, description: description || "",
      facilitatorId, facilitatorEmail: facilitatorEmail || "",
      participantEmail: null, participants: [],
      status: "active",
      sessionId: s1Id, // backward compat pointer to session 1
      sessions: [
        { id: s1Id, number: 1, status: "available" },
        { id: s2Id, number: 2, status: "locked" },
        { id: s3Id, number: 3, status: "locked" },
        { id: s4Id, number: 4, status: "locked" },
      ],
      createdAt: new Date().toISOString(),
    };

    await kv.set(`journey:${journeyId}`, journey);

    // Create session records
    for (const s of journey.sessions) {
      await kv.set(`session:${s.id}`, {
        id: s.id, journeyId, sessionNumber: s.number, status: s.status,
        currentStep: 1, createdAt: new Date().toISOString(),
      });
      await kv.set(`board:${s.id}`, s.number === 1 ? EMPTY_S1_BOARD : EMPTY_S2_BOARD);
    }

    const facilitatorJourneys: string[] = (await kv.get(`facilitator:${facilitatorId}:journeys`)) || [];
    if (!facilitatorJourneys.includes(journeyId)) {
      facilitatorJourneys.push(journeyId);
      await kv.set(`facilitator:${facilitatorId}:journeys`, facilitatorJourneys);
    }

    return c.json({ success: true, journey, sessionId: s1Id });
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.get(`${P}/journeys/facilitator/:userId`, async (c) => {
  try {
    const userId = c.req.param("userId");
    const journeyIds: string[] = (await kv.get(`facilitator:${userId}:journeys`)) || [];

    console.log(`[facilitator-journeys] userId=${userId} indexedCount=${journeyIds.length}`);

    const journeys = [];
    for (const id of journeyIds) {
      let j = await kv.get(`journey:${id}`);
      if (!j) {
        console.log(`[facilitator-journeys] journey ${id} missing from KV — skipping`);
        continue;
      }

      // Ownership check: the KV index may contain stale IDs from other facilitators
      // or migrated test data. The facilitatorId field is the authoritative source.
      if (j.facilitatorId !== userId) {
        console.log(`[facilitator-journeys] REJECT journey ${id}: facilitatorId=${j.facilitatorId} !== requestedUserId=${userId}`);
        continue;
      }

      j = await ensureJourneySessions(j);
      journeys.push(j);
    }

    console.log(`[facilitator-journeys] returning ${journeys.length} owned journeys for userId=${userId}`);
    return c.json({ success: true, journeys: journeys.reverse() });
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.get(`${P}/journeys/participant/:email`, async (c) => {
  try {
    const email = decodeURIComponent(c.req.param("email"));
    const journeyIds: string[] = (await kv.get(`participant_email:${email}:journeys`)) || [];

    console.log(`[participant-journeys] email=${email} indexedCount=${journeyIds.length}`);

    const journeys = [];
    for (const id of journeyIds) {
      let j = await kv.get(`journey:${id}`);
      if (!j) {
        console.log(`[participant-journeys] journey ${id} missing from KV — skipping`);
        continue;
      }

      // Verify this participant is actually linked to the journey
      const isLinked = (j.participants || []).some((p: any) => p.email === email) || j.participantEmail === email;
      if (!isLinked) {
        console.log(`[participant-journeys] REJECT journey ${id}: ${email} not in participants list`);
        continue;
      }

      j = await ensureJourneySessions(j);
      journeys.push(j);
    }

    console.log(`[participant-journeys] returning ${journeys.length} linked journeys for ${email}`);
    return c.json({ success: true, journeys: journeys.reverse() });
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.get(`${P}/journeys/:id`, async (c) => {
  try {
    let j = await kv.get(`journey:${c.req.param("id")}`);
    if (!j) return c.json({ error: "Journey not found" }, 404);
    j = await ensureJourneySessions(j);
    return c.json({ success: true, journey: j });
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.post(`${P}/journeys/:id/link`, async (c) => {
  try {
    const journeyId = c.req.param("id");
    const { participantEmail } = await c.req.json();
    if (!participantEmail) return c.json({ error: "Participant email required" }, 400);
    let journey = await kv.get(`journey:${journeyId}`);
    if (!journey) return c.json({ error: "Journey not found" }, 404);
    journey = await ensureJourneySessions(journey);
    const email = participantEmail.trim().toLowerCase();
    if (!journey.participants) journey.participants = [];
    if (journey.participants.some((p: any) => p.email === email))
      return c.json({ error: `${email} is already linked to this journey` }, 400);
    journey.participants.push({ email, linkedAt: new Date().toISOString() });
    journey.participantEmail = email;
    await kv.set(`journey:${journeyId}`, journey);
    const pj: string[] = (await kv.get(`participant_email:${email}:journeys`)) || [];
    if (!pj.includes(journeyId)) { pj.push(journeyId); await kv.set(`participant_email:${email}:journeys`, pj); }
    return c.json({ success: true, journey });
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

// ─── Sessions ─────────────────────────────────────────────────────────────────

app.get(`${P}/sessions/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const session = await kv.get(`session:${id}`);
    if (!session) return c.json({ error: "Session not found" }, 404);

    let journey = await kv.get(`journey:${session.journeyId}`);
    if (journey) journey = await ensureJourneySessions(journey);

    // Include previous session board states for data carry-forward
    const previousBoards: Record<number, any> = {};
    if (journey?.sessions && session.sessionNumber > 1) {
      for (const s of journey.sessions) {
        if (s.number < session.sessionNumber) {
          const board = await kv.get(`board:${s.id}`);
          if (board) previousBoards[s.number] = board;
        }
      }
    }

    return c.json({ success: true, session, journey, previousBoards });
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.get(`${P}/sessions/:id/board`, async (c) => {
  try {
    const id = c.req.param("id");
    const state = await kv.get(`board:${id}`);
    const session = await kv.get(`session:${id}`);
    const defaultBoard = session?.sessionNumber === 1 ? EMPTY_S1_BOARD : EMPTY_S2_BOARD;
    return c.json({ success: true, state: state || defaultBoard });
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.put(`${P}/sessions/:id/board`, async (c) => {
  try {
    const id = c.req.param("id");
    const { state } = await c.req.json();
    await kv.set(`board:${id}`, { ...state, updatedAt: new Date().toISOString() });
    if (state.currentStep) {
      const session = await kv.get(`session:${id}`);
      if (session) {
        session.currentStep = state.currentStep;
        session.updatedAt = new Date().toISOString();
        await kv.set(`session:${id}`, session);
      }
    }
    return c.json({ success: true });
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.put(`${P}/sessions/:id/status`, async (c) => {
  try {
    const sessionId = c.req.param("id");
    const { status } = await c.req.json();
    const session = await kv.get(`session:${sessionId}`);
    if (!session) return c.json({ error: "Session not found" }, 404);

    session.status = status;
    session.updatedAt = new Date().toISOString();
    await kv.set(`session:${sessionId}`, session);

    let journey = await kv.get(`journey:${session.journeyId}`);
    if (journey) {
      journey = await ensureJourneySessions(journey);

      // Update the matching session entry in journey.sessions
      const idx = journey.sessions.findIndex((s: any) => s.id === sessionId);
      if (idx !== -1) {
        journey.sessions[idx].status = status;

        if (status === "completed") {
          // Unlock the next session
          if (idx + 1 < journey.sessions.length) {
            // Only unlock if it's currently locked (don't downgrade)
            if (journey.sessions[idx + 1].status === "locked") {
              journey.sessions[idx + 1].status = "available";
              // Update the next session's KV record too
              const nextSession = await kv.get(`session:${journey.sessions[idx + 1].id}`);
              if (nextSession) {
                nextSession.status = "available";
                await kv.set(`session:${journey.sessions[idx + 1].id}`, nextSession);
              }
            }
          }
          // If last session completed, mark journey done
          if (idx === 3) {
            journey.status = "completed";
          }
        }
      }

      await kv.set(`journey:${session.journeyId}`, journey);
      return c.json({ success: true, journey });
    }

    return c.json({ success: true });
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

Deno.serve(app.fetch);
