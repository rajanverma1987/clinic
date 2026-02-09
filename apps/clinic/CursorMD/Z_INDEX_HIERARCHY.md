# Z-Index Hierarchy Documentation

**Date:** December 2024  
**Status:** Complete - All components updated

---

## 📊 Z-Index Hierarchy (Lowest to Highest)

### Base Content Layer (0-9)

- **0**: Base content, normal flow
- **1**: Content overlays, relative positioning within containers

### Dropdowns Layer (10-19)

- **10**: Simple dropdowns (PhoneInput, basic selects)
- **15**: Dropdown menus (PatientSelector, form dropdowns)

### Sticky Elements Layer (20-29)

- **20**: Sticky elements (general)
- **21**: Sticky headers (DashboardHeader)

### Fixed Elements Layer (30-39)

- **30**: Fixed sidebars, panels (ChatPanel, FileTransfer)

### Modal Layer (40-59)

- **40**: Modal backdrops
- **50**: Modals (Modal component, RecordingConsentModal, WaitingRoom)

### Popovers & Tooltips (60-79)

- **60**: Popovers
- **70**: Tooltips

### Sidebar (1000)

- **1000**: Main sidebar navigation

### Marketing Header (9999)

- **9999**: Marketing/landing page header (fixed)

### High-Priority Dropdowns (10050-10059)

- **10050**: LanguageSwitcher dropdown menu
- **10051**: LanguageSwitcher backdrop

### Toast & Loader (10060-10079)

- **10060**: Toast notifications
- **10070**: Loader overlay

### Maximum (99999)

- **99999**: Absolute maximum (reserved for critical overlays)

---

## 🎯 Component Z-Index Assignments

### Layout Components

- **Sidebar**: `var(--z-sidebar, 1000)`
- **DashboardHeader**: `var(--z-sticky-header, 21)`
- **Marketing Header**: `z-[9999]` (9999)
- **Layout Loader**: `var(--z-loader, 10070)`

### UI Components

- **Modal**: `var(--z-modal, 50)`
- **Modal Backdrop**: `var(--z-modal-backdrop, 40)`
- **LanguageSwitcher**: `var(--z-dropdown-menu-high, 10050)`
- **LanguageSwitcher Backdrop**: `var(--z-dropdown-backdrop-high, 10051)`
- **LanguageSwitcher Dropdown**: `var(--z-dropdown-menu-high, 10050)`
- **PatientSelector Dropdown**: `var(--z-dropdown-menu, 15)`
- **PhoneInput Dropdown**: `var(--z-dropdown-menu, 15)`
- **Toast**: `var(--z-toast, 10060)`
- **Loader**: `var(--z-loader, 10070)`

### Telemedicine Components

- **ChatPanel**: `var(--z-fixed, 30)`
- **FileTransfer**: `var(--z-fixed, 30)`
- **RecordingConsentModal**: `var(--z-modal, 50)`
- **WaitingRoom**: `var(--z-modal, 50)`

---

## ✅ Implementation Status

### Updated Components

- ✅ `app/globals.css` - Z-index variables defined
- ✅ `components/ui/Modal.jsx` - Uses `var(--z-modal, 50)`
- ✅ `components/ui/LanguageSwitcher.jsx` - Uses `var(--z-dropdown-menu-high, 10050)`
- ✅ `components/ui/LanguageSwitcher.css` - All z-index values updated
- ✅ `components/layout/DashboardHeader.jsx` - Uses `var(--z-sticky-header, 21)`
- ✅ `components/layout/Sidebar.jsx` - Uses `var(--z-sidebar, 1000)`
- ✅ `components/layout/Layout.jsx` - Uses `var(--z-loader, 10070)`
- ✅ `components/ui/PatientSelector.jsx` - Uses `var(--z-dropdown-menu, 15)`
- ✅ `components/ui/PhoneInput.jsx` - Uses proper z-index
- ✅ `components/telemedicine/*` - All updated
- ✅ `lib/utils/toast.js` - Uses `var(--z-toast, 10060)`
- ✅ `components/ui/Loader.jsx` - Uses `var(--z-loader, 10070)`

---

## 🔍 Key Rules

1. **Always use CSS variables** from `globals.css` for z-index values
2. **Never use arbitrary z-index values** - use the hierarchy
3. **Content cards should never have z-index** - they're in base layer (0)
4. **Dropdowns above sticky headers** - use 10050+ range
5. **Modals above everything** except toasts and loaders
6. **Toasts and loaders** are always on top (10060+)

---

## 🐛 Common Issues Fixed

1. **LanguageSwitcher dropdown cut off** - Fixed by using 10050+ z-index
2. **Dropdowns behind content cards** - Fixed by ensuring cards have no z-index
3. **Modal behind dropdowns** - Fixed by proper hierarchy (modals at 50, dropdowns at 15/10050)
4. **Toast behind modals** - Fixed by toasts at 10060, modals at 50

---

## 📝 Usage Examples

```css
/* ✅ Correct - Using CSS variable */
.my-dropdown {
  z-index: var(--z-dropdown-menu, 15);
}

/* ❌ Wrong - Hardcoded value */
.my-dropdown {
  z-index: 50;
}
```

```jsx
// ✅ Correct - Using CSS variable
<div style={{ zIndex: 'var(--z-modal, 50)' }}>

// ❌ Wrong - Hardcoded value
<div style={{ zIndex: 50 }}>
```

---

## 🔄 Future Updates

When adding new components:

1. Check this hierarchy
2. Use appropriate CSS variable
3. Update this document if adding new layer
4. Test with existing components to ensure proper layering
