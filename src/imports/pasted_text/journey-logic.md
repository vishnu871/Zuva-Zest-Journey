The prompt is very long, so I'd actually recommend structuring it as **two sections in one prompt**:

### PART 1 — Journey Orchestration & Session Progression Logic

(Paste this first)

```text
JOURNEY ORCHESTRATION AND SESSION PROGRESSION LOGIC

Before implementing Session 2 activities, first implement and verify the complete Zest Journey lifecycle.

A Journey contains:

- Session 1
- Session 2
- Session 3
- Session 4

JOURNEY CREATION

When a facilitator creates a new journey and invites a participant:

Journey Status:
- Active

Session Statuses:
- Session 1 → Available
- Session 2 → Locked
- Session 3 → Locked
- Session 4 → Locked

The participant must always start with Session 1.

Participants must never access future locked sessions.

SESSION PROGRESSION

When Session 1 is completed:
- Session 1 → Completed
- Session 2 → Available
- Session 3 → Locked
- Session 4 → Locked

When Session 2 is completed:
- Session 1 → Completed
- Session 2 → Completed
- Session 3 → Available
- Session 4 → Locked

When Session 3 is completed:
- Session 1 → Completed
- Session 2 → Completed
- Session 3 → Completed
- Session 4 → Available

When Session 4 is completed:
- Journey Status → Completed

SESSION STATES

Support:
- Locked
- Available
- In Progress
- Completed

PARTICIPANT VIEW

Display all four sessions with status indicators.

Locked sessions must not be accessible.

FACILITATOR VIEW

Facilitators can:
- Start available sessions
- Resume in-progress sessions
- Review completed sessions

SESSION COMPLETION

When facilitator clicks End Session:
- Save all session data
- Mark current session as Completed
- Unlock next session automatically

DATA CARRY FORWARD

Session 1 outputs → Session 2
Session 2 outputs → Session 3
Session 3 outputs → Session 4

Participants should never be asked to re-enter information already captured in previous sessions.

PERSISTENCE

Refreshing the page must not lose progress.

Reopening a journey must restore:
- Session statuses
- Session outputs
- Reflections
- Notes
- Cards
- Progress
```

---

### PART 2 — Session 2: The Life Board – Identities in Reality

```text
BUILD SESSION 2 – THE LIFE BOARD: IDENTITIES IN REALITY

Session 2 occurs approximately 10 days after Session 1.

Purpose:

Help participants evaluate how their selected identities fit into the reality of their lives.

The participant performs all activities.

The facilitator guides the conversation, observes progress in real time, assists when needed, and reviews completed boards.

All actions must:
- Auto-save
- Persist
- Synchronize in real time

STEP 1 — RE-ENTRY

Prompt:
"What stayed with you?"

Participant can:
- Create sticky notes
- Edit sticky notes
- Delete sticky notes
- Move sticky notes

Facilitator can:
- Observe
- Guide discussion
- Assist participant

STEP 2 — IDENTITY SELECTION

Prompt:
"Choose the two identities you would like to explore more deeply today."

Requirements:
- Load selected identities from Session 1
- Display as visual identity cards
- Participant selects exactly 2 identities
- Selected cards highlighted
- Prevent continuing until 2 identities selected
- Auto-save

STEP 3 — IDENTITY A: IDENTITY BRIDGE

Display Identity A.

Prompt:
"Imagine stepping into this life. What about this identity draws you in?"

Participant:
- Creates reflection sticky notes
- Edits notes
- Deletes notes
- Moves notes

STEP 4 — IDENTITY A: ENERGY THERMOMETER

Display a large vertical thermometer.

Zones:
- Energising
- Grounding
- Draining

Participant:
- Drags Identity A card onto thermometer
- Positions card at desired level
- Adjusts placement if needed

Save exact placement.

Restore exact placement when reopening.

STEP 5 — IDENTITY A: LIFE REALITY GRID

Create a collaborative workspace with three zones:

1. Assets
2. Actions
3. Challenges

ASSETS

Display asset cards:

- Functional Expertise
- High-Trust Network
- Deep Industry Experience
- Credibility with Senior Leaders
- Ecosystem Knowledge
- Facilitation and Teaching Ability
- Low-Burn Lifestyle Flexibility
- Thought Leadership Potential
- Professional Infrastructure
- Professional Reputation
- Digital Tools and Platforms
- Ability to Mentor and Develop People
- Natural Authority in a Room
- Community Trust
- Access to Capital
- Personal Financial Cushion

Also include:

"Add Your Own Asset"

Participant:
- Drags asset cards into workspace
- Removes asset cards
- Reorders asset cards
- Creates custom asset cards
- Edits custom assets
- Deletes custom assets

ACTIONS

Prompt:
"Imagine a Tuesday morning at 10 AM in this life. What are you doing?"

Participant:
- Creates action sticky notes
- Edits notes
- Deletes notes
- Moves notes

CHALLENGES

Prompt:
"What might test this path?"

Participant:
- Creates challenge sticky notes
- Edits notes
- Deletes notes
- Moves notes

STEP 6 — IDENTITY B: IDENTITY BRIDGE

Repeat Identity Bridge experience for Identity B.

STEP 7 — IDENTITY B: ENERGY THERMOMETER

Repeat thermometer experience for Identity B.

Participant drags Identity B onto:
- Energising
- Grounding
- Draining

Save exact placement.

STEP 8 — IDENTITY B: LIFE REALITY GRID

Repeat:
- Assets
- Actions
- Challenges

All functionality from Identity A must be available.

STEP 9 — ALIGNMENT REFLECTION

Display Identity A and Identity B side by side.

Prompt:

- Which identity fits your life most naturally right now?
- Which one energises you more?
- Which one fits your current pace of life?
- Which one feels sustainable?

Participant:
- Creates reflection sticky notes
- Compares identities
- Selects most aligned identity

SESSION COMPLETION

Display visual summary:

- Selected identities
- Assets
- Actions
- Challenges
- Energy placements
- Alignment reflections

Facilitator can:
- End Session
- Save final state
- Review session later

REAL-TIME COLLABORATION

- Participant sees facilitator actions instantly
- Facilitator sees participant actions instantly
- Presence indicators
- Auto-save
- Session restoration

FACILITATOR PERMISSIONS

Facilitator can:
- Open Session 2
- Navigate steps
- Add sticky notes
- Edit participant notes
- Delete participant notes
- Move participant notes
- Assist participant
- End session
- Review completed sessions

PARTICIPANT PERMISSIONS

Participant can:
- Complete activities
- Create reflections
- Select identities
- Select assets
- Create custom assets
- Create actions
- Create challenges
- Resume incomplete sessions
- Review completed sessions in read-only mode

DESIGN REQUIREMENTS

Follow Zuva Life Design System.

Use:
- Identity Cards
- Asset Cards
- Sticky Notes
- Thermometer Component
- Drag-and-Drop Interactions
- Visual Reflection Workspaces
- Side-by-Side Comparison Layouts

Do NOT build as:
- Forms
- Surveys
- Checkbox lists
- Radio button lists
- Textarea-heavy screens

Maintain the collaborative workshop experience.

CRITICAL APPLICATION REQUIREMENTS

- No page breakdowns
- No dead links
- No blank pages
- No placeholder screens
- No broken navigation
- No runtime errors
- No console errors
- No failed API requests

Every clickable element must perform its intended action.

RESPONSIVENESS

Fully responsive on:
- Mobile
- Tablet
- Desktop

Support:
- Mobile drag-and-drop
- Tablet drag-and-drop
- Touch interactions

No overflow.
No clipped content.
No horizontal scrolling.

All Session 2 functionality must work across all screen sizes.
```
