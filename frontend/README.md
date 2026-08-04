# 📱 ROVR Frontend — Expo SDK 56 Mobile Client

The **ROVR Frontend** is a modern, high-performance mobile application built with **Expo SDK 56**, **React Native 0.85**, and **TypeScript**. It delivers a premium fitness tracking interface featuring custom Reanimated 4 micro-animations, glassmorphism design elements, JWT authentication, and automatic host IP detection for mobile device testing.

---

## 📂 Codebase File & Folder Structure

```
frontend/
├── package.json               # App dependencies and npm scripts
├── tsconfig.json              # TypeScript configuration & path aliases (@/*)
├── app.json                   # Expo SDK 56 configuration metadata
├── expo-env.d.ts              # Expo environment declarations
├── src/
│   ├── app/                   # Expo Router file-based navigation
│   │   ├── _layout.tsx        # Root layout with AuthProvider & RootNavigator
│   │   ├── index.tsx          # Root route redirect -> /(tabs)
│   │   ├── (auth)/            # Unauthenticated route group
│   │   │   ├── _layout.tsx    # Stack layout for auth screens
│   │   │   ├── sign-in.tsx    # Premium Sign In screen with Reanimated animations
│   │   │   └── sign-up.tsx    # Premium Sign Up screen with client validation
│   │   └── (tabs)/            # Authenticated route group
│   │       ├── _layout.tsx    # Tab bar navigation layout
│   │       ├── index.tsx      # Main Home Dashboard
│   │       └── explore.tsx    # Explore & Feature Demo screen
│   ├── components/            # Shared UI components & animations
│   │   ├── animated-icon.tsx  # Animated splash screen overlay
│   │   ├── app-tabs.tsx       # Custom native/web tab navigation bar
│   │   ├── external-link.tsx  # Cross-platform external link handler
│   │   ├── themed-text.tsx    # Theme-aware Text component
│   │   └── themed-view.tsx    # Theme-aware View component
│   ├── constants/             # Design system tokens
│   │   └── theme.ts           # Color palettes (Light/Dark), spacing, fonts
│   ├── context/               # Global state providers
│   │   └── AuthContext.tsx    # Auth state, JWT AsyncStorage persistence, auto-hydration
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-color-scheme.ts# Color scheme hook
│   │   └── use-theme.ts       # Active theme colors hook
│   ├── services/              # Networking & API integrations
│   │   └── api.ts             # Axios instance with Expo host IP auto-resolution
│   └── types/                 # Custom TypeScript definitions
│       └── declarations.d.ts  # CSS module declarations
```

---

## 🔍 Important Code Aspects & Architecture

### 1. Authentication Flow & Guard (`AuthContext.tsx` & `_layout.tsx`)
- **Token Persistence**: JWT tokens and minimal user data are stored securely in `AsyncStorage`.
- **Auto-Hydration**: On app startup, `AuthContext` reads stored credentials and updates `isAuthenticated`.
- **Navigation Guard**: `RootNavigator` inside [`src/app/_layout.tsx`](file:///Users/aditya/Developer/ROVR/frontend/src/app/_layout.tsx) waits until both auth state and `useRootNavigationState()` are fully ready before redirecting:
  - Unauthenticated users $\rightarrow$ Redirected to `/(auth)/sign-in`
  - Authenticated users $\rightarrow$ Redirected to `/(tabs)`

### 2. Dynamic Host IP Resolution (`api.ts`)
To prevent hardcoding IP addresses when testing on mobile over Wi-Fi or Mobile Hotspot, [`src/services/api.ts`](file:///Users/aditya/Developer/ROVR/frontend/src/services/api.ts) dynamically extracts the host IP from Expo Constants:

```typescript
const getBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  return 'http://10.57.101.37:3000';
};
```

### 3. Micro-Animations & Design System (`sign-in.tsx` & `sign-up.tsx`)
- **Staggered Entrance**: Form input fields slide up and fade in sequentially on load using `withDelay()` and `withSpring()`.
- **Error Feedback**: Form triggers a horizontal shake sequence on invalid input or failed authentication requests.
- **Glowing Brand**: Pulsing text shadow animation on the **ROVR** title.
- **Button Physics**: Scale transformation (0.97) on press using `react-native-reanimated`.

---

## 🛠️ Scripts & Running Locally

| Command | Action |
|---|---|
| `npx expo start` | Start Expo dev server |
| `npx expo start --clear` | Clear Expo Metro cache and start server |
| `npx tsc --noEmit` | Run TypeScript type check across the app |
| `npm run android` | Run on Android emulator |
| `npm run ios` | Run on iOS simulator |
| `npm run web` | Run web version in browser |
