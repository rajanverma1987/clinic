✅ 1. COLOR SYSTEM (Final)
Brand / Primary

#2D9CDB — Primary 500

#0F89C7 — Primary 700

#56CCF2 — Primary 300

#E6F7FE — Primary 100

Secondary / Success

#27AE60 — Success 500

#1E874F — Success 700

#E8F8EF — Success 100

Neutrals

#1A1A1A — Text strong

#4F4F4F — Text medium

#828282 — Text muted

#D1D1D1 — Border (light)

#E6E9EE — Divider / thin border

#F7FAFC — Background

#FFFFFF — Surface

Alerts

Warning: #F2C94C

Error: #EB5757

Info: #2D9CDB

✅ 2. TYPOGRAPHY
Font Family
"Inter", -apple-system, BlinkMacSystemFont, "Roboto", "Segoe UI", "Helvetica Neue", Arial, sans-serif;

Headings

H1: 32px / 40px / 700

H2: 24px / 32px / 600

H3: 20px / 28px / 600

H4: 18px / 24px / 600

Body text

Body LG: 18px / 28px | 400

Body MD: 16px / 24px | 400

Body SM: 14px / 20px | 400

Body XS: 12px / 16px | 400

Buttons

Label: 16px / 20px | 600

✅ 3. BUTTON SYSTEM
Primary Button

Background: primary-500

Hover: primary-700

Text: #FFFFFF

Radius: 8px

Padding: 12px 20px

Shadow: subtle (0 2px 4px rgba(0,0,0,0.06))

Secondary Button

Background: #FFFFFF

Border: primary-500

Text: primary-500

Hover: primary-100

Destructive Button

Background: #EB5757

Hover: #C54141

Text: white

Disabled

Background: #D1D1D1

Text: white

Cursor: not-allowed

✅ 4. INPUT FIELDS
Default

Background: #FFFFFF

Border: #D1D1D1

Radius: 8px

Padding: 12px

Text: neutral-900

Placeholder: neutral-500

Focus State

Border: primary-500

Shadow: 0 0 0 3px rgba(45,156,219,0.20)

Error State

Border: #EB5757

Helper text: error red

✅ 5. CARDS / SURFACES
Default Card

Background: #FFFFFF

Border: #E6E9EE

Radius: 10px

Padding: 16–24px

Shadow: 0 2px 4px rgba(0,0,0,0.04)

Elevated Card

Shadow: 0 4px 12px rgba(0,0,0,0.08)

✅ 6. NAVIGATION BAR (Web App)
Top Bar

Background: white

Border bottom: #E6E9EE

Height: 64px

Logo left + actions-right

Side Nav

Background: #FFFFFF

Active link: primary-100

Active text: primary-500

Hover: #F7FAFC

Icon size: 20px

✅ 7. TABLES (Clinic dashboards need this)
Header Row

Background: primary-100

Text: primary-700

Weight: 600

Height: 48px

Row

Height: 44–48px

Border bottom: #E6E9EE

Hover

Background: #F7FAFC

Selected row

Background: primary-100

Border-left: 3px solid primary-500

✅ 8. SHADOWS
shadow-sm: 0 1px 2px rgba(0,0,0,0.04)
shadow-md: 0 2px 4px rgba(0,0,0,0.06)
shadow-lg: 0 4px 12px rgba(0,0,0,0.08)
shadow-xl: 0 8px 20px rgba(0,0,0,0.12)

✅ 9. SPACING SCALE (Use this everywhere)
4px  
8px  
12px  
16px  
24px  
32px  
40px  
48px

Keep spacing consistent → cleaner UI.

🔟 10. COMPLETE DESIGN TOKEN JSON (Ready for devs)
{
"colors": {
"primary": { "900": "#0B67A0", "700": "#0F89C7", "500": "#2D9CDB", "300": "#56CCF2", "100": "#E6F7FE" },
"secondary": { "700": "#1E874F", "500": "#27AE60", "300": "#6FCF97", "100": "#E8F8EF" },
"neutral": { "900": "#1A1A1A", "700": "#4F4F4F", "500": "#828282", "300": "#D1D1D1", "200": "#E6E9EE", "100": "#F7FAFC", "50": "#FFFFFF" },
"status": { "success": "#27AE60", "warning": "#F2C94C", "error": "#EB5757", "info": "#2D9CDB" }
},
"typography": {
"fontFamily": "\"Inter\", -apple-system, BlinkMacSystemFont, \"Roboto\", \"Segoe UI\", \"Helvetica Neue\", Arial, sans-serif",
"sizes": { "h1": 32, "h2": 24, "h3": 20, "h4": 18, "bodyLg": 18, "bodyMd": 16, "bodySm": 14, "bodyXs": 12 },
"lineHeights": { "h1": 40, "h2": 32, "h3": 28, "h4": 24, "bodyLg": 28, "bodyMd": 24, "bodySm": 20, "bodyXs": 16 },
"weights": { "regular": 400, "medium": 500, "semibold": 600, "bold": 700 }
},
"components": {
"button": {
"primary": { "bg": "#2D9CDB", "text": "#FFFFFF", "hover": "#0F89C7", "radius": 8, "padding": "12px 20px" },
"secondary": { "bg": "#FFFFFF", "text": "#2D9CDB", "border": "#2D9CDB" },
"danger": { "bg": "#EB5757", "text": "#FFFFFF", "hover": "#C54141" }
},
"input": {
"bg": "#FFFFFF", "border": "#D1D1D1", "radius": 8,
"focusBorder": "#2D9CDB", "errorBorder": "#EB5757"
}
},
"shadow": {
"sm": "0 1px 2px rgba(0,0,0,0.04)",
"md": "0 2px 4px rgba(0,0,0,0.06)",
"lg": "0 4px 12px rgba(0,0,0,0.08)"
},
"spacing": [4, 8, 12, 16, 24, 32, 40, 48]
}
