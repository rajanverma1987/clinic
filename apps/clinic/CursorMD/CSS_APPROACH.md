# CSS Approach – Professional Standards for the Clinic App

This document defines the correct and professional approach to CSS in this project. Follow it for all new styles and when touching existing ones.

---

## 1. Single Source of Truth: Design Tokens

**Where:** `app/globals.css` inside `:root` (and optionally `.dark` for theme overrides).

- **Colors:** Use CSS custom properties only. Never hardcode hex/rgb in component CSS.
  - `--color-primary-500`, `--color-neutral-900`, `--color-status-error`, etc.
- **Spacing:** `--space-1` … `--space-16`, `--gap-1` … `--gap-16`.
- **Typography:** `--font-family`, `--text-body-sm`, `--text-body-sm-line-height`, etc.
- **Layout:** `--radius-sm` … `--radius-full`, `--shadow-sm` … `--shadow-2xl`, `--z-modal`, etc.

**Rule:** In any `.css` file (globals or component), use `var(--token-name)` instead of raw values. This keeps theme, dark mode, and future rebrands consistent.

```css
/* ✅ Correct – solid colors */
.Modal-close:hover {
  background: var(--color-status-error);
  color: var(--color-neutral-50);
}

/* ✅ Correct – transparency via color-mix (modern browsers) */
.Modal-backdrop {
  background: color-mix(in srgb, var(--color-primary-500) 8%, transparent);
}

/* ❌ Avoid – hardcoded values */
.Modal-close:hover {
  background: #eb5757;
  color: white;
}
```

For older browser support, use `rgba()` with values that match your tokens, and add a comment referencing the token name.

---

## 2. Layering: Base → Components → Utilities

Use Tailwind’s `@layer` so specificity and order are predictable:

| Layer                  | Use for                                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `@layer base`          | Resets, `body`, typography defaults, `:root` tokens.                                                             |
| (no layer or implicit) | Layout/component-specific classes (e.g. `.sticky-header-bar`, `.Modal-backdrop`) that are not generic utilities. |
| `@layer utilities`     | Small, reusable utility classes (e.g. `.animate-fade-in`, `.space-section`).                                     |

- **Base:** Only global defaults and tokens.
- **Component/layout:** Page and component structure; can live in `globals.css` or co-located `.css` files.
- **Utilities:** Single-purpose classes; avoid duplicating what Tailwind already provides (e.g. prefer `rounded-lg` over a custom class when equivalent).

---

## 3. Naming Conventions

### Global / layout (in `globals.css`)

- **BEM-style, kebab-case:** Block and elements with `__`, modifiers with `--`.
  - `.sticky-header-bar`, `.sticky-header-bar__inner`, `.header-control-box--icon`.
- Keeps layout and shared components easy to find and reason about.

### Component-scoped (e.g. `components/ui/Modal.css`)

- **PascalCase block + BEM:** Matches the component name to avoid clashes.
  - `.Modal-backdrop`, `.Modal-container`, `.Modal-title`, `.Alert-container--sm`.
- Ensures component styles don’t leak; other components don’t depend on these class names.

### Utility classes (in `globals.css` inside `@layer utilities`)

- **Kebab-case, purpose-based:** e.g. `.animate-fade-in`, `.space-section`, `.icon-sm`.

**Rule:** Pick one convention per context and stick to it. Don’t mix arbitrary naming (e.g. `box2`, `style1`) in production CSS.

---

## 4. Tailwind vs Custom CSS

- **Use Tailwind for:** Layout (flex, grid, gap, padding, margin), typography (text sizes, weights), colors (e.g. `bg-primary-500`, `text-neutral-700`), responsive breakpoints, and one-off overrides via `className`.
- **Use custom CSS for:**
  - Complex components (modals, dropdowns, alerts) where many properties and states are easier to maintain in a `.css` file.
  - Global layout (e.g. `.layout-root`, `.sticky-header-bar`) and design-system utilities (e.g. `.icon`, `.sidebar-nav-icon`) that many files use.
  - Animations and keyframes that are reused.
- **Avoid:** Duplicating Tailwind’s spacing/color scale in custom CSS; prefer extending Tailwind’s theme from the same design tokens (see `tailwind.config.js`).

---

## 5. File Organization

| Location                   | Purpose                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------ |
| `app/globals.css`          | Tokens (`:root`), base styles, shared layout, shared utilities.                      |
| `components/ui/*.css`      | Component-specific styles (Modal, Alert, Toast, etc.). Import next to the component. |
| `app/<route>/styles/*.css` | Route-specific styles (e.g. dashboard, prescription form). Import in layout or page. |

- **One global entry:** Only `app/globals.css` is imported in the root layout; all other CSS is imported by the component or route that uses it.
- **Co-locate:** Keep `ComponentName.css` next to `ComponentName.jsx` when the styles are used only by that component.

---

## 6. Responsive and Accessibility

- **Breakpoints:** Align with Tailwind: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px. Use the same values in custom `@media` when needed.
- **Touch targets:** Buttons and interactive elements at least 44×44px where possible (use `--size-*` or Tailwind size classes).
- **Focus:** Use `:focus-visible` and a visible focus ring (e.g. `outline: 1px solid var(--color-primary-500)`); avoid removing focus outline without a replacement.
- **Reduced motion:** Prefer `@media (prefers-reduced-motion: reduce)` to disable or simplify animations when set.

---

## 7. What to Avoid

1. **Hardcoded colors/sizes** in component CSS – use `var(--…)` from `globals.css`.
2. **Inline styles** for layout/theme – use classes and tokens; reserve inline for truly dynamic values (e.g. width from API).
3. **`!important`** unless overriding third-party or critical layout; if used, add a short comment.
4. **Global `*` selectors** for visual properties – prefer `body` or specific wrappers to avoid unintended side effects.
5. **Duplicate tokens** – keep tokens in `:root`; Tailwind theme should extend from the same design system (see `tailwind.config.js` and `globals.css`).

---

## 8. Summary Checklist

- [ ] New/changed styles use design tokens (`var(--…)`) instead of raw values.
- [ ] Naming follows the convention for the context (BEM kebab in globals, PascalCase+BEM in component CSS).
- [ ] Component-specific styles live in co-located `.css` or route `styles/` and are imported where used.
- [ ] No unnecessary duplication with Tailwind; custom utilities are in `@layer utilities` when in `globals.css`.
- [ ] Focus and reduced-motion considered where applicable.

For icon sizes and sidebar/layout tokens, see `CursorMD/ICON_SIZES_AND_CSS.md` and `CursorMD/Z_INDEX_HIERARCHY.md`.

---

## 9. Token migration status

Component and route CSS files have been updated to use design tokens (`var(--…)` and `color-mix(in srgb, var(--token) X%, transparent)` where needed):

- **Done:** `components/ui/Modal.css`, `Alert.css`, `Toast.css`, `Checkbox.css`, `LanguageSwitcher.css`, `NotificationDropdown.css`; `app/prescriptions/styles/prescription-form.css` (main blocks).
- **Partially done:** `app/dashboard/styles/dashboard.css` (stat cards, card gradient; many list/quick-action/critical-alert blocks still use `rgba`/hex). Migrate those incrementally using the same pattern: replace `#ffffff` with `var(--color-neutral-50)`, `rgba(45, 156, 219, 0.2)` with `color-mix(in srgb, var(--color-primary-500) 20%, transparent)`, etc.
