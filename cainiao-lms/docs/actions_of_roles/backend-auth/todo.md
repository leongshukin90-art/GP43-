# Backend A: Authentication, Users, and Permissions

## Mission

Keep the application booting correctly and make sure every role can only open the pages and perform the actions allowed for that role.

## Start here in this project

`cainiao-lms` ships a **working framework with empty feature modules**. The framework boots,
you can sign in, and the role guards work. Everything listed as yours is either missing or a
stub, so read the plan below as *what to build*, not as an audit of something that exists.

The mechanic you will use constantly: each unimplemented route is one `stubPage({ ... })` call
in `routes/`, and its `needs` list is the acceptance list for that page. Replace the call, then
fill in the view. `docs/module-map.md` lists every page with its route, view, and owner.

`app.js`, `routes/auth.js`, `middlewares/auth.js`, `middlewares/role.js`, and
`utils/navigation.js` are complete, and Steps 2-5 of this plan pass today. Verify them, then
spend your effort on user management (Step 7) and the items below.

New in this project, and yours:

- `routes/auth.js` carries `POST /demo/login`, a prototype helper that signs in one of
  `DEMO_ACCOUNTS = ["staff01", "admin01", "cust01"]` without checking a password. It exists only
  to power the one-click buttons on the login page and **must be deleted before any real use**,
  together with the quick sign-in box in `views/auth/login.hbs`.
- `renderLogin()` in the same file is the single renderer for the login page, so the failure
  paths and the demo buttons cannot drift apart. Route every failure through it.
- `data/logs.json` now receives `Demo quick sign-in.` entries. They are expected, not a bug.

## Your files

Everything below is already in the folder. **Nobody else edits these files.** This list is your
claim - there is no issue tracker to claim against instead, so treat it as the rule.

| File | Now | What you do |
| --- | --- | --- |
| `app.js` | working | Keep the app bootable: engine, helpers, guards, routers, error pages. |
| `routes/auth.js` | working | Login, logout, and the `POST /demo/login` prototype helper you must delete later. |
| `middlewares/auth.js` | working | `requireAuth`. |
| `middlewares/role.js` | working | `requireRole`. |
| `utils/db.js` | working | `readJson` and `writeJson`. Every other module depends on it. |
| `utils/navigation.js` | working | `roleHome`. |
| `utils/stub.js` | working | The 501 placeholder handler. It disappears as stubs are replaced. |
| `data/users.json` | seeded | The 3 demo accounts. Add accounts with the manager. |
| `routes/admin.js` | stub (user block) | Build `POST /admin/users` and `POST /admin/users/:id`. Shared with Backend C - tell them first. |
| `data/logs.json` | seeded (login rows) | Written through `logAction`, never by hand. |

**Not yours - ask the owner before you touch these:**

| File | Owner |
| --- | --- |
| `routes/staff.js` | Backend B and C |
| `routes/client.js` | Backend B |
| `views/`, `public/` | the frontend owners and UI/UX |

## You do not own

- Parcel, shelf, notification, or tracking rules owned by Backend B
- Exception, report, log-list, or configuration rules owned by Backend C
- Staff/customer/admin Handlebars page design
- Any database, session, cookie, JWT, or external identity provider

## Current authentication model

The project intentionally uses one in-memory variable:

```javascript
global.currentUser
```

Login logic:

1. Read `data/users.json`.
2. Compare `username` and `password`.
3. On failure, show an error on `/login`.
4. On success, copy the user into `global.currentUser`.
5. Redirect the user to the role home.
6. Logout sets `global.currentUser` to `null`.

This is a prototype only. Explain that limitation in code comments and documentation.

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

Sign in as `staff01`, `admin01`, and `cust01` to check the three role homes. Authentication,
logout, and the role guards already work; every other route answers **HTTP 501**.
### Step 2: Verify the app boot path

Open `app.js` and trace:

1. Express is created.
2. Handlebars is configured.
3. URL-encoded form parsing is enabled.
4. Static assets are served from `public/`.
5. Shared template variables are attached to `res.locals`.
6. Auth routes are registered.
7. Staff routes use `requireAuth` and `requireRole('staff')`.
8. Customer routes use `requireAuth` and `requireRole('customer')`.
9. Admin routes use `requireAuth` and `requireRole('admin')`.
10. 404 and 500 handlers are last.

If the app does not import without starting a server, run:

```powershell
node -e "require('./app'); console.log('app imported')"
```

Expected result: `app imported`.

### Step 3: Verify login

Test each account:

| Username | Password | Expected home |
| --- | --- | --- |
| `staff01` | `123456` | `/staff/dashboard` |
| `admin01` | `123456` | `/admin/reports` |
| `cust01` | `123456` | `/my/packages` |

Also test:

- Empty username
- Empty password
- Wrong password
- Username with different letter casing if the team decides usernames are case-insensitive

### Step 4: Verify logout

1. Sign in.
2. Open `/logout`.
3. Confirm the browser redirects to `/login`.
4. Open a protected route.
5. Confirm it redirects to `/login`.

A GET logout is acceptable for this teaching prototype because the original requirement specifies it.

### Step 5: Verify role middleware

Open:

```powershell
Get-Content -Raw middlewares\auth.js
Get-Content -Raw middlewares\role.js
```

Expected behavior:

- `requireAuth` redirects a signed-out user to `/login`.
- `requireRole('staff')` allows only staff.
- Wrong roles receive HTTP 403.
- Missing authentication receives redirect, not 403.

### Step 6: Review user records

Every record in `data/users.json` must contain:

- `id`
- `username`
- `password`
- `name`
- `role`
- `phone`
- `createdAt`

Allowed roles are exactly:

```text
staff
admin
customer
```

Do not log raw passwords.

### Step 7: Improve user management

User-management routes are inside `routes/admin.js`. Coordinate with Backend C before editing that file.

Create user:

1. Read `username`, `password`, `name`, `phone`, and `role`.
2. Trim text fields.
3. Require every field.
4. Validate the role.
5. Reject a duplicate username case-insensitively.
6. Generate the next user ID.
7. Store a `createdAt` timestamp.
8. Write `users.json`.
9. Write an audit log.
10. Redirect with success or error.

Update user:

1. Find the user by `id`.
2. Validate text fields and role.
3. Reject a username used by another record.
4. Keep the old password when the password field is empty.
5. Save and log the change.

Do not allow deleting the last signed-in admin without a separate product decision.

### Step 8: Protect the system against invalid sessions

If `global.currentUser` refers to a deleted or edited user, decide and document one rule.

Recommended teaching rule:

- Keep it simple and restart the server after editing accounts manually.
- Do not add sessions just to solve this prototype-only edge case.

### Step 9: Test authentication and user management

1. Start the server.
2. Sign in with each demo account.
3. Confirm the correct role home.
4. Confirm wrong-role access is 403.
5. Confirm signed-out access redirects to login.
6. Create a user with username `testauth`.
7. Confirm the user appears in `data/users.json`.
8. Try to create `testauth` again.
9. Confirm it is rejected.
10. Update the test user's phone and role.
11. Restore `users.json` and `logs.json` to the three-user demo state before handoff unless the manager says otherwise.

### Step 10: Check the final code

Run:

```powershell
node --check app.js
node --check routes/auth.js
node --check middlewares/auth.js
node --check middlewares/role.js
node -e "JSON.parse(require('fs').readFileSync('data/users.json','utf8')); console.log('users.json valid')"
```

## Handoff message

```text
Authentication work ready for review
Files changed: <list>
Login tests: staff/admin/customer passed
403 tests: passed
User-management tests: passed
Demo data restored: yes
Files handed back: <the exact list>
Handed back at: <date and time>
```

## Completion checklist

- [ ] All three demo accounts work.
- [ ] Failed login shows a readable error.
- [ ] Logout clears the current user.
- [ ] Signed-out users are redirected.
- [ ] Wrong-role users receive 403.
- [ ] Create user validates all fields.
- [ ] Duplicate usernames are rejected.
- [ ] Password is optional when updating a user.
- [ ] Login and user changes produce log entries.
- [ ] No cookie, session, JWT, or database was added.
- [ ] `users.json` is valid JSON after testing.