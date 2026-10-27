# Cainiao LMS — UI/UX Design Guidelines

## Overview
This document defines the visual layout, spacing, status color conventions, and component guidelines for the Cainiao LMS product across Staff, Customer, and Admin portals[cite: 6].

---

## 1. Color Palette & Status Mapping
- **Primary Brand Color:** `--brand` (`#f97316`)[cite: 6]
- **Dark Brand Accent:** `--brand-dark` (`#c2410c`)[cite: 6]
- **Dark Navigation:** `--nav-start` (`#12233f`) to `--nav-end` (`#1e3a5f`)[cite: 6]
- **Line/Border Token:** `--line` (`#d8e0ea`) *(Note: Align with current CSS token)*

### Status Badge Colors
- `Arrived`: `.bg-primary` — Package logged in system[cite: 6].
- `Shelved`: `.bg-info` — Package assigned to shelf[cite: 6].
- `Notified`: `.bg-warning.text-dark` — Ready for customer pickup[cite: 6].
- `Picked Up`: `.bg-success` — Handed off to customer[cite: 6].
- `Exception`: `.bg-danger` — Active flag or issue[cite: 6].

Always show text descriptions alongside badge colors.

---

## 2. Navigation Rules
Navigation (`views/partials/nav.hbs`) dynamically renders based on the user's role[cite: 6]:
- **Staff:** Dashboard (`/staff/dashboard`), Parcels (`/staff/packages`), Shelves (`/staff/shelves`), Exceptions (`/staff/exceptions`)[cite: 6].
- **Customer:** My Parcels (`/my/packages`), Notifications (`/my/notifications`)[cite: 6].
- **Admin:** Reports (`/admin/reports`), Users (`/admin/users`), Logs (`/admin/logs`), Configuration (`/admin/config`)[cite: 6].

---

## 3. UI Component Patterns

### A. Context Header Block
```html
<div class="d-flex justify-content-between align-items-center mb-4">
  <div>
    <span class="text-uppercase text-muted fw-bold small">Staff Portal</span>
    <h2 class="h3 mb-0">Parcel Inventory</h2>
  </div>
  <a href="/staff/packages/create" class="btn btn-primary">+ Inbound Parcel</a>
</div>