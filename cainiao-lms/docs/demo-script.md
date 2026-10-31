# Demo script - Cainiao LMS

A 5-8 minute walkthrough. Every demo account uses the password `123456`.

## Reset before every run

```powershell
cd "D:\study\hkmu\comp_350_ software_engineering\proj\GP43-\cainiao-lms"
git restore data
Remove-Item data\logs.json -ErrorAction SilentlyContinue
npm run dev
```

Open <http://localhost:3000>. The reset restores 3 users, 5 shelves, and 10 parcels.
`data/logs.json` is runtime state, so it is deleted rather than restored.

## Walkthrough

### 0:00-0:40 - Sign in as staff

1. On the login page, point out the three quick sign-in buttons.
2. Click **staff**. You land on `/staff/dashboard`.
3. Show the total parcel count, the Arrived / Notified / Exception counts, the active shelf count,
   and the Recent arrivals table.

### 0:40-1:30 - Find a parcel

1. Open **Parcels**.
2. Show the 10 seeded parcels.
3. Filter Status = `Arrived` and Type = `Document`, then clear the filters.

### 1:30-2:30 - Receive a parcel

1. Click **Receive parcel**.
2. Fill in:
   - Tracking number: `CAINIAO-HK-2001`
   - Recipient: `Demo Customer`
   - Phone: `+852 9000 0001`
   - Customer: `Chan Tai Man`
   - Weight: `2.5`
   - Type: `Parcel`
3. Submit. The new parcel appears in the list with status `Arrived`.
4. Optional negative demo: submit the form without the phone. A red error appears and nothing is
   saved.

### 2:30-3:30 - Shelve and notify

1. Open `CAINIAO-HK-2001`.
2. Under Shelf assignment choose `S-A-01` and click **Place on shelf**.
3. Show the new status `Shelved`, the six-digit pickup code, and the tracking event.
4. Click **Generate notification**. The status becomes `Notified`.
5. Point out the success message and the new timeline entry.

### 3:30-4:30 - Customer view

1. Sign out.
2. On the login page click **customer**.
3. My parcels shows only Chan Tai Man parcels. Search for `2001`.
4. Open the parcel: show the pickup-code panel and the tracking history (newest first).
5. Open Notifications: show the generated message and the link back to the parcel.

### 4:30-5:15 - Pickup

1. Sign out and quick sign in as **staff**.
2. Open `CAINIAO-HK-2001`.
3. Click **Confirm pickup**.
4. Show status `Picked Up` and the new timeline event.
5. Open **Shelves**: the `S-A-01` used count has gone down.

### 5:15-6:15 - Exception flow

1. Open **Exceptions**.
2. Choose `CAINIAO-HK-1007` (Arrived), type `Damaged`, description `Outer box is crushed.`
3. Submit. The parcel becomes `Exception` and the register shows an Open exception.
4. Click **Resolve**. The parcel returns to `Arrived` (it had no shelf) and the exception becomes
   `Resolved`.
5. Open the parcel to show both timeline events.

### 6:15-7:15 - Admin

1. Sign out and quick sign in as **admin**.
2. **Reports**: totals, status breakdown, and the seven-day CSS chart.
3. **Users**: create a test user, then edit it. Leaving the password empty keeps the old one.
4. **Logs**: filter Action = `LOGIN`; show that entries are newest first.
5. **Configuration**: change the site name, save, and show the navbar updated on the next page.

### 7:15-7:45 - Guard check and close

1. Sign out and sign in as **customer**.
2. Open `/staff/dashboard` manually: the app answers 403.
3. Finish on the customer parcel page.

## Reset after the demo

```powershell
git restore data
Remove-Item data\logs.json -ErrorAction SilentlyContinue
```

## Demo data notes

- Intended exception example: `CAINIAO-HK-1007` (Arrived).
- Alternate states: `CAINIAO-HK-1002` and `CAINIAO-HK-1008` are Shelved;
  `CAINIAO-HK-1003`, `CAINIAO-HK-1006`, and `CAINIAO-HK-1010` are Notified.
- All seeded parcels belong to `cust01`. To demonstrate the cross-customer 403, create a second
  customer and assign one parcel to that account first.
- Seed timestamps are anchored to **2026-10-31**, so the seven-day chart is populated. If the demo
  is run much later, shift the seed timestamps again or the chart will show zeros.