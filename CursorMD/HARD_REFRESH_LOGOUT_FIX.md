# Hard Refresh Causing Logout – Fix

## Problem

On a **hard refresh** (Ctrl+Shift+R / Cmd+Shift+R or full reload), the user was sometimes sent to the login page even though they had valid tokens in `localStorage`.

## Root Causes

1. **Stale cached 401**
   - The browser can cache `GET /api/auth/me`. If it had ever cached a 401 (e.g. from a previous session or expired token), a hard refresh could reuse that cached 401.
   - The app would then treat the user as unauthenticated and redirect to login.

2. **No optimistic hydrate**
   - Auth state started as `user = null` and `loading = true` until `checkAuth()` finished.
   - If `/auth/me` was slow or failed (e.g. network blip), the UI could show “redirecting to login” or redirect before the request completed.

3. **Auth responses cacheable**
   - `/api/auth/me` and auth middleware 401 responses did not send `Cache-Control: no-store`, so the browser was allowed to cache them.

## Fixes Applied

### 1. API client (`lib/api/client.js`)

- **Skip in-memory cache** for auth endpoints: `/auth/me`, `/auth/refresh`. Those requests always go to the server.
- **`cache: 'no-store'`** for auth endpoints so the browser does not cache the response (avoids stale 401 on hard refresh).

### 2. Auth API and middleware

- **`/api/auth/me`** (success and all error responses): add headers
  `Cache-Control: no-store, no-cache, must-revalidate` and `Pragma: no-cache`.
- **Auth middleware** (`middleware/auth.js`): add the same no-cache headers to 401 responses so cached 401s are not reused.

### 3. AuthContext – optimistic hydrate

- **`useLayoutEffect`** (runs before paint): if `localStorage` has `accessToken` or `refreshToken` and `userInfo`, parse `userInfo` and set `user` and `loading = false` immediately.
- **`useEffect`**: run `checkAuth()` to revalidate; it can update or clear the user if the session is invalid.

Result: on hard refresh the UI shows the user from `localStorage` right away, and only redirects to login if `checkAuth()` actually determines the session is invalid (no redirect while the request is still in flight).

## Files Changed

- `lib/api/client.js` – no cache for auth endpoints, `cache: 'no-store'` for auth `fetch`.
- `app/api/auth/me/route.js` – no-cache headers on all responses.
- `middleware/auth.js` – no-cache headers on 401 responses.
- `contexts/AuthContext.jsx` – `useLayoutEffect` hydrate from `userInfo` + tokens; `useEffect` runs `checkAuth()`.

## Testing

1. Log in, then hard refresh (Ctrl+Shift+R / Cmd+Shift+R) on dashboard or any protected page – you should stay logged in.
2. Log out, then hard refresh on login page – you should remain on login.
3. After token expiry, hard refresh – if refresh token is still valid, you should stay in; if both are invalid, you should be redirected to login.
