# Button Variants – One Style Per Visual

**Date:** January 2026  
**Status:** Design-system reference

## Canonical variants

All buttons use `@/components/ui/Button`. There are **six visual styles**; other variant names are aliases and render the same.

| Variant (use in code) | Visual | Use for |
|-----------------------|--------|---------|
| **primary** | Filled blue, white text | Main CTA (Save, Submit, Accept, Create) |
| **success** | Same as primary | Positive actions (Accept, Confirm) – alias of primary |
| **secondary** | Blue outline, white bg | Alternative action (Cancel, Back, View All, Decline) |
| **outline** | Same as secondary | Alternative / outline – alias of secondary |
| **danger** | Filled red | Destructive (Delete, Remove, Logout) |
| **destructive** | Same as danger | Alias of danger |
| **logout** | Same as danger | Alias of danger |
| **ghost** | Transparent, hover bg | Low emphasis (menu items, inline actions) |
| **tertiary** | Same as ghost | Alias of ghost |
| **link** | Text link, underline on hover | “See All”, in-text actions |
| **warning** | Filled amber | Risky-but-not-destructive (e.g. overwrite) |

## Rules

- **One primary, one secondary:** Prefer `variant="primary"` for the main action and `variant="secondary"` for the other. Use `success` only where it clarifies intent (e.g. Accept); it looks like primary.
- **Outline = secondary:** `outline` and `secondary` share the same style. Use either; prefer `secondary` for consistency.
- **Destructive:** Use `danger` (or `destructive` / `logout`) for delete, remove, sign out. All three look the same.
- **Sizes:** `xs` (chips, dense lists), `sm` (cards, headers, tables), `md` (default), `lg` (hero, onboarding). Use `sm` in dense UIs.

## Implementation

`components/ui/Button.jsx` defines:

- `PRIMARY_STYLE` – used for `primary` and `success`
- `SECONDARY_STYLE` – used for `secondary` and `outline`
- `DANGER_STYLE` – used for `danger`, `destructive`, `logout`

Hover effects and content (text/icon color) are driven by these visual groups, not by every variant name. New variant names should map to one of these styles instead of adding new visuals.
