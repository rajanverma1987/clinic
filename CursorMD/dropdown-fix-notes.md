# Dropdown Fix Notes

## Issue
The ITEM dropdown in the Prescription Items table is not working - users cannot select items from the dropdown.

## Possible Causes
1. Table row or cell event handlers blocking clicks
2. CSS overflow clipping the dropdown
3. Z-index issues preventing interaction
4. Event propagation issues

## Solution Attempted
1. Added `stopPropagation()` to prevent event bubbling
2. Added `pointerEvents: 'auto'` to ensure clicks are captured
3. Removed blocking event handlers like `onMouseDown` with `preventDefault()`
4. Fixed TypeScript errors by adding `form` and `strength` to interface

## Next Steps
If dropdown still doesn't work, try:
1. Check browser console for JavaScript errors
2. Inspect the select element to see if it's disabled
3. Check if any parent component has event handlers blocking
4. Consider using a custom dropdown component instead of native select

