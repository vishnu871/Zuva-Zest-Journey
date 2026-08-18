1. REDESIGN THE STICKY NOTE EXPERIENCE

The current sticky notes do not resemble real sticky notes. They currently appear as rounded input cards with text fields, which does not match the collaborative Miro-style workshop experience we want throughout the Zest Journey.

Redesign the sticky note component used throughout Sessions 1, 2, 3, and 4.

Visual Design
Replace the current rounded cards with realistic square sticky notes.
Use a subtle paper texture or paper-like appearance.
Sticky size approximately 120–150px × 120–150px on desktop.
Slightly rounded corners (6–8px).
Soft drop shadow:
0 6px 18px rgba(0,0,0,0.12)
Add a subtle folded corner effect.
Allow a slight random rotation (±1–2°) to make the board feel natural.
While dragging, slightly enlarge the sticky and increase its shadow.
Colours

Support realistic sticky-note colours:

Light Green
Light Yellow
Peach
Light Blue
Lavender

Allow different colours to improve visual grouping.

Typography
Font: Inter
15–16px
Medium weight
Dark gray text
Comfortable line spacing
Text wraps naturally.
Editing

Do not display a separate text input box.

Instead:

Double-click a sticky note to edit it.
The sticky itself becomes editable.
Press Enter or click outside to save.
Drag & Drop

Sticky notes must behave exactly like Miro:

Free dragging anywhere.
No snapping.
Overlapping allowed.
Smooth drag animation.
Touch drag on tablet and mobile.
Position is saved automatically.
Hover State

When hovering:

Shadow increases.
Cursor changes to grab.
Sticky lifts slightly.
While Dragging
Cursor changes to grabbing.
Sticky scales to approximately 1.03.
Sticky stays above all other elements.
Sticky Actions

Each sticky should support:

Edit
Duplicate
Delete
Change colour

Display these actions as small floating icons in the top-right corner of the sticky.

Sticky Stack

Replace the current "Add Another Note" section.

Instead, create a realistic Sticky Note Stack positioned on the right side of every collaborative board.

When the participant clicks the stack:

A new sticky note is created.
It appears beside the stack.
The participant drags it anywhere on the board.

This should feel similar to Miro.

Board Behaviour

Sticky notes should never be restricted to rows or grids.

Participants should be able to arrange them freely across the board.

The board should feel like a real collaborative workshop.

Responsiveness

Desktop

120–150px notes

Tablet

110px notes

Mobile

90–100px notes
Fully touch draggable
Easy editing

Apply this improved sticky note component consistently across all collaborative workshop boards in Sessions 1–4.

2. FIX THE FACILITATOR SESSIONS PAGE

The Sessions page is currently displaying hardcoded demo sessions and placeholder data instead of the facilitator's actual journeys.

Remove all fake sessions and placeholder information.

Do NOT display example workshops such as:

Session 6: Mapping Your Future
Tomorrow
Virtual
35 Participants
Sample dates
Demo participant counts

These should never appear.

Data Source

The Sessions page must display only real sessions created by the logged-in facilitator.

The source of truth should be the journeys created from the Journeys page.

Whenever a facilitator:

Creates a Journey
Invites Participants
Starts a Session
Completes a Session

The Sessions page must automatically update.

No manual refresh should be required.

Session Cards

Each session card should display only real information.

Display:

Journey Name
Session Number
Current Session (1–4)
Participant Name(s)
Participant Count
Status
Session Date
Session Time
Progress
Facilitator Name

Never display placeholder values.

Status Logic

If Session 1 has not started

Status = Scheduled

If Session 1 is currently running

Status = Active

If Session 1 is completed

Unlock Session 2 according to the existing journey progression rules.

Continue similarly through Session 3 and Session 4.

After Session 4

Status = Completed.

Navigation

Clicking a session card should always open the correct session board.

Example:

Journey A

→ Session 1

Journey B

→ Session 2

Journey C

→ Session 4

The board opened must always match that journey's current session.

Empty State

If no journeys or sessions exist, display:

No sessions available yet

Provide a button:

Create Journey

This button should navigate directly to the Journey creation page.

Do not generate fake data.

REAL-TIME SYNCHRONIZATION

Whenever:

A journey is created
A participant is invited
A session is started
A session is completed
Sticky notes are created, edited, deleted, or moved

Both participant and facilitator must immediately see the changes in real time.

All interactions should be auto-saved and restored when reopening the session.

PRODUCTION REQUIREMENTS

This is a production-ready application.

No page breakdowns.
No dead links.
No blank pages.
No placeholder pages.
No "Coming Soon" screens.
No hardcoded demo data.
No duplicate sessions.
No fake participant counts.
No fake workshop names.
No broken navigation.
No runtime errors.
No console errors.
No failed API requests.
Every clickable element must perform its intended action.
Every button must work.
Every sticky note must function correctly.
Every session displayed must correspond to a real journey created by the logged-in facilitator.
The Sessions page must always remain synchronized with the facilitator's actual journey data.
The sticky note experience should closely match a real Miro collaborative board across desktop, tablet, and mobile.