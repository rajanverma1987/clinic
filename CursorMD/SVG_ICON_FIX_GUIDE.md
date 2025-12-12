# SVG Icon Size Fix Guide

## Conversion Table
- `w-4 h-4` = `width='16px' height='16px'`
- `w-5 h-5` = `width='20px' height='20px'`
- `w-6 h-6` = `width='24px' height='24px'`
- `w-8 h-8` = `width='32px' height='32px'`
- `h-4 w-4` = `width='16px' height='16px'`
- `h-5 w-5` = `width='20px' height='20px'`
- etc.

## Pattern to Replace

### Before:
```jsx
<svg className='w-5 h-5' ...>
```

### After:
```jsx
<svg width='20px' height='20px' ...>
```

## Files Fixed
- ✅ components/ui/Disclaimer.jsx
- ✅ components/layout/Sidebar.jsx (all icon components)
- ✅ app/login/page.jsx

## Files Remaining
See terminal output for full list. Key files:
- app/patients/page.jsx
- app/appointments/new/page.jsx
- app/invoices/new/page.jsx
- app/dashboard/components/*.jsx
- And many more...

## Notes
- Remove size classes from className
- Add width and height as attributes with px units
- Keep other className attributes intact

