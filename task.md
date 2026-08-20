# App-Wide Continuous Step Counting

- [x] Created `StepContext.tsx` providing continuous app-wide step counting
- [x] Wrapped `RootLayout` in `StepProvider` in `_layout.tsx` so whenever the app is open anywhere, physical steps are tracked in the foreground
- [x] Uses dual-sensor technology: `Pedometer` + `Accelerometer` heel-strike peak detection algorithm ($10\text{Hz}$, $M > 1.22\text{G}$)
- [x] Synchronizes live steps seamlessly to the Home Screen and caches daily steps to `AsyncStorage`
- [x] Verified with TypeScript (`npx tsc --noEmit` passed with 0 errors)