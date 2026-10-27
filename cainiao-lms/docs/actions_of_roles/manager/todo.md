# Project Manager / Requirements Owner


## Mission

Keep the team aligned on one clear version of the product. No developer should have to guess what a route, field, role, status, or acceptance condition means.

The current prototype already exists. Your job is to document it accurately, settle disagreements, create small work items, and confirm the final demonstration.


## Start here in this project

`cainiao-lms` ships a **working framework with empty feature modules**. The framework boots,
you can sign in, and the role guards work. Everything listed as yours is either missing or a
stub, so read the plan below as *what to build*, not as an audit of something that exists.

The mechanic you will use constantly: each unimplemented route is one `stubPage({ ... })` call
in `routes/`, and its `needs` list is the acceptance list for that page. Replace the call, then
fill in the view. `docs/module-map.md` lists every page with its route, view, and owner.

Your documents (`docs/requirements.md`, `docs/data-dictionary.md`,
`docs/acceptance.md`, `docs/demo-script.md`) do not exist yet, and they are the critical path:
every other role is blocked on the frozen route names and field names. Write them from two
sources that do exist - `prototype/cainiao-lms-prototype.html` for behaviour and
`docs/module-map.md` for the route/view/owner map - not from imagination.

The prototype file was moved into this project; it is no longer under `cainiao-lms-prototype`,
and the reference implementation next door has a broken login (see the project README).

## Your files

Everything below is already in the folder. **Nobody else edits these files.** This list is your
claim - there is no issue tracker to claim against instead, so treat it as the rule.

| File | Now | What you do |
| --- | --- | --- |
| `docs/requirements.md` | does not exist | Create it: scope, roles, lifecycle, enums, rules. |
| `docs/data-dictionary.md` | does not exist | Create it: every field of every record in `data/`. |
| `docs/acceptance.md` | does not exist | Create it: one checkbox per role, each an observable result. |
| `docs/demo-script.md` | does not exist | Create it: a 5-8 minute click script plus a reset step. |
| `docs/module-map.md` | written | Verify the route table against `routes/`, then freeze it. |
| `docs/actions_of_roles/*/todo.md` | written | Keep the role plans current. Owners may correct their own. |
| `snapshots/README.md` | written | Keep the backup convention accurate. |

**Not yours - ask the owner before you touch these:**

| File | Owner |
| --- | --- |
| every source file: `app.js`, `routes/`, `views/`, `utils/`, `public/` | the role owners |
| `data/*.json` | Backend A, B, and C |

## You do not own

- Do not directly redesign UI files unless the UI/UX owner is unavailable.
- Do not change route behavior without telling the route owner.
- Do not silently rename JSON fields. A field rename affects backend, frontend, seed data, tests, and documentation.
- Do not mark a feature complete based only on source code. Check the browser behavior.


## Current baseline to document

Read these files before writing anything:

- `package.json`
- `app.js`
- `routes/auth.js`
- `routes/staff.js`
- `routes/client.js`
- `routes/admin.js`
- `middlewares/auth.js`
- `middlewares/role.js`
- every file under `data/`
- every page under `views/`
- `README.md`

Do not trust an old screenshot or chat message more than the current source files.


## Step-by-step work


### Step 1: Verify that the application runs

Action:

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

Expected result:

- The login page appears.
- All three demo accounts can sign in.
- The correct role page opens.
- The page styles load from Bootstrap.

Record exactly which version you are reviewing: the folder, the date, and the time. That is the
only version anchor this project has.


### Step 2: Create `docs/requirements.md`

Use simple numbered requirements. For every requirement, include:

- The user role
- The user goal
- The expected result
- The rule or limitation
- The related route
- The related JSON files

Example:

```markdown

### REQ-STAFF-004: Shelve a parcel

- Role: staff
- Goal: place an arrived parcel on a shelf
- Route: POST /staff/packages/:id/shelf
- Data: packages.json, shelves.json, tracking.json, logs.json
- Rule: only Arrived parcels can be shelved
- Rule: the shelf must be Active and have free capacity
- Result: the parcel becomes Shelved and receives a six-digit pickup code
```

Cover all required features in the original project request. Do not add database, Docker, TypeScript, or authentication technologies.


### Step 3: Verify the route table in `docs/module-map.md`

The route table already exists: `docs/module-map.md` lists every route with its input fields,
the JSON files it reads and writes, the template it renders, and its owner. It was written and
checked against a working implementation, so **do not rewrite it into a second `docs/routes.md`**
- two route tables in one project drift apart, and then nobody knows which one is true.

Your job here is to verify and extend it:

1. Walk every route in the table and open it in `routes/`. Confirm the path and the method match.
2. Confirm the input fields match the forms the frontend owners are writing, and the template
   variable list matches what the route actually passes.
3. Add anything the table is missing: a purpose line, error behaviour, a `prototype helper` label.
4. Mark the routes that only exist for the demo, such as `POST /demo/login`.
5. Freeze it: from then on, a path or field-name change must update this table in the same task.

Keep `docs/module-map.md` as the single route table. If the team later outgrows it, split it out
into `docs/routes.md` in one move - do not maintain both.
### Step 4: Create `docs/data-dictionary.md`

Describe each JSON file and every field. Use this table shape:

| Field | Type | Required | Example | Rule |
| --- | --- | --- | --- | --- |
| `trackingNo` | string | yes | `CAINIAO-HK-1001` | uppercase and unique |
| `status` | string | yes | `Arrived` | one of the five allowed statuses |

Define these enums exactly:

- Roles: `staff`, `admin`, `customer`
- Parcel statuses: `Arrived`, `Shelved`, `Notified`, `Picked Up`, `Exception`
- Shelf statuses: `Active`, `Maintenance`
- Exception statuses: `Open`, `Resolved`
- Parcel types: `Parcel`, `Document`, `Fragile`, `Bulky`, `Cold Chain`

Write down which fields are generated by the server and must not be trusted from the browser.


### Step 5: Create `docs/acceptance.md`

Write a checkbox list for each role. Each item must describe an observable result.

Good example:

```markdown
- [ ] As staff01, receive a valid parcel and see it listed with status Arrived.
- [ ] As staff01, try an empty tracking number and see a validation message, not a server crash.
- [ ] As cust01, open `/my/packages` and see only packages where `customerId` equals the current user ID.
- [ ] As cust01, open `/staff/dashboard` and receive HTTP 403.
```

Include checks for:

- Login success and failure
- Logout
- Role protection
- Single and batch intake
- Search, filter, and pagination
- Shelf capacity
- Pickup-code generation
- Notification generation
- Pickup handover
- Tracking timeline
- Exception report and resolve
- Reports
- User management
- Operation logs
- Configuration
- JSON persistence after server restart


### Step 6: Keep the file ownership current

With no version control, **the file lists in the nine role plans are the only thing stopping two
people from overwriting each other.** They are already written for all nine roles.

Keep them true:

1. When a new file appears, name its owner in the matching role plan.
2. When a file changes hands, update **both** role plans in the same task.
3. When a file is shared - `routes/staff.js` and `routes/admin.js` are - keep the split written
   down: which block belongs to which owner.
4. When someone needs a file outside their list, they ask you, and you record the hand-over.

If the team ever wants a real issue tracker, `.scratch/<feature-slug>/issues/` is the convention
in the repository `AGENTS.md`. Do not run both systems at once.
### Step 7: Coordinate field and route changes

Before approving a field change, answer:

1. Which JSON file changes?
2. Which seed records need migration?
3. Which route reads or writes the field?
4. Which Handlebars page shows the field?
5. Which acceptance item changes?
6. Who owns each affected file?

Write the answer down before implementation starts.


### Step 8: Create `docs/demo-script.md`

Write a 5-8 minute demonstration with exact clicks:

1. Sign in as `staff01`.
2. Receive one parcel.
3. Shelve it and show the pickup code.
4. Generate the notification.
5. Sign in as `cust01` and show the parcel and notification.
6. Return as `staff01` and confirm pickup.
7. Sign in as `admin01` and show reports, users, logs, and configuration.
8. Explain the exception workflow using a prepared sample parcel.

Keep a reset instruction at the top so the demo can be repeated.


### Step 9: Run the final acceptance review

For each hand-back:

- Read what the owner wrote down.
- Run the acceptance steps.
- Compare the screen text and field names with the documents.
- Check the handed-back files are the ones you signed off, and that nobody edited them afterwards.
- Accept it or return it with the exact missing behavior.


## Deliverables

- A complete requirements document
- The verified route table in `docs/module-map.md`
- A complete JSON data dictionary
- A testable acceptance checklist
- A repeatable demo script
- The file ownership lists in the nine role plans
- Final sign-off with the frozen file list and the date


## Completion checklist

- [ ] Every documented route exists in code.
- [ ] Every documented JSON field exists or is clearly marked as proposed.
- [ ] Every acceptance item uses a real demo account and observable result.
- [ ] Nothing is marked done without browser evidence.
- [ ] The demo script can run from a clean server restart.
- [ ] All unresolved decisions have an owner and a due date.