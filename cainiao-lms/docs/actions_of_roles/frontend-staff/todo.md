# Frontend A: Staff Pages

## Mission

Build and maintain the staff-facing Handlebars pages so a station worker can receive, find, shelve, notify, pick up, and handle parcels without confusion.

## Start here in this project

`cainiao-lms` ships a **working framework with empty feature modules**. The framework boots,
you can sign in, and the role guards work. Everything listed as yours is either missing or a
stub, so read the plan below as *what to build*, not as an audit of something that exists.

The mechanic you will use constantly: each unimplemented route is one `stubPage({ ... })` call
in `routes/`, and its `needs` list is the acceptance list for that page. Replace the call, then
fill in the view. `docs/module-map.md` lists every page with its route, view, and owner.

Your six views exist but contain only `{{> stub}}`, and the routes behind them answer HTTP 501.
Delete the `{{> stub}}` line and write the markup.

The "Do not invent a template variable" rule still holds, but the *target* variables are listed
for you in the `stubPage({ ... })` calls in `routes/staff.js` - the stub routes pass nothing yet,
so agree the names with Backend B before you build a page that uses them.

## Your files

Everything below is already in the folder. **Nobody else edits these files.** This list is your
claim - there is no issue tracker to claim against instead, so treat it as the rule.

| File | Now | What you do |
| --- | --- | --- |
| `views/staff/dashboard.hbs` | placeholder | Delete `{{> stub}}` and build the dashboard. |
| `views/staff/packages.hbs` | placeholder | Delete `{{> stub}}` and build the parcel list with filters and paging. |
| `views/staff/package-form.hbs` | placeholder | Delete `{{> stub}}` and build the single and batch intake forms. |
| `views/staff/package-detail.hbs` | placeholder | Delete `{{> stub}}` and build the detail page, its actions, and the timeline. |
| `views/staff/shelves.hbs` | placeholder | Delete `{{> stub}}` and build the shelf board. |
| `views/staff/exceptions.hbs` | placeholder | Delete `{{> stub}}` and build the exception board. |

**Not yours - ask the owner before you touch these:**

| File | Owner |
| --- | --- |
| `routes/staff.js` | Backend B and C |
| `public/css/style.css`, `views/partials/` | UI/UX |
| `views/client/`, `views/admin/` | Frontend B and C |

## You do not own

- Do not change routes without Backend B approval.
- Do not change JSON fields without Backend B and the manager.
- Do not put package state transitions inside the browser. The server owns the lifecycle.
- Do not edit customer or admin views unless the manager assigns that work to you.
- Do not add a chart library or frontend framework.

## Inputs you need before coding

Get these from the manager and backend owners:

- The frozen route, field, and template-variable contract: `docs/module-map.md`
- Form field names from `docs/data-dictionary.md` (the manager writes it)
- The template variables are already listed per view in `docs/module-map.md`
- Status colors from `docs/ui-guidelines.md`

## Pages and user goals

| Page | User goal |
| --- | --- |
| Staff dashboard | Understand the current workload quickly |
| Parcel list | Find the right parcel and open an action |
| Receive parcels | Create one parcel or many parcels |
| Parcel detail | Complete the next valid lifecycle action |
| Shelves | See capacity and maintain shelf state |
| Exceptions | Report and resolve problem parcels |

## Step-by-step work

### Step 1: Get the project running


Take the project folder from the manager and work in your own copy of it.

Two rules keep the shared folder safe:

1. One person owns one file. Never edit a file another person owns, and never edit a file that
   is not on your file list above.
2. Before you change anything, copy the whole `data/` folder (and any file you are about to
   edit) into `snapshots/<YYYY-MM-DD>/`. There is no version control here, so that copy is your
   only undo.

```powershell
cd <the project folder>
npm install
npm run dev
```

Open `http://localhost:3000` and sign in as `staff01` with password `123456`.

Expected result: `/staff/dashboard` opens. It answers **HTTP 501** until you build it - that
placeholder is your starting point.
### Step 2: Read the server before editing the page

Open `routes/staff.js`.

For every page you will change, write down:

- Route path
- Template name passed to `res.render`
- Every variable passed to the template
- Every form action
- Every form `name` attribute

Example:

```text
GET /staff/packages/create
Template: staff/package-form
Variables: customers, types, error, success
POST target: /staff/packages
Fields: trackingNo, recipientName, recipientPhone, customerId, weight, type
```

Do not invent a template variable. Ask the backend owner to add it and explain why.

### Step 3: Improve the staff dashboard

File: `views/staff/dashboard.hbs`

Check these sections:

1. Top title and quick actions
2. Total parcel count
3. Arrived count
4. Notified count
5. Exception count
6. Active shelf count
7. Recent arrivals table
8. Lifecycle snapshot

For every card:

- The label must be short.
- The number must be easy to see.
- The link must open the matching filtered list.
- The card must stack cleanly on mobile.

### Step 4: Improve the parcel list

File: `views/staff/packages.hbs`

Check the search form:

- Search text field: `q`
- Status field: `status`
- Type field: `type`
- Submit method: GET
- Submit action: `/staff/packages`

Check the table columns:

- Tracking number
- Recipient and phone
- Type
- Status
- Pickup code
- Arrived time
- Open button

Rules:

- Every tracking number links to `/staff/packages/{{id}}`.
- Empty pickup codes show an em dash.
- The status badge uses `text-bg-{{statusClass status}}`.
- The page shows `total`, `page`, and `totalPages`.
- Pagination links use the `url` value from the server.
- The empty-state row uses `colspan="7"`.

### Step 5: Improve single and batch intake

File: `views/staff/package-form.hbs`

Single form:

- Method: POST
- Action: `/staff/packages`
- Fields: `trackingNo`, `recipientName`, `recipientPhone`, `customerId`, `weight`, `type`
- Required customer dropdown must come from `customers`.

Batch form:

- Method: POST
- Action: `/staff/packages/batch`
- Customer field: `customerId`
- Batch text field: `batch`
- One row format: `tracking no. | recipient | phone | weight | type`

Add plain instructions near the batch field. Do not use a hidden format that a new user cannot discover.

### Step 6: Improve parcel detail actions

File: `views/staff/package-detail.hbs`

Action display rules:

| Server flag | Meaning | Button or form |
| --- | --- | --- |
| `canShelve` | Parcel is Arrived | Show shelf selector and shelf form |
| `canNotify` | Parcel is Shelved | Show Generate notification form |
| `canPickup` | Parcel is Notified | Show Confirm pickup form |
| `canReportException` | Parcel can enter exception flow | Show Report exception link |

Check that hidden actions never submit to the server. The server must still reject invalid transitions even if someone sends the request manually.

Tracking history must show newest event first because the route sorts it that way.

### Step 7: Improve shelf management

File: `views/staff/shelves.hbs`

Each shelf card should show:

- Shelf code
- Cabinet or zone
- Status
- Used count
- Capacity
- Usage progress
- Maintenance button

Rules:

- An occupied shelf cannot enter maintenance.
- A full shelf must be visually obvious.
- The Add shelf form posts `code`, `cabinet`, and `capacity` to `/staff/shelves`.
- The server calculates `usagePercent`; do not repeat that calculation in the template.

### Step 8: Improve exception management

File: `views/staff/exceptions.hbs`

Report form:

- Method: POST
- Action: `/staff/exceptions`
- Fields: `packageId`, `type`, `description`
- Package options come from `eligiblePackages`.
- If `selectedPackageId` exists, pre-select that option.

Register table:

- Show linked parcel
- Show issue type
- Show open/resolved status
- Show reported time
- Show Resolve button only for open exceptions

### Step 9: Add small browser validation

JavaScript may help with:

- Confirming pickup
- Confirming exception resolution
- Preventing double-submit
- Showing a simple required-field warning

JavaScript must not:

- Change parcel status by itself
- Generate pickup codes
- Bypass the server validation
- Hide a backend error permanently

### Step 10: Test each staff action

Run this browser sequence:

1. Sign in as staff.
2. Receive a valid parcel.
3. Try to receive a duplicate tracking number.
4. Receive two batch rows.
5. Search by tracking number.
6. Filter by Arrived.
7. Open a parcel and shelve it.
8. Confirm the pickup code appears.
9. Generate the notification.
10. Confirm pickup.
11. Create a shelf and move it to maintenance.
12. Report an exception and resolve it.

For every step, check the JSON file changes under `data/`.

### Step 11: Check role safety

While signed in as `cust01`, open:

```text
/staff/dashboard
```

Expected result: HTTP 403.

While signed out, open:

```text
/staff/packages
```

Expected result: redirect to `/login`.

## Handoff message

When finished, send:

```text
Staff pages ready for review
Pages changed: <list>
Routes used: <list>
Test account: staff01 / 123456
Test results: <short result for each step>
Known limitation: <none or exact limitation>
Files handed back: <the exact list>
Handed back at: <date and time>
```

## Completion checklist

- [ ] Every form field name matches the server.
- [ ] Every action button posts to an existing route.
- [ ] Invalid lifecycle actions are not shown.
- [ ] Empty lists show a clear message.
- [ ] Tables scroll on small screens.
- [ ] Status colors match the UI guideline.
- [ ] Pickup code is easy to read.
- [ ] Tracking timeline is readable.
- [ ] No staff page exposes another role's navigation.
- [ ] The staff flow has been tested from intake to pickup.