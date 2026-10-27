# Backend C: Exceptions, Reports, Logs, and Configuration

## Mission

Give administrators trustworthy operational data and give staff a safe exception workflow. Report numbers, audit logs, and configuration must match the actual JSON files and the parcel lifecycle.

## Start here in this project

`cainiao-lms` ships a **working framework with empty feature modules**. The framework boots,
you can sign in, and the role guards work. Everything listed as yours is either missing or a
stub, so read the plan below as *what to build*, not as an audit of something that exists.

The mechanic you will use constantly: each unimplemented route is one `stubPage({ ... })` call
in `routes/`, and its `needs` list is the acceptance list for that page. Replace the call, then
fill in the view. `docs/module-map.md` lists every page with its route, view, and owner.

`utils/date.js`, `utils/logger.js`, and `utils/request.js` are already implemented. Every route
you own answers HTTP 501, and the seed data for `exceptions.json`, `logs.json`, and
`config.json` is already in place.

Your exception routes live in `routes/staff.js` (shared with Backend B); reports, logs, and
configuration live in `routes/admin.js` (user management there belongs to Backend A). The
`needs` list of each `stubPage({ ... })` call is that route acceptance list.

## Your files

Everything below is already in the folder. **Nobody else edits these files.** This list is your
claim - there is no issue tracker to claim against instead, so treat it as the rule.

| File | Now | What you do |
| --- | --- | --- |
| `routes/staff.js` | 3 stubs (exception block) | Report, list, and resolve exceptions. Shared with Backend B - tell them first. |
| `routes/admin.js` | 5 stubs (reports, logs, config) | Build reports, the log browser, and configuration. User management in this file is Backend A. |
| `utils/date.js` | working | Hong Kong date keys and `recentDays`. |
| `utils/logger.js` | working | `logAction`. |
| `utils/request.js` | working | `trimText`. |
| `data/exceptions.json` | seeded, 2 records | Exception records. |
| `data/logs.json` | seeded, 23 records | Append-only audit log. |
| `data/config.json` | seeded | Site fields and the notification template. |

**Not yours - ask the owner before you touch these:**

| File | Owner |
| --- | --- |
| `views/` | Frontend A, B, C, and UI/UX |
| `routes/client.js` | Backend B |
| `utils/parcels.js`, `utils/id.js`, `utils/packageStatus.js` | Backend B |
| the user block in `routes/admin.js` | Backend A |

## Shared-file warning

`routes/staff.js` is shared with Backend B. `routes/admin.js` is shared with Backend A for user management.

Before editing a shared file:

1. Tell the other owner the exact route or function you will change.
2. Tell the other owner.
3. Keep the change inside your route block.
4. Do not reformat or move the other owner's code.
5. Re-test the other owner's routes after your change.

## Exception lifecycle

An exception is a problem record linked to a parcel.

Allowed package state change:

```text
Arrived / Shelved / Notified -> Exception -> resolved state
```

The exception record itself has:

- `Open`
- `Resolved`

When a parcel enters the exception flow:

1. Remember the previous parcel status.
2. Remove one used slot from an assigned shelf if needed.
3. Set the parcel status to `Exception`.
4. Create an exception record.
5. Add a tracking event.
6. Add an operation log.

When an exception is resolved:

1. Check the shelf is still available if the parcel should return to `Shelved` or `Notified`.
2. Restore the previous state when possible.
3. Return the parcel to `Arrived` when the shelf or pickup code cannot be restored.
4. Remove obsolete pickup notifications when the parcel returns to `Arrived`.
5. Mark the exception `Resolved`.
6. Add a tracking event.
7. Add an operation log.

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

Sign in as `staff01` for exception testing and `admin01` for report, log, and configuration
testing. Those routes answer **HTTP 501** until you build them.
### Step 2: Review exception fields

Open `data/exceptions.json`.

Each record must contain:

- `id`
- `packageId`
- `type`
- `description`
- `status`
- `reportedBy`
- `createdAt`
- `resolvedAt`

Validate:

- Package ID points to a real package.
- Type is not empty.
- Description is not empty.
- Open exceptions have `resolvedAt: null`.
- Resolved exceptions have a timestamp.

### Step 3: Improve exception registration

Route: `POST /staff/exceptions`

Input fields:

- `packageId`
- `type`
- `description`

Required checks:

- Package exists.
- Type and description are not empty.
- Package status can enter the exception flow.
- The test data does not contain a second open exception for the same package.

Write the route so it redirects with a readable error instead of crashing.

### Step 4: Improve exception resolution

Route: `POST /staff/exceptions/:id/resolve`

Required checks:

- Exception exists.
- Exception status is `Open`.
- Linked package exists.

Resolution behavior must be deterministic. Write the rule down before changing code.

Current prototype rule:

- Restore the previous state if the shelf is active and has capacity.
- If the shelf cannot be restored, return to `Arrived`.
- Clear the pickup code if it can no longer be used.
- Remove obsolete notifications.
- Keep old tracking history.

### Step 5: Improve report aggregation

Route: `GET /admin/reports`

Calculate totals from `data/packages.json`:

- Total packages
- Ready-for-pickup count
- Total weight
- Count by status
- Count by parcel type
- Daily inbound count for the last seven Hong Kong calendar days

Daily grouping must use the helper in `utils/date.js`. Do not use UTC directly for a Hong Kong report.

Return data to the template. Do not calculate totals in Handlebars.

### Step 6: Verify the chart contract

The report page must contain:

```html
<!-- CHART: daily-inbound -->
```

The chart uses HTML and CSS only.

Each day should provide:

- `key`
- `label`
- `count`
- `height`

The bar height should be readable when the maximum is zero.

### Step 7: Improve operation logging

Use `utils/logger.js`.

Every important write action should add:

- Action code
- Current user ID
- Current username
- Human-readable detail
- Created timestamp

Suggested action codes:

```text
LOGIN
LOGOUT
PACKAGE_CREATED
PACKAGE_BATCH_CREATED
PACKAGE_SHELVED
PACKAGE_NOTIFIED
PACKAGE_PICKED_UP
SHELF_CREATED
SHELF_STATUS_CHANGED
EXCEPTION_REPORTED
EXCEPTION_RESOLVED
USER_CREATED
USER_UPDATED
CONFIG_UPDATED
```

Do not log passwords or sensitive configuration.

### Step 8: Improve log search

Route: `GET /admin/logs`

Filtering:

- `q` searches username, action, and detail.
- `action` filters one exact action code.
- Newest entry first.
- Pagination keeps filters.

If the number of logs is large for this prototype, keep pagination. Do not remove it.

### Step 9: Improve configuration

Routes:

- `GET /admin/config`
- `POST /admin/config`

Fields:

- `siteName`
- `siteCode`
- `address`
- `phone`
- `notificationTemplate`
- `language`

Rules:

- Every field is required.
- `language` is currently `en`.
- Replace the notification placeholders only on the server.
- Keep user-entered content escaped.
- The next rendered page should use the saved site name.

### Step 10: Test exceptions

Use a test package:

1. Sign in as staff.
2. Open an eligible parcel.
3. Report an exception.
4. Confirm the package status becomes `Exception`.
5. Confirm a tracking event exists.
6. Confirm an operation log exists.
7. Resolve the exception.
8. Confirm the package returns to the correct state.
9. Confirm the exception is `Resolved`.
10. Restore all test JSON changes before handoff.

### Step 11: Test reports

1. Count each status manually in `data/packages.json`.
2. Open `/admin/reports`.
3. Compare the cards.
4. Compare total weight.
5. Count the last seven days in Hong Kong time.
6. Compare the chart.
7. Add one test parcel only if the task requires it, then restore the seed data.

### Step 12: Test logs and configuration

1. Perform one action as staff.
2. Sign in as admin.
3. Confirm the action appears in `/admin/logs`.
4. Search for the action code.
5. Save a test site name.
6. Reload a page and confirm the site name changed.
7. Restore the original configuration.

### Step 13: Validate JSON files

Run:

```powershell
node -e "for (const f of ['exceptions','logs','config']) { JSON.parse(require('fs').readFileSync('data/'+f+'.json','utf8')); console.log(f+' valid'); }"
```

## Handoff message

```text
Admin operations backend ready for review
Routes changed: <list>
Exception flow tested: yes
Report totals checked: yes
Log search checked: yes
Configuration restored: yes
Files handed back: <the exact list>
Handed back at: <date and time>
```

## Completion checklist

- [ ] Exception registration validates the package.
- [ ] Exception resolution uses a documented rule.
- [ ] Stale pickup notifications are removed when their code is invalid.
- [ ] Report status counts match `packages.json`.
- [ ] Daily inbound uses Hong Kong calendar days.
- [ ] The report uses the required chart marker.
- [ ] Logs include action, user, detail, and time.
- [ ] Log filters and pagination work.
- [ ] Configuration persists and remains escaped.
- [ ] All JSON files are valid.