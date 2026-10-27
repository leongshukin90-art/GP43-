# Backend B: Parcels, Shelves, Notifications, and Tracking

## Mission

Implement the parcel lifecycle so a parcel moves through the correct states, the shelf count remains correct, the customer receives the right pickup code, and every meaningful event appears in the tracking timeline.

## Start here in this project

`cainiao-lms` ships a **working framework with empty feature modules**. The framework boots,
you can sign in, and the role guards work. Everything listed as yours is either missing or a
stub, so read the plan below as *what to build*, not as an audit of something that exists.

The mechanic you will use constantly: each unimplemented route is one `stubPage({ ... })` call
in `routes/`, and its `needs` list is the acceptance list for that page. Replace the call, then
fill in the view. `docs/module-map.md` lists every page with its route, view, and owner.

Your routes in `routes/staff.js` and `routes/client.js` answer HTTP 501 and the matching views
are placeholders. Start with the file left empty for you on purpose:
`utils/parcels.js` - `createParcel()` and `countByStatus()` throw until you implement them.
Then work the staff lifecycle routes, then the three customer routes.

Already done for you, so verify rather than rewrite: `utils/id.js` (Step 5),
`utils/packageStatus.js` (the transition predicates), `utils/pagination.js`, and `utils/db.js`.
Each stub in `routes/staff.js` and `routes/client.js` carries its acceptance notes in the
`needs` list of the `stubPage({ ... })` call.

## Your files

Everything below is already in the folder. **Nobody else edits these files.** This list is your
claim - there is no issue tracker to claim against instead, so treat it as the rule.

| File | Now | What you do |
| --- | --- | --- |
| `utils/parcels.js` | stub, throws | Implement `createParcel` and `countByStatus`. Start here. |
| `routes/staff.js` | 12 stubs | Build the staff lifecycle. The 3 exception routes in the same file are Backend C. |
| `routes/client.js` | 3 stubs | Build the customer portal. |
| `utils/packageStatus.js` | working | The status vocabulary and the transition predicates. Add new rules here. |
| `utils/id.js` | working | `nextId` and `generatePickupCode`. |
| `utils/pagination.js` | working | Page slicing and page links. |
| `data/packages.json` | seeded, 10 records | Parcel records. Never hand back loose test parcels. |
| `data/shelves.json` | seeded, 5 records | Shelf records and their used counts. |
| `data/notifications.json` | seeded, 5 records | Pickup notifications. |
| `data/tracking.json` | seeded, 27 records | The tracking timeline. |

**Not yours - ask the owner before you touch these:**

| File | Owner |
| --- | --- |
| `views/` | Frontend A, B, C, and UI/UX |
| `routes/admin.js` | Backend A and C |
| `utils/date.js`, `utils/logger.js`, `utils/request.js` | Backend C |
| `utils/db.js`, `utils/stub.js`, `app.js` | Backend A |

## You do not own

- Login and role middleware
- User management
- Exception, report, log-list, and configuration routes
- Customer and admin Handlebars pages
- Database, queue, background worker, or chart library

## Lifecycle contract

```text
Arrived -> Shelved -> Notified -> Picked Up
             |
             +-> Exception (also possible from Arrived or Notified)
```

Allowed transitions:

| Current | Action | Next | Required condition |
| --- | --- | --- | --- |
| Arrived | Place on shelf | Shelved | active shelf with free capacity |
| Shelved | Generate notification | Notified | pickup code exists |
| Notified | Confirm pickup | Picked Up | correct parcel in Notified state |
| Arrived/Shelved/Notified | Report exception | Exception | description and issue type exist |
| Exception | Resolve | previous state or Arrived | shelf capacity is available to restore the shelf |

The server must reject invalid transitions with a readable redirect or error. Do not rely on the browser to hide buttons.

## Required parcel fields

Every package record must contain:

- `id`
- `trackingNo`
- `recipientName`
- `recipientPhone`
- `customerId`
- `shelfId`
- `pickupCode`
- `status`
- `weight`
- `type`
- `arrivedAt`
- `shelvedAt`
- `notifiedAt`
- `pickedUpAt`

Optional temporary fields:

- `previousStatus` while a parcel is in an exception flow

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

Sign in as `staff01` and `cust01`. `/staff/packages` and `/my/packages` answer **HTTP 501**
until you build them.
### Step 2: Read the existing route file

Open `routes/staff.js` and make a route map:

| Route | Reads | Writes |
| --- | --- | --- |
| `GET /staff/dashboard` | packages, shelves | none |
| `GET /staff/packages` | packages | none |
| `GET /staff/packages/create` | users | none |
| `POST /staff/packages` | packages, users | packages, tracking, logs |
| `POST /staff/packages/batch` | packages, users | packages, tracking, logs |
| `GET /staff/packages/:id` | packages, tracking, shelves | none |
| `POST /staff/packages/:id/shelf` | packages, shelves | packages, shelves, tracking, logs |
| `POST /staff/packages/:id/notify` | packages, notifications, config | packages, notifications, tracking, logs |
| `POST /staff/packages/:id/pickup` | packages, shelves | packages, shelves, tracking, logs |
| shelf routes | shelves | shelves, logs |

### Step 3: Keep one parcel factory

Use `utils/parcels.js` for single and batch intake. Do not copy the parcel object shape into both route handlers.

The factory must:

- Generate the next `PKG` ID.
- Set `shelfId` and `pickupCode` to `null`.
- Set `status` to `Arrived`.
- Set `arrivedAt`.
- Set all later timestamps to `null`.

This prevents new fields from being added to one intake path and forgotten in the other.

### Step 4: Validate intake

Single intake must check:

- Tracking number is not empty.
- Tracking number is unique case-insensitively.
- Recipient name is not empty.
- Recipient phone is not empty.
- Customer exists and has role `customer`.
- Weight is a positive number.
- Type is one of the allowed values.

Batch intake must:

- Read one row per line.
- Accept `|` or comma separators.
- Require tracking number, recipient, phone, and weight.
- Default missing type to `Parcel`.
- Skip invalid rows without crashing the whole request.
- Report how many rows were created and skipped.

### Step 5: Generate safe IDs and pickup codes

`utils/id.js` must:

- Find the highest numeric suffix.
- Generate the next ID with the same prefix.
- Generate a six-digit pickup code.
- Avoid collisions with existing pickup codes.

Do not use the tracking number as the pickup code.

### Step 6: Implement shelf assignment

Required checks:

1. Parcel exists.
2. Parcel status is `Arrived`.
3. Shelf exists.
4. Shelf status is `Active`.
5. `shelf.used < shelf.capacity`.

On success:

- Set `shelfId`.
- Generate `pickupCode`.
- Set status to `Shelved`.
- Set `shelvedAt`.
- Increment `shelf.used`.
- Write packages and shelves.
- Add tracking event.
- Add operation log.

### Step 7: Implement notification generation

Required checks:

1. Parcel exists.
2. Parcel status is `Shelved`.
3. Pickup code exists.

On success:

- Read configuration.
- Replace `siteName`, `trackingNo`, `pickupCode`, and `name` placeholders.
- Create a notification if one does not already exist for the parcel.
- Set parcel status to `Notified`.
- Set `notifiedAt`.
- Write packages and notifications.
- Add tracking event.
- Add operation log.

The notification content must use the server-side template. Do not generate the message only in the browser.

### Step 8: Implement pickup

Required checks:

1. Parcel exists.
2. Parcel status is `Notified`.

On success:

- Set status to `Picked Up`.
- Set `pickedUpAt`.
- Decrement the used count of the assigned shelf when it is still present.
- Keep the shelf history fields if the current design uses them for display.
- Write packages and shelves.
- Add tracking event.
- Add operation log.

Do not allow arrival-to-pickup or shelf-to-pickup shortcuts.

### Step 9: Keep tracking meaningful

Every tracking event must contain:

- `id`
- `packageId`
- `status`
- `description`
- `operator`
- `createdAt`

The description should be understandable without reading code. Example:

```text
Placed on shelf S-A-01. Pickup code 481920.
```

### Step 10: Validate pagination and search

The staff list supports:

- `q`
- `status`
- `type`
- `page`

The list should:

- Search tracking number, recipient name, phone, and pickup code.
- Filter without breaking pagination.
- Keep the current filters in page links.
- Return a useful empty page.

### Step 11: Test package state transitions

Run this flow in the browser:

1. Sign in as `staff01`.
2. Receive one parcel.
3. Confirm status `Arrived`.
4. Try to notify before shelving. Confirm the server rejects it.
5. Assign an active shelf.
6. Confirm status `Shelved` and a six-digit pickup code.
7. Generate the notification.
8. Confirm status `Notified` and a notification record.
9. Confirm pickup.
10. Confirm status `Picked Up` and a released shelf slot.

Then repeat with batch intake using two rows.

### Step 12: Test shelf capacity

1. Find the smallest shelf in `data/shelves.json`.
2. Fill it until `used` equals `capacity`, then restore the JSON before handoff.
3. Confirm the server rejects another shelf assignment to that shelf.
4. Move a parcel away or restore the JSON.
5. Confirm the shelf becomes available again.

### Step 13: Test tracking and JSON persistence

After each action:

- Open package detail and confirm the new tracking event appears.
- Stop the server.
- Start it again.
- Confirm the package status is still correct.

### Step 14: Protect data shape

Run:

```powershell
node -e "for (const f of ['packages','shelves','notifications','tracking']) { JSON.parse(require('fs').readFileSync('data/'+f+'.json','utf8')); console.log(f+' valid'); }"
```

Do not leave temporary test packages behind. Keep 10 sample packages unless the manager explicitly changes the seed data.

## Code quality rules

- Put state predicates in `utils/packageStatus.js`.
- Put parcel creation in `utils/parcels.js`.
- Put ID generation in `utils/id.js`.
- Put pagination in `utils/pagination.js`.
- Do not repeat the same shelf capacity calculation in three routes.
- Use short comments that explain why a check exists.

## Handoff message

```text
Parcel lifecycle ready for review
Routes changed: <list>
State transitions tested: Arrived -> Shelved -> Notified -> Picked Up
Shelf capacity tested: yes
JSON restored: yes
Files handed back: <the exact list>
Handed back at: <date and time>
```

## Completion checklist

- [ ] Single intake works and validates input.
- [ ] Batch intake works and reports skipped rows.
- [ ] Invalid lifecycle transitions are rejected.
- [ ] Pickup codes are six digits and unique.
- [ ] Shelf capacity is respected.
- [ ] Pickup releases shelf capacity.
- [ ] Notification content matches the configuration template.
- [ ] Tracking events are added for each successful action.
- [ ] Search and pagination keep their filters.
- [ ] JSON files remain valid.