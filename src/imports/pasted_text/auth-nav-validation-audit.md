CRITICAL AUTHENTICATION, ROLE MANAGEMENT, NAVIGATION & VALIDATION AUDIT

Stop applying small patches.

Perform a complete audit and rebuild of authentication, role routing, navigation mapping, and form validation.

Do not redesign the UI.

Do not modify branding, colors, typography, layouts, spacing, illustrations, or visual styling.

Focus only on fixing application logic, authentication, navigation, validation, and routing.

CURRENT ISSUES

1. Participant users are still redirected to the Facilitator Dashboard after login.
2. View Journeys opens Create Journey instead of Journeys.
3. Create Journey was incorrectly added to the sidebar.
4. Navigation architecture does not match intended product structure.
5. Route mappings are incorrect or duplicated.
6. Password and Confirm Password validation is not working correctly.

ROLE ROUTING AUDIT

Audit the complete authentication flow.

Verify:

* Role selected during signup.
* Role stored in database.
* Role retrieved during login.
* Role used for dashboard redirect.

Add temporary debug logs:

* Selected role
* Saved role
* Retrieved role
* Redirect destination

Required Logic:

If role = facilitator
→ Redirect to /facilitator/dashboard

If role = participant
→ Redirect to /participant/dashboard

No hardcoded redirects.

No default redirect to facilitator dashboard.

No fallback routing.

DATABASE AUDIT

Inspect users table.

Verify:

* Facilitator accounts are stored as role = facilitator
* Participant accounts are stored as role = participant

If participant accounts are being saved as facilitator, fix the signup logic immediately.

AUTHENTICATION REQUIREMENTS

Verify:

* Facilitator Signup works
* Facilitator Login works
* Participant Signup works
* Participant Login works
* Forgot Password works
* Session persistence works
* Supabase authentication works

Use existing Supabase project:

Build Production Ready App

PASSWORD VALIDATION FIX

Current Issue:

The system allows account creation even when Password and Confirm Password do not match.

Requirements:

* Password and Confirm Password must match exactly.
* If they do not match, prevent account creation completely.
* Do not create users in Supabase when passwords differ.
* Show validation message:

"Passwords do not match"

* Highlight both fields with error state.
* Remove error immediately after values match.

Validation Rules:

Password:

* Required
* Minimum 8 characters

Confirm Password:

* Required
* Must exactly match Password

Before signup verify:

1. Password exists
2. Confirm Password exists
3. Password === Confirm Password

Only then allow account creation.

Apply to:

* Facilitator Signup
* Participant Signup

FORM VALIDATION AUDIT

Verify:

* Full Name updates state correctly.
* Email updates state correctly.
* Password updates state correctly.
* Confirm Password updates state correctly.

Validation should:

* Trigger only for invalid values.
* Clear immediately after valid input.
* Never display errors when values are valid.

NAVIGATION ARCHITECTURE AUDIT

Rebuild navigation structure correctly.

FACILITATOR SIDEBAR SHOULD CONTAIN ONLY:

* Dashboard
* Journeys
* Sessions
* Reports
* Profile
* Sign Out

REMOVE:

* Create Journey sidebar item

Create Journey is an action, not primary navigation.

JOURNEYS PAGE

Must contain:

* View All Journeys
* Search
* Filters
* Journey Cards
* Create Journey Button

Navigation Flow:

Sidebar → Journeys
→ Opens Journeys Page

Journeys Page
→ Create Journey Button
→ Opens Create Journey Page

View Journeys must NEVER open Create Journey.

CREATE JOURNEY PAGE

Separate page.

Accessible only through:

* Create Journey button
* CTA actions

Not from sidebar navigation.

SIDEBAR FIX

Requirements:

* Sidebar height = 100vh
* Navigation area scrollable
* Account section pinned to bottom
* Sign Out always visible
* No scrolling required to access Sign Out

Structure:

Sidebar
├── Logo
├── User Profile
├── Navigation Menu
│
│ Dashboard
│ Journeys
│ Sessions
│ Reports
│ Profile
│
└── Account Section
├── User Info
├── Role
└── Sign Out

Recommended Implementation:

* Flex column layout
* Navigation uses flex-grow
* Account section uses margin-top:auto

CODE QUALITY AUDIT

Inspect and fix:

* Undefined variables
* ReferenceErrors
* TypeErrors
* Missing imports
* Missing state declarations
* Broken event handlers
* Invalid React Hook Form usage
* Broken Supabase integration
* Broken redirects
* Broken navigation mappings
* Invalid route definitions

SUCCESS CRITERIA

Facilitator Signup
→ Account Created
→ Login
→ Facilitator Dashboard

Participant Signup
→ Account Created
→ Login
→ Participant Dashboard

Password Mismatch
→ Show error
→ Prevent account creation

Journeys
→ Journeys Page

Create Journey Button
→ Create Journey Page

Sidebar
→ No Create Journey menu item

Sign Out
→ Always visible

Final Result:

* No runtime errors
* No incorrect dashboard redirects
* No role mapping issues
* No password validation issues
* No broken navigation
* No duplicated routes
* No authentication failures
* No sidebar usability issues
* Fully functional production-ready authentication and navigation flow
