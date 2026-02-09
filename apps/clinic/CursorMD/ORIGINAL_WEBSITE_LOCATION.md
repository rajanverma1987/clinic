# Where Is the Original Website?

## Current location (inside clinic repo)

Your **original website** content lives in the **clinic** app at these paths:

| Path                                        | Purpose                                                                                        |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `app/page.jsx`                              | Root redirect to `/login` (clinic dashboard). Original home content was here; see git history. |
| `app/pricing/page.jsx`                      | Pricing page (restored from git)                                                               |
| `app/blog/page.jsx`                         | Blog listing (restored)                                                                        |
| `app/blog/[slug]/page.jsx`                  | Blog post (restored)                                                                           |
| `app/legal/page.jsx`                        | Legal & disclaimers (restored)                                                                 |
| `app/legal/responsible-disclosure/page.jsx` | Responsible disclosure (restored if present)                                                   |
| `app/privacy/page.jsx`                      | Privacy policy (restored)                                                                      |
| `app/terms/page.jsx`                        | Terms of service (restored)                                                                    |
| `app/support/page.jsx`                      | Support hub (restored)                                                                         |
| `app/support/contact/page.jsx`              | Contact form (restored)                                                                        |
| `components/marketing/*`                    | Header, Footer, HeroSection, FeaturesSection, FAQSection, CTASection, etc.                     |

So the **full original website** (all copy, sections, and marketing components) is in the clinic repo at the paths above.

## Standalone marketing app (`website/`)

The **website/** folder is a **separate** Next.js app for the “recommended architecture” (www = marketing, accounts = clinic). It currently has **minimal placeholder** pages, not a copy of the original website.

To have the **exact original** website moved out of the clinic:

1. Copy the pages above from `app/` into `website/app/` (home, pricing, blog, legal, privacy, terms, support).
2. Copy `components/marketing/*` into `website/components/marketing/`.
3. Remove any clinic-only dependencies (e.g. `AuthContext`, `apiClient`, dashboard routes) from the copied code so the website app stays public-only (e.g. Login → redirect, Request Demo, Get Clinic Access as you configured).
4. After the copy is done, remove the marketing routes from the clinic app again (keep only root redirect and dashboard).

If you want, the next step can be: **copy the original website from the clinic into `website/` and adapt it** so the standalone app has the exact original content and the clinic only has the redirect and dashboard.
