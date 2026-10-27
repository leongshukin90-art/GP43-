# Testing and Configuration Management

## Mission

Prove that the prototype works, catch broken changes before the demonstration, keep every hand-back tidy, and make sure setup instructions match reality.

This role is the quality gate. You do not need to be the best programmer, but you must be careful, repeatable, and honest about failures.

## Start here in this project

`cainiao-lms` ships a **working framework with empty feature modules**. The framework boots,
you can sign in, and the role guards work. Everything listed as yours is either missing or a
stub, so read the plan below as *what to build*, not as an audit of something that exists.

The mechanic you will use constantly: each unimplemented route is one `stubPage({ ... })` call
in `routes/`, and its `needs` list is the acceptance list for that page. Replace the call, then
fill in the view. `docs/module-map.md` lists every page with its route, view, and owner.

Two corrections to this plan:

- The project folder is wherever the manager puts it - for example `D:\test\cainiao-lms`. It is not `...\cainiao-lms-prototype`.
- `npm install` on its own is enough. (`npm install node express express-handlebars` would try to
  install a package literally called `node`. Never run it.)

What is testable today: login, logout, the role guards, the 404 and 500 pages, `npm run check`,
and the JSON seed files. Step 5 and Steps 14-18 apply now. Steps 6-13 need the feature pages,
which return HTTP 501 until their owners build them - record those as **blocked**, not failed.

Two checks specific to this project:

- `POST /demo/login` is a password-less prototype helper. Confirm it stays restricted to the
  `DEMO_ACCOUNTS` whitelist, and confirm it is gone before release.
- Every `{{> stub}}` still present in `views/` is a page nobody has built yet. Count them.

This project has **no version control**. Everyone edits the same folder, so the rules that
keep it safe are: one person owns one file, copy `data/` aside before a destructive test, and
put every hand-back (file list + date and time + evidence) in your hand-back message.

## Your files

Everything below is already in the folder. **Nobody else edits these files.** This list is your
claim - there is no issue tracker to claim against instead, so treat it as the rule.

| File | Now | What you do |
| --- | --- | --- |
| `README.md` | written | Keep setup, run, and demo instructions true. |
| `package.json` | written | Guard the dependency boundary. No new dependency without the manager. |
| `package-lock.json` | written | Regenerate only when `package.json` legitimately changes. |
| `docs/actions_of_roles/README.md` | written | The hand-back convention and the source-of-truth table. |
| `tests/ (folder)` | does not exist | Add automated tests if the team decides it wants them. |

**Not yours - ask the owner before you touch these:**

| File | Owner |
| --- | --- |
| `routes/`, `views/`, `utils/` | the owners above |
| `data/*.json` | Backend A, B, and C |
| `docs/requirements.md` and the other product documents | the manager |

## You do not own

- Product scope decisions
- Route behavior without the matching backend owner
- UI redesign without the UI/UX owner
- Other people's feature branches

## Test environment

- Windows PowerShell
- Node.js 20 LTS or later (verified on Node 22.18)
- Project folder: the shared folder the manager hands out (for example `D:\test\cainiao-lms`)
- Demo accounts: `staff01`, `admin01`, `cust01`
- Password: `123456`

Do not test against a dirty data set without writing down what changed. Back up the `data/` directory before destructive tests.

PowerShell backup:

```powershell
$backup = Join-Path $env:TEMP "cainiao-lms-data-backup"
New-Item -ItemType Directory -Force -Path $backup | Out-Null
Copy-Item -Path "data\*" -Destination $backup -Force
```

Restore:

```powershell
Copy-Item -Path (Join-Path $backup "*") -Destination "data" -Force
Remove-Item -LiteralPath $backup -Recurse -Force
```

Before any recursive delete, print the resolved target and confirm it is in `$env:TEMP`.

## Step-by-step work

### Step 1: Get the version you are going to test

Copy the whole project folder somewhere outside the shared folder and test that copy, so a
half-finished edit by someone else cannot break your run:

```powershell
$stamp   = Get-Date -Format "yyyy-MM-dd-HHmm"
$project = "<the project folder>"
$test    = Join-Path $env:TEMP "cainiao-lms-$stamp"
Copy-Item -Path $project -Destination $test -Recurse
cd $test
npm install
npm run dev
```

Write the folder name and the date and time into your test report. Without version control,
that stamp is the only way to say which version passed.
### Step 2: Install and start

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

If the server fails, record:

- Exact command
- Full error message
- Node version
- npm version
- Which folder copy you are testing, with its date and time

Do not hide the error by changing random files.

### Step 3: Run static checks

```powershell
node --check app.js
Get-ChildItem routes,utils,middlewares -Filter *.js -Recurse | ForEach-Object { node --check $_.FullName }
```

Validate every JSON file:

```powershell
node -e "const fs=require('fs'); for (const f of fs.readdirSync('data').filter(x=>x.endsWith('.json'))) { JSON.parse(fs.readFileSync('data/'+f,'utf8')); console.log(f+' valid'); }"
```

Expected result: every file prints `valid`.

### Step 4: Check the dependency boundary

```powershell
npm ls --depth=0
```

Allowed direct dependencies:

- `express`
- `express-handlebars`
- `nodemon` in `devDependencies`

Fail the review if the project added a database, chart library, frontend framework, TypeScript, cookie, session, or JWT dependency.

### Step 5: Test login and role guards

Create a table with these columns:

| Case | Steps | Expected |
| --- | --- | --- |
| Valid staff login | `staff01 / 123456` | `/staff/dashboard` |
| Valid admin login | `admin01 / 123456` | `/admin/reports` |
| Valid customer login | `cust01 / 123456` | `/my/packages` |
| Wrong password | any wrong password | login error, no access |
| Signed-out staff route | open `/staff/dashboard` | redirect to `/login` |
| Customer on staff route | signed in as `cust01` | HTTP 403 |
| Staff on admin route | signed in as `staff01` | HTTP 403 |
| Admin on customer route | signed in as `admin01` | HTTP 403 |
| Logout | open `/logout` | redirect to `/login` |

### Step 6: Test the staff workflow

Use a fresh test parcel.

1. Receive one parcel.
2. Confirm it appears with status `Arrived`.
3. Assign a valid shelf.
4. Confirm a six-digit pickup code.
5. Generate a notification.
6. Find the matching customer notification.
7. Confirm the pickup.
8. Confirm shelf usage decreased.
9. Confirm tracking events exist in the correct order.
10. Confirm operation log entries exist.

Test invalid cases:

- Duplicate tracking number
- Empty recipient
- Zero or negative weight
- Missing customer
- Inactive shelf
- Full shelf
- Pickup before notification

### Step 7: Test batch intake

Use this sample:

```text
CAINIAO-HK-9001 | Test User | +852 9000 9001 | 1.2 | Parcel
CAINIAO-HK-9002 | Test User | +852 9000 9002 | 2.4 | Document
```

Expected:

- Two packages are created.
- Both have status `Arrived`.
- Both appear in the list.
- Invalid rows do not crash the whole request.
- The redirect reports created and skipped counts.

Restore the seed data after the test.

### Step 8: Test search, filters, and pagination

- Search a full tracking number.
- Search a partial recipient name.
- Search by phone.
- Filter each status.
- Filter each type.
- Open page 2.
- Combine a filter and page 2.
- Confirm page links keep the filter.

### Step 9: Test exceptions

1. Choose an eligible parcel.
2. Report a damaged, lost, refused, or address issue.
3. Confirm the parcel becomes `Exception`.
4. Confirm the exception is `Open`.
5. Confirm shelf usage is released when needed.
6. Resolve the exception.
7. Confirm the parcel returns to the documented state.
8. Confirm obsolete notification content is not left behind.
9. Confirm tracking and log entries exist.

### Step 10: Test admin pages

Reports:

- Count packages manually.
- Compare total cards.
- Compare status counts.
- Compare type counts.
- Compare seven-day inbound bars.
- Confirm the chart marker exists.

Users:

- Create a unique test user.
- Try a duplicate username.
- Update role, name, and phone.
- Leave password empty and confirm it still works.
- Restore the demo user list afterward.

Logs:

- Search by username.
- Filter by action.
- Open page 2 when available.
- Confirm newest entries sort first.

Configuration:

- Save a test site name.
- Confirm the navbar updates.
- Restore the original configuration.

### Step 11: Test customer isolation

Every package shown to `cust01` must have:

```json
"customerId": "USR-0003"
```

Test the server-side check by changing one package in a backup copy and opening it as the wrong customer. Expected result: HTTP 403. Restore the original data.

### Step 12: Test persistence

1. Perform one valid write action.
2. Stop the server.
3. Start the server.
4. Sign in again.
5. Confirm the written data still exists.

### Step 13: Test browser layout

Check at these widths:

- 360 px
- 768 px
- 1280 px

Look for:

- Horizontal page overflow
- Hidden primary button
- Unreadable pickup code
- Broken table layout
- Navbar overlap
- Chart label clipping

### Step 14: Review code changes

For each changed file ask:

1. Is the change inside the owner's boundary?
2. Does it add an unapproved dependency?
3. Does it use a short useful comment?
4. Does it leave the app runnable?
5. Does it update the matching documentation?
6. Does it leave test data changed?

### Step 15: Review a hand-back

There is no diff to read, so the review rests on what the owner wrote down. For each task:

1. Read the hand-back: the file list, what changed, and the evidence.
2. Ask the owner for the exact list of files they touched, if it is missing or vague.
3. Compare the handed-back files with your last snapshot of those files. If a file changed that
   is not on the list, treat it as an unreviewed change and ask about it.
4. Confirm the file list stays inside one owner boundary.
5. Re-run the checks from Steps 3-13 that cover those files.
6. Record the result and the date with the hand-back.

A hand-back is rejected when the file list is incomplete, the server does not start, or the
evidence cannot be reproduced on a clean copy of the folder.
### Step 16: Update README

The README must contain:

- Project name and purpose
- Exact technology list
- Node version
- Install command
- Development command
- Port and URL
- Demo accounts
- Main workflows
- Route list (compare with `docs/module-map.md`)
- JSON file list
- Prototype limitations
- Test or demo notes when relevant

Remove duplicate or impossible commands. Do not tell students to install a global `node` package when Node.js is already the runtime.

### Step 17: Prepare the demo

Before the presentation:

1. Restore the standard seed data only if that is the agreed demo state.
2. Count users, shelves, and packages.
3. Start the server once and leave it running.
4. Rehearse the manager's demo script.
5. Prepare one known exception parcel.
6. Prepare one arrival parcel for live intake.
7. Keep a second PowerShell window ready for JSON checks.
8. Record which folder copy you tested, with its date and time.

### Step 18: Publish the test report

Use this format:

```text
Version (folder + date and time):
Environment:
Test date:
Tester:
Passed cases:
Failed cases:
Blocked cases:
Data restored:
Known limitations:
```

Attach screenshots for layout failures. Include the exact request and response for HTTP failures.

## Completion checklist

- [ ] `npm install` works from a clean checkout.
- [ ] `npm run dev` starts the server.
- [ ] All three demo accounts work.
- [ ] All role guards work.
- [ ] Single and batch intake work.
- [ ] Shelf assignment and capacity rules work.
- [ ] Notification generation works.
- [ ] Pickup releases capacity.
- [ ] Tracking timeline matches actions.
- [ ] Exception report and resolve work.
- [ ] Reports match JSON data.
- [ ] User management works.
- [ ] Logs are searchable.
- [ ] Configuration persists and restores.
- [ ] All JSON files are valid.
- [ ] No unapproved dependency was added.
- [ ] README instructions match the project.
- [ ] Demo data is restored.
- [ ] The tested version (folder copy + date and time) is recorded.