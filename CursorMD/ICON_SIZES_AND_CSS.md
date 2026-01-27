# Icon Sizes and CSS – Dashboard & Website

This document describes the standardized icon sizing and color system used across the dashboard and marketing site.

## Design tokens (globals.css)

Icon sizes are defined as CSS custom properties in `:root`:

| Token | Size | Use |
|-------|------|-----|
| `--icon-size-xs` | 16px | Inline small icons, badges, time badges |
| `--icon-size-sm` | 20px | List leading icons, buttons, tabs, quick actions |
| `--icon-size-md` | 24px | Sidebar nav, section headers |
| `--icon-size-lg` | 32px | Empty states, feature cards |
| `--icon-size-xl` | 40px | Stat card icon containers (visual only; inner icon is sm) |
| `--icon-size-2xl` | 48px | Large decorative icons |
| `--icon-size-empty` | 64px | Empty-state icons |
| `--dashboard-sidebar-icon-size` | 24px | Sidebar nav icons (alias for consistency) |

## Utility classes

Use these on `<svg>` or on a wrapper around the icon:

- **`.icon`** – Base: 20px, `flex-shrink: 0`, `color: currentColor`
- **`.icon-xs`** – 16px
- **`.icon-sm`** – 20px (default when using `.icon`)
- **`.icon-md`** – 24px
- **`.icon-lg`** – 32px
- **`.icon-xl`** – 40px
- **`.icon-2xl`** – 48px

**Sidebar nav**

- **`.sidebar-nav-icon`** – Wrapper for nav item icons: 24px, inherits link text color. Use as `<span class="sidebar-nav-icon"><svg>…</svg></span>`.

## Shared icon components (`components/icons/`)

Icons (e.g. `CalendarIcon`, `UsersIcon`) accept:

- `className` – default `'icon icon-sm'` (20px). Override for other sizes, e.g. `'icon icon-xs'` or `'icon icon-md'`.
- `color` – default `'currentColor'`. Use for tint, e.g. `'white'`, `'#F59E0B'`, or Tailwind/semantic classes via parent (`text-primary-600`).

Example:

```jsx
<CalendarIcon className="icon icon-sm" color="white" />
<ChevronRightIcon className="icon icon-sm text-neutral-400" />
<WarningIcon className="icon icon-xs" color="#F59E0B" />
```

## Where sizing is applied

| Area | Size | Implementation |
|------|------|----------------|
| Sidebar nav items | 24px | `.sidebar-nav-icon` wrapper + inner `<svg>` |
| Sidebar collapse chevron | 24px | `.sidebar-nav-icon` on wrapper |
| Stats cards (inner icon) | 20px | `className="icon icon-sm"`, `color="white"` |
| Quick Actions (dropdown icons) | 20px | `className="icon icon-sm shrink-0 text-primary-600"` |
| Dashboard list items (leading icon) | 16px | `className="icon icon-xs"` + semantic color |
| Dashboard list items (chevron) | 20px | `className="icon icon-sm"` |
| Critical Alerts | 16px / 20px | `icon icon-xs` (header), `icon icon-sm` (per alert) |
| Settings tabs | 20px | Inline SVGs use `className="icon icon-sm"` |
| PageHeader search icon | 20px | `className="icon icon-sm"` |
| Dashboard header calendar | 20px | `className="icon icon-sm"` |
| Empty states | 64px | `.empty-state-icon` uses `--icon-size-empty` |
| Quick-action buttons (card layout) | 20px | `.quick-action-btn svg` / `.quick-action-btn .icon` use `--icon-size-sm` |

## Colors

- **Inherit**: Use `color="currentColor"` (or default) and set color on the parent (`text-primary-600`, `text-neutral-400`, etc.).
- **Fixed**: Pass `color="white"`, `color="#F59E0B"`, or use Tailwind/semantic classes on the icon or parent.
- **Sidebar**: Nav icons inherit from the link (`text-neutral-700` / `text-primary-700`), so no extra color on the icon.

## Files touched in this pass

- **globals.css** – Icon tokens, `.icon`, `.icon-xs`…`.icon-2xl`, `.sidebar-nav-icon`
- **Sidebar.jsx** – All nav icons wrapped in `.sidebar-nav-icon`, collapse chevron uses same class
- **components/icons/** – Default `className='icon icon-sm'` for all exported icons
- **app/dashboard/components/** – StatsCard, QuickActions, CriticalAlerts, *ListItem, NextPatientCard use `icon icon-sm` / `icon icon-xs` and semantic colors
- **app/dashboard/styles/dashboard.css** – `.empty-state-icon` and `.quick-action-btn svg` use tokens and sizing
- **SettingsTabs.jsx** – Tab SVGs use `icon icon-sm`
- **PageHeader.jsx** – Search SVG uses `icon icon-sm`
- **DashboardHeader.jsx** – Calendar SVG uses `icon icon-sm`
- **app/dashboard/page.jsx** – Star rating SVGs use `icon icon-sm`

## 100% coverage (icon size / color)

Icon size and color are standardized across:

- **Dashboard**: Sidebar, StatsCard, QuickActions, CriticalAlerts, list items, NextPatientCard, CalendarWidget, star ratings, empty states, quick-action buttons.
- **Settings**: SettingsTabs, ComplianceTab, GeneralSettingsTab, DoctorsTab, HolidayManagementTab, ProfileTab, SMTPSettingsTab, TaxSettingsTab, QueueSettingsTab.
- **Layout**: PageHeader, DashboardHeader, BackButton, ProfileMenu.
- **Auth**: Login, forgot-password, patient-portal login/register.
- **Admin**: Admin dashboard cards and nav (24px/32px via `.icon-md` / `.icon-lg`).
- **Doctors**: Doctors schedule, profile, register, patients detail.
- **Appointments / prescriptions**: Detail and new pages (inline icons use `.icon-xs` / `.icon-sm`).
- **Patient portal**: Home, family, lab-reports, prescriptions, medical-records, appointments, confirm, book, login, register.
- **Telemedicine**: VideoControls (icon-xs + Tailwind responsive overrides), SessionInfo, ChatPanel, summary page.
- **Components**: PatientSelector, NotificationDropdown, CalendarPopup, ProductGallerySection, CTASection, PremiumFeatureGuard, SearchBar, PhoneInput.

Decorative or layout elements (e.g. dot indicators, badge circles, checkbox swatches) keep Tailwind `w-*`/`h-*` where they are not SVG icons.

## Extending

- New icons: Prefer shared components in `components/icons/` with default `className='icon icon-sm'`.
- New UI: Use `.icon`, `.icon-xs`…`.icon-xl` or `.sidebar-nav-icon` so sizes stay consistent and themeable via `--icon-size-*`.
