# Acceptance checklist

Run the reset at the top of `docs/demo-script.md` before starting.
Every item is observable in the browser with the demo accounts.

## Authentication and access

- [ ] `staff01 / 123456` lands on `/staff/dashboard`.
- [ ] `admin01 / 123456` lands on `/admin/reports`.
- [ ] `cust01 / 123456` lands on `/my/packages`.
- [ ] A wrong password returns 401 and shows an error on the login page.
- [ ] A signed-out user opening a protected route is redirected to `/login`.
- [ ] A customer opening `/staff/dashboard` or `/admin/reports` gets 403.
- [ ] A staff user opening `/admin/reports` gets 403.
- [ ] An admin opening `/staff/dashboard` gets 403.
- [ ] `/logout` returns to `/login`.

## Staff

### Dashboard

- [ ] Counts match `data/packages.json`.
- [ ] The active shelf count matches `data/shelves.json`.
- [ ] Recent arrivals are newest first.

### Parcel list

- [ ] All seeded parcels are listed.
- [ ] Search matches tracking number, recipient, phone, and pickup code.
- [ ] Status and type filters narrow the list.
- [ ] Filters survive pagination.
- [ ] The status badge uses the shared status color.

### Single intake

- [ ] A missing required field shows a visible error and creates no record.
- [ ] A duplicate tracking number is rejected.
- [ ] A valid parcel is created with status `Arrived`.
- [ ] The new parcel has a tracking event and an operation log entry.

### Batch intake

- [ ] The form asks for one customer for the whole batch.
- [ ] Rows use the five-column format: tracking | name | phone | weight | type.
- [ ] An invalid row is skipped while valid rows are created.
- [ ] The redirect reports how many rows were created and skipped.

### Parcel lifecycle

- [ ] Only an `Arrived` parcel can be shelved.
- [ ] Only an Active shelf with free capacity can be chosen.
- [ ] Shelving generates a unique six-digit pickup code.
- [ ] Only a `Shelved` parcel with a pickup code can be notified.
- [ ] Notification content uses `config.notificationTemplate`.
- [ ] Repeated notify does not create a second notification.
- [ ] Only a `Notified` parcel can be picked up.
- [ ] Pickup releases the shelf slot.
- [ ] Every successful transition adds a tracking event and an operation log.

### Shelves

- [ ] A shelf can be created with code, cabinet, and positive capacity.
- [ ] A duplicate shelf code is rejected.
- [ ] An occupied shelf cannot enter maintenance.
- [ ] A shelf toggles between Active and Maintenance.

### Exceptions

- [ ] Only `Arrived`, `Shelved`, or `Notified` parcels can be reported.
- [ ] Reporting sets the parcel to `Exception` and keeps its previous status.
- [ ] Reporting releases the shelf slot.
- [ ] Resolving restores the previous status when shelf capacity is available.
- [ ] Resolving without a usable shelf returns the parcel to `Arrived` and clears the pickup code.
- [ ] Obsolete pickup notifications are removed when the code is cleared.
- [ ] Reporting and resolving add tracking and log entries.

## Customer

- [ ] My parcels shows only parcels whose `customerId` is the signed-in user.
- [ ] Search, status filter, and pagination work.
- [ ] The pickup code is easy to find when one exists.
- [ ] Parcel detail shows the tracking history newest first.
- [ ] Notifications show only the signed-in customer's messages.
- [ ] Opening another customer's parcel returns 403.
- [ ] Opening an unknown parcel returns 404.
- [ ] The customer pages expose no edit, shelf, pickup, or exception controls.

## Administrator

- [ ] Reports match `data/packages.json`: total parcels, total weight, status counts, type counts.
- [ ] The daily-inbound chart has seven Hong Kong calendar days.
- [ ] The chart is HTML and CSS only and keeps `<!-- CHART: daily-inbound -->`.
- [ ] A user can be created.
- [ ] A duplicate username is rejected.
- [ ] A user can be updated; an empty password keeps the old one.
- [ ] Logs can be searched by text and filtered by action.
- [ ] Logs are newest first and paginated.
- [ ] Configuration saves and survives a reload.
- [ ] The saved site name appears in the navbar.
- [ ] A changed notification template affects the next generated notification.

## Cross-cutting

- [ ] `npm run check` exits 0.
- [ ] All eight `data/*.json` files parse.
- [ ] Writes survive a server restart.
- [ ] Direct dependencies are only `express` and `express-handlebars`, plus `nodemon` in dev.
- [ ] 403 and 404 use the shared error page.
- [ ] The reset restores 3 users, 5 shelves, and 10 parcels.

## Known limitations

- Authentication is in memory: one signed-in user per server process, and a restart signs everyone out.
- Passwords are stored as plain text because this is a teaching prototype.
- Data lives in JSON files with no concurrency control.
- `POST /demo/login` is a password-less prototype helper and must be deleted before any real use.
- `data/logs.json` is local runtime state and is not tracked.