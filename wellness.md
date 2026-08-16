# Women's Wellness Module — V1

Backend-only V1. No `(tabs)` shell exists yet in the frontend to host a
screen, so this ships as API + client only; screens follow once that shell
exists (tracked separately, not part of this module).

## What's new

```
backend/src/models/cycle.model.js
backend/src/models/dailyLog.model.js
backend/src/services/wellness/phase.service.js          (pure)
backend/src/services/wellness/prediction.service.js      (pure)
backend/src/services/wellness/recommendation.service.js  (pure)
backend/src/services/wellness/cycle.service.js           (DB)
backend/src/services/wellness/dailyLog.service.js        (DB)
backend/src/routes/wellness.route.js
frontend/src/services/wellnessApi.ts
```

## Modified

```
backend/src/app.js   — one line: app.use("/api/wellness", wellnessRoutes)
```

Nothing else touched. Auth, onboarding, hydration, steps, profile — untouched.

## Not built (see MISSING notes in conversation)

- Workout/Nutrition push integration — those modules don't exist yet.
  Phase/cycle data is exposed via `GET /api/wellness/cycle/current` for a
  future module to consume; no active push was built.
- XP/Notifications — no backend surface added. No existing XP or
  notification infrastructure to hook into yet.
- Frontend screens — blocked on the `(tabs)` shell not existing yet.
- Trusted contacts — explicitly V2 per RESULT.md §5.

## API Reference

All routes require `Authorization: Bearer <token>` (existing `protect`
middleware). Response envelope matches `steps.route.js`: `{ success, message?, data? }`.

### `POST /api/wellness/cycle`

Log a period start (and optionally its end/length).

Request:

```json
{ "cycleStart": "2026-08-01", "cycleEnd": "2026-08-06", "periodLength": 5 }
```

Success (201):

```json
{
  "success": true,
  "message": "Cycle logged successfully",
  "data": { "_id": "...", "cycleStart": "...", "...": "..." }
}
```

### `GET /api/wellness/cycle/current`

Returns the latest cycle, computed phase, and next-period prediction.

```json
{
  "success": true,
  "data": {
    "cycle": { "_id": "...", "cycleStart": "..." },
    "phase": {
      "phase": "LUTEAL",
      "cycleDay": 20,
      "isOverdue": false,
      "ovulationWindow": { "start": 13, "end": 15 },
      "cycleLength": 28,
      "periodLength": 5
    },
    "prediction": {
      "status": "ok",
      "predictedNextPeriod": "...",
      "predictedCycleLength": 29,
      "confidence": 0.86,
      "dataPoints": 5
    }
  }
}
```

### `GET /api/wellness/cycle/history`

All logged cycles, most recent first.

### `POST /api/wellness/daily-log`

Upsert by date.

Request:

```json
{
  "date": "2026-08-01",
  "flow": "MEDIUM",
  "painLevel": 4,
  "symptoms": ["CRAMPS", "FATIGUE"],
  "mood": {
    "mood": 3,
    "energy": 2,
    "stress": 4,
    "sleepQuality": 3,
    "motivation": 2
  },
  "notes": "optional free text"
}
```

### `GET /api/wellness/daily-log/:date`

`:date` in `YYYY-MM-DD`.

### `GET /api/wellness/calendar?month=YYYY-MM`

Derived view — phase, prediction, and that month's logged days. Nothing is
stored separately for the calendar.

### `GET /api/wellness/recommendations`

Rule-based food/workout/hydration guidance for the current phase, plus notes
for any symptoms logged today. Always includes a non-medical-advice
disclaimer field.

## Manual Test Checklist (no test framework in this repo yet)

Auth:

- [ ] No `Authorization` header → 401 on every route above
- [ ] Malformed/expired token → 401
- [ ] User A's token cannot read/modify User B's cycle or daily-log data
      (every query is scoped by `req.user.id`, never a client-supplied `userId`)

Cycle:

- [ ] `POST /cycle` with no `cycleStart` → 400
- [ ] `POST /cycle` with invalid date string → 400
- [ ] `POST /cycle` twice, second date later than first → first cycle's
      `cycleLength` gets backfilled
- [ ] `GET /cycle/current` with zero cycles logged → 404 ("No cycle history found")

Daily log:

- [ ] `POST /daily-log` with bad `date` format → 400
- [ ] `POST /daily-log` with invalid `flow` value → 400
- [ ] `POST /daily-log` with `painLevel` of 11 → 400
- [ ] `POST /daily-log` with unknown symptom string → 400
- [ ] Posting to the same `date` twice updates rather than duplicates
      (enforced by the `{user, date}` unique index)

Prediction (via `GET /cycle/current`):

- [ ] 0 cycles → 404 (no current cycle to report on)
- [ ] 1 cycle → `prediction.status === "low_confidence"`
- [ ] 2+ regular cycles → `status === "ok"`, confidence rises as variance drops
- [ ] Irregular cycle lengths → confidence stays low but never crashes

Phase boundaries (via `phase.service.js`, testable standalone):

- [ ] `cycleDay === periodLength` → still `MENSTRUAL`
- [ ] `cycleDay === periodLength + 1` → `FOLLICULAR`
- [ ] `cycleDay` at `ovulationWindow.start`/`end` → `OVULATION`
- [ ] `cycleDay > cycleLength` → `LUTEAL` with `isOverdue: true`
