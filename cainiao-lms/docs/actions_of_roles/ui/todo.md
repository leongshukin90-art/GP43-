# UI/UX Designer

## Mission

Make the three role areas look like one product and behave predictably on desktop and mobile. Developers should be able to copy the same Bootstrap classes and patterns instead of inventing new styles on each page.

## Start here in this project

`cainiao-lms` ships a **working framework with empty feature modules**. The framework boots,
you can sign in, and the role guards work. Everything listed as yours is either missing or a
stub, so read the plan below as *what to build*, not as an audit of something that exists.

The mechanic you will use constantly: each unimplemented route is one `stubPage({ ... })` call
in `routes/`, and its `needs` list is the acceptance list for that page. Replace the call, then
fill in the view. `docs/module-map.md` lists every page with its route, view, and owner.

Only the shell is styled today: `views/layouts/main.hbs`, `views/partials/nav.hbs`,
`views/partials/alerts.hbs`, `views/error.hbs`, `views/auth/login.hbs`, and
`public/css/style.css`. Every role page is still a placeholder card, so you are defining the
product look, not auditing one.

Two files you now own that this plan does not list:

- `views/auth/login.hbs` - rebuilt to match `prototype/cainiao-lms-prototype.html`, including
  the three one-click demo sign-in buttons.
- The login section of `public/css/style.css` - ported from the prototype, plus the `--line`
  token and `.btn-soft`, `.field`, `.scenario-box`, and `.demo-user` components.

Step 1 asks you to screenshot the current pages: most of them are identical placeholder cards,
so inventory the prototype screens instead. Step 9 asks you to confirm the
`<!-- CHART: daily-inbound -->` marker is in `views/admin/reports.hbs` - it is not there yet;
that file contains only `{{> stub}}`, so the marker is yours to define and Frontend C adds it.

## Your files

Everything below is already in the folder. **Nobody else edits these files.** This list is your
claim - there is no issue tracker to claim against instead, so treat it as the rule.

| File | Now | What you do |
| --- | --- | --- |
| `public/css/style.css` | working | Extend the shared design system. The login block is ported from the prototype. |
| `views/layouts/main.hbs` | working | The shared shell: assets, navbar, footer, title. |
| `views/partials/nav.hbs` | working | The role-aware navigation. |
| `views/partials/alerts.hbs` | working | The success and error block. |
| `views/partials/stub.hbs` | working | The card every unbuilt page renders. |
| `views/error.hbs` | working | The shared 403, 404, and 500 page. |
| `views/auth/login.hbs` | working | The login page. Shared with Backend A - agree before changing it. |
| `public/js/main.js` | working | The shared `data-confirm` guard. Frontend owners ask you for changes here. |
| `docs/ui-guidelines.md` | does not exist | Create it: colors, spacing, components, status map, responsive rules. |

**Not yours - ask the owner before you touch these:**

| File | Owner |
| --- | --- |
| `routes/` | Backend A, B, and C |
| `views/staff/`, `views/client/`, `views/admin/` | the three frontend owners |
| `data/` | Backend A, B, and C |

## You do not own

- Do not change route names.
- Do not change JSON field names.
- Do not add a UI framework or chart library.
- Do not put business rules only in the browser. The server must still validate everything.
- Do not remove the required chart marker `<!-- CHART: daily-inbound -->`.

## Design principles

1. Use Bootstrap 5 components before writing custom CSS.
2. Keep the orange Cainiao-inspired accent for primary actions.
3. Use one shared top navigation and one shared page spacing pattern.
4. Make the most important action visible at the top of each page.
5. Use tables for dense staff data and cards for customer parcels.
6. Keep all visible text in English.
7. Make status colors consistent everywhere.

## Status and component rules

| Status | Bootstrap color | Meaning |
| --- | --- | --- |
| Arrived | primary | Received but not shelved |
| Shelved | info | On a shelf, notification not yet generated |
| Notified | warning | Customer can collect the parcel |
| Picked Up | success | Completed |
| Exception | danger | Needs special handling |

Required shared patterns:

- Page title block with a small uppercase context label
- Primary action button in the top-right area
- Search/filter form inside a white card
- Empty-state message inside the table or card
- Success and error alert partial
- Timeline with a colored dot and a vertical line
- Responsive table using `.table-responsive`
- Keyboard-visible focus state
- Form labels connected to inputs with `for` and `id`

## Step-by-step work

### Step 1: Inventory the current pages

Open every page and create a screenshot list:

- `/login`
- `/staff/dashboard`
- `/staff/packages`
- `/staff/packages/create`
- `/staff/packages/:id`
- `/staff/shelves`
- `/staff/exceptions`
- `/my/packages`
- `/my/packages/:id`
- `/my/notifications`
- `/admin/reports`
- `/admin/users`
- `/admin/logs`
- `/admin/config`
- 403 and 404 error pages

For each page, note:

- Main user goal
- Primary action
- Secondary actions
- Empty state
- Error state
- Mobile problem

### Step 2: Create `docs/ui-guidelines.md`

Write down:

- Color variables and their meaning
- Spacing scale
- Button hierarchy
- Card and table rules
- Form rules
- Status badge mapping
- Timeline structure
- Navigation rules
- Responsive breakpoints
- Accessibility checklist

Give each rule one short example using Bootstrap classes.

### Step 3: Review CSS variables

Open `public/css/style.css`.

Keep reusable values in `:root`. Do not repeat raw color values when a variable already exists.

Recommended groups:

```css
:root {
  --brand: #f97316;
  --brand-dark: #c2410c;
  --ink: #172033;
  --nav-start: #12233f;
  --nav-end: #1e3a5f;
}
```

Check contrast before using light text on a colored background.

### Step 4: Standardize the shared layout

Review `views/layouts/main.hbs`.

Confirm:

- Bootstrap CSS and JavaScript CDN links appear once.
- The page language remains `en`.
- The shared navbar appears for signed-in pages.
- Login hides the navbar.
- The page title uses the current page title and site name.
- `public/css/style.css` loads after Bootstrap so project rules can override it.
- The footer identifies the project as a prototype.

### Step 5: Standardize navigation

Review `views/partials/nav.hbs`.

For each role, confirm the links match this list:

- Staff: Dashboard, Parcels, Shelves, Exceptions
- Admin: Reports, Users, Logs, Configuration
- Customer: My parcels, Notifications

Check the current user name, role, and sign-out button on desktop and mobile.

### Step 6: Standardize alerts

Review `views/partials/alerts.hbs`.

Success messages should explain what happened. Error messages should explain what to fix. Do not use technical errors such as `ReferenceError`.

### Step 7: Improve the status badge system

The server helper is in `utils/packageStatus.js`.

Coordinate with Backend B before changing a status name. Keep CSS behavior readable even if the JavaScript helper changes.

Check that the same status has the same color on all pages.

### Step 8: Improve the tracking timeline

Use one timeline structure for staff and customer detail pages.

Each event should show:

- Status
- Description
- Date and time
- Operator where appropriate

On mobile, the event text should wrap below the date rather than overflow the card.

### Step 9: Design the static report chart

The report chart is CSS only.

Confirm:

- `<!-- CHART: daily-inbound -->` remains in `views/admin/reports.hbs`.
- Bars have a visible count.
- Bars use a readable height.
- Empty days show a small placeholder bar or clear zero state.
- The chart works without JavaScript.
- The chart is not misleading when every count is zero.

### Step 10: Define form behavior

For each form, write:

- Required fields
- Field type
- Example value
- Validation message
- Success redirect
- Failure behavior

The browser may use `required`, `min`, `max`, and `step`, but the server remains the final authority.

### Step 11: Accessibility pass

Check every page:

- Every input has a label.
- Buttons describe their action.
- Tables have headers.
- Color is not the only status signal.
- Focus outlines are visible.
- Text zoom to 200% does not hide the main action.
- Error messages use `role="alert"` where appropriate.

### Step 12: Responsive pass

Check widths around 360 px, 768 px, and 1280 px.

Fix:

- Navbar overflow
- Table overflow
- Button wrapping
- Card spacing
- Timeline crowding
- Chart label clipping

## Handoff package

When your design change is ready, give the three frontend owners:

- Updated class names
- Before/after screenshots
- Exact pages affected
- What they must change in their files
- What they must not change

## Completion checklist

- [ ] All pages use the shared layout and navigation.
- [ ] Status colors are consistent.
- [ ] Every form has clear labels and validation guidance.
- [ ] Every list has a useful empty state.
- [ ] Mobile layout has been checked at 360 px and 768 px.
- [ ] Keyboard focus is visible.
- [ ] The report chart is CSS-only and keeps the required marker.
- [ ] `docs/ui-guidelines.md` matches the implemented CSS.