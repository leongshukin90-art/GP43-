> **Note for the cainiao-lms project.** These plans were written against the finished
> reference implementation next door (that folder is optional and does not travel with this one).
> This project is the skeleton: the framework runs, but every feature page is a stub that
> answers HTTP 501.
> Read each plan as *what to build*, not *what to review*, and read the matching
> stubPage({ ... }) call in routes/ first - its needs list is the acceptance list.
> The source-of-truth documents listed below (docs/requirements.md, docs/data-dictionary.md, ...)
> do not exist yet; the manager creates them in step 1 of the delivery order.
# Role Action Plans

This directory explains what each person should do next on the Cainiao Post Hong Kong parcel management prototype.

The existing project is already runnable. These plans are not instructions to rebuild it from zero. They explain how each owner should review, improve, verify, and hand off their part without breaking other people's work.

## Team map

| Number | Role | Folder | Main responsibility |
| --- | --- | --- | --- |
| 1 | Project manager / requirements | `manager/` | Requirements, JSON dictionary, acceptance, demo |
| 2 | UI/UX designer | `ui/` | Layout, components, colors, responsive and accessibility rules |
| 3 | Frontend A | `frontend-staff/` | Staff pages |
| 4 | Frontend B | `frontend-customer/` | Customer pages |
| 5 | Frontend C | `frontend-admin/` | Admin pages and report placeholders |
| 6 | Backend A | `backend-auth/` | App foundation, authentication, roles, users |
| 7 | Backend B | `backend-parcel/` | Parcels, shelves, pickup codes, notifications, tracking |
| 8 | Backend C | `backend-admin/` | Exceptions, reports, logs, configuration |
| 9 | Testing / configuration management | `qa-config/` | Tests, file hand-back rules, README, release and demo checks |

## Project baseline

- Runtime: Node.js 20 LTS or later
- Language: JavaScript only
- Server: Express
- Templates: express-handlebars
- Styling: Bootstrap 5 CDN
- Data: JSON files under `data/`
- Authentication: `global.currentUser`, with no cookie, session, or JWT
- Demo accounts: `staff01`, `admin01`, `cust01`
- Password for all demo accounts: `123456`
- Main lifecycle: `Arrived -> Shelved -> Notified -> Picked Up`
- Exception side path: `Arrived`, `Shelved`, or `Notified -> Exception`
- Report marker: `<!-- CHART: daily-inbound -->`

## Source-of-truth files

The team must keep these files consistent:

| Topic | Source of truth |
| --- | --- |
| Product requirements | `docs/requirements.md` |
| Route table, input fields, data files, template variables | `docs/module-map.md` **(already written)** |
| JSON fields | `docs/data-dictionary.md` |
| Acceptance checks | `docs/acceptance.md` |
| Demo steps | `docs/demo-script.md` |
| UI rules | `docs/ui-guidelines.md` |
| Behaviour reference | `prototype/cainiao-lms-prototype.html` **(already written)** |
| Local issues | `.scratch/<feature-slug>/issues/` - **not in use**; the file lists in the role plans replace it |
| Setup instructions | `README.md` |

The manager creates the product documents. The UI/UX designer creates the UI guideline. QA/config
management checks that all documents match the code.

Only `docs/module-map.md` and the prototype exist today. The rest are deliverables.

`docs/module-map.md` is now the route table: paths, input fields, the JSON files each route reads
and writes, the template variables each view receives, and the response codes. It replaces the
`docs/routes.md` step that used to be on the manager plan - keep one route table, not two.

## Delivery order

Use this order unless the manager decides otherwise.

1. Manager freezes the requirements, routes, field names, acceptance checklist, and demo story.
2. UI/UX defines the common layout, component classes, status colors, and timeline pattern.
3. Backend A confirms the app foundation, login, logout, and role guards.
4. Backend B confirms the parcel lifecycle and data contract.
5. Backend C confirms exceptions, reports, logs, and configuration.
6. Frontend A, B, and C build or improve their pages against the frozen contracts.
7. QA/config management runs the full test matrix and prepares the demonstration.
8. The manager accepts the work and records the final demo version.

Frontend work may start before every backend task is finished, but it must use the field names and route names from the frozen manager documents.

## Integration rules

1. One person owns one file.
2. One task should touch the smallest possible set of files.
3. Do not edit another person's route or view file without telling the owner first.
4. Keep the application runnable after every merge.
5. Do not add a database, Docker, TypeScript, a frontend framework, a chart library, cookie, session, or JWT.
6. Use English for software text, comments, JSON values, and documentation.
7. Explain non-obvious JavaScript with short student-friendly comments.
8. Never hand back `node_modules/`.
9. Never hand back broken demo data. The default state should keep 3 users, 5 shelves, and 10 sample parcels.
10. A task is not complete until the owner writes the exact checks performed and the result.

## Working without version control

This project is a shared folder, not a Git repository. Nothing remembers yesterday, so three
habits carry the whole safety net.

### 1. One person owns one file

Your file list is in your role plan. If two people need the same
file, the second one waits or the manager splits the task differently.

### 2. Snapshot before you change, and before you hand back

Copy the files you are about to touch - and always the whole `data/` folder - into
`snapshots/<YYYY-MM-DD>/`. That copy is the only undo this project has.

```powershell
$stamp = Get-Date -Format "yyyy-MM-dd"
New-Item -ItemType Directory -Force -Path "snapshots\$stamp" | Out-Null
Copy-Item -Path "data" -Destination "snapshots\$stamp\data" -Recurse -Force
```

### 3. Hand back explicitly

When your task works, tell the manager and write in your hand-back message:

```text
Files handed back:
Handed back at:
Checks I ran and what they returned:
Data restored: yes/no
```

Never overwrite a file while someone else is editing it. Never hand back `node_modules/`.

### Running the project

```powershell
cd <the project folder>
npm install
npm run dev
```

Open <http://localhost:3000>.
