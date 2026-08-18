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

const RESEND_API_KEY =
  Deno.env.get("RESEND_API_KEY") ?? "";

const EMAIL_FROM =
  Deno.env.get("EMAIL_FROM") ??
  "Zuva Life <onboarding@resend.dev>";

const APP_URL =
  Deno.env.get("APP_URL") ??
  "http://localhost:5173";

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL HELPERS
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
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body style="
  margin:0;
  padding:0;
  background:#EBE2D6;
  font-family:Arial,Helvetica,sans-serif;
  color:#2C1810;
">

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  style="background:#EBE2D6;"
>
<tr>
<td align="center" style="padding:40px 16px;">

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  style="
    max-width:600px;
    background:#ffffff;
    border-radius:20px;
    overflow:hidden;
  "
>

<tr>
<td style="
  background:#4A1C5C;
  padding:28px 32px;
  color:#ffffff;
">

<div style="
  font-size:24px;
  font-weight:bold;
">
Zuva Life
</div>

<div style="
  margin-top:5px;
  font-size:14px;
  opacity:.85;
">
Zest Journey
</div>

</td>
</tr>

<tr>
<td style="
  padding:36px 32px;
">
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
    console.warn(
      "[email] RESEND_API_KEY is not configured."
    );

    return {
      success: false,
      error:
        "RESEND_API_KEY is not configured",
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

        body: JSON.stringify(
          payload
        ),
      }
    );

    const result =
      await response.json();

    if (!response.ok) {
      console.error(
        "[email] Resend error:",
        result
      );

      return {
        success: false,
        error:
          result?.message ||
          "Failed to send email",
      };
    }

    console.log(
      `[email] Email sent to ${to}`
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error(
      "[email] Email error:",
      error
    );

    return {
      success: false,
      error: String(error),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION INFORMATION
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_NAMES: Record<
  number,
  string
> = {
  1: "Identity Discovery",
  2: "Identities In Reality",
  3: "Future Self Exploration",
  4: "Integration & Next Steps",
};

// ─────────────────────────────────────────────────────────────────────────────
// PDF HELPERS
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
    if (prefix) {
      lines.push(
        `${prefix}: ${String(value)}`
      );
    } else {
      lines.push(
        String(value)
      );
    }

    return lines;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return lines;
    }

    value.forEach(
      (item, index) => {
        if (
          typeof item === "string" ||
          typeof item === "number" ||
          typeof item === "boolean"
        ) {
          lines.push(
            `${prefix || "Item"} ${index + 1}: ${String(item)}`
          );
        } else {
          lines.push(
            `${prefix || "Item"} ${index + 1}`
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
          key === "updatedAt"
        ) {
          return;
        }

        if (
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
          typeof child ===
            "object"
        ) {
          lines.push(
            label
          );

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

  const linesPerPage = Math.floor(
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

  if (pages.length === 0) {
    pages.push([]);
  }

  const objects: string[] = [];

  // Object 1 — Catalog
  objects.push(
    "<< /Type /Catalog /Pages 2 0 R >>"
  );

  // Page object numbers
  const pageObjectNumbers: number[] =
    [];

  const fontObjectNumber = 3;
  const firstPageObject = 4;

  pages.forEach(
    (_page, index) => {
      pageObjectNumbers.push(
        firstPageObject +
          index * 2
      );
    }
  );

  const kids =
    pageObjectNumbers
      .map(
        (number) =>
          `${number} 0 R`
      )
      .join(" ");

  // Object 2 — Pages
  objects.push(
    `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`
  );

  // Object 3 — Font
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

      let stream =
        "BT\n";

      stream +=
        "/F1 11 Tf\n";

      stream +=
        `${marginX} ${topY} Td\n`;

      for (
        const line of pageLines
      ) {
        // PDF Helvetica doesn't support
        // arbitrary Unicode reliably.
        // Remove unsupported characters.
        const safe =
          line
            .replace(
              /[^\x20-\x7E]/g,
              ""
            )
            .slice(
              0,
              105
            );

        stream +=
          `(${pdfEscape(
            safe
          )}) Tj\n`;

        stream +=
          `0 -${lineHeight} Td\n`;
      }

      stream +=
        "ET";

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
    binary += String.fromCharCode(
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

// ─────────────────────────────────────────────────────────────────────────────
// REPORT DATA
// ─────────────────────────────────────────────────────────────────────────────

async function buildSessionReport(
  session: any,
  journey: any,
  board: any
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
    journey.participantEmail ||
    journey.participants?.[0]
      ?.email ||
    "Participant";

  const lines: string[] = [];

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
// AUTOMATIC SESSION REPORT EMAIL
// ─────────────────────────────────────────────────────────────────────────────

async function sendAutomaticSessionReportEmail(
  session: any,
  journey: any
) {
  // Prevent duplicate automatic emails.
  // Once a report has successfully been sent,
  // reportEmailSentAt is stored on the session.
  if (
    session.reportEmailSentAt
  ) {
    console.log(
      `[session-report] Report already emailed for session ${session.id}. Skipping duplicate email.`
    );

    return {
      success: true,
      skipped: true,
      alreadySent: true,
      sentAt:
        session.reportEmailSentAt,
    };
  }

  const participantEmail =
    journey.participantEmail ||
    journey.participants?.[0]
      ?.email;

  if (
    !participantEmail
  ) {
    console.warn(
      "[session-report] No participant email found."
    );

    return {
      success: false,
      skipped: true,
      error:
        "No participant email found.",
    };
  }

  try {
    const board =
      (await kv.get(
        `board:${session.id}`
      )) || {};

    const report =
      await buildSessionReport(
        session,
        journey,
        board
      );

    const pdf =
      createPdf(
        report.lines
      );

    const base64 =
      uint8ToBase64(
        pdf
      );

    const emailResult =
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
                — ${escapeHtml(
                  report.sessionName
                )}
              </strong>.
            </p>

            <p style="
              font-size:16px;
              line-height:1.7;
            ">
              Your personal session report
              is attached to this email.
            </p>

            <div style="
              margin:28px 0;
              padding:20px;
              background:#F7F3EE;
              border-radius:14px;
              border:1px solid #EBE2D6;
            ">

              <strong style="
                color:#4A1C5C;
              ">
                ${escapeHtml(
                  journey.title
                )}
              </strong>

              <br>

              <span style="
                color:#6B625D;
              ">
                Session ${
                  session.sessionNumber
                }
                —
                ${escapeHtml(
                  report.sessionName
                )}
              </span>

            </div>

            <p style="
              font-size:15px;
              line-height:1.7;
              color:#6B625D;
            ">
              Keep this report as
              a reflection of the
              work you've done and
              the insights you've
              uncovered.
            </p>

            <p style="
              margin-top:28px;
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

    if (
      !emailResult.success
    ) {
      console.warn(
        `[session-report] Email failed: ${emailResult.error}`
      );

      return {
        success: false,
        skipped: false,
        error:
          emailResult.error ||
          "Failed to send report email.",
      };
    }

    // Only mark the report as sent after
    // Resend confirms successful delivery.
    session.reportEmailSentAt =
      new Date().toISOString();

    await kv.set(
      `session:${session.id}`,
      session
    );

    console.log(
      `[session-report] Report emailed successfully to ${participantEmail}`
    );

    return {
      success: true,
      skipped: false,
      alreadySent: false,
      email:
        participantEmail,
      sentAt:
        session.reportEmailSentAt,
    };
  } catch (error) {
    console.error(
      "[session-report] Error:",
      error
    );

    return {
      success: false,
      skipped: false,
      error: String(error),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH
// ─────────────────────────────────────────────────────────────────────────────

app.get(
  `${P}/health`,
  (c) => {
    return c.json({
      status: "ok",
      ts: new Date().toISOString(),
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// AUTH — SIGNUP
// ─────────────────────────────────────────────────────────────────────────────

app.post(
  `${P}/auth/signup`,
  async (c) => {
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
            error:
              "Missing required fields",
          },
          400
        );
      }

      const supabase =
        createClient(
          Deno.env.get(
            "SUPABASE_URL"
          ) ?? "",

          Deno.env.get(
            "SUPABASE_SERVICE_ROLE_KEY"
          ) ?? ""
        );

      const {
        data,
        error,
      } =
        await supabase.auth.admin.createUser(
          {
            email,
            password,

            user_metadata: {
              name: fullName,
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

          email,

          fullName,

          role,

          createdAt:
            new Date().toISOString(),
        }
      );

      // ─────────────────────────────────────────
      // WELCOME EMAIL
      // ─────────────────────────────────────────

      const firstName =
        fullName
          .trim()
          .split(" ")[0] ||
        "there";

      const welcomeEmail =
        await sendEmail({
          to: email,

          subject:
            "Welcome to Zest Journey",

          html:
            emailLayout(`
              <h1 style="
                margin:0 0 16px;
                color:#4A1C5C;
                font-size:28px;
              ">
                Welcome, ${escapeHtml(
                  firstName
                )}!
              </h1>

              <p style="
                font-size:16px;
                line-height:1.7;
              ">
                Thank you for creating
                your Zest Journey account.
              </p>

              <p style="
                font-size:16px;
                line-height:1.7;
              ">
                Your account is now ready.
                You can sign in and begin
                exploring your journey.
              </p>

              <div style="
                margin:28px 0;
                text-align:center;
              ">
                <a
                  href="${APP_URL}"
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
                  Open Zest Journey
                </a>
              </div>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#6B625D;
              ">
                We look forward to
                accompanying you through
                your journey.
              </p>

              <p style="
                margin-top:28px;
                font-size:15px;
              ">
                Warmly,<br>
                <strong>Zuva Life</strong>
              </p>
            `),
        });

      if (
        !welcomeEmail.success
      ) {
        console.warn(
          "[signup] Welcome email failed:",
          welcomeEmail.error
        );
      }

      return c.json({
        success: true,

        user: {
          id:
            data.user.id,

          email:
            data.user.email,

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
          error:
            String(e),
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
  async (c) => {
    try {
      const authorization =
        c.req.header(
          "Authorization"
        ) ?? "";

      const accessToken =
        authorization.startsWith(
          "Bearer "
        )
          ? authorization
              .slice(7)
              .trim()
          : "";

      if (!accessToken) {
        return c.json(
          {
            error:
              "No access token",
          },
          401
        );
      }

      const supabase =
        createClient(
          Deno.env.get(
            "SUPABASE_URL"
          ) ?? "",

          Deno.env.get(
            "SUPABASE_ANON_KEY"
          ) ?? ""
        );

      const {
        data: { user },
        error,
      } =
        await supabase.auth.getUser(
          accessToken
        );

      if (
        error ||
        !user
      ) {
        return c.json(
          {
            error:
              "Invalid token",
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
          id:
            user.id,

          email:
            user.email,

          fullName:
            userData?.fullName ||
            user.user_metadata
              ?.name,

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
          error:
            String(e),
        },
        500
      );
    }
  }
);

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
        s1Status === "completed"
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
          id:
            session.id,

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

      const journeyEntries =
        await kv.getEntriesByPrefix(
          "journey:"
        );

      const journeyKeys =
        journeyEntries.map(
          (entry) =>
            entry.key
        );

      const sessionEntries =
        await kv.getEntriesByPrefix(
          "session:"
        );

      const sessionKeys =
        sessionEntries.map(
          (entry) =>
            entry.key
        );

      const boardEntries =
        await kv.getEntriesByPrefix(
          "board:"
        );

      const boardKeys =
        boardEntries.map(
          (entry) =>
            entry.key
        );

      const facilitatorEntries =
        await kv.getEntriesByPrefix(
          "facilitator:"
        );

      const facilitatorKeys =
        facilitatorEntries.map(
          (entry) =>
            entry.key
        );

      const participantEntries =
        await kv.getEntriesByPrefix(
          "participant_email:"
        );

      const participantKeys =
        participantEntries.map(
          (entry) =>
            entry.key
        );

      if (
        journeyKeys.length > 0
      ) {
        await kv.mdel(
          journeyKeys
        );
      }

      if (
        sessionKeys.length > 0
      ) {
        await kv.mdel(
          sessionKeys
        );
      }

      if (
        boardKeys.length > 0
      ) {
        await kv.mdel(
          boardKeys
        );
      }

      if (
        facilitatorKeys.length > 0
      ) {
        await kv.mdel(
          facilitatorKeys
        );
      }

      if (
        participantKeys.length > 0
      ) {
        await kv.mdel(
          participantKeys
        );
      }

      console.log(
        "[cleanup] Cleanup completed successfully."
      );

      return c.json({
        success: true,

        deleted: {
          journeys:
            journeyKeys.length,

          sessions:
            sessionKeys.length,

          boards:
            boardKeys.length,

          facilitatorIndexes:
            facilitatorKeys.length,

          participantIndexes:
            participantKeys.length,
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
          error:
            String(e),
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
        selectedSessionNumber < 1 ||
        selectedSessionNumber > 4
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
        id:
          journeyId,

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

        status:
          "active",

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
            id:
              session.id,

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
          error:
            String(e),
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
            `[facilitator-journeys] journey ${id} missing`
          );

          continue;
        }

        if (
          journey.facilitatorId !==
          userId
        ) {
          console.log(
            `[facilitator-journeys] rejected journey ${id}`
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
      console.error(
        "Facilitator journeys error:",
        e
      );

      return c.json(
        {
          error:
            String(e),
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
        )
          .trim()
          .toLowerCase();

      const journeyIds: string[] =
        (await kv.get(
          `participant_email:${email}:journeys`
        )) || [];

      const journeys = [];

      const validJourneyIds: string[] =
        [];

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
          (
            journey.participants ||
            []
          ).some(
            (p: any) =>
              String(
                p.email
              )
                .trim()
                .toLowerCase() ===
              email
          ) ||
          String(
            journey.participantEmail ||
              ""
          )
            .trim()
            .toLowerCase() ===
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

        validJourneyIds.push(
          id
        );
      }

      if (
        validJourneyIds.length !==
        journeyIds.length
      ) {
        await kv.set(
          `participant_email:${email}:journeys`,
          validJourneyIds
        );
      }

      return c.json({
        success: true,

        journeys:
          journeys.reverse(),
      });
    } catch (e) {
      console.error(
        "Participant journeys error:",
        e
      );

      return c.json(
        {
          error:
            String(e),
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
  async (c) => {
    try {
      const journeyId =
        c.req.param("id");

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

      return c.json({
        success: true,
        journey,
      });
    } catch (e) {
      console.error(
        "Get journey error:",
        e
      );

      return c.json(
        {
          error:
            String(e),
        },
        500
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// JOURNEYS — DELETE SINGLE
// ─────────────────────────────────────────────────────────────────────────────

app.delete(
  `${P}/journeys/:id`,
  async (c) => {
    try {
      const journeyId =
        c.req.param("id");

      if (!journeyId) {
        return c.json(
          {
            error:
              "Journey ID is required",
          },
          400
        );
      }

      console.log(
        `[delete-journey] Starting deletion for ${journeyId}`
      );

      const journey =
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
          .filter(
            (id: string) =>
              Boolean(id)
          );

      let deletedBoards = 0;

      for (
        const sessionId of
        sessionIds
      ) {
        const board =
          await kv.get(
            `board:${sessionId}`
          );

        if (
          board !== undefined &&
          board !== null
        ) {
          await kv.del(
            `board:${sessionId}`
          );

          deletedBoards++;
        }
      }

      let deletedSessions = 0;

      for (
        const sessionId of
        sessionIds
      ) {
        const session =
          await kv.get(
            `session:${sessionId}`
          );

        if (
          session !== undefined &&
          session !== null
        ) {
          await kv.del(
            `session:${sessionId}`
          );

          deletedSessions++;
        }
      }

      let facilitatorIndexUpdated =
        false;

      if (
        journey.facilitatorId
      ) {
        const facilitatorKey =
          `facilitator:${journey.facilitatorId}:journeys`;

        const facilitatorJourneys: string[] =
          (await kv.get(
            facilitatorKey
          )) || [];

        const filtered =
          facilitatorJourneys.filter(
            (id: string) =>
              id !== journeyId
          );

        if (
          filtered.length !==
          facilitatorJourneys.length
        ) {
          await kv.set(
            facilitatorKey,
            filtered
          );

          facilitatorIndexUpdated =
            true;
        }
      }

      let participantIndexesUpdated =
        0;

      const participantEmails =
        new Set<string>();

      if (
        journey.participantEmail
      ) {
        participantEmails.add(
          String(
            journey.participantEmail
          )
            .trim()
            .toLowerCase()
        );
      }

      for (
        const participant of
        journey.participants ||
        []
      ) {
        if (
          participant?.email
        ) {
          participantEmails.add(
            String(
              participant.email
            )
              .trim()
              .toLowerCase()
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

        const filtered =
          participantJourneys.filter(
            (id: string) =>
              id !== journeyId
          );

        if (
          filtered.length !==
          participantJourneys.length
        ) {
          await kv.set(
            participantKey,
            filtered
          );

          participantIndexesUpdated++;
        }
      }

      await kv.del(
        `journey:${journeyId}`
      );

      console.log(
        `[delete-journey] Successfully deleted ${journeyId}`
      );

      return c.json({
        success: true,

        message:
          "Journey deleted successfully.",

        deleted: {
          journey: 1,

          sessions:
            deletedSessions,

          boards:
            deletedBoards,

          facilitatorIndex:
            facilitatorIndexUpdated
              ? 1
              : 0,

          participantIndexes:
            participantIndexesUpdated,
        },
      });
    } catch (e) {
      console.error(
        "[delete-journey] Error:",
        e
      );

      return c.json(
        {
          success: false,

          error:
            "Failed to delete journey.",

          details:
            String(e),
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
            String(
              p.email
            )
              .trim()
              .toLowerCase() ===
            email
        )
      ) {
        return c.json(
          {
            error:
              `${email} is already linked to this journey`,
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

      // ─────────────────────────────────────────
      // INVITATION EMAIL
      // ─────────────────────────────────────────

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
                You're invited to a
                Zest Journey
              </h1>

              <p style="
                font-size:16px;
                line-height:1.7;
              ">
                You have been invited to
                join a Zest Journey with
                Zuva Life.
              </p>

              <div style="
                background:#F7F3EE;
                border:1px solid #EBE2D6;
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
                Your journey is now
                available in your
                participant dashboard.
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
                We look forward to
                accompanying you through
                your journey.
              </p>

              <p style="
                margin-top:28px;
                font-size:15px;
              ">
                Warmly,<br>
                <strong>Zuva Life</strong>
              </p>
            `),
        });

      if (
        !invitationEmail.success
      ) {
        console.warn(
          "[journey-link] Invitation email failed:",
          invitationEmail.error
        );
      }

      return c.json({
        success: true,
        journey,
      });
    } catch (e) {
      console.error(
        "Link participant error:",
        e
      );

      return c.json(
        {
          error:
            String(e),
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
        session.sessionNumber > 1
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
      console.error(
        "Get session error:",
        e
      );

      return c.json(
        {
          error:
            String(e),
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
      console.error(
        "Get board error:",
        e
      );

      return c.json(
        {
          error:
            String(e),
        },
        500
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS — REPORT PDF
// ─────────────────────────────────────────────────────────────────────────────

app.get(
  `${P}/sessions/:id/report`,
  async (c) => {
    try {
      const sessionId =
        c.req.param("id");

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

      const journey =
        await kv.get(
          `journey:${session.journeyId}`
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

      const board =
        (await kv.get(
          `board:${sessionId}`
        )) || {};

      const report =
        await buildSessionReport(
          session,
          journey,
          board
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
    } catch (e) {
      console.error(
        "Generate report error:",
        e
      );

      return c.json(
        {
          error:
            String(e),
        },
        500
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS — EMAIL REPORT
// ─────────────────────────────────────────────────────────────────────────────

app.post(
  `${P}/sessions/:id/report/email`,
  async (c) => {
    try {
      const sessionId =
        c.req.param("id");

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

      const journey =
        await kv.get(
          `journey:${session.journeyId}`
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

      const participantEmail =
        journey.participantEmail ||
        journey.participants?.[0]
          ?.email;

      if (
        !participantEmail
      ) {
        return c.json(
          {
            error:
              "No participant email found.",
          },
          400
        );
      }

      const board =
        (await kv.get(
          `board:${sessionId}`
        )) || {};

      const report =
        await buildSessionReport(
          session,
          journey,
          board
        );

      const pdf =
        createPdf(
          report.lines
        );

      const base64 =
        uint8ToBase64(
          pdf
        );

      const emailResult =
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
                Your session report
                is ready
              </h1>

              <p style="
                font-size:16px;
                line-height:1.7;
              ">
                Your completed
                <strong>
                  Session ${session.sessionNumber}
                  — ${escapeHtml(
                    report.sessionName
                  )}
                </strong>
                report is ready.
              </p>

              <div style="
                background:#F7F3EE;
                border:1px solid #EBE2D6;
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
                  font-size:19px;
                  font-weight:bold;
                  color:#4A1C5C;
                ">
                  ${escapeHtml(
                    journey.title
                  )}
                </div>

              </div>

              <p style="
                font-size:16px;
                line-height:1.7;
              ">
                We've attached your
                session report as a PDF
                so you can keep it and
                revisit your reflections
                whenever you'd like.
              </p>

              <p style="
                font-size:15px;
                line-height:1.7;
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

      if (
        !emailResult.success
      ) {
        return c.json(
          {
            success: false,

            error:
              emailResult.error ||
              "Failed to send report email.",
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
    } catch (e) {
      console.error(
        "Email report error:",
        e
      );

      return c.json(
        {
          success: false,

          error:
            String(e),
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

      if (!state) {
        return c.json(
          {
            error:
              "Board state is required",
          },
          400
        );
      }

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
      console.error(
        "Save board error:",
        e
      );

      return c.json(
        {
          error:
            String(e),
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

      if (
        index !== -1
      ) {
        journey.sessions[
          index
        ].status =
          status;

        if (
          status ===
          "completed"
        ) {
          // ─────────────────────────────────────
          // Unlock next session
          // ─────────────────────────────────────

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

          // ─────────────────────────────────────
          // Complete journey if Session 4
          // ─────────────────────────────────────

          if (
            index === 3
          ) {
            journey.status =
              "completed";
          }
        }
      }

      await kv.set(
        `journey:${session.journeyId}`,
        journey
      );

      // ─────────────────────────────────────────
      // AUTOMATIC SESSION REPORT EMAIL
      // ─────────────────────────────────────────

      let reportEmailResult:
        | any
        | null = null;

      if (
        status ===
        "completed"
      ) {
        reportEmailResult =
          await sendAutomaticSessionReportEmail(
            session,
            journey
          );
      }

      return c.json({
        success: true,

        journey,

        reportEmail:
          reportEmailResult,
      });
    } catch (e) {
      console.error(
        "Update session status error:",
        e
      );

      return c.json(
        {
          error:
            String(e),
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