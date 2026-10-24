# Cainiao LMS — UI/UX Design Guidelines

## Overview
This document defines the visual layout, spacing, status color conventions, and component guidelines for the Cainiao LMS product across Staff, Customer, and Admin portals.

---

## 1. Color Palette & Status Mapping
- **Primary Brand Color:** `--brand` (`#f97316`)
- **Dark Brand Accent:** `--brand-dark` (`#c2410c`)
- **Dark Navigation:** `--nav-start` (`#12233f`) to `--nav-end` (`#1e3a5f`)
- **Line/Border Token:** `--line` (`#e2e8f0`)

### Status Badge Colors
- `Arrived`: `.bg-primary` (Blue `#2563eb`) — Package logged in system.
- `Shelved`: `.bg-info` (Cyan `#0891b2`) — Package assigned to shelf.
- `Notified`: `.bg-warning.text-dark` (Amber `#d97706`) — Ready for customer pickup.
- `Picked Up`: `.bg-success` (Green `#16a34a`) — Handed off to customer.
- `Exception`: `.bg-danger` (Red `#dc2626`) — Active flag or issue.

---

## 2. Navigation Rules
Navigation (`views/partials/nav.hbs`) dynamically renders based on the user's role:
- **Staff:** Dashboard (`/staff/dashboard`), Parcels (`/staff/packages`), Shelves (`/staff/shelves`), Exceptions (`/staff/exceptions`).
- **Customer:** My Parcels (`/my/packages`), Notifications (`/my/notifications`).
- **Admin:** Reports (`/admin/reports`), Users (`/admin/users`), Logs (`/admin/logs`), Configuration (`/admin/config`).

---

## 3. UI Component Patterns

### A. Context Header Block
```html
<div class="d-flex justify-content-between align-items-center mb-4">
  <div>
    <span class="text-uppercase text-muted fw-bold small">Staff Portal</span>
    <h2 class="h3 mb-0">Parcel Inventory</h2>
  </div>
  <a href="/staff/packages/create" class="btn btn-brand">+ Inbound Parcel</a>
</div>