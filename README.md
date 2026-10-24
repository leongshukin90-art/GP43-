# Cainiao LMS — team project skeleton

A runnable full-stack **framework** for the Cainiao Post (Hong Kong) parcel management system.
The application boots, you can sign in, role guards work, and every unfinished page tells you
so instead of pretending to work.

This project is built for a team. The framework is done; the feature modules are the work.

**Version: first hand-off, 2026-10-11.** There is no version control, so every hand-back carries
its own file list and timestamp. See "Working without version control" in
`docs/actions_of_roles/README.md`.

## What to read first

| If you are | Read |
| --- | --- |
| New to the project | this README, then `docs/module-map.md` |
| About to build a page or a route | `docs/module-map.md` - the frozen paths, fields, and variables |
| About to start your role | `docs/actions_of_roles/<your-role>/todo.md` |
| Reviewing someone else's work | `docs/actions_of_roles/qa-config/todo.md` |

## Where the design comes from

| Source | What it is |
| --- | --- |
| `prototype\cainiao-lms-prototype.html` | The throwaway logic prototype, moved into this project: one file, in-memory, proves the screen flow and the parcel lifecycle. Open it directly in a browser. |
| `..\cainiao-lms-prototype\` (it does **not** travel with this folder) | The finished reference implementation. Use it to check expected behaviour if you have it. Do not copy it blindly - see **Known issue** below. |
| `docs/actions_of_roles/` | One work plan per team role. |

## Quick start

```powershell
cd <the project folder>
npm install
npm run dev
```

Open <http://localhost:3000>.

| Role | Username | Password |
| --- | --- | --- |
| Station staff | `staff01` | `123456` |
| Administrator | `admin01` | `123456` |
| Customer | `cust01` | `123456` |

The login page carries one **quick sign-in button per role** (`staff`, `admin`, `customer`). They post to the prototype helper `POST /demo/login`, which skips the password check and is restricted to the three usernames listed below. Delete that route and the quick sign-in box in `views/auth/login.hbs` before this project is used for anything real.

Authentication keeps the signed-in user in the `global.currentUser` variable.
Restarting the server signs everyone out. No cookie, session, JWT, or database is used.

## Already built — treat as shared infrastructure

Change these only when the manager says so, because everyone depends on them.

| Path | What it does |
| --- | --- |
| `app.js` | Boots Express, registers the view engine, helpers, guards, routers, and the 404 / 500 pages. |
| `routes/auth.js` | Real, working login and logout. |
| `middlewares/auth.js`, `middlewares/role.js` | `requireAuth` and `requireRole`. Every role group is already guarded. |
| `utils/db.js` | `readJson` / `writeJson` for the `data/` files. |
| `utils/id.js`, `utils/date.js`, `utils/logger.js`, `utils/navigation.js`, `utils/pagination.js`, `utils/packageStatus.js`, `utils/request.js` | Shared helpers: IDs and pickup codes, Hong Kong dates, the audit log, role homes, page slicing, the status vocabulary, and form trimming. |
| `views/layouts/`, `views/partials/`, `views/error.hbs`, `views/auth/login.hbs` | Shared shell, navigation, alerts, error page, login page. |
| `data/*.json` | Seed data: 3 users, 5 shelves, 10 parcels, tracking events, notifications, exceptions, logs, config. |
| `public/css/style.css`, `public/js/main.js` | Base styles and the `data-confirm` form guard. |

## What the team builds

Every route in `routes/staff.js`, `routes/client.js`, and `routes/admin.js` currently answers
**HTTP 501 Not Implemented** and renders the page stub. The route path and the template name are
already correct, so implementing a page means replacing one `stubPage(...)` call with the real
handler and filling in the `.hbs` file.

| Module | Route file | Views | Owner |
| --- | --- | --- | --- |
| Authentication | `routes/auth.js` (working) | `views/auth/login.hbs` | backend-auth |
| Staff workflows | `routes/staff.js` | `views/staff/*.hbs` | backend-parcel + frontend-staff |
| Customer portal | `routes/client.js` | `views/client/*.hbs` | backend-parcel + frontend-customer |
| Admin console | `routes/admin.js` | `views/admin/*.hbs` | backend-admin + frontend-admin |
| Parcel domain rules | `utils/parcels.js` (stub) | — | backend-parcel |
| Exceptions | `routes/staff.js` exception routes | `views/staff/exceptions.hbs` | backend-admin + frontend-staff |

See `docs/module-map.md` for the per-page detail and the definition of done.

## Route contract

These paths are frozen. Keep them unless the manager approves a change, because other people
link to them and post forms to them.

### Authentication (public)

- `GET /login` — form, including the three one-click demo buttons
- `POST /login` — fields `username`, `password`
- `POST /demo/login` — **prototype helper**: signs in a listed demo account with no password, field `username`
- `GET /logout`

### Staff (`/staff`, role `staff`)

- `GET /dashboard`
- `GET /packages` — query `q`, `status`, `type`, `page`
- `GET /packages/create`
- `POST /packages`
- `POST /packages/batch`
- `GET /packages/:id`
- `POST /packages/:id/shelf`
- `POST /packages/:id/notify`
- `POST /packages/:id/pickup`
- `GET /shelves`
- `POST /shelves`
- `POST /shelves/:id/status`
- `GET /exceptions`
- `POST /exceptions`
- `POST /exceptions/:id/resolve`

### Customer (`/my`, role `customer`)

- `GET /packages` — query `q`, `status`, `page`
- `GET /packages/:id`
- `GET /notifications`

### Administrator (`/admin`, role `admin`)

- `GET /reports`
- `GET /users`
- `POST /users`
- `POST /users/:id`
- `GET /logs` — query `q`, `action`, `page`
- `GET /config`
- `POST /config`

## Domain rules

- Roles: `staff`, `admin`, `customer`
- Parcel statuses: `Arrived`, `Shelved`, `Notified`, `Picked Up`, `Exception`
- Shelf statuses: `Active`, `Maintenance`
- Exception statuses: `Open`, `Resolved`
- Parcel types: `Parcel`, `Document`, `Fragile`, `Bulky`, `Cold Chain`

```text
Arrived -> Shelved -> Notified -> Picked Up
                   \-> Exception -> back to the previous status, or Arrived
```

The vocabulary and the transition predicates live in `utils/packageStatus.js`. Put new
status rules there instead of repeating them in three route files.

## Team map

| # | Role | Plan |
| --- | --- | --- |
| 1 | Project manager / requirements | `docs/actions_of_roles/manager/todo.md` |
| 2 | UI/UX designer | `docs/actions_of_roles/ui/todo.md` |
| 3 | Frontend A — staff pages | `docs/actions_of_roles/frontend-staff/todo.md` |
| 4 | Frontend B — customer pages | `docs/actions_of_roles/frontend-customer/todo.md` |
| 5 | Frontend C — admin pages | `docs/actions_of_roles/frontend-admin/todo.md` |
| 6 | Backend A — app foundation and auth | `docs/actions_of_roles/backend-auth/todo.md` |
| 7 | Backend B — parcels, shelves, notifications | `docs/actions_of_roles/backend-parcel/todo.md` |
| 8 | Backend C — exceptions, reports, logs, config | `docs/actions_of_roles/backend-admin/todo.md` |
| 9 | QA / configuration management | `docs/actions_of_roles/qa-config/todo.md` |

## Project rules

1. One person owns one file. Your role plan lists yours; do not edit another owner's file without telling them first.
2. Keep the application runnable after every merge. `npm run check` must pass.
3. No database, Docker, TypeScript, frontend framework, chart library, cookie, session, or JWT.
4. English for all software text, comments, JSON values, and documentation.
5. Never hand back `node_modules/`. Share the project folder without it.
6. Never hand back broken demo data. The default state keeps 3 users, 5 shelves, and 10 sample parcels.
7. A task is not done until the owner writes the exact checks they ran and the result.

## Checks

```powershell
npm run check
```

Validates the JSON data files:

```powershell
node -e "for (const f of ['config','users','packages','shelves','notifications','tracking','exceptions','logs']) { JSON.parse(require('fs').readFileSync('data/' + f + '.json', 'utf8')); console.log(f + ' valid'); }"
```

## Known issue in the reference implementation

The reference implementation, if you have it next door, has a broken login in
`..\cainiao-lms-prototype\routes\auth.js`: the line
`const user = users.find(...)` sits behind a `//` comment on the previous line, so
`POST /login` throws `ReferenceError: user is not defined`. This project ships a clean
`routes/auth.js` instead, so sign-in works from the start. Fix the reference before using it
as a behaviour reference for authentication.
