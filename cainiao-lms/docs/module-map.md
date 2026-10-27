# Module map

Who builds what, what each page has to do, and what counts as done.

Everything in this project boots today. The feature modules are stubs: each route answers
**HTTP 501** and renders its own placeholder page. Implementing a page means replacing one
`stubPage(...)` call with a real handler and filling in the matching `.hbs` file.

## How to implement one stub

1. Confirm the file is on your list in `docs/actions_of_roles/<your-role>/todo.md`.
2. Open the route file and find the `stubPage({ ... })` call. Its `needs` list is the acceptance list.
3. Replace that single call with a real handler. Keep the HTTP method, the path, and the
   rendered template name. Other people already link to them.
4. Fill in the `.hbs` file that currently contains `{{> stub}}`.
5. Run `npm run check`, then walk the flow in the browser as the right demo account.
6. Hand it back: the file list, what you clicked, what you saw, and the date and time.

If a page needs a value the handler does not pass yet, ask the route owner to add it. Do not
invent a template variable in the view and hope.

## What is frozen, and what is yours

The contract below exists to stop two people breaking each other. Keep that in mind and it will
not over-constrain you either.

**Frozen** - talk to the manager before changing:

- Route paths and HTTP methods.
- Form field names and query parameter names (`q`, `status`, `page`, `trackingNo`, ...).
- The template variable names each view receives.
- The record fields in `data/`, and the words in `utils/packageStatus.js`.
- The response codes for the common cases.

These are frozen because somebody else's file already depends on them: a form already posts that
field name, a link already points at that path, a view already reads that variable.

**Yours** - design it however you like:

- Everything behind the route: validation rules, helper functions, how a number is computed.
- The HTML and CSS inside your own view.
- Page wording, layout, empty states, and messages.
- Function and variable names that never leave your file.

Rule of thumb: **if another member's file would have to change because of your change, it is
frozen. If only your own files change, it is yours.**

## Route contract (frozen)

Every route with the field names it accepts and the files it touches. File names are short for
the files in `data/` - `users` is `data/users.json`.

### Authentication - routes `backend-auth`, markup `ui`

All four routes work today; this is the only finished module.

| Route | Input | Reads | Writes | Result |
| --- | --- | --- | --- | --- |
| `GET /login` | - | users | - | `views/auth/login.hbs` |
| `POST /login` | `username`, `password` | users | logs | redirect to the role home, or 401 and the login page again |
| `POST /demo/login` | `username`, must be in `DEMO_ACCOUNTS` | users | logs | redirect to the role home, or 404 and the login page again |
| `GET /logout` | - | - | logs | redirect `/login` |

`POST /demo/login` is the prototype helper behind the three one-click buttons. It checks no
password and **must be deleted** before the project is used for anything real, together with the
quick sign-in box in `views/auth/login.hbs`.

### Staff workflows - routes `backend-parcel`, views `frontend-staff`

| Route | Input | Reads | Writes | Result |
| --- | --- | --- | --- | --- |
| `GET /staff/dashboard` | - | packages, shelves | - | `views/staff/dashboard.hbs` |
| `GET /staff/packages` | `q`, `status`, `type`, `page` | packages | - | `views/staff/packages.hbs` |
| `GET /staff/packages/create` | - | users | - | `views/staff/package-form.hbs` |
| `POST /staff/packages` | `trackingNo`, `recipientName`, `recipientPhone`, `customerId`, `weight`, `type` | packages, users | packages, tracking, logs | redirect `/staff/packages` |
| `POST /staff/packages/batch` | `customerId`, `batch` | packages, users | packages, tracking, logs | redirect `/staff/packages` |
| `GET /staff/packages/:id` | - | packages, tracking, shelves | - | `views/staff/package-detail.hbs` |
| `POST /staff/packages/:id/shelf` | `shelfId` | packages, shelves | packages, shelves, tracking, logs | redirect to the parcel detail |
| `POST /staff/packages/:id/notify` | - | packages, notifications, config | packages, notifications, tracking, logs | redirect to the parcel detail |
| `POST /staff/packages/:id/pickup` | - | packages, shelves | packages, shelves, tracking, logs | redirect to the parcel detail |
| `GET /staff/shelves` | - | shelves | - | `views/staff/shelves.hbs` |
| `POST /staff/shelves` | `code`, `cabinet`, `capacity` | shelves | shelves, logs | redirect `/staff/shelves` |
| `POST /staff/shelves/:id/status` | - (toggles Active and Maintenance) | shelves | shelves, logs | redirect `/staff/shelves` |

Done when: `staff01` can take a parcel from arrival to pickup, the shelf capacity rule holds,
pickup codes are six digits and unique, every action writes a tracking event and a log line, and
the JSON files stay valid across a restart.

### Customer portal - routes `backend-parcel`, views `frontend-customer`

The most important rule in the project: every query is filtered by `global.currentUser.id`.
Never read a customer ID from a form or a query string.

| Route | Input | Reads | Writes | Result |
| --- | --- | --- | --- | --- |
| `GET /my/packages` | `q`, `status`, `page` | packages | - | `views/client/packages.hbs` |
| `GET /my/packages/:id` | - | packages, tracking | - | `views/client/package-detail.hbs` |
| `GET /my/notifications` | - | notifications, packages | - | `views/client/notifications.hbs` |

Done when: `cust01` sees only their own parcels, editing the URL to another customer parcel
returns 403, an unknown parcel returns 404, and the tracking timeline shows newest first.

### Admin console - routes `backend-admin`, user management `backend-auth`, views `frontend-admin`

| Route | Input | Reads | Writes | Result |
| --- | --- | --- | --- | --- |
| `GET /admin/reports` | - | packages | - | `views/admin/reports.hbs` |
| `GET /admin/users` | `q`, `role` | users | - | `views/admin/users.hbs` |
| `POST /admin/users` | `username`, `password`, `name`, `phone`, `role` | users | users, logs | redirect `/admin/users` |
| `POST /admin/users/:id` | `username`, `name`, `phone`, `role`, `password` (empty keeps the old one) | users | users, logs | redirect `/admin/users` |
| `GET /admin/logs` | `q`, `action`, `page` | logs | - | `views/admin/logs.hbs` |
| `GET /admin/config` | - | config | - | `views/admin/config.hbs` |
| `POST /admin/config` | `siteName`, `siteCode`, `address`, `phone`, `notificationTemplate`, `language` | - | config, logs | redirect `/admin/config` |

Done when: totals match `data/packages.json`, the daily-inbound chart is HTML and CSS only, a
user can be created and updated with duplicate usernames rejected, logs can be searched and
paged, and configuration edits change the notification message that staff generate.

### Exceptions - routes `backend-admin`, views `frontend-staff`

| Route | Input | Reads | Writes | Result |
| --- | --- | --- | --- | --- |
| `GET /staff/exceptions` | `packageId` (preselects a parcel) | exceptions, packages | - | `views/staff/exceptions.hbs` |
| `POST /staff/exceptions` | `packageId`, `type`, `description` | packages, shelves, exceptions | packages, shelves, exceptions, tracking, logs | redirect `/staff/exceptions` |
| `POST /staff/exceptions/:id/resolve` | - | packages, shelves, exceptions, notifications | packages, shelves, exceptions, notifications, tracking, logs | redirect `/staff/exceptions` |

Done when: only `Arrived`, `Shelved`, and `Notified` parcels can enter the exception flow, the
previous status is remembered, and resolve restores it when shelf capacity allows - otherwise
the parcel returns to `Arrived`.

### Template variables each view receives

Frozen the same way the routes are. The route passes exactly these names; the view uses exactly
these names. `title` comes from the layout.

| View | Variables |
| --- | --- |
| `auth/login` | `error`, `username`, `demoAccounts` |
| `staff/dashboard` | `counts`, `totalPackages`, `activeShelves` |
| `staff/packages` | `packages`, `total`, `page`, `totalPages`, `pagination`, `filters`, `statuses`, `types`, `success`, `error` |
| `staff/package-form` | `customers`, `types`, `error`, `success` |
| `staff/package-detail` | `parcel`, `tracking`, `shelves`, `canShelve`, `canNotify`, `canPickup`, `canReportException`, `success`, `error` |
| `staff/shelves` | `shelves`, `success`, `error` |
| `staff/exceptions` | `exceptions`, `eligiblePackages`, `selectedPackageId`, `error`, `success` |
| `client/packages` | `packages`, `total`, `page`, `totalPages`, `pagination`, `filters`, `statuses` |
| `client/package-detail` | `parcel`, `tracking` |
| `client/notifications` | `notifications` |
| `admin/reports` | `totalPackages`, `totalWeight`, `statusCounts`, `typeCounts`, `dailyInbound` |
| `admin/users` | `users`, `roles`, `filters`, `success`, `error` |
| `admin/logs` | `logs`, `total`, `page`, `totalPages`, `pagination`, `actions`, `filters` |
| `admin/config` | `config`, `success`, `error` |

### Shapes you were given

These come from the shared helpers that are already written, so they are not yours to redesign:

- `pagination` - an array of `{ number, active, url }`, built by `utils/pagination.js`.
- `counts` - `{ Arrived, Shelved, Notified, Picked Up, Exception }`, from `utils/packageStatus.js`.
- `canShelve`, `canNotify`, `canPickup`, `canReportException` - booleans from the same file.

### Shapes you design

The view needs these to exist, but everything past the minimum is the route owner's choice:

- `filters` - whatever the view must put back into the search form after a reload.
  `{ q, status, type }` is a reasonable minimum; add more if your page needs it.
- `dailyInbound` - one object per day for the last seven Hong Kong days. `utils/date.js`
  (`recentDays`) already gives you `key` and `label`. How you express the bar height is yours,
  as long as the chart still reads when every count is zero.

The JSON record fields themselves live in `docs/data-dictionary.md`, which the manager writes.

### Response codes

| Code | Meaning here |
| --- | --- |
| 200 | A page rendered. |
| 302 | A write succeeded and the route redirected. |
| 401 | `POST /login` rejected the credentials. |
| 403 | The wrong role, or a customer asking for another customer parcel. |
| 404 | No such parcel, user, or path. |
| 500 | Something unexpected. The shared error page renders it. |
| 501 | A stub nobody has built yet. Every placeholder page shows this. |

## Files without routes

### Parcel domain - owner `backend-parcel`

| File | Purpose |
| --- | --- |
| `utils/parcels.js` | **stub** - `createParcel()` and `countByStatus()` throw until they are implemented. Single and batch intake must share `createParcel()` so records never drift. |
| `utils/packageStatus.js` | Working. The status vocabulary and the transition predicates. Add new rules here, not in route handlers. |
| `utils/id.js` | Working. `nextId()` and `generatePickupCode()`. |
| `utils/stub.js` | Working. The 501 placeholder handler; it disappears as stubs are replaced. |

### Shared UI - owner `ui`

| File | Purpose |
| --- | --- |
| `views/layouts/main.hbs`, `views/partials/nav.hbs`, `views/partials/alerts.hbs`, `views/error.hbs` | Working shell. Agree before changing: every page depends on it. |
| `views/auth/login.hbs` | Working. Rebuilt from the prototype and shared with `backend-auth`. |
| `public/css/style.css` | Base tokens and components: navbar, metric cards, parcel cards, pickup code, timeline, CSS chart, and the login page ported from the prototype. |
| `public/js/main.js` | The `data-confirm` form guard. |

Done when: a UI guideline document exists, every page uses the shared Bootstrap layout, status
colors are consistent, layouts survive at 375 px and 1440 px, and nothing relies on color alone.

## Delivery order

1. Manager freezes requirements, routes, field names, acceptance checks, and the demo story.
2. UI/UX defines the layout, component classes, status colors, and the timeline pattern.
3. Backend A confirms the app foundation, login, logout, and role guards.
4. Backend B confirms the parcel lifecycle and the data contract.
5. Backend C confirms exceptions, reports, logs, and configuration.
6. Frontend A, B, and C build their pages against the frozen contracts.
7. QA/config runs the full test matrix and prepares the demonstration.
8. The manager accepts the work and records the final demo version.

Frontend work may start before the backend is finished, but it must use the field names and
route names from this table.

## Definition of done

- The requested user action works from the browser, with the right demo account.
- Invalid input does not crash the server: it re-renders with a message.
- The role guard still blocks the wrong role.
- The JSON files remain valid.
- The page uses the shared Bootstrap layout and English text.
- `npm run check` passes.
- The hand-back message contains the checks performed, their result, the files handed back, and the date and time.
