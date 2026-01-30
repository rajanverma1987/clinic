# Button – Platform-wide design

**Date:** January 2026
**Status:** Single source for all actions

## Component

`components/ui/Button.jsx` – **one clean implementation**: no overlay divs, no refs, no gradient hacks. Each variant is a single set of Tailwind classes (bg, border, text, hover, active, focus).

## Props

| Prop        | Default     | Description                                                                                       |
| ----------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `variant`   | `'primary'` | primary, success, secondary, outline, danger, destructive, logout, warning, ghost, tertiary, link |
| `size`      | `'md'`      | xs, sm, md, lg, xl                                                                                |
| `shape`     | `'rounded'` | rounded, pill, square                                                                             |
| `isLoading` | `false`     | Shows CompactLoader + “Loading” label                                                             |
| `disabled`  | `false`     | Disabled + grey styling                                                                           |
| `iconOnly`  | `false`     | Square aspect, padding 0                                                                          |
| `className` | `''`        | Extra classes                                                                                     |
| `children`  | —           | Label and/or icon                                                                                 |
| `...rest`   | —           | type, onClick, aria-\*, etc. Use `type="submit"` in forms.                                        |

## Variants (visual)

| Variant                                   | Default                                                 | Hover / selected               | Use                               |
| ----------------------------------------- | ------------------------------------------------------- | ------------------------------ | --------------------------------- |
| **primary** / **success**                 | Green #15803d, 1px white + 0.5px green ring, white text | Blue (bg + ring)               | Main CTA (Save, Submit, Create)   |
| **secondary** / **outline**               | Blue #2d9cdb, 1px white + 0.5px blue ring, white text   | Green fill effect + green ring | Cancel, Back, alternative actions |
| **danger** / **destructive** / **logout** | Red fill, white text                                    | Darker red                     | Delete, Remove, Logout            |
| **warning**                               | Amber fill, white text                                  | Darker amber                   | Risky actions                     |
| **ghost** / **tertiary**                  | Transparent, primary text                               | Light primary bg               | Low emphasis                      |
| **link**                                  | Transparent, primary text, no border                    | Underline                      | “See all”, in-text actions        |

## Rules

- **One primary, one secondary per context:** Primary for main action, secondary for Cancel/Back/alternative.
- **Side-by-side buttons must never be the same variant:** When two (or more) buttons appear next to each other (e.g. in a flex row), use **primary** for the main action and **secondary** for the other(s). Never use two primary or two secondary side by side.
- **Sizes:** `md` for page-level actions; `sm` for tables, cards, dense UIs.
- **Icons:** Use design-system icon classes; SVGs inherit button color via `[&_svg]:text-current`.
- **Forms:** Pass `type="submit"` for submit buttons; default is `type="button"`.

## Structure (internal)

- Single `<button>` with concatenated classes: BASE + variant + size + shape + disabled.
- Optional `as="span"` for file-input triggers: renders `<span role="button" tabIndex={0} aria-disabled={…}>` with same styles and keyboard support.
- No nested overlay spans; no ref-based animations.
- Loading: CompactLoader + i18n “common.loading”.
- Aliases (e.g. success, outline, destructive) map to the same VARIANTS entry as the canonical name.

## Platform fixes (Jan 2026)

- **Toast, Alert, Modal:** Close actions use `<Button variant="ghost" size="xs" iconOnly>` instead of raw `<button>`.
- **Delete / Cancel / Reject:** All “red” actions use `variant="danger"`; removed ad-hoc `className='border-red-300 text-red-700'` (and similar) from:
  - admin/content/specialties, admin/appointments, admin/patients, admin/patients/[id], admin/doctors, admin/doctors/verify
  - app/appointments/[id] (Cancel appointment)
  - app/patient-portal/profile (Delete account, Danger zone)
  - app/doctors/profile (Delete clinic)
- **RecordingConsentModal, WaitingRoom:** “Decline” / “Reject” use `variant="danger"`; “I Consent” / “Admit” use `variant="secondary"`. Raw `<button>` in WaitingRoom replaced with `Button`.
- **Queue page:** Start Video / Start Appointment use `variant="primary"`; Mark Complete uses `variant="secondary"`. Removed custom bg/border class overrides.
- **File-input triggers:** Buttons that wrap hidden `<input type="file">` use `as="span"` so the visible trigger is a span; `Button` supports `as="span"` with role and keyboard handling.
