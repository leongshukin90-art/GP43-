# Frontend C: Admin Pages

## Mission

Build the admin pages so an administrator can understand system activity, manage users, inspect logs, and change system configuration without leaving the web application.

## Start here in this project

`cainiao-lms` ships a **working framework with empty feature modules**. The framework boots,
you can sign in, and the role guards work. Everything listed as yours is either missing or a
stub, so read the plan below as *what to build*, not as an audit of something that exists.

The mechanic you will use constantly: each unimplemented route is one `stubPage({ ... })` call
in `routes/`, and its `needs` list is the acceptance list for that page. Replace the call, then
fill in the view. `docs/module-map.md` lists every page with its route, view, and owner.

Your four views exist but contain only `{{> stub}}`, and the routes behind them answer HTTP 501.
Delete the `{{> stub}}` line and write the markup.

Two things in Step 3 do not exist yet and are yours to introduce with Backend C: the
`<!-- CHART: daily-inbound -->` marker and the `.css-chart` markup. The CSS classes
(`.css-chart`, `.chart-column`, `.chart-value`, `.chart-bar`, `.chart-label`) are already in
`public/css/style.css`, so only the markup and the heights are missing.

The route-variable table below is the target contract, not the current behaviour.

## Your files

Everything below is already in the folder. **Nobody else edits these files.** This list is your
claim - there is no issue tracker to claim against instead, so treat it as the rule.

| File | Now | What you do |
| --- | --- | --- |
| `views/admin/reports.hbs` | placeholder | Delete `{{> stub}}` and build the reports page, including the CSS-only chart and its marker. |
| `views/admin/users.hbs` | placeholder | Delete `{{> stub}}` and build user management. |
| `views/admin/logs.hbs` | placeholder | Delete `{{> stub}}` and build the log browser. |
| `views/admin/config.hbs` | placeholder | Delete `{{> stub}}` and build the configuration page. |

**Not yours - ask the owner before you touch these:**

| File | Owner |
| --- | --- |
| `routes/admin.js` | Backend A and C |
| `public/css/style.css`, `views/partials/` | UI/UX |
| `views/staff/`, `views/client/` | Frontend A and B |

## You do not own

- Do not add a chart library. The report chart must remain HTML and CSS.
- Do not remove `<!-- CHART: daily-inbound -->`.
- Do not change role names or JSON field names without the manager and Backend A/C.
- Do not allow an admin to delete their own last admin account without a product decision.
- Do not store user passwords in the browser local storage.

## Pages and user goals

| Page | User goal |
| --- | --- |
| Reports | See parcel totals and daily inbound activity |
| Users | Find, create, and update user accounts |
| Logs | Find who did what and when |
| Configuration | Change site and notification settings |

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

Sign in as `admin01` with password `123456`. `/admin/reports` answers **HTTP 501** until you
build it.
### Step 2: Read the admin route

Open `routes/admin.js`.

Write down each page's template variables:

| Route | Main variables |
| --- | --- |
| `/admin/reports` | `totalPackages`, `totalWeight`, `statusCounts`, `typeCounts`, `dailyInbound` |
| `/admin/users` | `users`, `roles`, `filters`, `success`, `error` |
| `/admin/logs` | `logs`, `total`, `page`, `totalPages`, `pagination`, `actions`, `filters` |
| `/admin/config` | `config`, `success`, `error` |

Do not create a variable in Handlebars that the route does not pass.

### Step 3: Improve the report page

File: `views/admin/reports.hbs`

Required sections:

1. Total parcels
2. Ready for pickup
3. Total weight
4. Daily inbound chart
5. Status breakdown
6. Parcel type breakdown

Chart rules:

- Use `.css-chart`, `.chart-column`, `.chart-bar`, and `.chart-label`.
- Each bar height comes from `height`.
- Each bar shows the count.
- The required comment appears immediately before the chart structure.
- The chart renders correctly when all counts are zero.
- No external chart JavaScript or chart library is allowed.

### Step 4: Improve user management

File: `views/admin/users.hbs`

Create account form:

- Method: POST
- Action: `/admin/users`
- Fields: `username`, `password`, `name`, `phone`, `role`

Filter form:

- Method: GET
- Action: `/admin/users`
- Fields: `q`, `role`

Edit form:

- Method: POST
- Action: `/admin/users/:id`
- Fields: `username`, `password`, `name`, `phone`, `role`
- An empty password means keep the current password.

Check:

- Usernames display clearly.
- Role labels are readable.
- Each edit form has a unique collapse target.
- The selected role remains selected.
- Validation messages appear in the shared alert area.

### Step 5: Improve operation logs

File: `views/admin/logs.hbs`

Filter form:

- Field `q`
- Field `action`
- Method GET
- Action `/admin/logs`

Table columns:

- Time
- Operator
- Action
- Detail

Rules:

- Newest log should appear first because the server sorts it that way.
- Action codes may use monospace styling.
- Long details must wrap.
- Pagination uses the server-built `url`.
- Empty logs show a clear message.

### Step 6: Improve configuration

File: `views/admin/config.hbs`

Form:

- Method: POST
- Action: `/admin/config`
- Fields: `siteName`, `siteCode`, `address`, `phone`, `notificationTemplate`, `language`

Rules:

- Language is currently English only.
- Use a hidden `language=en` field and a disabled English display.
- Explain the notification placeholders: `siteName`, `trackingNo`, `pickupCode`, `name`.
- Keep the template textarea monospace.
- Do not execute user-entered HTML.
- The shared navbar should show the saved `siteName` after the next request.

### Step 7: Add small admin browser interactions

Safe JavaScript:

- Confirm user role changes.
- Confirm account updates.
- Collapse or expand edit forms.
- Prevent double-submit.
- Keep the current filter when opening or closing a form.

Unsafe behavior:

- Do not calculate report totals in JavaScript when the server already provides them.
- Do not hide an error permanently.
- Do not send a request without a server route.

### Step 8: Test administrator flows

1. Sign in as `admin01`.
2. Open Reports and compare totals with `data/packages.json`.
3. Open Daily inbound and check seven columns.
4. Create a test user with a unique username.
5. Update the test user's role and phone.
6. Try a duplicate username and confirm an error message.
7. Search logs by action.
8. Save configuration with a valid site name.
9. Reload a protected page and confirm the navbar site name changed.
10. Restore the original configuration before handoff.
11. Remove test users or restore the three-user demo state before handoff.

### Step 9: Check role safety

Signed in as `admin01`:

- All `/admin/*` pages return 200.
- `/staff/dashboard` returns 403.
- `/my/packages` returns 403.

Signed out:

- `/admin/reports` redirects to `/login`.

### Step 10: Check responsive behavior

At 360 px:

- Report cards stack.
- Chart labels remain readable.
- User edit form becomes one column.
- Log table scrolls horizontally.
- Configuration fields stack.

## Handoff message

```text
Admin pages ready for review
Pages changed: <list>
Chart marker checked: yes
User-management checks: passed
Log filter checks: passed
Configuration restored: yes
Files handed back: <the exact list>
Handed back at: <date and time>
```

## Completion checklist

- [ ] Report totals match the JSON data.
- [ ] The CSS chart displays seven days.
- [ ] `<!-- CHART: daily-inbound -->` is present.
- [ ] User create and update forms work.
- [ ] Duplicate usernames are rejected.
- [ ] Log filters and pagination work.
- [ ] Configuration persists.
- [ ] English is the only visible language option.
- [ ] Wrong-role access returns 403.
- [ ] Demo data is restored after tests.