# Marketing Website (Public)

**Deploy to:** `www.yoursite.com`

- **Home**, **Pricing**, **Blog**, **About**, **Contact**, **Privacy**, **Terms**
- **Login** / **Get Started** buttons → redirect only to clinic app (no auth here)
- No dashboard code, no role logic, no patient/clinic data

## Setup

```bash
cd website
cp .env.example .env.local
# Set NEXT_PUBLIC_CLINIC_APP_URL=https://accounts.yoursite.com
npm install
npm run dev
```

Runs on **port 5054** (clinic app uses 5053).

## Env

| Variable                     | Description                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_CLINIC_APP_URL` | Clinic dashboard URL. Login/Register redirect here. e.g. `https://accounts.yoursite.com` |

## Build & Deploy

```bash
npm run build
npm start
```

Deploy this app to your www subdomain; deploy the clinic app (parent repo) to accounts subdomain.
