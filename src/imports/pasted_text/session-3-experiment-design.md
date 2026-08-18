# BUILD SESSION 3 – EXPERIMENT DESIGN

Before implementing Session 3, ensure the **Journey Orchestration and Session Progression Logic** is already implemented.

A Journey contains:

* Session 1
* Session 2
* Session 3
* Session 4

When Session 2 is completed:

* Session 2 → Completed
* Session 3 → Available
* Session 4 → Locked

When a facilitator selects **Session 3** from the Session Selector dropdown, load only the **Session 3 board**.

Do **not** display Session 1 or Session 2 activities.

---

# SESSION GOAL

Help participants design small, low-risk, real-world experiments that allow them to experience their Anchor Identity before making larger life decisions.

The participant performs all activities.

The facilitator guides the discussion, observes participant progress in real time, navigates through each step, assists when required, and reviews completed work.

All participant actions must:

* Auto-save
* Synchronize in real time
* Persist after refresh
* Restore when the session is reopened

---

# STEP 1 — RECALIBRATION

## Screen Title

**A Moment to Reconsider**

Automatically load:

* Anchor Identity selected in Session 2
* Identity card

Display the facilitator prompt:

> **Does the Anchor Identity still feel right?**

Display two response buttons:

* **Yes**
* **No**

The participant must select one before continuing.

### If participant selects **Yes**

Display the facilitator follow-up question:

> **What has strengthened your confidence in this identity since Session 2?**

Participant can:

* Create reflection sticky note
* Edit sticky note
* Delete sticky note
* Move sticky note

### If participant selects **No**

Display the facilitator follow-up question:

> **What has shifted since Session 2?**

Participant can:

* Create reflection sticky note
* Edit sticky note
* Delete sticky note
* Move sticky note

Display:

> **Would you like to choose another Anchor Identity from your shortlisted identities?**

Load the shortlisted identities from Session 2.

Allow the participant to choose another Anchor Identity.

If changed:

Update the Anchor Identity for the remainder of Session 3.

### Facilitator Actions

* Ask the recalibration question.
* Observe the participant's Yes/No response in real time.
* Observe participant reflections.
* Guide the discussion.
* Assist when required.

### Data Saved

* Yes/No response
* Reflection sticky note
* Updated Anchor Identity (if changed)

---

# STEP 2 — EXPERIMENT DESIGN

## Goal

Design small, low-risk experiments that help the participant explore the Anchor Identity.

Create a collaborative bubble-map workspace similar to the Session 3 Miro board.

Display three experiment tiers.

---

## Observe

**Low Friction**

Estimated effort:

**Under 2 Hours**

Purpose:

Observe the world of this identity.

---

## Converse

**Medium Engagement**

Estimated effort:

**Half Day**

Purpose:

Speak with people already living this identity.

---

## Act

**High Stakes**

Estimated effort:

**Full Day or Public Action**

Purpose:

Take real action aligned with the identity.

---

Display a gallery containing **20 predefined experiment cards**.

Participant can:

* Drag experiment cards into Observe
* Drag experiment cards into Converse
* Drag experiment cards into Act
* Move experiment cards between tiers
* Reorder experiment cards
* Remove experiment cards

Facilitator can:

* Guide participant discussion
* Observe participant choices in real time
* Assist participant when required

### Data Saved

Experiment card IDs assigned to:

* Observe
* Converse
* Act

---

# STEP 3 — FRICTION MAPPING

Automatically load:

Challenge sticky notes from Session 2.

Display:

* Observe experiments
* Converse experiments
* Act experiments

Display a visual Energy Thermometer.

Sections:

* Energising
* Grounding
* Draining

Participant can:

* Drag challenge sticky notes onto the related experiment.
* Map one challenge to multiple experiments.
* Create additional challenge sticky notes.
* Edit challenge sticky notes.
* Delete challenge sticky notes.
* Move challenge sticky notes.

Facilitator can:

* Observe challenge mappings.
* Guide participant reflection.
* Assist participant if required.

### Data Saved

* Challenge-to-experiment mappings
* Additional challenge sticky notes

---

# STEP 4 — FIRST STEP COMMITMENT

Display the commitment template:

> **By [Date] I will take [X] actions related to being a [Anchor Identity].**

Automatically populate:

* Anchor Identity

Allow editing of:

* Date
* Number of actions

Display the facilitator prompt:

> **How does taking this first step feel?**

Participant can:

* Create optional reflection sticky note
* Edit sticky note
* Delete sticky note
* Move sticky note

Facilitator can:

* Guide participant in creating the commitment.
* Update the commitment date if required.
* Update the number of actions if required.
* Review participant reflection.

### Data Saved

* Commitment statement
* Commitment date
* Number of actions
* Optional reflection sticky note

---

# SESSION COMPLETION

When the facilitator clicks **End Session**:

Automatically:

* Save all participant work.
* Mark Session 3 as Completed.
* Unlock Session 4.
* Generate the Session 3 Summary.
* Store all outputs for Session 4.

---

# REAL-TIME COLLABORATION

Participant sees facilitator actions instantly.

Facilitator sees participant actions instantly.

Synchronize:

* Sticky notes
* Experiment cards
* Challenge mappings
* Identity selection
* Commitment statement
* Session progress

Auto-save after every interaction.

Restore the complete session state when reopened.

---

# FACILITATOR PERMISSIONS

Facilitator can:

* Open Session 3.
* Navigate through all four steps.
* Observe participant activity.
* Add sticky notes on behalf of the participant.
* Edit participant sticky notes.
* Delete participant sticky notes.
* Move participant sticky notes.
* Guide the discussion.
* End Session 3.
* Review completed Session 3 boards.

---

# PARTICIPANT PERMISSIONS

Participant can:

* Complete all Session 3 activities.
* Select Yes or No during recalibration.
* Change Anchor Identity if required.
* Drag experiment cards.
* Create, edit, move, and delete sticky notes.
* Map challenges to experiments.
* Complete the commitment statement.
* Resume incomplete sessions.
* Review completed Session 3 in read-only mode.

---

# DESIGN REQUIREMENTS

Follow the Zuva Life Design System.

Use:

* Playfair Display for headings.
* Inter for body text.
* Zuva colour palette.

Maintain consistency with Session 1 and Session 2.

Replicate the collaborative Miro-style workshop experience.

Use:

* Sticky notes
* Draggable experiment cards
* Bubble-map layouts
* Interactive workspaces
* Energy thermometer
* Large collaborative canvas

Do **not** build Session 3 as:

* Traditional forms
* Survey pages
* Checkbox lists
* Radio button forms
* Long text areas

The experience should feel like an interactive coaching workshop rather than filling out forms.

---

# CRITICAL APPLICATION REQUIREMENTS

This is a production-ready application.

* No page breakdowns.
* No dead links.
* No blank pages.
* No placeholder pages.
* No "Coming Soon" screens.
* No broken navigation.
* No non-functional buttons.
* No runtime errors.
* No console errors.
* No failed API requests.
* No circular redirects.

Every clickable element must perform its intended action.

Every button must work.

Every drag-and-drop interaction must work correctly.

Every facilitator action must function correctly.

Every participant action must function correctly.

All session data must persist correctly and restore correctly after refresh or reopening the session.

---

# RESPONSIVENESS

Session 3 must be fully responsive on:

* Desktop
* Tablet
* Mobile

Requirements:

* Responsive collaborative boards.
* Responsive experiment cards.
* Responsive sticky notes.
* Touch-friendly drag-and-drop.
* Mobile drag-and-drop support.
* Tablet drag-and-drop support.
* No clipped content.
* No content overflow.
* No horizontal scrolling.

The complete Session 3 experience must work seamlessly across desktop, tablet, and mobile devices.
