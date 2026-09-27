# WowCity buyer app: status

_Last updated: 2026-09-27 (autonomous overnight build)_

## How to run

```bash
npm install
cp .env.example .env.local          # then edit; never commit real values
EXPO_PUBLIC_MOCK=1 npx expo start   # demo data, no server needed
npx expo start                      # against EXPO_PUBLIC_API_URL
```

Mock mode is also used automatically when `EXPO_PUBLIC_API_URL` is not set.
Many features (secure store, haptics, gestures, maps, location) need a
**development build** rather than Expo Go:

```bash
npx eas-cli@latest build --profile development --platform android   # or ios
npx eas-cli@latest build --profile preview --platform android       # installable APK, mock data
npx eas-cli@latest build --profile production --platform all        # store builds
npx eas-cli@latest submit --platform android|ios
```

Quality gates (run before every push):

```bash
npx tsc --noEmit && npx eslint . && npx jest && npx expo-doctor
npm run export:web && node scripts/screenshots.mjs   # screenshots → docs/screenshots/
```

`scripts/screenshots.mjs` serves `dist/` locally and drives Chromium
(`/opt/pw-browsers/chromium`, override with `CHROMIUM_PATH`). Pass a mode
(`light`, `dark`, `amoled`, `eyeComfort`) to shoot only that one.

## Done

- Expo SDK 57, TypeScript strict, Expo Router (typed routes, `src/app`), TanStack Query, zustand.
- `app.config.ts`: name WowCity, `com.luzzan.wowcity`, location permission strings, no background location.
- `eas.json`: development / preview / production profiles.
- API client for `/api/v1/public` exactly per `docs/buyer-api.md`: `{data}` / `{error}` envelopes,
  friendly messages, network errors, bearer auth, **single-flight refresh-token rotation**
  (refresh token in `expo-secure-store`, access token in memory; sign-out when refresh is rejected,
  stay signed in when offline).
- Mock mode (`EXPO_PUBLIC_MOCK=1`): in-memory server for every endpoint. 7 shops (6 Bhopal, 1 Indore),
  38 real clothing photos, sold-out items, shops hiding brand / MRP / price / address / phone,
  radius + city filtering, all filters and sorts, 24-item pages, OTP sign-in (any 6 digits; `000000` = wrong code),
  favourites, profile, delete account.
- Theme: typed semantic tokens for Light, Dark, AMOLED Black, Eye Comfort (+ System), 5 accents,
  4 text sizes, reduce motion, haptics; persisted; live switching with a short cross-fade.
  Unit tests assert 4.5:1 contrast for text, status colours and every accent in every mode.
- Screens: Welcome/location + radius, Home (location pill, search launcher, category chips, shops carousel,
  "In stock near you" rail, "Newest nearby" infinite grid, pull to refresh), Search (debounced search,
  recent searches, filter chips, bottom-sheet filters from `/filters`, sort sheet, result count),
  Product detail (fixed order: photos → description → labelled rows/price/availability → Save; shop card with
  Directions / Call / See the shop; Share; tags), Shop profile (search within shop), Nearby shops list
  (+ map behind a flag), Saved (sign-in required; the save that triggered sign-in is completed after),
  Account (sign in/out, name, location & radius, Appearance, privacy policy, Delete account sheet),
  Appearance, Location, Sign in (email or mobile, 6-box code with SMS autofill, resend timer).
- UI: large 4:5 photos with blurhash placeholders and cached images, spring press feedback, haptic heart
  with pop + ring burst, skeleton loaders, bottom sheets with drag-to-close, toasts with Undo, calm offline
  banner (NetInfo → TanStack online manager), friendly empty/error states, 48dp targets, screen-reader labels.
- Never shows stock counts; sold-out items say "Sold out at this shop"; hidden fields are simply not shown
  ("Price in shop" when price hidden).

## Next

- Review every screen in all five modes and at Extra large text; polish spacing.
- Product detail: header that fades in on scroll.
- Component tests for key screens (React Native Testing Library).
- App icon / splash artwork (currently Expo defaults).

## Blockers / needs the owner

- **Store accounts:** Apple Developer and Google Play Console accounts, then `eas credentials` and
  `eas submit` (ASC API key / Play service-account JSON). Not available here.
- **Maps:** the nearby-shops map is off by default (`EXPO_PUBLIC_ENABLE_MAP=1` to turn on).
  **Android needs a Google Maps API key** as the EAS secret `GOOGLE_MAPS_ANDROID_API_KEY`.
- **API URL:** set `EXPO_PUBLIC_API_URL` (e.g. `https://<server>/api/v1/public`) once the wow-city
  backend is live; production profile sets `EXPO_PUBLIC_MOCK=0`.
- **Privacy policy URL:** defaults to `https://wowcity.in/privacy` (placeholder); set `EXPO_PUBLIC_PRIVACY_URL`.
- **Deep links:** share links use the `wowcity://` scheme; universal/app links need a real domain.
- **Device-only checks:** haptics, SMS code autofill, secure store, pinch zoom and location permission flows
  need a physical device or simulator; they are not covered by web screenshots.
