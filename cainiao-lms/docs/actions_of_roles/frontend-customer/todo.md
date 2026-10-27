# Frontend B: Customer Pages

## Mission

Build a simple, read-only customer area. A customer must immediately understand which parcels belong to them, what state each parcel is in, and what pickup code to use.

## Start here in this project

`cainiao-lms` ships a **working framework with empty feature modules**. The framework boots,
you can sign in, and the role guards work. Everything listed as yours is either missing or a
stub, so read the plan below as *what to build*, not as an audit of something that exists.

The mechanic you will use constantly: each unimplemented route is one `stubPage({ ... })` call
in `routes/`, and its `needs` list is the acceptance list for that page. Replace the call, then
fill in the view. `docs/module-map.md` lists every page with its route, view, and owner.

Your three views exist but contain only `{{> stub}}`, and the routes behind them answer HTTP 501.
Delete the `{{> stub}}` line and write the markup.

The route-variable table below is the **target contract** - the stub routes pass nothing yet, so
Backend B must add `packages`, `pagination`, `filters`, `statuses`, `parcel`, `tracking`, and
`notifications` before your pages can render them. Agree the names first.

The security rule is the one thing that is already enforced: `routes/client.js` is mounted behind
`requireAuth` and `requireRole("customer")` in `app.js`, so Step 8 passes today.

## Your files

Everything below is already in the folder. **Nobody else edits these files.** This list is your
claim - there is no issue tracker to claim against instead, so treat it as the rule.

| File | Now | What you do |
| --- | --- | --- |
| `views/client/packages.hbs` | placeholder | Delete `{{> stub}}` and build the customer parcel list. |
| `views/client/package-detail.hbs` | placeholder | Delete `{{> stub}}` and build the detail page with the pickup code and timeline. |
| `views/client/notifications.hbs` | placeholder | Delete `{{> stub}}` and build the notification inbox. |

**Not yours - ask the owner before you touch these:**

| File | Owner |
| --- | --- |
| `routes/client.js` | Backend B |
| `public/css/style.css`, `views/partials/` | UI/UX |
| `views/staff/`, `views/admin/` | Frontend A and C |

## You do not own

- Do not add edit, delete, pickup, shelf, or exception action buttons.
- Do not trust a customer ID from the browser.
- Do not change the server-side ownership check in `routes/client.js`.
- Do not expose another customer's package through query parameters or links.
- Do not change admin or staff views.

## Security rule

The server must filter packages with this rule:

```javascript
parcel.customerId === global.currentUser.id
```

The page must not receive a customer ID from a form or query string. If someone manually opens `/my/packages/:id`, the server must return 403 when the package belongs to another user.

## Pages and user goals

| Page | User goal |
| --- | --- |
| My parcels | Find my parcel and see its current status |
| Parcel detail | See the pickup code and full tracking history |
| Notifications | Read messages about my parcels |

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

Sign in as `cust01` with password `123456`. `/my/packages` answers **HTTP 501** until you
build it.
### Step 2: Read the customer route

Open `routes/client.js`.

For each page, write down:

- Template name
- Passed variables
- Filter rules
- Sort order
- Authorization checks

Expected route variables:

| Route | Main variables |
| --- | --- |
| `/my/packages` | `packages`, `total`, `page`, `totalPages`, `pagination`, `filters`, `statuses` |
| `/my/packages/:id` | `parcel`, `tracking` |
| `/my/notifications` | `notifications` |

Do not invent new variables without asking the backend owner.

### Step 3: Improve the parcel list

File: `views/client/packages.hbs`

Each card should show:

- Tracking number
- Status badge
- Parcel type
- Weight
- Arrival date
- Pickup code when available
- Link to parcel detail

Search form:

- Field `q`
- Field `status`
- Method GET
- Action `/my/packages`

Rules:

- A missing pickup code shows an em dash.
- A `Notified` parcel makes the pickup code easy to find.
- The empty state says that no parcels match the filters.
- Pagination uses server-built `url` values.

### Step 4: improve parcel detail

File: `views/client/package-detail.hbs`

Page order:

1. Back link
2. Tracking number and current status
3. Large pickup-code panel when a code exists
4. Parcel details
5. Tracking timeline

Parcel details should include:

- Recipient
- Type
- Weight
- Arrived time
- Shelved time
- Notified time
- Picked-up time

For missing times, use the shared date helper or an em dash. Do not print `Invalid Date`.

Timeline:

- Newest event first
- Status
- Description
- Date and time
- No edit controls

### Step 5: Improve notifications

File: `views/client/notifications.hbs`

Each notification card should show:

- Title
- Content
- Created time
- Link to the related parcel when `parcel` exists

Do not show a read/unread badge unless a route actually changes that state.

If the notification template contains a pickup code, show the content without escaping technical symbols incorrectly.

### Step 6: Check mobile readability

At 360 px width:

- The pickup code must fit.
- Tracking number must wrap without cutting characters.
- Cards must have comfortable spacing.
- Timeline text must not overflow.
- Buttons must stay at least 44 px tall where practical.

### Step 7: Check ownership protection

Test these cases:

1. Sign in as `cust01`.
2. Open `/my/packages`.
3. Confirm every displayed `customerId` belongs to `USR-0003` by checking `data/packages.json`.
4. Temporarily change one package's `customerId` to another user ID in a test copy of the JSON.
5. Open that package as `cust01`.
6. Confirm the response is 403.
7. Restore the original JSON.

Do not leave the temporary ownership change in place.

### Step 8: Check role safety

Signed in as `cust01`:

- `/my/packages` returns 200.
- `/my/notifications` returns 200.
- `/staff/dashboard` returns 403.
- `/admin/reports` returns 403.
- `/login` redirects to `/my/packages`.

Signed out:

- `/my/packages` redirects to `/login`.

### Step 9: Test notification behavior

1. Sign in as staff.
2. Shelve a parcel.
3. Generate the notification.
4. Sign in as the matching customer.
5. Confirm the new notification appears.
6. Confirm the linked parcel opens.
7. Confirm the pickup code in the notification matches the parcel detail.

### Step 10: Check English text and accessibility

- All visible text is English.
- Every link describes its destination.
- Status is not communicated by color alone.
- The pickup code uses a readable font size.
- Screen readers can identify the section heading around the code and timeline.

## Handoff message

```text
Customer pages ready for review
Pages changed: <list>
Ownership checks: passed
Responsive widths checked: 360 px, 768 px, 1280 px
Test account: cust01 / 123456
Files handed back: <the exact list>
Handed back at: <date and time>
Known limitation: <none or exact limitation>
```

## Completion checklist

- [ ] Customer sees only their own parcels.
- [ ] Customer pages have no write actions.
- [ ] Pickup code is visible when available.
- [ ] Tracking history is newest first.
- [ ] Notifications link to the correct parcel.
- [ ] No `Invalid Date` or undefined value appears.
- [ ] Wrong-role access returns 403.
- [ ] Mobile cards and timelines are readable.
- [ ] All visible text is English.
- [ ] The full notification flow has been tested.